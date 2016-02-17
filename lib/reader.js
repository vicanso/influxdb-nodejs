'use strict';
const InfluxQL = require('./influx-ql');

class Reader extends InfluxQL{
	constructor(client, series) {
		super();
		this._client = client;
		this._series = series;
	}
	end(cb) {
		const q = this.q();
		return this._client._influx.query(q, cb);
	}
	queue() {
		this._client.queue(this, 'query');
	}
}


module.exports = Reader;