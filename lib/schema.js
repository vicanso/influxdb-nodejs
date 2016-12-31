'use strict';

const _ = require('lodash');

const map = new Map();

exports.set = function set(name, definition, options) {
  map.set(name, {
    definition,
    options,
  });
};

exports.get = function get(name) {
  return map.get(name);
};

// influxdb data-types
// Integers - append an i to the field value to tell InfluxDB to store the number as an integer. Store the field value 82 as an integer:
// t, T, true, True, or TRUE. Specify FALSE with f, F, false
exports.validate = function validate(name, data) {
  const schema = exports.get(name);
  if (!schema) {
    return data;
  }
  const definition = schema.definition;
  const options = schema.options || {};
  const stripUnknown = options.stripUnknown;
  const result = {};
  const booleanList = 't T true True TRUE FALSE f F false'.split(' ');
  _.forEach(data, (value, key) => {
    const type = definition[key];
    if (stripUnknown && !type) {
      return;
    }
    switch (type) {
      case 'integer': {
        const v = parseInt(value, 10);
        if (_.isNaN(v)) {
          break;
        }
        result[key] = `${v}i`;
        break;
      }
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
      default: {
        result[key] = value;
        break;
      }
    }
  });
  return result;
};

