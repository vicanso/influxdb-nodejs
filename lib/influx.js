'use strict';
const qs = require('querystring');
const _ = require('lodash');
const HTTP = require('./http');
const internal = require('./internal');

function format(data) {
  return _.map(data, (v, k) => `${k}=${v}`).join(',');
}

function getPostData(data) {
  return `${data.measurement},${format(data.tags)} ${format(data.fields)} ${data.time}`;
}

class Influx {
  constructor(options) {
    const servers = options.servers || [{
      host: options.host,
      port: options.port,
      protocol: options.protocol,
    }];
    const client = new HTTP(_.map(servers, server => _.pick(server, ['host', 'protocol', 'port'])));

    const internalData = internal(this);
    internalData.opts = options;
    internalData.client = client;
  }

  set timeout(v) {
    internal(this).client.timeout = v;
  }
  get timeout() {
    return internal(this).client.timeout;
  }

  get availableServers() {
    return internal(this).client.availableServers;
  }
  get unavailableServers() {
    return internal(this).client.unavailableServers;
  }

  query(q) {
    const options = internal(this).opts;
    const data = {
      q,
      db: options.database,
    };
    const url = `/query?${qs.stringify(data)}`;
    return internal(this).client.get(url);
  }

  write(v) {
    const data = _.clone(v);
    const options = internal(this).opts;
    const queryData = {
      db: options.database,
    };
    /* istanbul ignore if */
    if (options.username && options.password) {
      data.u = data.username;
      data.p = data.password;
    }
    const url = `/write?${qs.stringify(queryData)}`;
    const postData = getPostData(data);
    return internal(this).client.post(url, postData);
  }

  writePoints(v) {
    const data = _.clone(v);
    const options = internal(this).opts;
    const queryData = {
      db: options.database,
    };
    /* istanbul ignore if */
    if (options.username && options.password) {
      data.u = data.username;
      data.p = data.password;
    }
    const url = `/write?${qs.stringify(queryData)}`;
    const postData = _.map(data, getPostData);
    return internal(this).client.post(url, postData.join('\n'));
  }
}

module.exports = Influx;
