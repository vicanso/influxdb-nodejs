'use strict';
const _ = require('lodash');


class Writer {
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
	end() {
		return this._client._influx.write(this.getData());
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
			this._values.time = Date.now();
		}
		this._client.queue(this);
	}
}


module.exports = Writer;