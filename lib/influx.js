'use strict';
const _ = require('lodash');
const HTTP = require('./http');
const internal = require('./internal');
const debug = require('./debug');
const util = require('./util');

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
    const client = new HTTP(options.servers);
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
    debug('q:%s', q);
    const internalData = internal(this);
    const opts = internalData.opts;
    const queryData = {
      q,
      db: opts.database,
    };
    if (opts.username && opts.password) {
      queryData.u = opts.username;
      queryData.p = opts.password;
    }
    if (opts.epoch) {
      queryData.epoch = opts.epoch;
    }
    return internalData.client.get('/query', queryData).then(res => res.body, err => {
      throw util.getError(err);
    });
  }

  /**
   * [queryRaw description]
   * @param  {[type]} q [description]
   * @return {[type]}   [description]
   */
  queryRaw(q) {
    debug('q:%s', q);
    return internal(this).client.get('/query', {
      q,
    }).then(res => res.body, err => {
      /* istanbul ignore next */
      throw util.getError(err);
    });
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
    return client.post('/write', postData.join('\n'), queryData).then(res => res.body, err => {
      /* istanbul ignore next */
      throw util.getError(err);
    });
  }
}

module.exports = Influx;
