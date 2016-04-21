'use strict';
const _ = require('lodash');
const request = require('superagent');
const loadBalancer = require('superagent-load-balancer');
const internal = require('./internal');

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
  constructor(servers, ping) {
    // health check
    const data = internal(this);
    if (_.isFunction(ping)) {
      loadBalancer.healthCheck(servers, {
        ping,
      });
    }
    data.balancer = loadBalancer.get(servers);
  }
  set timeout(v) {
    if (_.isNumber(v)) {
      internal(this).timeout = v;
    }
  }
  get timeout() {
    return internal(this).timeout;
  }
  get(url, query) {
    const internalData = internal(this);
    const req = getRequest('get', url, query, internalData.timeout);
    req.use(internalData.balancer);
    return req;
  }
  post(url, data, query) {
    const internalData = internal(this);
    const req = getRequest('post', url, query, internalData.timeout);
    req.type('form')
      .send(data);
    req.use(internalData.balancer);
    return req;
  }
}

module.exports = HTTP;
