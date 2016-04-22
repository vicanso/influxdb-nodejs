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

exports.now = now;
exports.getError = getError;
