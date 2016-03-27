'use strict';
const _ = require('lodash');
const internal = require('./internal');
class QL {
  constructor() {
    const internalData = internal(this);
    internalData.conditions = [];
    internalData.fields = [];
    internalData.group = [];
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
      internal(this).conditions.push(`${k}='${v}'`);
    }
    return this;
  }
  where(v) {
    if (v) {
      internal(this).conditions.push(v);
    }
    return this;
  }
  field(v) {
    internal(this).fields.push(v);
    return this;
  }
  group(key) {
    if (key) {
      internal(this).group.push(key);
    }
    return this;
  }
  desc() {
    internal(this).order = 'DESC';
    return this;
  }
  asc() {
    internal(this).order = 'ASC';
    return this;
  }
  limit(v) {
    const count = parseInt(v, 10);
    if (!_.isNaN(count)) {
      internal(this).limit = count;
    }
    return this;
  }
  offset(v) {
    const offset = parseInt(v, 10);
    if (!_.isNaN(offset)) {
      internal(this).offset = offset;
    }
    return this;
  }
  slimit(v) {
    const count = parseInt(v, 10);
    if (!_.isNaN(count)) {
      internal(this).slimit = count;
    }
    return this;
  }
  fill(v) {
    internal(this).fill = v;
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
  measurement(v) {
    internal(this).measurement = v;
    return this;
  }
  q() {
    const internalData = internal(this);
    const fields = _.flattenDeep(internalData.fields).join(',') || '*';
    let q = `SELECT ${fields} FROM ${internalData.measurement}`;
    /* istanbul ignore else */
    if (internalData.conditions && internalData.conditions.length) {
      q += (` WHERE ${internalData.conditions.join(' AND ')}`);
    }
    if (internalData.group.length) {
      q += ` GROUP BY ${internalData.group.join(',')}`;
      if (!_.isNil(internalData.fill)) {
        q += ` fill(${internalData.fill})`;
      }
    }
    if (_.isNumber(internalData.limit)) {
      q += ` LIMIT ${internalData.limit}`;
    }
    if (_.isNumber(internalData.slimit)) {
      q += ` SLIMIT ${internalData.slimit}`;
    }
    if (_.isNumber(internalData.offset)) {
      q += ` OFFSET ${internalData.offset}`;
    }
    const order = internalData.order;
    if (order) {
      q += ` ORDER BY time ${order}`;
    }
    return q;
  }
}

module.exports = QL;
