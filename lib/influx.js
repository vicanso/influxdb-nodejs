'use strict';
const _ = require('lodash');
const HTTP = require('./http');
const internal = require('./internal');
const request = require('superagent');
const debug = require('./debug');

function format(data) {
  return _.map(data, (v, k) => `${k}=${v}`).join(',');
}

function getPostData(data) {
  const arr = [data.measurement];
  if (data.tags) {
    arr.push(`,${format(data.tags)}`);
  }
  arr.push(` ${format(data.fields)}`);
  if (data.time) {
    arr.push(` ${data.time}`);
  }
  return arr.join('');
}

class Influx {
  /**
   * [constructor description]
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
   */
  constructor(options) {
    /* istanbul ignore if */
    if (!options.database) {
      throw new Error('database can not be null');
    }
    /* istanbul ignore if */
    if (!options.servers || !options.servers.length) {
      throw new Error('servers cat not be null');
    }
    debug('Influx init options:%j', options);
    const client = new HTTP(options.servers, (backend, cb) => {
      const url = `${backend.protocol || 'http'}://${backend.host}:${backend.port || 80}/query?q=SHOW+SERIES+WHERE+FALSE`;
      request.get(url).end(cb);
    });
    const internalData = internal(this);
    internalData.opts = _.extend({
      // epoch: 'ms',
    }, options);
    internalData.client = client;
  }
  /**
   * [timeout set timeout]
   * @param  {[type]} v [description]
   * @return {[type]}   [description]
   */
  set timeout(v) {
    internal(this).client.timeout = v;
  }

  /**
   * [timeout get timeout]
   * @return {[type]} [description]
   */
  get timeout() {
    return internal(this).client.timeout;
  }

  /**
   * [query query result from influxdb]
   * @param  {[type]} q [description]
   * @return {[type]}   [description]
   */
  query(q) {
    const internalData = internal(this);
    const opts = internalData.opts;
    const queryData = {
      q,
      db: opts.database,
    };
    if (opts.epoch) {
      queryData.epoch = opts.epoch;
    }
    return internalData.client.get('/query', queryData);
  }

  /**
   * [write write point to influxdb]
   * @param  {[type]} v [description]
   * @return {[type]}   [description]
   */
  write(v) {
    const points = _.isArray(v) ? v : [v];
    const internalData = internal(this);
    const opts = internalData.opts;
    const client = internalData.client;
    const queryData = {
      db: opts.database,
    };
    // if (opts.epoch) {
    //   queryData.epoch = opts.epoch;
    // }
    if (opts.username && opts.password) {
      queryData.u = opts.username;
      queryData.p = opts.password;
    }
    const postData = _.map(points, getPostData);
    return client.post('/write', postData.join('\n'), queryData);
  }
}

module.exports = Influx;
