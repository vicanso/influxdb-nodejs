'use strict';
const _ = require('lodash');
const util = require('./util');
const internal = require('./internal');

class Writer {
  constructor(client, measurement) {
    const internalData = internal(this);
    internalData.client = client;
    internalData.measurement = measurement;
    internalData.tags = {};
    internalData.fields = {};
    internalData.time = 0;
  }
  measurement(v) {
    internal(this).measurement = v;
    return this;
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
      internal(this).time = util.now();
    }
    return this;
  }
  end() {
    return internal(this).client.influxWrite(this.toJSON());
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
    internal(this).client.queue(this);
  }
}

module.exports = Writer;
