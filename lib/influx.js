'use strict';

const InfluxQL = require('influx-ql');
const _ = require('lodash');
const HTTP = require('./http');
const internal = require('./internal');
const debug = require('./debug');
const util = require('./util');

const influxInt = new RegExp('^[0-9]+i$');

function convert(v) {
  if (!_.isString(v)) {
    return v;
  }
  return v.replace(/,/g, '\\,').replace(/ /g, '\\ ');
}

function format(data) {
  return _.map(data, (v, k) => `${convert(k)}=${convert(v)}`).join(',');
}

function isBoolean(v) {
  const arr = ['t', 'true', 'f', 'false'];
  return _.indexOf(arr, v.toLowerCase()) !== -1;
}

function formatFields(data) {
  return _.map(data, (v, k) => {
    if (_.isString(v) && !influxInt.test(v) && !isBoolean(v)) {
      return `${convert(k)}="${v}"`;
    }
    return `${convert(k)}=${convert(v)}`;
  }).join(',');
}
// Tags should be sorted by key before being sent for best performance. The sort should match that from the Go bytes.Compare function (http://golang.org/pkg/bytes/#Compare).
function sortTags(data) {
  const toBuffer = (str) => {
    if (Buffer.from && Buffer.from !== Uint8Array.from) {
      return Buffer.from(str);
    }
    return new Buffer(str); // eslint-disable-line
  };
  const keys = _.map(_.keys(data), toBuffer).sort(Buffer.compare);
  const result = {};
  _.forEach(keys, (key) => {
    const k = key.toString();
    result[k] = data[k];
  });
  return result;
}

function getPostData(data) {
  const arr = [data.measurement];
  if (data.tags && !_.isEmpty(data.tags)) {
    arr.push(`,${format(sortTags(data.tags))}`);
  }
  arr.push(` ${formatFields(data.fields)}`);
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
    const client = new HTTP(options.servers, options.loadBalancingAlgorithm);
    // 如果有配置了用户与密码
    if (options.username && options.password) {
      // basic auth认证
      if (options.authType === 'basic') {
        const str = `${options.username}:${options.password}`;
        const authValue = `Basic ${Buffer.from(str).toString('base64')}`;
        client.addPlugin((req) => {
          req.set('Authorization', authValue);
          return req;
        });
      } else {
        client.addPlugin((req) => {
          req.query({
            u: options.username,
            p: options.password,
          });
          return req;
        });
      }
    }

    const internalData = internal(this);
    internalData.opts = _.extend({}, options);
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
  query(q, db, epoch) {
    debug('q:%s', q);
    const internalData = internal(this);
    const { opts } = internalData;
    const queryData = {
      q,
      db: db || opts.database,
    };
    if (epoch) {
      queryData.epoch = epoch;
    }
    return internalData.client.get('/query', queryData).then(res => res.body, (err) => {
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
    const { opts } = internalData;
    const { client } = internalData;
    const queryData = {
      db: opts.database,
    };
    if (points[0].precision) {
      queryData.precision = points[0].precision;
    }
    if (points[0].RP) {
      queryData.rp = points[0].RP;
    }
    const postData = _.map(points, getPostData);
    return client.post('/write', postData.join('\n'), queryData).then(res => res.body, (err) => {
      /* istanbul ignore next */
      throw util.getError(err);
    });
  }

  createDatabase(db) {
    return this.queryPost(InfluxQL.createDatabase(db));
  }

  dropDatabase(db) {
    return this.queryPost(InfluxQL.dropDatabase(db));
  }

  queryPost(q, db) {
    const internalData = internal(this);
    debug('q:%s', q);
    const queryData = {};
    /* istanbul ignore if */
    if (db) {
      queryData.db = db;
    }
    return internalData.client.post('/query', {
      q,
    }, queryData).then(res => res.body, (err) => {
      /* istanbul ignore next */
      throw util.getError(err);
    });
  }

  startHealthCheck(ping, interval) {
    internal(this).client.startHealthCheck(ping, interval);
  }

  getAvailableServers() {
    return internal(this).client.getAvailableServers();
  }

  addAlgorithm(type, fn) {
    return internal(this).client.addAlgorithm(type, fn);
  }

  /**
   * Add plugin function
   * @param {Function} fn plugin function
   */
  addPlugin(fn) {
    return internal(this).client.addPlugin(fn);
  }
}

module.exports = Influx;
