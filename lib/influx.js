'use strict';
const qs = require('querystring');
const _ = require('lodash');
const http = require('./http');

function format(data) {
	return _.map(data, (v, k) => {
		return `${k}=${v}`;
	}).join(',');
}



class Influx {
	constructor(options) {
		this._options = options;
	}

	query(q) {
		const options = this._options;
		const data = {
			q: q,
			precision: options.timePrecision,
			db: options.database
		};
		const url = this.getUrl(`/query?${qs.stringify(data)}`);
		return http.get(url);
	}

	write(data) {
		const options = this._options;
		const queryData = {
			precision: options.timePrecision,
			db: options.database
		};
		/* istanbul ignore if */
		if (options.username && options.password) {
			data.u = data.username;
			data.p = data.password;
		}
		const url = this.getUrl(`/write?${qs.stringify(queryData)}`);
		const postData = `${data.series},${format(data.tags)} ${format(data.values)}`;
		return http.post(url, postData);
	}

	writeSeries(data) {
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
		return http.post(url, postData.join('\n'));
	}

	getUrl(url) {
		const options = this._options;
		return `${options.protocol}://${options.host}:${options.port}${url}`;
	}
}




module.exports = Influx;