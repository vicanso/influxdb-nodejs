'use strict';

const EventEmitter = require('events');
const InfluxQL = require('influx-ql');
const request = require('superagent');
const _ = require('lodash');
const querystring = require('querystring');

const Influx = require('./influx');
const debug = require('./debug');
const Writer = require('./writer');
const Reader = require('./reader');
const internal = require('./internal');
const util = require('./util');
const schema = require('./schema');

/** @namespace Client */

/**
 * Listen on the event, not is support: 'queue', 'writeQueue', 'queryQueue'
 * @memberof Client
 * @function on
 * @instance
 * @since 2.4.0
 * @param {String} eventName - The name of event
 * @param {Function} listener - The callback function
 * @example
 * client.on('queue', (type, data) => {
 *   // write or query
 *   console.info(type);
 *   console.info(data);
 * });
 * client.on('writeQueue', (data) => {
 *   console.info(data);
 * });
 * client.on('invalid-fields', (data) => {
 *   //{ measurement: 'request',
 *   // fail: [ { category: 'stripUnknown', key: 'version', value: 1 },
 *   //  { category: 'stripUnknown', key: 'token', value: 'abcd' },
 *   //  { category: 'invalid', type: 'integer', key: 'no', value: 'abcd' },
 *   //  { category: 'invalid', type: 'float', key: 'score', value: 'ab' } ]}
 *   console.info(data);
 * });
 * client.on('invalid-tags', (data) => {
 *   // {measurement: 'request',
 *   // fail: [ { category: 'invalid', key: 'type', value: 'a' } ]}
 *   console.info(data);
 * })
 * console.on('queryQueue', (data) => {
 *   console.info(data);
 * });
 */

/**
 * Influxb client
 *
 * @example
 * const Influx = require('influxdb-nodejs');
 * const client = new Influx('http://127.0.0.1:8086/mydb');
 */
class Client extends EventEmitter {
  /**
   * constructor
   * @param  {String} uri - The influxdb connection uri, eg: 'http://user:pass@localhost:port,anotherhost:port,yetanother:port/mydatabase'
   * @param  {Object} options - [optional] The options for influxdb client, {loadBalancingAlgorithm: "round-robin"}.
   * loadBalancingAlgorithm can be url, leastconn, round-robin, first, url-path, default is round-robin
   */
  constructor(uri, options) {
    const reg = /(\S+?):\/\/(\S+?:\S+?@)?(\S+?)\/(\S+)/;
    const result = reg.exec(uri);
    /* istanbul ignore if */
    if (!result || !result[1] || !result[3] || !result[4]) {
      const message = 'Connect URI is wrong, eg: http://user:pass@localhost:port,anotherhost:port,yetanother:port/mydatabase';
      throw new Error(message);
    }
    super();
    const opts = _.extend({
      loadBalancingAlgorithm: 'round-robin',
    }, options);
    opts.servers = _.map(result[3].split(','), (str) => {
      const arr = str.split(':');
      return {
        protocol: result[1],
        host: arr[0],
        port: parseInt(arr[1], 10),
      };
    });
    const db = result[4] || '';
    const queryIndex = db.indexOf('?');
    let query = '';
    if (queryIndex === -1) {
      opts.database = db;
    } else {
      opts.database = db.substring(0, queryIndex);
      query = db.substr(queryIndex + 1);
    }
    /* istanbul ignore else */
    if (result[2]) {
      const authInfos = result[2].substring(0, result[2].length - 1).split(
        ':',
      );
      [opts.username, opts.password] = authInfos;
      // 根据query配置，判断使用哪种认证方式
      if (query) {
        const queryInfo = querystring.parse(query);
        if (queryInfo.auth) {
          opts.authType = queryInfo.auth;
        }
      }
    }
    debug('init options:%j', opts);
    const internalData = internal(this);
    internalData.opts = opts;
    internalData.writeQueue = new Set();
    internalData.queryQueue = new Set();
    internalData.influx = new Influx(opts);
    internalData.options = {};
    _.forEach(['invalid-tags', 'invalid-fields'], (event) => {
      schema.on(event, data => this.emit(event, data));
    });
  }

