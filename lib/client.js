'use strict';
const Influx = require('./influx');
const _ = require('lodash');
const debug = require('./debug');
const Writer = require('./writer');
const Reader = require('./reader');
const internal = require('./internal');
const util = require('./util');
const InfluxQL = require('influx-ql');
const request = require('superagent');
const loadBalancer = require('superagent-load-balancer');

class Client {
  constructor(uri, options) {
    const reg = /(\S+?):\/\/(\S+?:\S+?@)?(\S+?)\/(\S+)/;
    const result = reg.exec(uri);
    /* istanbul ignore if */
    if (!result || !result[1] || !result[3] || !result[4]) {
      throw new Error(
        'Connect URI is wrong, eg: http://user:pass@localhost:port,anotherhost:port,yetanother:port/mydatabase'
      );
    }
    const opts = _.extend({}, options);
    opts.servers = _.map(result[3].split(','), str => {
      const arr = str.split(':');
      return {
        protocol: result[1],
        host: arr[0],
        port: parseInt(arr[1], 10),
      };
    });
    opts.database = result[4];
    /* istanbul ignore else */
    if (result[2]) {
      const authInfos = result[2].substring(0, result[2].length - 1).split(
        ':');
      opts.username = authInfos[0];
      opts.password = authInfos[1];
    }
    debug('init options:%j', opts);
    const internalData = internal(this);
    internalData.opts = opts;
    internalData.writeQueue = new Set();
    internalData.queryQueue = new Set();
    internalData.influx = new Influx(opts);
  }

  /**
   * [startHealthCheck description]
   * @param  {[type]} ping [description]
   * @return {[type]}      [description]
   */
  startHealthCheck(ping) {
    const opts = internal(this).opts;
    const defaultPing = (backend, cb) => {
      const url = `${backend.protocol || 'http'}://${backend.host}:${backend.port || 80}/ping`;
      request.get(url).end(cb);
    };
    internal(this).timer = loadBalancer.healthCheck(opts.servers, {
      ping: ping || defaultPing,
    });
    return this;
  }

  /**
   * [stopHealthCheck description]
   * @return {[type]} [description]
   */
  stopHealthCheck() {
    clearInterval(internal(this).timer);
    return this;
  }

  /**
   * [getServers description]
   * @param  {[type]} available [description]
   * @return {[type]}           [description]
   */
  getServers(available) {
    const servers = _.filter(internal(this).opts.servers, server => {
      if (available) {
        return !server.disabled;
      }
      return !!server.disabled;
    });
    return _.map(servers, server => _.omit(server, ['disabled']));
  }

  /**
   * [availableServers description]
   * @return {[type]} [description]
   */
  get availableServers() {
    return this.getServers(true);
  }

  /**
   * [unavailableServers description]
   * @return {[type]} [description]
   */
  get unavailableServers() {
    return this.getServers(false);
  }

  /**
   * timeout 获取request timeout的值
   * @return {[type]} [description]
   */
  get timeout() {
    return internal(this).influx.timeout;
  }

  /**
   * timeout 设置request timeout的值
   * @return {[type]} [description]
   */
  set timeout(v) {
    internal(this).influx.timeout = v;
  }

  /**
   * writeQueueLength 获取写队列长度
   * @return {[type]} [description]
   */
  get writeQueueLength() {
    return internal(this).writeQueue.size;
  }

  /**
   * queryQueueLength 获取查询队列长度
   * @return {[type]} [description]
   */
  get queryQueueLength() {
    return internal(this).queryQueue.size;
  }

  /**
   * dropDatabase 删除数据库
   * @return {Promise}
   */
  dropDatabase() {
    const opts = internal(this).opts;
    return internal(this).influx.query(InfluxQL.dropDatabase(opts.database));
  }

  /**
   * [showDatabases description]
   * @return {[type]} [description]
   */
  showDatabases() {
    return internal(this).influx.queryRaw(InfluxQL.showDatabases());
  }

  /**
   * [showRetentionPolicies description]
   * @return {[type]} [description]
   */
  showRetentionPolicies() {
    const internalData = internal(this);
    const opts = internalData.opts;
    const q = InfluxQL.showRetentionPolicies(opts.database);
    return internalData.influx.queryRaw(q);
  }

  /**
   * [showMeasurements description]
   * @return {[type]} [description]
   */
  showMeasurements() {
    return internal(this).influx.query(InfluxQL.showMeasurements());
  }

  /**
   * [showTagKeys description]
   * @param  {[type]} measurement [description]
   * @return {[type]}             [description]
   */
  showTagKeys(measurement) {
    return internal(this).influx.query(InfluxQL.showTagKeys(measurement));
  }

  /**
   * [showFieldKeys description]
   * @param  {[type]} measurement [description]
   * @return {[type]}             [description]
   */
  showFieldKeys(measurement) {
    return internal(this).influx.query(InfluxQL.showFieldKeys(measurement));
  }

  showSeries(measurement) {
    return internal(this).influx.query(InfluxQL.showSeries(measurement));
  }
  /**
   * [createDatabaseNotExists description]
   * @return {[type]} [description]
   */
  createDatabaseNotExists() {
    const opts = internal(this).opts;
    return internal(this).influx.query(InfluxQL.createDatabaseNotExists(opts.database));
  }

  /**
   * syncWrite 同步write queue
   * @return {[type]} [description]
   */
  syncWrite() {
    const internalData = internal(this);
    const set = internalData.writeQueue;
    const influx = internalData.influx;
    const arr = Array.from(set);
    set.clear();
    return influx.write(arr);
  }

  /**
   * [syncQuery 同步read queue]
   * @param  {[type]} format [description]
   * @return {[type]}        [description]
   */
  syncQuery(format) {
    const internalData = internal(this);
    const set = internalData.queryQueue;
    const influx = internalData.influx;
    const arr = Array.from(set);
    set.clear();
    return influx.query(arr.join(';')).then(data => {
      let result;
      switch (format) {
        case 'json':
          result = util.toJSON(data);
          break;
        case 'csv':
          result = util.toCsv(data);
          break;
        default:
          result = data;
          break;
      }
      return result;
    });
  }

  /**
   * [writePoint description]
   * @param  {[type]} measurement [description]
   * @param  {[type]} fields      [description]
   * @param  {[type]} tags        [description]
   * @return {[type]}             [description]
   */
  writePoint(measurement, fields, tags) {
    const writer = this.write(measurement);
    writer.field(fields);
    if (tags) {
      writer.tag(tags);
    }
    return writer;
  }
  /**
   * write write point to measurement
   * @param  {String} measurement measurement名称
   * @return {Writer}        [description]
   */
  write(measurement) {
    const internalData = internal(this);
    const writer = new Writer(internalData.influx, internalData.writeQueue);
    writer.measurement = measurement;
    return writer;
  }

  /**
   * [query description]
   * @param  {[type]} measurement [description]
   * @return {[type]}        [description]
   */
  query(measurement) {
    const internalData = internal(this);
    const reader = new Reader(internalData.influx, internalData.queryQueue);
    reader.measurement = measurement;
    return reader;
  }
  /**
   * [queryRaw description]
   * @param  {[type]} q [description]
   * @return {[type]}   [description]
   */
  queryRaw(q) {
    return internal(this).influx.queryRaw(q);
  }
}

module.exports = Client;
