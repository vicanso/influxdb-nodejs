'use strict';

const _ = require('lodash');

function getError(err) {
  const str = _.get(err, 'response.body.error');
  /* istanbul ignore if */
  if (!str) {
    return err;
  }
  const e = new Error(str);
  _.forEach(['method', 'path', 'status'], (key) => {
    e[key] = _.get(err, `response.error.${key}`);
  });
  return e;
}

function toJSON(data) {
  const result = {};
  if (!data || !data.results) {
    return result;
  }
  _.forEach(data.results, (tmp) => {
    _.forEach(tmp.series, (item) => {
      const columns = item.columns;
      const arr = [];
      _.forEach(item.values, (valueList) => {
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
  if (!data || !data.results) {
    return result;
  }
  _.forEach(data.results, (tmp) => {
    _.forEach(tmp.series, (item) => {
      const arr = [];
      arr.push(item.columns.join(','));
      _.forEach(item.values, (valueList) => {
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

function mergeValues(data) {
  if (!data || !data.results) {
    return [];
  }
  let arr = [];
  _.forEach(data.results, (result) => {
    _.forEach(result.series, (series) => {
      arr = arr.concat(series.values);
    });
  });
  return arr;
}

function convertTagAndFieldKeys(data) {
  const result = [];
  if (!data || !data.results) {
    return result;
  }
  _.forEach(data.results, (item) => {
    _.forEach(item.series, (series) => {
      const columns = series.columns;
      const values = _.map(series.values, (arr) => {
        const tmp = {};
        _.forEach(arr, (v, index) => {
          const name = columns[index].replace(/tag|field/, '').toLowerCase();
          tmp[name] = v;
        });
        return tmp;
      });
      result.push({
        name: series.name,
        values,
      });
    });
  });
  return result;
}

exports.getError = getError;
exports.toJSON = toJSON;
exports.toCsv = toCsv;
exports.mergeValues = mergeValues;
exports.convertTagAndFieldKeys = convertTagAndFieldKeys;
