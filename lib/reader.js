'use strict';
const QL = require('influx-ql');
const internal = require('./internal');
const util = require('./util');
class Reader extends QL {
  constructor(client, queueSet) {
    if (!client) {
      throw new Error('client cat not be null');
    }
    super();
    const internalData = internal(this);
    internalData.client = client;
    internalData.queueSet = queueSet;
  }
  then(resolve, reject) {
    if (!this._fullfilledPromise) {
      const client = internal(this).client;
      const q = this.toSelect();
      this._fullfilledPromise = new Promise((innerResolve, innerReject) => {
        client.query(q).then(res => {
          innerResolve(res.body);
        }, err => {
          innerReject(util.getError(err));
        });
      });
    }
    return this._fullfilledPromise.then(resolve, reject);
  }
  queue() {
    const queueSet = internal(this).queueSet;
    if (!queueSet) {
      throw new Error('queue set is undefined');
    }
    queueSet.add(this.toSelect());
    return this;
  }
}

module.exports = Reader;
