'use strict';
require('./request')
const request = require('superagent');
const _ = require('lodash');
const Debug = require('debug');
const debug = Debug('cuttle-client');

class Client {
	constructor(options) {
		options = _.extend({
			host: 'localhost',
			port: 8086,
			protocol: 'http',
			database: 'cuttle'
		}, options);
		this._options = options;
		this._baseUrl = `${options.protocol}://${options.host}:${options.port}`;
	}
	query(measurement) {
		const url = this._baseUrl + '/query';
		return new Query(url, this._options.database, measurement);
	}
	write(measurement) {
		const url = this._baseUrl + '/write?db=' + this._options.database;
		return new Post(url, measurement);
		// const options = this._options;
		// const url = this._baseUrl + '/write?db=' + options.database;
		// let data = measurement;
		// _.forEach(tags, (v, k) => {
		// 	data += `,${k}=${v}`;
		// });

		// const end = function(fields) {
		// 	const fieldList = _.map(fields, (v, k) => {
		// 		return `${k}=${v}`;
		// 	});
		// 	return request.post(url)
		// 		.type('form')
		// 		.send(`${data} ${fieldList.join(',')} ${Date.now()}000000`)
		// 		.done();
		// };

		// if (fields) {
		// 	return end(fields);
		// } else {
		// 	return function(fields) {
		// 		return end(fields);
		// 	}
		// }
	}
}


class Query {
	constructor(url, db, measurement) {
		this._url = url;
		this._db = db;
		this._measurement = measurement;
		this._conditions = [];
		this._fields = [];
	}
	tag(k, v) {
		if (_.isArray(k)) {
			_.forEach(k, v => {
				this.tag(v);
			});
		} else if (_.isObject(k)) {
			_.forEach(k, (_v, _k) => {
				this.tag(_k, _v);
			});
		} else {
			if (_.isString(v)) {
				this._conditions.push(`${k}='${v}'`);
			} else {
				this._conditions.push(`${k}=${v}`);
			}
		}
		return this;
	}
	field(k) {
		this._fields.push(k);
		return this;
	}
	end() {
		const fields = this._fields.join(',') || '*';
		let q = `SELECT ${fields} FROM ${this._measurement}`;
		if (this._conditions) {
			q += (` WHERE ${this._conditions.join(',')}`);
		}
		debug('query %s %s', this._db, q);
		return request.get(this._url)
			.query({
				db: this._db,
				q: q
			}).done().then(res => {
				return _.get(res, 'body.results[0].series[0]');
			});
	}
}


class Post{
	constructor(url, measurement) {
		this._url = url;
		this._measurement = measurement;
		this._tags = [];
		this._fields = [];
	}
	tag(k, v) {
		if (_.isArray(k)) {
			_.forEach(k, v => {
				this.tag(v);
			});
		} else if (_.isObject(k)) {
			_.forEach(k, (_v, _k) => {
				this.tag(_k, _v);
			});
		} else {
			this._tags.push(`${k}=${v}`);
		}
		return this;
	}
	field(k, v) {
		if (_.isArray(k)) {
			_.forEach(k, v => {
				this.field(v);
			});
		} else if (_.isObject(k)) {
			_.forEach(k, (_v, _k) => {
				this.field(_k, _v);
			});
		} else {
			this._fields.push(`${k}=${v}`);
		}
		return this;
	}
	end(fields) {
		fields = fields || this._fields;
		const data = `${this._measurement},${this._tags.join(',')} ${fields.join(',')} ${Date.now()}000000`;
		debug('post %s, %s', this._url, data);
		return request.post(this._url)
			.type('form')
			.send(data)
			.done().then(res => {
				return res.body;
			});
	}
}

module.exports = Client;