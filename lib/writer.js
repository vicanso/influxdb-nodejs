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
		this._time = 0;
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
	time(precision) {
		if (_.isNumber(precision)) {
			this._time = precision;
		} else {
			this._time = util.now(this._precision);
		}
		return this;
	}
	end() {
		return this._client._influx.write(this.getData());
	}
	getData() {
		if (!this._time) {
			this.time();
		}
		return {
			measurement: this._measurement,
			tags: this._tags,
			values: this._values,
			time: this._time
		};
	}
	queue() {
		if (!this._time) {
			this.time();
		}
		this._client.queue(this);
	}
}


module.exports = Writer;