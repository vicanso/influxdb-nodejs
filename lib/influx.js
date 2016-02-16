'use strict';
const qs = require('querystring');
const request = require('superagent');
const debug = require('debug')('simple-influx');
const _ = require('lodash');
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
				const data = _.get(res, 'body.results[0]');
				if (data && data.error) {
					reject(new Error(data.error));
				} else {
					resolve(data);
				}
			}
		});
	});
}

class Influx {
	constructor(options) {
		this._options = options;
	}

	query(q) {
		const options = this._options;
		
		const data = {
			u: options.username,
			p: options.password,
			q: q,
			precision: options.timePrecision,
			db: options.database
		};
		const url = this.getUrl(`/query?${qs.stringify(data)}`);
		return get(url);
	}

	write(data) {
		const options = this._options;
		
		const queryData = {
			u: options.username,
			p: options.password,
			precision: options.timePrecision,
			db: options.database
		};
		const url = this.getUrl(`/write?${qs.stringify(queryData)}`);
		const postData = `${data.series},${format(data.tags)} ${format(data.values)}`;

		return post(url, postData).then(_.noop);
	}

	getUrl(url) {
		const options = this._options;
		return `${options.protocol}://${options.host}:${options.port}${url}`;
	}


}




module.exports = Influx;