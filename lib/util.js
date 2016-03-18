'use strict';
const _ = require('lodash');
exports.now = now;

function now() {
	const ms = Date.now();
	const us = '' + Math.ceil(process.hrtime()[1] / 1000);
	return '' + ms + _.padStart(us, '6', '0');
}