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
	write(series) {
		return new Writer(this, series);
	}
	query(series) {
		return new Reader(this, series);
	}
}


module.exports = Client;