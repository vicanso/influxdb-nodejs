'use strict';

const _ = require('lodash');

const internal = require('./internal');
const debug = require('./debug');

class Writer {
  /**
   * [constructor description]
   * @param  {[type]} client   [Influx Instance]
   * @param  {[type]} queueSet [Set instance for queue]
   * @return {[type]}          [description]
   */
  constructor(client, queueSet) {
    const internalData = internal(this);
    internalData.client = client;
    internalData.queueSet = queueSet;
    internalData.measurement = '';
    internalData.tags = {};
    internalData.fields = {};
    internalData.time = 0;
    internalData.precision = undefined;
  }
  /**
   * [measurement description]
   * @param  {[type]} v [description]
   * @return {[type]}   [description]
   */
  set measurement(v) {
    internal(this).measurement = v;
  }
  /**
   * [measurement description]
   * @return {[type]} [description]
   */
  get measurement() {
    return internal(this).measurement;
  }
  /**
   * [measurement description]
   * @param  {[type]} v [description]
   * @return {[type]}   [description]
   */
  set precision(v) {
    internal(this).precision = v;
  }
  /**
   * [measurement description]
   * @return {[type]} [description]
   */
  get precision() {
    return internal(this).precision;
  }
  /**
   * [tag add tags to the point]
   * @param  {[type]} k [description]
   * @param  {[type]} v [description]
   * @return {[type]}   [description]
   */
  tag(k, v) {
    const tags = internal(this).tags;
    if (v) {
      tags[k] = v;
    } else {
      _.extend(tags, k);
    }
    return this;
  }
  /**
   * [field add field to the point]
   * @param  {[type]} k [description]
   * @param  {[type]} v [description]
   * @return {[type]}   [description]
   */
  field(k, v) {
    const fields = internal(this).fields;
    if (v) {
      fields[k] = v;
    } else {
      _.extend(fields, k);
    }
    return this;
  }
  /**
   * [time set the time value]
   * @param  {[type]} v [description]
   * @return {[type]}   [description]
   */
  time(v, precision) {
    internal(this).time = v;
    if (precision) {
      this.precision = precision;
    }
    return this;
  }
  /**
   * [then description]
   * @param  {[type]} resolve [description]
   * @param  {[type]} reject  [description]
   * @return {[type]}         [description]
   */
  then(resolve, reject) {
    if (!this.fullfilledPromise) {
      const client = internal(this).client;
      const data = this.toJSON();
      this.fullfilledPromise = new Promise((innerResolve, innerReject) => {
        client.write(data).then(innerResolve, innerReject);
      });
    }
    return this.fullfilledPromise.then(resolve, reject);
  }
  /**
   * [toJSON get the point data {measurement: String, tags: Object, fields: Object, time: String }]
   * @return {[type]} [description]
   */
  toJSON() {
    const internalData = internal(this);

    const data = _.pick(internalData, 'measurement tags fields time precision'.split(' '));
    /* istanbul ignore if */
    if (!data.measurement) {
      throw new Error('measurement can not be null');
    }
    debug('writer data:%j', data);
    return data;
  }
  /**
   * [queue add write point data to the queue set]
   * @return {[type]} [description]
   */
  queue() {
    const queueSet = internal(this).queueSet;
    /* istanbul ignore if */
    if (!queueSet) {
      throw new Error('queue set is undefined');
    }
    /* istanbul ignore else */
    queueSet.add(this.toJSON());
    return this;
  }
}

module.exports = Writer;