  /**
   * Start the influxdb server health check
   * @param  {Function | Promise} ping - [optional] The ping checker, It not set the param, will use the default ping checker.
   * @param  {Integer} interval - [optional] The check interval
   * @since 2.4.5
   * @return {Client}
   * @example
   * client.startHealthCheck();
   */
  startHealthCheck(ping, interval) {
    const defaultPing = (backend) => {
      const pingUrl = `${backend.protocol || 'http'}://${backend.host}:${backend.port || 80}/ping`;
      return request.get(pingUrl).timeout(1000);
    };
    const pingFn = _.isNumber(ping) ? null : ping;
    const ms = _.isNumber(ping) ? ping : interval;
    internal(this).influx.startHealthCheck(pingFn || defaultPing, ms);
    return this;
  }

  /**
   * Stop the influxdb server health check
   * @return {Client}
   * @since 2.2.0
   * @example
   * client.stopHealthCheck();
   */
  stopHealthCheck() {
    clearInterval(internal(this).timer);
    return this;
  }

  /**
   * Get the database
   * @since 2.4.4
   * @return {String} The database of the client
   * @example
   * const database = client.database;
   * console.info(database);
   * // => mydb
   */
  get database() {
    return internal(this).opts.database;
  }

  /**
   * Get the available list
   * @since 2.2.0
   * @returns {Array} The server list
   * @example
   * const serverList = client.availableServers;
   * console.info(serverList)
   * // => [ { protocol: 'http', host: '127.0.0.1', port: 8086 } ]
   */
  get availableServers() {
    return internal(this).influx.getAvailableServers();
  }

  /**
   * Get the unavailable list
   * @deprecated since version 2.5.0
   * @since 2.2.0
   * @returns {Array} The server list
   * @example
   * const serverList = client.unavailableServers;
   * console.info(serverList)
   * // => [ { protocol: 'http', host: '127.0.0.1', port: 8086 } ]
   */
  get unavailableServers() {
    /* eslint no-console:0 */
    console.warn('The function is deprecated');
    const { servers } = internal(this).opts;
    const { availableServers } = this;
    const arr = [];
    servers.forEach((item) => {
      const found = _.find(availableServers, (tmp) => {
        const keyList = 'protocol host ip port'.split(' ');
        let diff = false;
        _.forEach(keyList, (key) => {
          if (!diff && item[key] !== tmp[key]) {
            diff = true;
          }
        });
        return !diff;
      });
      if (!found) {
        arr.push(_.extend({}, item));
      }
    });
    return arr;
  }

  /**
   * Set the http request timeout value, the unit is ms. The default is 0, no timeout.
   * @return {Integer}
   * @since 2.2.0
   * @example
   * const ms = client.timeout;
   * console.info(ms);
   * // => 0
   */
  get timeout() {
    return internal(this).influx.timeout;
  }

  /**
   * Set the http request timeout value.
   * @since 2.2.0
   * @example
   * client.timeout = 1000;
   * console.info(client.timeout);
   * // => 1000
   */
  set timeout(v) {
    internal(this).influx.timeout = v;
  }

  /**
   * Get the query data format type
   * @return {String}
   * @since 2.2.0
   * @example
   * const formatType = clinet.format;
   * console.info(formatType);
   * // => undefined
   */
  get format() {
    return internal(this).options.format;
  }

  /**
   * Set the query data format type
   * @param  {String} type
   * @since 2.2.0
   * @example
   * client.format = 'json';
   * console.info(client.format);
   * // => 'json'
   */
  set format(type) {
    internal(this).options.format = type;
  }

