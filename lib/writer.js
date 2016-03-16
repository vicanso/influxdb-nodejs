'use strict';
const _ = require('lodash');
const util = require('./util');


class Writer {
	constructor(client, measurement, precision) {
		this._client = client;
		this._measurement = measurement;
		this._tags = {};
		this._values = {};
		this._precision = precision;
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
		return this._client._influx.write(this.getData());
	}
	getData() {
		if (!this._values.time) {
			this._values.time = util.now(this._precision);
		}
		return {
			measurement: this._measurement,
			tags: this._tags,
			values: this._values
		};
	}
	queue() {
		if (!this._values.time) {
			this._values.time = util.now(this._precision);
		}
		this._client.queue(this);
	}
}


module.exports = Writer;