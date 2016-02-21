'use strict';
const qs = require('querystring');
const request = require('superagent');
const debug = require('debug')('simple-influx');
const _ = require('lodash');

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


function format(data) {
	return _.map(data, (v, k) => {
		return `${k}=${v}`;
	}).join(',');
}

function end(req) {
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

class Influx {
	constructor(options) {
		this._options = options;
	}

	query(q, cb) {
		const options = this._options;
		
		const data = {
			u: options.username,
			p: options.password,
			q: q,
			precision: options.timePrecision,
			db: options.database
		};
		const url = this.getUrl(`/query?${qs.stringify(data)}`);
		const promise = get(url);

		if (_.isFunction(cb)) {
			promise.then(data => {
				cb(null, data);
			}).catch(cb);
		} else {
			return promise;
		}
	}

	write(data, cb) {
		const options = this._options;
		const queryData = {
			u: options.username,
			p: options.password,
			precision: options.timePrecision,
			db: options.database
		};
		const url = this.getUrl(`/write?${qs.stringify(queryData)}`);
		const postData = `${data.series},${format(data.tags)} ${format(data.values)}`;
		const promise = post(url, postData);
		if (_.isFunction(cb)) {
			promise.then(data => {
				cb(null, data);
			}).catch(cb);
		} else {
			return promise;
		}
	}

	writeSeries(data, cb) {
		const options = this._options;
		const queryData = {
			u: options.username,
			p: options.password,
			precision: options.timePrecision,
			db: options.database
		};
		const url = this.getUrl(`/write?${qs.stringify(queryData)}`);
		const postData = [];
		_.forEach(data, (v, series) => {
			_.forEach(v, tmp => {
				postData.push(`${series},${format(tmp.tags)} ${format(tmp.values)}`);
			});
		});
		const promise = post(url, postData.join('\n'));
		if (_.isFunction(cb)) {
			promise.then(data => {
				cb(null, data);
			}).catch(cb);
		} else {
			return promise;
		}
	}

	getUrl(url) {
		const options = this._options;
		return `${options.protocol}://${options.host}:${options.port}${url}`;
	}
}




module.exports = Influx;