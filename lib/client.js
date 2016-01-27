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
		this._writeArr = [];
		this._queryArr = [];
	}
	dropDatabase(name) {
		return this._influx.dropDatabase(name);
	}
	createDatabase(name) {
		return this._influx.createDatabase(name);
	}
	autoSyncWrite(max) {
		max = max || 10;
		this._writeQueueMax = max;
		return this;
	}
	query(series) {
		return new Query(this, series);
	}
	write(series) {
		return new Write(this, series);
	}
	queue(inst, type) {
		if (type === 'query') {
			this._queryArr.push(inst);
		} else {
			this._writeArr.push(inst);
			const max = this._writeQueueMax;
			if (max && this._writeArr.length >= max) {
				this.syncWrite();
			}
		}
	}
	syncWrite(cb) {
		return this._sync('write', cb);
	}
	syncQuery(cb) {
		return this._sync('query', cb);
	}
	_sync(type, cb) {
		if (_.isFunction(type)) {
			let tmp = cb;
			cb = type;
			type = tmp;
		}
		cb = cb || _.noop;

		const arr = type === 'query'? this._queryArr : this._writeArr;
		if (!arr.length) {
			return;
		}
		if (type === 'query') {

			const queryList = _.map(arr, item => {
				return item.getSQL();
			});
			arr.length = 0;
			return this._influx.query(queryList.join(';'), cb);
		} else {
			const data = {};
			_.forEach(arr, item => {
				const tmpData = item.getData();
				const series = tmpData.series;
				if (!data[series]) {
					data[series] = [];
				}
				data[series].push([
					tmpData.values,
					tmpData.tags
				]);
			});
			arr.length = 0;
			return this._influx.writeSeries(data, cb);
		}
	}
}


class Query {
	constructor(client, series) {
		this._client = client;
		this._series = series;
		this._conditions = [];
		this._fields = [];
		this._group = [];
		this._limit;
		this._slimit;
		this._order;
		this._offset;
		this._fill;
	}
	tag(k, v) {
		if (_.isObject(k)) {
			_.forEach(k, (_v, _k) => {
				this.tag(_k, _v);
			});
		} else if(v) {
			this._conditions.push(`${k}='${v}'`);
		}
		return this;
	}
	where(v) {
		if (v) {
			this._conditions.push(v);
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
		if (key) {
			this._group.push(key);
		}
		return this;
	}
	desc() {
		this._order = 'DESC';
		return this;
	}
	asc() {
		this._order = 'ASC';
		return this;
	}
	limit(count) {
		count = parseInt(count);
		if (!_.isNaN(count)) {
			this._limit = count;
		}
		return this;
	}
	offset(offset) {
		offset = parseInt(offset);
		if (!_.isNaN(offset)) {
			this._offset = offset;
		}
		return this;
	}
	slimit(count) {
		count = parseInt(count);
		if (!_.isNaN(count)) {
			this._slimit = count;
		}
		return this;
	}
	fill(v) {
		this._fill = v;
		return this;
	}
	getSQL() {
		const fields = _.flattenDeep(this._fields).join(',') || '*';
		let q = `SELECT ${fields} FROM ${this._series}`;
		/* istanbul ignore else */
		if (this._conditions && this._conditions.length) {
			q += (` WHERE ${this._conditions.join(' AND ')}`);
		}
		if (this._group.length) {
			q += ` GROUP BY ${this._group.join(',')}`;
			if (!_.isNil(this._fill)) {
				q += ` fill(${this._fill})`;
			}
		}
		if (_.isNumber(this._limit)) {
			q += ` LIMIT ${this._limit}`;
		}
		if (_.isNumber(this._slimit)) {
			q += ` SLIMIT ${this._slimit}`;
		}
		if (_.isNumber(this._offset)) {
			q += ` OFFSET ${this._offset}`;
		}
		const order = this._order;
		if (order) {
			q += ` ORDER BY time ${order}`;
		}
		debug('query %s', q);
		return q;
	}
	end(cb) {
		cb = cb || _.noop;
		const q = this.getSQL();
		return this._client._influx.query(q, cb);
	}
	queue() {
		this._client.queue(this, 'query');
	}
}


class Write {
	constructor(client, series) {
		this._client = client;
		this._series = series;
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
	end(cb) {
		cb = cb || _.noop;
		return this._client._influx.write(this._series, this._values, this._tags, cb);
	}
	getData() {
		return {
			series: this._series,
			tags: this._tags,
			values: this._values
		};
	}
	queue() {
		if (!this._values.time) {
			this._values.time = new Date();
		}
		this._client.queue(this, 'write');
	}
}

module.exports = Client;
