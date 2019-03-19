'use strict';

const _ = require('lodash');
const request = require('superagent');
const Balancer = require('superagent-load-balancer');

const internal = require('./internal');
const debug = require('./debug');

function getRequest(method, url, query, timeout) {
  const req = request[method](url);
  if (query) {
    req.query(query);
  }
  if (timeout) {
    req.timeout(timeout);
  }
  return req;
}

class HTTP {
  /**
   * [constructor description]
   * @param  {[type]} servers [backendList]
   * @return {[type]}         [description]
   */
  constructor(servers, type) {
    // health check
    const data = internal(this);
    debug('http backends:%j', servers);
    const balancer = new Balancer(servers, type);
    data.balancer = balancer;
    data.plugins = [
      balancer.plugin(),
    ];
  }

  /**
   * [addPlugin add plugin for http request]
   * @param {Function} fn plugin function
   */
  addPlugin(fn) {
    internal(this).plugins.push(fn);
  }

  /**
   * [timeout set request time out]
   * @param  {[type]} v [timeout ms]
   * @return {[type]}   [description]
   */
  set timeout(v) {
    /* istanbul ignore else */
    if (_.isNumber(v)) {
      internal(this).timeout = v;
    }
  }

  /**
   * [timeout get request time out]
   * @return {[type]} [description]
   */
  get timeout() {
    return internal(this).timeout || 0;
  }

  /**
   * [get http get]
   * @param  {[type]} url   [description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  get(url, query) {
    debug('GET %s, query:%j', url, query);
    const internalData = internal(this);
    const req = getRequest('get', url, query, internalData.timeout);
    _.forEach(internalData.plugins, plugin => req.use(plugin));
    return req;
  }

  /**
   * [post http post]
   * @param  {[type]} url   [description]
   * @param  {[type]} data  [description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  post(url, data, query) {
    debug('POST %s, data:%j, query:%j', url, data, query);
    const internalData = internal(this);
    const req = getRequest('post', url, query, internalData.timeout);
    req.type('form')
      .send(data);
    _.forEach(internalData.plugins, plugin => req.use(plugin));
    return req;
  }

  startHealthCheck(ping, interval) {
    internal(this).balancer.startHealthCheck({
      ping,
      interval,
    });
  }

  getAvailableServers() {
    return internal(this).balancer.getAvailableServers();
  }

  addAlgorithm(type, fn) {
    return internal(this).balancer.addAlgorithm(type, fn);
  }
}

module.exports = HTTP;
