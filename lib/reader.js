'use strict';
const _ = require('lodash');
const InfluxQL = require('./influx-ql');

class Reader extends InfluxQL{
	constructor(client, series) {
		super();
		this._client = client;
		this._series = series;
	}
	end(cb) {
		cb = cb || _.noop;
		const q = this.q();
		return this._client._influx.query(q, cb);
	}
	queue() {
		this._client.queue(this, 'query');
	}
}


module.exports = Reader;