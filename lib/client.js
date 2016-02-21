'use strict';
const Influx = require('./influx');
const _ = require('lodash');
const debug = require('debug')('simple-influx');
const InfluxQL = require('./influx-ql');
const Writer = require('./writer');
const Reader = require('./reader');

class Client {
	constructor(options) {
		this._options = _.extend({
			username: 'root',
			password: 'root',
			timePrecision: 'ms',
			host: 'localhost',
			port: 8086,
			protocol: 'http',
			database: 'cuttle'
		}, options);
		debug('init options:%j', this._options);
		this._influx = new Influx(this._options);
		this._writeQueue = [];
		this._queryQueue = [];
		this._writeQueueMax = 10;
	}

	setWriteQueueMax(v) {
		this._writeQueueMax = v;
	}

	dropDatabase() {
		const ql = new InfluxQL();
		return this._influx.query(ql.dropDatabase(this._options.database)).then(_.noop);
	}
	createDatabase() {
		const ql = new InfluxQL();
		return this._influx.query(ql.createDatabase(this._options.database)).then(_.noop);
	}
	getMeasurements() {
		const ql = new InfluxQL();
		return this._influx.query(ql.showMeasurements());
	}
	dropMeasurement(measurement) {
		const ql = new InfluxQL();
		return this._influx.query(ql.dropMeasurement(measurement));
	}
	getSeries() {

	}
	getSeriesNames() {

	}
	dropSeries() {

	}
	queue(inst, type) {
		if (type === 'query') {
			this._queryQueue.push(inst);
		} else {
			this._writeQueue.push(inst);
			const max = this._writeQueueMax;
			if (max && this._writeQueue.length >= max) {
				this.syncWrite();
			}
		}
	}
	syncWrite() {
		return this._sync('write');
	}
	syncQuery() {
		return this._sync('query');
	}
	write(series) {
		return new Writer(this, series);
	}
	query(series) {
		return new Reader(this, series);
	}
	_sync(type) {
		const arr = type === 'query'? this._queryQueue : this._writeQueue;
		if (!arr.length) {
			return Promise.resolve();
		}
		if (type === 'query') {
			const queryArr = _.map(arr, tmp => {
				return tmp.q();
			});
			arr.length = 0;
			return this._influx.query(queryArr.join(';'));
		} else {
			const data = {};
			_.forEach(arr, item => {
				const tmpData = item.getData();
				const series = tmpData.series;
				if (!data[series]) {
					data[series] = [];
				}
				data[series].push({
					values: tmpData.values,
					tags: tmpData.tags
				});
			});
			arr.length = 0;
			return this._influx.writeSeries(data);
		}

	}
}


module.exports = Client;