  /**
   * Get the specified precision of epoch timestamps
   * @return {String}
   * @since 2.2.0
   * @example
   * const epoch = client.epoch;
   * console.info(epoch);
   * // => undefined
   */
  get epoch() {
    return internal(this).options.epoch;
  }

  /**
   * Set the specified precision of epoch timestamps.It should be [h,m,s,ms,u,ns]
   * @since 2.2.0
   * @example
   * client.epoch = 'ms';
   * console.info(client.epoch);
   * // => 'ms'
   */
  set epoch(v) {
    internal(this).options.epoch = v;
  }

  /**
   * Get the write queue length
   * @return {Integer}
   * @since 2.2.0
   * @example
   * client.write('http')
   *  .tag({
   *    spdy: 'fast',
   *    type: '2',
   *  })
   *  .field({
   *    use: 300,
   *  })
   *  .queue();
   * client.write('http')
   *  .tag({
   *    spdy: 'slow',
   *    type: '4',
   *  })
   *  .field({
   *    use: 1000,
   *  })
   *  .queue();
   * console.info(clinet.writeQueueLength);
   * // => 2
   */
  get writeQueueLength() {
    return internal(this).writeQueue.size;
  }

  /**
   * Get the query queue length
   * @return {Integer}
   * @since 2.2.0
   * @example
   * client.query('http')
   *  .set({limit: 1})
   *  .queue();
   * client.query('login')
   *  .set({limit: 1})
   *  .queue();
   * console.info(clinet.queryQueueLength);
   * // => 2
   */
  get queryQueueLength() {
    return internal(this).queryQueue.size;
  }

  /**
   * Create the database of the connection uri
   * @return {Promise}
   * @since 2.2.0
   * @example
   * const client = new Influx('http://127.0.0.1:8086/mydb');
   * client.createDatabase()
   *  .then(() => console.info('create database success'))
   *  .catch(err => console.error(`create database fail, ${err.message}`));
   */
  createDatabase() {
    const { opts } = internal(this);
    return internal(this).influx.createDatabase(opts.database);
  }

  /**
   * Drop the database of the connection uri
   * @return {Promise}
   * @since 2.2.0
   * @example
   * const client = new Influx('http://127.0.0.1:8086/mydb');
   * client.dropDatabase()
   *  .then(() => console.info('drop database success'))
   *  .catch(err => console.error(`drop database fail, ${err.message}`));
   */
  dropDatabase() {
    const { opts } = internal(this);
    return internal(this).influx.dropDatabase(opts.database);
  }

  /**
   * List all database of the server
   * @return {Array}
   * @since 2.2.0
   * @example
   * client.showDatabases()
   *   .then(console.info)
   *   .catch(console.error);
   * // => [ 'telegraf', '_internal', 'mydb' ]
   */
  showDatabases() {
    const ql = InfluxQL.showDatabases();
    const { influx } = internal(this);
    return influx.query(ql).then(data => _.flattenDeep(util.mergeValues(data)));
  }

  /**
   * Create retention policy
   * @param  {String} name - The retention policy
   * @param  {String} duration - The duration
   * @param  {Integer} replication - The replication
   * @param  {String} shardDuration - The shardDuration
   * @param  {Boolean} isDefault - Is the default retention policy
   * @return {Promise}
   * @since 2.2.0
   * @example
   * client.createRetentionPolicy('mytest', '2h')
   *   .then(() => console.info('create retention policy success'))
   *   .then(err => console.error(`create retention policy fail, ${err.message}`));
   */
  createRetentionPolicy(name, duration, replication, shardDuration, isDefault) {
    const internalData = internal(this);
    const { database } = internalData.opts;
    const q = InfluxQL.createRP(name, database, duration, shardDuration, replication, isDefault);
    return internalData.influx.query(q).then(_.noop);
  }

