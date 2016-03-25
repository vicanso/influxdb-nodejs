'use strict';
const _ = require('lodash');

function now() {
  const ms = Date.now();
  const us = `${Math.ceil(process.hrtime()[1] / 1000)}`;
  return `${ms}${_.padStart(us, '6', '0')}`;
}

exports.now = now;
