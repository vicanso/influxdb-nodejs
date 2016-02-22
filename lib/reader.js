'use strict';
const InfluxQL = require('./influx-ql');

class Reader extends InfluxQL{
	constructor(client, series) {
		super();
		this._client = client;
		this._series = series;
	}
	end() {
		const q = this.q();
		return this._client._influx.query(q);
	}
	queue() {
		this._client.queue(this);
	}
}


module.exports = Reader;