  /**
   * Update retention policy
   * @param  {String} name - The retention policy
   * @param  {String} duration - The duration
   * @param  {Integer} replication - The replication
   * @param  {String} shardDuration - The shardDuration
   * @param  {Boolean} isDefault - Is the default retention policy
   * @return {Promise}
   * @since 2.2.0
   * @example
   * client.updateRetentionPolicy('mytest', '2h')
   *   .then(() => console.info('update retention policy success'))
   *   .then(err => console.error(`update retention policy fail, ${err.message}`));
   */
  updateRetentionPolicy(name, duration, replication, shardDuration, isDefault) {
    const internalData = internal(this);
    const { database } = internalData.opts;
    const q = InfluxQL.updateRP(name, database, duration, replication, shardDuration, isDefault);
    return internalData.influx.query(q).then(_.noop);
  }

  /**
   * Drop retention policy
   * @param  {String} name - The retention policy
   * @return {Promise}
   * @since 2.2.0
   * @example
   * client.dropRetentionPolicy('mytest')
   *   .then(() => console.info('drop retention policy success'))
   *   .then(err => console.error(`drop retention policy fail, ${err.message}`));
   */
  dropRetentionPolicy(name) {
    const internalData = internal(this);
    const { database } = internalData.opts;
    const q = InfluxQL.dropRP(name, database);
    return internalData.influx.queryPost(q).then(_.noop);
  }

