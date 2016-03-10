'use strict';
const request = require('superagent');
const _ = require('lodash');
const debug = require('debug')('simple-influx');
const healthCheckInterval = 1000;
// const errorCodes = ['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EHOSTUNREACH'];
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

function get(url, timeout) {
	debug('request get %s', url);
	return end(request.get(url), timeout);
}

function post(url, data, timeout) {
	debug('request post %s, data:%j', url, data);
	const req = request.post(url)
		.type('form')
		.send(data);
	return end(req, timeout);
}


function end(req, timeout) {
	if (timeout) {
		req.timeout(timeout);
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



function isOnline(server) {
	const url = `${server.protocol || 'http'}://${server.host}:${server.port}/query?q=SHOW+SERIES+WHERE+FALSE`;
	return new Promise(resolve => {
		request.get(url).timeout(1000).end(err => {
			if (err) {
				resolve(false);
			} else {
				resolve(true);
			}
		});
	});
}

class HTTP {
	constructor(servers) {
		this._servers = _.map(servers, tmp => {
			tmp.available = true;
			return tmp;
		});
		this._timeout = 0;
		this._healthCheck();
	}
	set timeout(v) {
		this._timeout = v;
	}
	get timeout() {
		return this._timeout;
	}
	get availableServer() {
		return _.sample(this.availableServers);
	}
	get availableServers() {
		return this._getServers(true);
	}
	get unavailableServers() {
		return this._getServers(false);
	}
	get(url) {
		return get(this._getUrl(url), this._timeout);
	}

	post(url, data) {
		return post(this._getUrl(url), data, this._timeout);
	}
	_getServers(status) {
		const result = [];
		_.forEach(this._servers, server => {
			if (server.available === status) {
				result.push(_.pick(server, ['host', 'port']));
			}
		});
		return result;
	}
	_getUrl(url) {
		const server = this.availableServer;
		/* istanbul ignore if */
		if (!server) {
			throw new Error('no server is available');
		}
		debug('server:%j', server);
		return `${server.protocol || 'http'}://${server.host}:${server.port}${url}`;
	}
	_healthCheck() {
		const done = () => {
			setTimeout(() => {
				this._healthCheck();
			}, healthCheckInterval).unref();
		};

		const servers = this._servers;
		Promise.all(_.map(servers, tmp => isOnline(tmp))).then(arr => {
			_.forEach(arr, (available, i) => {
				const server = servers[i];
				server.available = available;
			});
			done();
		}).catch(err => {
			/* istanbul ignore next */
			console.error(err);
			/* istanbul ignore next */
			done();
		});
	}
}

module.exports = HTTP;
