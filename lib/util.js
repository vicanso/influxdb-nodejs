'use strict';
const _ = require('lodash');

function now() {
  const ms = Date.now();
  const us = `${Math.ceil(process.hrtime()[1] / 1000)}`;
  return `${ms}${_.padStart(us, '6', '0')}`;
}

function getError(err) {
  const str = _.get(err, 'response.body.error');
  /* istanbul ignore if */
  if (!str) {
    return err;
  }
  const e = new Error(str);
  _.forEach(['method', 'path', 'status'], key => {
    e[key] = _.get(err, `response.error.${key}`);
  });
  return e;
}

function toJSON(data) {
  const result = {};
  _.forEach(data.results, tmp => {
    _.forEach(tmp.series, item => {
      const columns = item.columns;
      const arr = [];
      _.forEach(item.values, valueList => {
        const point = {};
        _.forEach(valueList, (v, i) => {
          point[columns[i]] = v;
        });
        arr.push(point);
      });
      if (!result[item.name]) {
        result[item.name] = [];
      }
      result[item.name] = result[item.name].concat(arr);
    });
  });
  return result;
}

function toCsv(data) {
  const result = {};
  _.forEach(data.results, tmp => {
    _.forEach(tmp.series, item => {
      const arr = [];
      arr.push(item.columns.join(','));
      _.forEach(item.values, valueList => {
        arr.push(valueList.join(','));
      });
      if (result[item.name]) {
        result[item.name] += `\n${arr.join('\n')}`;
      } else {
        result[item.name] = arr.join('\n');
      }
    });
  });
  return result;
}

exports.now = now;
exports.getError = getError;
exports.toJSON = toJSON;
exports.toCsv = toCsv;
