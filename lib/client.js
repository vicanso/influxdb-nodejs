'use strict';
const Influx = require('./influx');
const _ = require('lodash');
const debug = require('debug')('cuttle-client');



class Client {
	constructor(options) {
		options = _.extend({
			host: 'localhost',
			port: 8086,
			protocol: 'http',
			database: 'cuttle'
		}, options);
		this._influx = new Influx(options);
	}
	dropDatabase(name) {
		return this._influx.dropDatabase(name);
	}
	createDatabase(name) {
		return this._influx.createDatabase(name);
	}
	query(measurement) {
		return new Query(this._influx, measurement);
	}
	write(measurement) {
		return new Post(this._influx, measurement);
	}
}


class Query {
	constructor(_influx, measurement) {
		this._influx = _influx;
		this._measurement = measurement;
		this._conditions = [];
		this._fields = [];
		this._groupBy = '';
	}
	tag(k, v) {
		if (_.isObject(k)) {
			_.forEach(k, (_v, _k) => {
				this.tag(_k, _v);
			});
		} else if(v) {
			this._conditions.push(`${k}='${v}'`);
		} else {
			this._conditions.push(k);
		}
		return this;
	}
	field() {
		const arr = _.toArray(arguments);
		_.forEach(arr, v => {
			this._fields.push(v);
		});
		return this;
	}
	group(key) {
		this._groupBy = key;
		return this;
	}
	end() {
		const fields = _.flattenDeep(this._fields).join(',') || '*';
		let q = `SELECT ${fields} FROM ${this._measurement}`;
		/* istanbul ignore else */
		if (this._conditions && this._conditions.length) {
			q += (` WHERE ${this._conditions.join(' AND ')}`);
		}
		if (this._groupBy) {
			q += ` GROUP BY ${this._groupBy}`;
		}
		debug('query %s', q);
		return this._influx.query(q);
	}
}


class Post {
	constructor(_influx, measurement) {
		this._influx = _influx;
		this._measurement = measurement;
		this._tags = {};
		this._values = {};
	}
	tag(k, v) {
		if (v) {
			this._tags[k] = v;
		} else {
			this._tags = _.extend(this._tags, k);
		}
		return this;
	}
	value(k, v) {
		if (v) {
			this._values[k] = v;
		} else {
			this._values = _.extend(this._values, k);
		}
		return this;
	}
	end() {
		return this._influx.write(this._measurement, this._values, this._tags);
	}
}

module.exports = Client;