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
    opts.servers = _.map(result[3].split(','), (str) => {
      const arr = str.split(':');
      return {
        protocol: result[1],
        host: arr[0],
        port: parseInt(arr[1], 10),
      };
    });
    opts.database = result[4] || '';
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
    internalData.options = {};
  }

  /**
   * [startHealthCheck description]
   * @param  {[type]} ping [description]
   * @return {[type]}      [description]
   */
  startHealthCheck(ping) {
    const opts = internal(this).opts;
    const timer = internal(this).timer;
    if (timer) {
      clearInterval(timer);
    }
    const defaultPing = (backend) => {
      const url = `${backend.protocol || 'http'}://${backend.host}:${backend.port || 80}/ping`;
      return request.get(url);
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
    const servers = _.filter(internal(this).opts.servers, (server) => {
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
   * [format description]
   * @return {[type]} [description]
   */
  get format() {
    return internal(this).options.format;
  }
  /**
   * format 设置query response type
   * @param  {[type]} v [description]
   * @return {[type]}   [description]
   */
  set format(v) {
    internal(this).options.format = v;
  }

  get epoch() {
    return internal(this).options.epoch;
  }
  /**
   * [epoch 设置query epoch]
   * @param  {[type]} v [description]
   * @return {[type]}   [description]
   */
  set epoch(v) {
    internal(this).options.epoch = v;
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
   * [createDatabaseNotExists description]
   * @return {[type]} [description]
   */
  createDatabase() {
    const opts = internal(this).opts;
    return internal(this).influx.createDatabase(opts.database);
  }

  dropDatabase() {
    const opts = internal(this).opts;
    return internal(this).influx.dropDatabase(opts.database);
  }

  /**
   * [showDatabases description]
   * @return {[type]} [description]
   */
  showDatabases() {
    const ql = InfluxQL.showDatabases();
    const influx = internal(this).influx;
    return influx.query(ql).then(data => _.flattenDeep(util.mergeValues(data)));
  }

  createRetentionPolicy(name, duration, replication, shardDuration, isDefault) {
    const internalData = internal(this);
    const database = internalData.opts.database;
    const q = InfluxQL.createRP(name, database, duration, shardDuration, replication, isDefault);
    return internalData.influx.query(q).then(_.noop);
  }

  updateRetentionPolicy(name, duration, replication, shardDuration, isDefault) {
    const internalData = internal(this);
    const database = internalData.opts.database;
    const q = InfluxQL.updateRP(name, database, duration, replication, shardDuration, isDefault);
    return internalData.influx.query(q).then(_.noop);
  }

  dropRetentionPolicy(name) {
    const internalData = internal(this);
    const database = internalData.opts.database;
    const q = InfluxQL.dropRP(name, database);
    return internalData.influx.queryPost(q).then(_.noop);
  }

  /**
   * [showRetentionPolicies description]
   * @return {[type]} [description]
   */
  showRetentionPolicies() {
    const internalData = internal(this);
    const opts = internalData.opts;
    const q = InfluxQL.showRetentionPolicies(opts.database);
    return internalData.influx.query(q).then((data) => {
      const result = [];
      if (!data || !data.results) {
        return result;
      }
      _.forEach(data.results, (item) => {
        _.forEach(item.series, (series) => {
          const columns = series.columns;
          _.forEach(series.values, (arr) => {
            const tmp = {};
            _.forEach(arr, (v, index) => {
              tmp[columns[index]] = v;
            });
            result.push(tmp);
          });
        });
      });
      return result;
    });
  }

  /**
   * [showMeasurements description]
   * @return {[type]} [description]
   */
  showMeasurements() {
    const ql = InfluxQL.showMeasurements();
    const influx = internal(this).influx;
    return influx.query(ql).then(data => _.flattenDeep(util.mergeValues(data)));
  }

  /**
   * [showTagKeys description]
   * @param  {[type]} measurement [description]
   * @return {[type]}             [description]
   */
  showTagKeys(measurement) {
    const ql = InfluxQL.showTagKeys(measurement);
    const influx = internal(this).influx;
    return influx.query(ql).then(util.convertTagAndFieldKeys);
  }

  /**
   * [showFieldKeys description]
   * @param  {[type]} measurement [description]
   * @return {[type]}             [description]
   */
  showFieldKeys(measurement) {
    const ql = InfluxQL.showFieldKeys(measurement);
    const influx = internal(this).influx;
    return influx.query(ql).then(util.convertTagAndFieldKeys);
  }

  showSeries(measurement) {
    const ql = InfluxQL.showSeries(measurement);
    const influx = internal(this).influx;
    return influx.query(ql).then((data) => {
      const result = [];
      if (!data || !data.results) {
        return result;
      }
      _.forEach(data.results, (item) => {
        _.forEach(item.series, (series) => {
          result.push(series.values);
        });
      });
      return _.flattenDeep(result).sort();
    });
  }
  /**
   * write write point to measurement
   * @param  {String} measurement measurement名称
   * @param  {String} precision timestamp precision for all points OPTIONAL
   * @return {Writer}        [description]
   */
  write(measurement, precision) {
    const internalData = internal(this);
    const writer = new Writer(internalData.influx, internalData.writeQueue);
    writer.measurement = measurement;
    writer.precision = precision;
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
    const formatType = this.format;
    if (formatType) {
      reader.set('format', formatType);
    }
    const epoch = this.epoch;
    if (epoch) {
      reader.set('epoch', epoch);
    }
    return reader;
  }

  /**
   * [writePoint description]
   * @param  {[type]} measurement [description]
   * @param  {[type]} fields      [description]
   * @param  {[type]} tags        [description]
   * @param  {string} precision   The timestamp precision. 'h', 'm', 's', 'ms',
   *                              'u', 'n' OPTIONAL
   * @return {[type]}             [description]
   */
  writePoint(measurement, fields, tags, precision) {
    const writer = this.write(measurement, precision);
    writer.field(fields);
    if (tags) {
      writer.tag(tags);
    }
    return writer;
  }
  /**
   * [queryRaw description]
   * @param  {[type]} q  [description]
   * @param  {[type]} db [description]
   * @return {[type]}    [description]
   */
  queryRaw(q, db) {
    return internal(this).influx.query(q, db);
  }

  queryPost(q, db) {
    return internal(this).influx.queryPost(q, db);
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
    return influx.query(arr.join(';')).then((data) => {
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
}

module.exports = Client;
