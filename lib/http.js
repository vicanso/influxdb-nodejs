'use strict';
const request = require('superagent');
const loadBalancer = require('superagent-load-balancer');
const internal = require('./internal');

function end(req) {
  return new Promise((resolve, reject) => {
    req.on('response', (res) => {
      const response = res;
      if (response.statusCode === 204) {
        delete response.headers['content-encoding'];
      }
    });
    req.end((err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

class HTTP {
  constructor(servers) {
    // health check
    const data = internal(this);
    loadBalancer.healthCheck(servers, {
      ping: (backend, cb) => {
        const url = `${backend.protocol || 'http'}://${backend.host}:${backend.port || 80}/query?q=SHOW+SERIES+WHERE+FALSE`;
        request.get(url).end(cb);
      },
    });
    data.balancer = loadBalancer.get(servers);
  }
  get(url, query) {
    const req = request.get(url);
    if (query) {
      req.query(query);
    }
    req.use(internal(this).balancer);
    return end(req).then(res => res.body);
  }
  post(url, data, query) {
    const req = request.post(url)
      .type('form')
      .send(data);
    if (query) {
      req.query(query);
    }
    req.use(internal(this).balancer);
    return end(req);
  }
}

module.exports = HTTP;
