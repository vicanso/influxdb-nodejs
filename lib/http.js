'use strict';
const request = require('superagent');
const _ = require('lodash');
const debug = require('debug')('simple-influx');
const errorCodes = ['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EHOSTUNREACH'];
const influxServers = [];
const healthCheckInterval = 1000;
var healthCheckTimer;
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
	url = getUrl(url);
	return end(request.get(url));
}

function post(url, data) {
	debug('request post %s, data:%j', url, data);
	url = getUrl(url);
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

function getUrl(url){
	const server = getAvailableServer();
	if (!server) {
		throw new Error('no server is available');
	}
	debug('server:%j', server);
	return `${server.protocol || 'http'}://${server.host}:${server.port}${url}`;
}


function getAvailableServer() {
	const servers = _.filter(influxServers, server => server.available);
	return _.sample(servers);
}


function isOnline(server) {
	const url = `${server.protocol || 'http'}://${server.host}:${server.port}/`;
	return new Promise(resolve => {
		request.get(url).timeout(1000).end(err => {
			if (err && _.indexOf(errorCodes, err.code) !== -1) {
				resolve(false);
			} else {
				resolve(true);
			}
		});
	});
}

function setServers(servers) {
	influxServers.length = 0;
	_.forEach(servers, tmp => {
		tmp.available = true;
		influxServers.push(tmp);
	});
	healthCheck();
}

function healthCheck() {
	if (healthCheckTimer) {
		clearTimeout(healthCheckTimer);
	}

	Promise.all(_.map(influxServers, tmp => isOnline(tmp))).then(arr => {
		_.forEach(arr, (available, i) => {
			const server = influxServers[i];
			if (!available) {
				console.info(`${server.host}:${server.port} is unavailable`);
			}
			server.available = available;
		});
		healthCheckTimer = setTimeout(healthCheck, healthCheckInterval);
		healthCheckTimer.unref();
	}).catch(err => {
		console.error(err);
		healthCheckTimer = setTimeout(healthCheck, healthCheckInterval);
		healthCheckTimer.unref();
	});
}

exports.setServers = setServers;

exports.timeout = 0;

exports.get = get;

exports.post = post;