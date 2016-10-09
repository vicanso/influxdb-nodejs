'use strict';

const QL = require('influx-ql');
const _ = require('lodash');

const internal = require('./internal');
const debug = require('./debug');
const util = require('./util');

class Reader extends QL {
  /**
   * [constructor description]
   * @param  {[type]} client   [Influx Instance]
   * @param  {[type]} queueSet [Set Instance for queue]
   * @return {[type]}          [description]
   */
  constructor(client, queueSet) {
    /* istanbul ignore if */
    if (!client) {
      throw new Error('client cat not be null');
    }
    super();
    const internalData = internal(this);
    internalData.client = client;
    internalData.queueSet = queueSet;
    internalData.options = {};
  }

  set(k, v) {
    const options = internal(this).options;
    if (_.isObject(k)) {
      _.extend(options, k);
    } else {
      options[k] = v;
    }
    return this;
  }

  get(k) {
    return internal(this).options[k];
  }

  /**
   * [then description]
   * @param  {[type]} resolve [description]
   * @param  {[type]} reject  [description]
   * @return {[type]}         [description]
   */
  then(resolve, reject) {
    /* istanbul ignore else */
    if (!this.fullfilledPromise) {
      /* istanbul ignore if */
      if (!this.measurement) {
        throw new Error('measurement can not be null');
      }
      const client = internal(this).client;
      const options = internal(this).options;
      const q = this.toSelect();
      const format = options.format;
      debug('reader q:%s', q);
      this.fullfilledPromise = new Promise((innerResolve, innerReject) => {
        client.query(q, null, this.get('epoch')).then((data) => {
          switch (format) {
            case 'json':
              innerResolve(util.toJSON(data));
              break;
            case 'csv':
              innerResolve(util.toCsv(data));
              break;
            default:
              innerResolve(data);
              break;
          }
        }, innerReject);
      });
    }
    return this.fullfilledPromise.then(resolve, reject);
  }
  /**
   * [queue add the query to queue]
   * @return {[type]} [description]
   */
  queue() {
    const queueSet = internal(this).queueSet;
    /* istanbul ignore if */
    if (!queueSet) {
      throw new Error('queue set is undefined');
    }
    /* istanbul ignore if */
    if (!this.measurement) {
      throw new Error('measurement can not be null');
    }
    const q = this.toSelect();
    debug('reader q:%s', q);
    queueSet.add(q);
    return this;
  }
}

module.exports = Reader;
