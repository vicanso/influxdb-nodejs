'use strict';
const _ = require('lodash');
const internal = require('./internal');
const util = require('./util');

class Writer {
  constructor(client, queueSet) {
    const internalData = internal(this);
    internalData.client = client;
    internalData.queueSet = queueSet;
    internalData.measurement = '';
    internalData.tags = {};
    internalData.fields = {};
    internalData.time = 0;
  }
  set measurement(v) {
    internal(this).measurement = v;
  }
  get measurement() {
    return internal(this).measurement;
  }
  tag(k, v) {
    const tags = internal(this).tags;
    if (v) {
      tags[k] = v;
    } else {
      _.extend(tags, k);
    }
    return this;
  }
  field(k, v) {
    const fields = internal(this).fields;
    if (v) {
      fields[k] = v;
    } else {
      _.extend(fields, k);
    }
    return this;
  }
  time(v) {
    if (v) {
      internal(this).time = v;
    } else {
      internal(this).time = Date.now();
    }
    return this;
  }
  then(resolve, reject) {
    if (!this._fullfilledPromise) {
      const client = internal(this).client;
      const data = this.toJSON();
      this._fullfilledPromise = new Promise((innerResolve, innerReject) => {
        client.write(data).then(res => {
          innerResolve(res.body);
        }, err => {
          innerReject(util.getError(err));
        });
      });
    }
    return this._fullfilledPromise.then(resolve, reject);
  }

  toJSON() {
    if (!internal(this).time) {
      this.time();
    }
    return {
      measurement: internal(this).measurement,
      tags: internal(this).tags,
      fields: internal(this).fields,
      time: internal(this).time,
    };
  }
  queue() {
    if (!internal(this).time) {
      this.time();
    }
    internal(this).queueSet.add(this.toJSON());
    return this;
  }
}

module.exports = Writer;
