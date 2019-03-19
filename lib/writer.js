'use strict';

const _ = require('lodash');

const internal = require('./internal');
const debug = require('./debug');
const util = require('./util');
const schema = require('./schema');

function clearNilValue(data) {
  const result = {};
  _.forEach(data, (v, k) => {
    if (!_.isNil(v)) {
      result[k] = v;
    }
  });
  return result;
}

/**
 * Influxdb Writer
 * @example
 * const Influx = require('influxdb-nodejs');
 * const client = new Influx('http://127.0.0.1:8086/mydb');
 * const writer = client.writer('http');
 */

class Writer {
  /**
   * Get the influxdb writer
   * @param  {Influx} client - The influx instance
   * @param  {Function} queue - The queue function
   * @return {Writer}
   * @since 2.2.0
   */
  constructor(client, queue) {
    const internalData = internal(this);
    internalData.client = client;
    internalData.queue = queue;
    internalData.measurement = '';
    internalData.tags = {};
    internalData.fields = {};
    internalData.time = 0;
    internalData.precision = undefined;
  }

  set measurement(v) {
    internal(this).measurement = v;
  }

  get measurement() {
    return internal(this).measurement;
  }

  set precision(v) {
    internal(this).precision = v;
  }

  get precision() {
    return internal(this).precision;
  }

  /**
   * Set the internal value
   * @param {String|Object} key the key
   * @param {Any} value the value
   * @return {Writer}
   * @since 2.7.7
   * @example
   * client.write('http')
   *   .tag('method', 'GET')
   *   .tag({
   *     spdy: 'fast',
   *     type: '2',
   *   })
   *   .set({
   *     RP: 'test',
   *   })
   *   .field('size', 10 * 1024)
   *   .field({
   *     use: 300,
   *     code: 200,
   *   })
   *   .then(() => console.info('write point success'))
   *   .catch(err => console.error(`write point fail, ${err.message}`));
   */
  set(key, value) {
    if (_.isObject(key)) {
      _.forEach(key, (v, k) => {
        this.set(k, v);
      });
    }
    internal(this)[key] = value;
    return this;
  }

  /**
   * Set the tag for the write point
   * @param  {String | Object} key - The tag's key
   * @param  {Any} value - The tag's value
   * @return {Writer}
   * @since 2.2.0
   * @example
   * client.write('http')
   *   .tag('method', 'GET')
   *   .tag({
   *     spdy: 'fast',
   *     type: '2',
   *   })
   *   .field('size', 10 * 1024)
   *   .field({
   *     use: 300,
   *     code: 200,
   *   })
   *   .then(() => console.info('write point success'))
   *   .catch(err => console.error(`write point fail, ${err.message}`));
   */
  tag(k, v) {
    const { tags } = internal(this);
    if (v) {
      tags[k] = v;
    } else {
      _.extend(tags, k);
    }
    return this;
  }

  /**
   * Set the field for the write point
   * @param  {String | Object} key - The field's key
   * @param  {Any} value - The field's value
   * @return {Writer}
   * @since 2.2.0
   * @example
   * client.write('http')
   *   .tag('method', 'GET')
   *   .tag({
   *     spdy: 'fast',
   *     type: '2',
   *   })
   *   .field('size', 10 * 1024)
   *   .field({
   *     use: 300,
   *     code: 200,
   *   })
   *   .then(() => console.info('write point success'))
   *   .catch(err => console.error(`write point fail, ${err.message}`));
   */
  field(k, v) {
    const { fields } = internal(this);
    if (v) {
      fields[k] = v;
    } else {
      _.extend(fields, k);
    }
    return this;
  }

  /**
   * Set the timestamp for the write point
   * @param  {String} timestamp - The timestamp
   * @return {String} precision - The precision for the timestamp
   * @since 2.2.0
   * @example
   * client.write('http')
   *   .tag('method', 'GET')
   *   .tag({
   *     spdy: 'fast',
   *     type: '2',
   *   })
   *   .field('size', 10 * 1024)
   *   .field({
   *     use: 300,
   *     code: 200,
   *   })
   *   .time(Date.now(), 'ms')
   *   .then(() => console.info('write point success'))
   *   .catch(err => console.error(`write point fail, ${err.message}`));
   */
  time(timestamp, precision) {
    internal(this).time = `${timestamp}`;
    if (precision) {
      internal(this).precision = precision;
    }
    return this;
  }

  /**
   * Get the writer promise
   * @param  {Function} resolve - resolve function
   * @param  {Function} reject - reject function
   * @return {Promise}
   * @since 2.2.0
   */
  then(resolve, reject) {
    if (!this.fullfilledPromise) {
      const { client } = internal(this);
      const data = this.toJSON();
      this.fullfilledPromise = new Promise((innerResolve, innerReject) => {
        client.write(data).then(innerResolve, innerReject);
      });
    }
    return this.fullfilledPromise.then(resolve, reject);
  }

  /**
   * Get the point data {measurement: String, tags: Object, fields: Object, time: String }]
   * @return {Object}
   * @since 2.2.0
   * @example
   * const writer = client.write('http')
   *   .tag('method', 'GET')
   *   .tag({
   *     spdy: 'fast',
   *     type: '2',
   *   })
   *   .field('size', 10 * 1024)
   *   .field({
   *     use: 300,
   *     code: 200,
   *   });
   * console.info(writer.toJSON());
   * // => { measurement: 'http',
   * //      tags: { method: 'GET', spdy: 'fast', type: '2' },
   * //      fields: { size: 10240, use: 300, code: 200 },
   * //      time: 0 }
   */
  toJSON() {
    const internalData = internal(this);
    const { measurement } = internalData;
    /* istanbul ignore if */
    if (!internalData.measurement) {
      throw new Error('measurement can not be null');
    }
    const data = {
      measurement,
    };
    _.forEach('tags fields time precision RP'.split(' '), (key) => {
      if (!_.isUndefined(internalData[key])) {
        let value = internalData[key];
        if (_.isObject(value)) {
          value = clearNilValue(value);
        }
        switch (key) {
          case 'fields':
            data[key] = schema.validateFields(measurement, value);
            break;
          case 'tags':
            data[key] = schema.validateTags(measurement, value);
            break;
          default:
            data[key] = value;
        }
      }
    });

    debug('writer data:%j', data);
    return data;
  }

  /**
   * Add the writer to the queue
   * @return {Writer}
   * @since 2.2.0
   * @example
   * client.write('http')
   *   .tag('method', 'GET')
   *   .tag({
   *     spdy: 'fast',
   *     type: '2',
   *   })
   *   .field('size', 10 * 1024)
   *   .field({
   *     use: 300,
   *     code: 200,
   *   })
   *   .queue();
   */
  queue() {
    const internalData = internal(this);
    const { queue } = internalData;
    /* istanbul ignore if */
    if (!queue) {
      throw new Error('queue function is undefined');
    }
    if (!internalData.time) {
      this.time(util.getTime(internalData.precision));
    }
    queue(this.toJSON());
    return this;
  }
}

module.exports = Writer;
