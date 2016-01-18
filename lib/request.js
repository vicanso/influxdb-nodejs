'use strict';
const request = require('superagent');

request.Request.prototype.done = function() {
	return new Promise((resolve, reject) => {
		this.end((err, res) => {
			if (err) {
				reject(err);
			} else {
				resolve(res);
			}
		});
	});
}