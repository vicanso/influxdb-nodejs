'use strict';

const _ = require('lodash');
const nano = require('nano-seconds');

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
    if (tmp.error) {
      throw new Error(tmp.error);
    }
    _.forEach(tmp.series, (item) => {
      const { columns } = item;
      const arr = [];
      _.forEach(item.values, (valueList) => {
        const point = {};
        _.forEach(valueList, (v, i) => {
          point[columns[i]] = v;
        });
        if (item.tags) {
          _.extend(point, item.tags);
        }
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
    if (tmp.error) {
      throw new Error(tmp.error);
    }
    _.forEach(tmp.series, (item) => {
      const arr = [];
      let keys = [];
      let values = [];
      if (item.tags) {
        keys = keys.concat(_.keys(item.tags));
        values = values.concat(_.values(item.tags));
      }
      arr.push(keys.concat(item.columns).join(','));
      _.forEach(item.values, (valueList) => {
        arr.push(values.concat(valueList).join(','));
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
      const { columns } = series;
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

function ns() {
  return nano.toString();
}

function us() {
  return ns().substring(0, 16);
}

function getTime(precision) {
  switch (precision) {
    case 'ms':
      return `${Date.now()}`;
    case 'us':
      return us();
    default:
      return ns();
  }
}

function convertToNs(isoString) {
  const arr = nano.fromISOString(isoString);
  return arr.join('');
}

exports.getError = getError;
exports.toJSON = toJSON;
exports.toCsv = toCsv;
exports.mergeValues = mergeValues;
exports.convertTagAndFieldKeys = convertTagAndFieldKeys;
exports.getTime = getTime;
exports.convertToNs = convertToNs;
