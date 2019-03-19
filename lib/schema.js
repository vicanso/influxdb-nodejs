'use strict';

const _ = require('lodash');
const EventEmitter = require('events');

const map = new Map();
const emiter = new EventEmitter();

exports.on = function on(event, listener) {
  emiter.on(event, listener);
};

exports.set = function set(name, fieldSchema, tagSchema, options) {
  const sortTagSchema = {};
  _.forEach(tagSchema, (v, k) => {
    if (v === '*') {
      sortTagSchema[k] = v;
    }
    if (_.isArray(v)) {
      sortTagSchema[k] = v.sort();
    }
  });
  map.set(name, {
    fieldSchema,
    tagSchema: sortTagSchema,
    options,
  });
};

exports.get = function get(name) {
  return map.get(name);
};

// influxdb data-types
// Integers - append an i to the field value to tell InfluxDB to store the number as an integer. Store the field value 82 as an integer:
// t, T, true, True, or TRUE. Specify FALSE with f, F, false
exports.validateFields = function validateFields(name, data) {
  const schema = exports.get(name);
  if (!schema) {
    return data;
  }
  const definition = schema.fieldSchema;
  const options = schema.options || {};
  const { stripUnknown } = options;
  const result = {};
  const booleanList = 't T true True TRUE FALSE f F false'.split(' ');
  const fail = [];
  _.forEach(data, (value, key) => {
    const type = definition[key];
    if (stripUnknown && !type) {
      fail.push({
        category: 'stripUnknown',
        key,
        value,
      });
      return;
    }
    switch (type) {
      case 'f':
      case 'float': {
        const v = parseFloat(value);
        if (_.isNaN(v)) {
          fail.push({
            category: 'invalid',
            type,
            key,
            value,
          });
          break;
        }
        result[key] = v;
        break;
      }
      case 'i':
      case 'integer': {
        const v = parseInt(value, 10);
        if (_.isNaN(v)) {
          fail.push({
            category: 'invalid',
            type,
            key,
            value,
          });
          break;
        }
        result[key] = `${v}i`;
        break;
      }
      case 'b':
      case 'boolean': {
        if (_.includes(booleanList, value)) {
          result[key] = value;
        } else if (value) {
          result[key] = 'T';
        } else {
          result[key] = 'F';
        }
        break;
      }
      case 's':
      case 'string': {
        result[key] = value.toString();
        break;
      }
      default: {
        result[key] = value;
        break;
      }
    }
  });
  if (fail.length !== 0) {
    emiter.emit('invalid-fields', {
      measurement: name,
      fail,
    });
  }
  return result;
};

exports.validateTags = function validateTags(name, data) {
  const schema = exports.get(name);
  if (!schema) {
    return data;
  }
  const fail = [];
  const definition = schema.tagSchema;
  const options = schema.options || {};
  const { stripUnknown } = options;
  const result = {};
  _.forEach(data, (value, key) => {
    const v = String(value).toString();
    const opts = definition[key];
    if (!opts) {
      if (stripUnknown) {
        fail.push({
          category: 'stripUnknown',
          key,
          value,
        });
        return;
      }
      result[key] = v;
      return;
    }
    if (opts === '*' || _.sortedIndexOf(opts, v) !== -1) {
      result[key] = v;
    } else {
      fail.push({
        category: 'invalid',
        key,
        value,
      });
    }
  });
  if (fail.length !== 0) {
    emiter.emit('invalid-tags', {
      measurement: name,
      fail,
    });
  }
  return result;
};