  /**
   * List retention policies
   * @return {Array}
   * @since 2.2.0
   * @example
   * client.showRetentionPolicies()
   *   .then(console.info)
   *   .catch(console.error);
   * // => [ { name: 'autogen', duration: '0s', shardGroupDuration: '168h0m0s', replicaN: 1, default: true } ]
   */
  showRetentionPolicies() {
    const internalData = internal(this);
    const { opts } = internalData;
    const q = InfluxQL.showRetentionPolicies(opts.database);
    return internalData.influx.query(q).then((data) => {
      const result = [];
      if (!data || !data.results) {
        return result;
      }
      _.forEach(data.results, (item) => {
        _.forEach(item.series, (series) => {
          const { columns } = series;
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
   * List the measurement of the influxdb server
   * @return {Array}
   * @since 2.2.0
   * @example
   * client.showMeasurements()
   *   .then(console.info)
   *   .catch(console.error);
   * // => [ 'cpu', 'disk', 'diskio', 'kernel', 'mem', 'processes', 'swap', 'system' ]
   */
  showMeasurements() {
    const ql = InfluxQL.showMeasurements();
    const { influx } = internal(this);
    return influx.query(ql).then(data => _.flattenDeep(util.mergeValues(data)));
  }

  /**
   * Show tag keys of measurement
   * @param  {String} measurement - [optional] If not set the param, will get the tag keys of the database.
   * @return {Array}
   * @since 2.2.0
   * @example
   * client.showTagKeys()
   *   .then(console.info)
   *   .catch(console.error);
   * // => [
   * //       { name: 'cpu', values: [
   * //         { key: 'cpu' },
   * //         { key: 'host' },
   * //         { key: 'dc' }]
   * //       },
   * //       { name: 'disk', values: [
   * //         { key: 'dc' },
   * //         { key: 'fstype' }]
   * //       }
   * //    ]
   * @example
   * client.showTagKeys('cpu')
   *   .then(console.info)
   *   .catch(console.error);
   * // => [
   * //       { name: 'cpu', values: [
   * //         { key: 'cpu' },
   * //         { key: 'host' },
   * //         { key: 'dc' }]
   * //       }
   * //    ]
   */
  showTagKeys(measurement) {
    const ql = InfluxQL.showTagKeys(measurement);
    const { influx } = internal(this);
    return influx.query(ql).then(util.convertTagAndFieldKeys);
  }

  /**
   * Show field keys of measurement
   * @param  {String} measurement - [optional] If not set the param, will get the field keys of the database.
   * @return {Array}
   * @since 2.2.0
   * @example
   * client.showFieldKeys()
   *   .then(console.info)
   *   .catch(console.error);
   * // => [
   * //       { name: 'cpu', values: [
   * //         { key: 'usage_guest', type: 'float' },
   * //         { key: 'usage_guest_nice', type: 'float' }]
   * //       },
   * //       { name: 'disk', values: [
   * //         { key: 'free', type: 'integer' },
   * //         { key: 'inodes_free', type: 'integer' }]
   * //       }
   * //    ]
   * @example
   * client.showFieldKeys('cpu')
   *   .then(console.info)
   *   .catch(console.error);
   * // => [
   * //       { name: 'cpu', values: [
   * //         { key: 'usage_guest', type: 'float' },
   * //         { key: 'usage_guest_nice', type: 'float' }]
   * //       }
   * //    ]
   */
  showFieldKeys(measurement) {
    const ql = InfluxQL.showFieldKeys(measurement);
    const { influx } = internal(this);
    return influx.query(ql).then(util.convertTagAndFieldKeys);
  }

  showSeries(measurement) {
    const ql = InfluxQL.showSeries(measurement);
    const { influx } = internal(this);
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
   * Get the writer for the influxdb
   * @param  {String} measurement - The measurment name
   * @param  {String} precision - [optional] timestamp precision, 'h', 'm', 's', 'ms', 'u', 'n'
   * @return {Writer}
   * @since 2.2.0
   * @example
   * client.write('http')
   *   .tag({
   *     spdy: '1',
   *     type: '2',
   *   })
   *   .field({
   *      use: 300,
   *      code: 200,
   *    })
   *    .then(() => console.info('write point success'));
   *    .catch(err => console.error(`write point fail, ${err.message}`));
   */
  write(measurement, precision) {
    const internalData = internal(this);
    const queue = internalData.writeQueue;
    const writer = new Writer(internalData.influx, (data) => {
      queue.add(data);
      this.emit('queue', {
        type: 'write',
        data,
      });
      this.emit('writeQueue', data);
    });
    writer.measurement = measurement;
    if (precision) {
      writer.precision = precision;
    }
    return writer;
  }

  /**
   * Get the influxdb query reader
   * @param  {String} measurement - The influxdb's measurement
   * @return {Reader}
   * @since 2.2.0
   * @example
   * const reader = client.query('http');
   */
  query(measurement) {
    const internalData = internal(this);
    const queue = internalData.queryQueue;
    const reader = new Reader(internalData.influx, (data) => {
      queue.add(data);
      this.emit('queue', {
        type: 'query',
        data,
      });
      this.emit('queryQueue', data);
    });
    reader.measurement = measurement;
    const formatType = this.format;
    if (formatType) {
      reader.set('format', formatType);
    }
    const { epoch } = this;
    if (epoch) {
      reader.set('epoch', epoch);
    }
    return reader;
  }

  /**
   * Update one record (latest)
   *
   * @param {any} measurement - The influxdb's measurement
   * @param {any} conditions - The query conditions
   * @param {any} updateFields - The update fileds
   * @return {Writer}
   * @memberof Client
   */
  findOneAndUpdate(measurement, conditions, updateFields) {
    if (!updateFields || updateFields.time) {
      throw new Error('update fields can not be null or update time field');
    }
    const updateItem = item => this.showTagKeys(measurement)
      .then((data) => {
        const found = _.find(data, tmp => tmp.name === measurement);
        if (!found) {
          return null;
        }
        return _.map(found.values, tmp => tmp.key);
      }).then((tagNames) => {
        if (!tagNames) {
          return null;
        }
        const tags = _.pick(item, tagNames);
        const fields = _.extend(_.omit(item, tagNames), updateFields);
        const time = util.convertToNs(fields.time);
        delete fields.time;
        return this.writePoint(measurement, fields, tags)
          .time(time);
      });

    return this.query(measurement)
      .condition(conditions)
      .set({
        limit: 1,
        format: 'json',
        order: 'desc',
      })
      .then((data) => {
        const item = _.get(data, `${measurement}[0]`);
        if (!item) {
          return null;
        }
        return updateItem(item);
      });
  }

  /**
   * Write point to influxdb
   * @param  {String} measurement - The measurement name
   * @param  {Object} fields - The fields of write point
   * @param  {Object} tags - [optional] The tags of write point
   * @param  {string} precision - [optional] The timestamp precision. 'h', 'm', 's', 'ms', 'u', 'n'
   * @return {Writer}
   * @since 2.2.0
   * @example
   * client.writePoint('http', {
   *   use: 300,
   *   code: 200,
   * }, {
   *   spdy: '1',
   *   type: '2',
   * }).then(() => console.info('write point success'))
   * .catch(err => console.error(`write point fail,  ${err.message}`));
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
   * Use influx ql to query the data
   * @param  {String} q  - The influx ql
   * @param  {String} db - [optional] The database, if the param is not set, it will use the connection's db.
   * @return {Promise}
   * @since 2.2.0
   * @example
   * const clinet = new Influx('http://127.0.0.1:8086/mydb')
   * client.queryRaw('select * from "http"')
   *   .then(console.info)
   *   .catch(console.error);
   *
   * @example
   * const clinet = new Influx('http://127.0.0.1:8086/mydb')
   * client.queryRaw('select * from "login"', 'testdb')
   *   .then(console.info)
   *   .catch(console.error);
   */
  queryRaw(q, db) {
    return internal(this).influx.query(q, db);
  }

  /**
   * Use post for the influxdb query, such as create user
   * @param  {String} q - The influx ql
   * @param  {String} db - The database
   * @return {Promise}
   * @since 2.2.0
   * @example
   * client.queryPost('create user "vicanso" with password \'mypwd\' with all privileges')
   *   .then(() => console.info('create user success'))
   *   .catch(err => console.error(`create user fail, ${err.message}`));
   */
  queryPost(q, db) {
    return internal(this).influx.queryPost(q, db);
  }

  /**
   * Sync the write queue
   * @return {Promise}
   * @since 2.2.0
   * @example
   * client.write('http')
   *   .tag({
   *     spdy: '1',
   *     type: '2',
   *   })
   *   .field({
   *      use: 300,
   *      code: 200,
   *    })
   *    .queue();
   * client.write('http')
   *   .tag({
   *     spdy: '2',
   *     type: '3',
   *   })
   *   .field({
   *     use: 600,
   *     code: 304,
   *   })
   *   .queue();
   * client.syncWrite()
   *   .then(() => console.info('sync write queue success'))
   *   .catch(err => console.error(`sync write queue fail, ${err.message}`));
   * // => sync write queue success
   */
  syncWrite() {
    const internalData = internal(this);
    const set = internalData.writeQueue;
    const { influx } = internalData;
    const arr = Array.from(set);
    if (arr.length === 0) {
      return Promise.resolve();
    }
    set.clear();
    this.emit('sync', {
      type: 'write',
      count: arr.length,
    });
    return influx.write(arr);
  }

  /**
   * Sync the query queue
   * @param  {String} format - [optional] The query response format type
   * @return {Promise}
   * @since 2.2.0
   * @example
   * client.query('cpu')
   *   .set({
   *     limit: 1,
   *   })
   *   .queue();
   * client.query('mem')
   *   .set({
   *     limit: 1,
   *   })
   *   .queue();
   * client.syncQuery('json')
   *   .then(console.info)
   *   .catch(console.error);
   * // => { cpu:
   * //      [ { time: '2016-12-09T12:46:48Z',
   * //          cpu: 'cpu-total',
   * //          host: 'red',
   * //          usage_user: 0.05000000000000008 } ],
   * //       mem:
   * //       [ { time: '2016-12-09T12:46:48Z',
   * //           active: 175300608,
   * //           available: 7891501056,
   * //           available_percent: 94.7944240310642,
   * //           used_percent: 5.205575968935799 } ] }
   */
  syncQuery(format) {
    const internalData = internal(this);
    const set = internalData.queryQueue;
    const { influx } = internalData;
    const arr = Array.from(set);
    if (arr.length === 0) {
      return Promise.resolve();
    }
    set.clear();
    this.emit('sync', {
      type: 'queue',
      count: arr.length,
    });
    return influx.query(arr.join(';'), null, internalData.options.epoch).then((data) => {
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
   * Set or Get schema for the measurement, if the field(tag) validate fail, the field(tag) will be remove
   * @param  {String} measurement - the name of measurement
   * @param  {Object} fieldSchema      - the field's schema definition, if is undefined, will return the schme for the measurement
   * @param  {Object} tagSchema      - the tag's schema definition
   * @param  {Object} options      - the schema options, {
   *   stripUnknown: Boolean, // remove all unknown field
   * }
   * @return {Object} The schema definition
   * @since 2.4.0
   * @example
   * const fieldSchema = {
   *   use: 'integer',
   *   sucesss: 'boolean',
   *   vip: 'boolean',
   * };
   * client.schema('request', fieldSchema);
   * client.write('request')
   *   .field({
   *     use: 300,
   *     sucesss: 'T',
   *     vip: 'true',
   *   })
   *   .then(() => {
   *     console.info('write point success');
   *   })
   *   .catch(console.error);
   * @example
   * const fieldSchema = {
   *   use: 'integer',
   *   sucesss: 'boolean',
   *   vip: 'boolean',
   * };
   * client.schema('request', fieldSchema, {
   *   stripUnknown: true,
   * });
   * client.write('request')
   *   .field({
   *     use: 300,
   *     sucesss: 'T',
   *     vip: 'true',
   *     account: 'vicanso',
   *   })
   *   .then(() => {
   *     console.info('write point success');
   *   })
   *   .catch(console.error);
   * @example
   * const fieldSchema = {
   *   use: 'integer',
   *   sucesss: 'boolean',
   *   vip: 'boolean',
   * };
   * const tagSchema = {
   *   spdy: ['1', '2'],
   *   method: '*',
   * };
   * client.schema('request', fieldSchema, tagSchema, {
   *   stripUnknown: true,
   * });
   * client.write('request')
   *   .field({
   *     use: 300,
   *     sucesss: 'T',
   *     vip: 'true',
   *     account: 'vicanso',
   *   })
   *   .tag({
   *     spdy: '2',
   *     method: 'GET',
   *   })
   *   .then(() => {
   *     console.info('write point success');
   *   })
   *   .catch(console.error);
   */
  /* eslint class-methods-use-this:0 */
  schema(measurement, fieldSchema, tgs, opts) {
    if (!fieldSchema) {
      return schema.get(measurement);
    }
    let tagSchema = tgs;
    let options = opts;
    if (_.has(tagSchema, 'stripUnknown')) {
      options = tgs;
      tagSchema = opts;
    }
    return schema.set(measurement, fieldSchema, tagSchema, options);
  }

  /**
   * Set the load balance algorithm
   * @param {String} type - the load balance type
   * @param {Function} fn - the load balance function, it shoud return an integer
   * @since 2.7.0
   * @example
   * client.addAlgorithm('getByUrl', (request) => {
   *   return request.url.length;
   * });
   */
  addAlgorithm(type, fn) {
    return internal(this).influx.addAlgorithm(type, fn);
  }

  /**
   * Add plugin function
   * @param {Function} fn - plugin function
   * @since 2.11.0
   * @example
   * const noCache = require('superagent-no-cache')
   * client.addPlugin(noCache);
  */
  addPlugin(fn) {
    return internal(this).influx.addPlugin(fn);
  }
}

module.exports = Client;
