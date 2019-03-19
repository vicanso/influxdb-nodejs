'use strict';

const QL = require('influx-ql');
const _ = require('lodash');

const internal = require('./internal');
const debug = require('./debug');
const util = require('./util');

const qlKeys = 'RP start end limit slimit order offset soffset fill tz'.split(' ');

/**
 * Influxdb Reader extends InfluxQL
 * @extends QL
 * @example
 * const Influx = require('influxdb-nodejs');
 * const client = new Influx('http://127.0.0.1:8086/mydb');
 * const reader = client.query('http');
 */

class Reader extends QL {
  /**
   * Get the influxdb reader
   * @param  {Influx} client - The influx instance
   * @param  {Function} queue - The queue function
   * @return {Reader}
   * @since 2.2.0
   */
  constructor(client, queue) {
    /* istanbul ignore if */
    if (!client) {
      throw new Error('client cat not be null');
    }
    super();
    const internalData = internal(this);
    internalData.client = client;
    internalData.queue = queue;
    internalData.options = {};
  }

  /**
   * Set the reader options
   * @param {String | Object} key - The key of options, eg: format epoch RP start end limit slimit order offset soffset fill
   * @param {Any} - The value of options
   * @return {Reader}
   * @since 2.2.0
   * @example
   * client.query('http')
   *   .condition('spdy', 'fast')
   *   // query data response type
   *   .set('format', 'json')
   *   // the specified precision of epoch timestamps
   *   .set('epoch', 's')
   *   .set({
   *     // the retention policy
   *     RP: 'autogen',
   *     // the query start time, 3 hours ago
   *     start: '-3h',
   *     // the query end time, 1 hours ago
   *     end: '-1h',
   *     // the query point limit, paginates N points in the query results
   *     limit: 10,
   *     // the query series limit
   *     slimit: 1,
   *     // the query result order
   *     order: 'desc',
   *     // the query offset
   *     offset: 10,
   *     // specifies the number of series to paginate
   *     soffset: 0,
   *     // changes the value reported for time intervals that have no data
   *     fill: 0,
   *     // timezone
   *     tz: 'America/Chicago',
   *   })
   *   .then(console.info)
   *   .catch(console.error);
   */
  set(k, v) {
    const { options } = internal(this);

    if (_.isObject(k)) {
      _.forEach(k, (v1, k1) => this.set(k1, v1));
    } else if (_.indexOf(qlKeys, k) !== -1) {
      this[k] = v;
    } else {
      options[k] = v;
    }
    return this;
  }

  /**
   * Get the reader options
   * @param  {String} key - The key of options
   * @return {Any}
   * @since 2.2.0
   * @example
   * const reader = client.query('http').set({
   *   limit: 10,
   * });
   * console.info(reader.get('limit'));
   * // => 10
   */
  get(k) {
    if (_.indexOf(qlKeys, k) !== -1) {
      return this[k];
    }
    return internal(this).options[k];
  }

  /**
   * Get the query promise
   * @param  {Function} resolve - resolve function
   * @param  {Function} reject - reject function
   * @return {Promise}
   * @since 2.2.0
   */
  then(resolve, reject) {
    /* istanbul ignore else */
    if (!this.fullfilledPromise) {
      /* istanbul ignore if */
      if (!this.measurement) {
        throw new Error('measurement can not be null');
      }
      const { client } = internal(this);
      const { options } = internal(this);
      const q = this.toSelect();
      const { format } = options;
      debug('reader q:%s', q);
      this.fullfilledPromise = new Promise((innerResolve, innerReject) => {
        client.query(q, null, this.get('epoch')).then((data) => {
          let fn = null;
          switch (format) {
            case 'json':
              fn = util.toJSON;
              break;
            case 'csv':
              fn = util.toCsv;
              break;
            default:
              fn = _.identity;
              break;
          }
          try {
            const result = fn(data);
            innerResolve(result);
          } catch (err) {
            innerReject(err);
          }
        }, innerReject);
      });
    }
    return this.fullfilledPromise.then(resolve, reject);
  }

  /**
   * Add the query to the queue
   * @return {Reader}
   * @since 2.2.0
   * @example
   * client.query('http')
   *   .tag({
   *     spdy: '1',
   *   })
   *   .queue();
   */
  queue() {
    const { queue } = internal(this);
    /* istanbul ignore if */
    if (!queue) {
      throw new Error('queue function is undefined');
    }
    /* istanbul ignore if */
    if (!this.measurement) {
      throw new Error('measurement can not be null');
    }
    const q = this.toSelect();
    debug('reader q:%s', q);
    queue(q);
    return this;
  }

  /**
   * Get the influx ql of the reader
   * @return {String}
   * @since 2.2.1
   * @example
   * const ql = client.query('http')
   *   .tag({
   *     spdy: '1',
   *   })
   *   .toString();
   * // => select * from "http" where "spdy" = '1'
   */
  toString() {
    return this.toSelect();
  }

  /**
   * Add influx ql calculate, use addFunction instead of it.
   * @param {String} type  - calculate type
   * @param {String} field - calculate field
   */
  addCalculate(type, field) {
    /* eslint no-console:0 */
    console.warn('Please use addFunction instead of addCalculate');
    return this.addFunction(type, field);
  }
}

module.exports = Reader;
