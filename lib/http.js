'use strict';
const request = require('superagent');
const _ = require('lodash');
const debug = require('debug')('simple-influx');

// superagent bug: HTTP endpoint that returns a 204 with a content-encoding: gzip, it will throw Error [Error: unexpected end of file] errno: -5, code: 'Z_BUF_ERROR'
const originalEnd = request.Request.prototype.end;
request.Request.prototype.end = function(fn) {
	const req = this.request();
	req.on('response', (res) => {
		if (res.statusCode === 204) {
			delete res.headers['content-encoding'];
		}
	});
	originalEnd.call(this, fn);
};

// resubmitErrorCodes = ['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EHOSTUNREACH']

function get(url) {
	debug('request get %s', url);
	return end(request.get(url));
}

function post(url, data) {
	debug('request post %s, data:%j', url, data);
	const req = request.post(url)
		.type('form')
		.send(data);
	return end(req);
}


function end(req) {
	if (exports.timeout) {
		req.timeout(exports.timeout);
	}
	return new Promise((resolve, reject) => {
		req.end((err, res) => {
			/* istanbul ignore if */
			if (err) {
				reject(err);
			} else {
				const results = _.get(res, 'body.results');
				if (!results) {
					return resolve(results);
				}
				if (results.length > 1) {
					resolve(results);
				} else {
					const data = results[0];
					/* istanbul ignore if */
					if (data && data.error) {
						reject(new Error(data.error));
					} else {
						resolve(data);
					}
				}
			}
		});
	});
}

exports.timeout = 0;

exports.get = get;

exports.post = post;