'use strict';
const _ = require('lodash');

class QL {
  constructor() {
    this._conditions = [];
    this._fields = [];
    this._group = [];
    // this._limit;
    // this._slimit;
    // this._order;
    // this._offset;
    // this._fill;
  }
  createDatabase(db) {
    return `create database "${db}"`;
  }
  createDatabaseNotExists(db) {
    return `create database if not exists "${db}"`;
  }
  dropDatabase(db) {
    return `drop database "${db}"`;
  }
  showMeasurements() {
    return 'show measurements';
  }
  dropMeasurement(measurement) {
    return `drop measurement ${measurement}`;
  }
  tag(k, v) {
    if (_.isObject(k)) {
      _.forEach(k, (_v, _k) => {
        this.tag(_k, _v);
      });
    } else if (v) {
      this._conditions.push(`${k}='${v}'`);
    }
    return this;
  }
  where(v) {
    if (v) {
      this._conditions.push(v);
    }
    return this;
  }
  field(v) {
    this._fields.push(v);
    return this;
  }
  group(key) {
    if (key) {
      this._group.push(key);
    }
    return this;
  }
  desc() {
    this._order = 'DESC';
    return this;
  }
  asc() {
    this._order = 'ASC';
    return this;
  }
  limit(v) {
    const count = parseInt(v, 10);
    if (!_.isNaN(count)) {
      this._limit = count;
    }
    return this;
  }
  offset(v) {
    const offset = parseInt(v, 10);
    if (!_.isNaN(offset)) {
      this._offset = offset;
    }
    return this;
  }
  slimit(v) {
    const count = parseInt(v, 10);
    if (!_.isNaN(count)) {
      this._slimit = count;
    }
    return this;
  }
  fill(v) {
    this._fill = v;
    return this;
  }
  mean(v) {
    this.field(`MEAN(${v})`);
    return this;
  }
  sum(v) {
    this.field(`SUM(${v})`);
    return this;
  }
  count(v) {
    this.field(`COUNT(${v})`);
    return this;
  }
  q() {
    const fields = _.flattenDeep(this._fields).join(',') || '*';
    let q = `SELECT ${fields} FROM ${this._measurement}`;
    /* istanbul ignore else */
    if (this._conditions && this._conditions.length) {
      q += (` WHERE ${this._conditions.join(' AND ')}`);
    }
    if (this._group.length) {
      q += ` GROUP BY ${this._group.join(',')}`;
      if (!_.isNil(this._fill)) {
        q += ` fill(${this._fill})`;
      }
    }
    if (_.isNumber(this._limit)) {
      q += ` LIMIT ${this._limit}`;
    }
    if (_.isNumber(this._slimit)) {
      q += ` SLIMIT ${this._slimit}`;
    }
    if (_.isNumber(this._offset)) {
      q += ` OFFSET ${this._offset}`;
    }
    const order = this._order;
    if (order) {
      q += ` ORDER BY time ${order}`;
    }
    return q;
  }
}

module.exports = QL;
