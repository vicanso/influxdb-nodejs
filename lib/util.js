'use strict';
exports.now = now;

function now(precision) {
	precision = precision || 'ms';
	const ms = Date.now();
	if (precision === 'us') {
		return Math.ceil(ms / 1000);
	} else if(precision === 'u') {
		const nanoseconds = process.hrtime()[1];
		return ms * 1000 + Math.ceil(nanoseconds / 1000);
	} else {
		return ms;
	}
}