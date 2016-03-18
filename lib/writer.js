'use strict';
const _ = require('lodash');
const util = require('./util');


class Writer {
	constructor(client, measurement) {
		this._client = client;
		this._measurement = measurement;
		this._tags = {};
		this._fields = {};
		this._time = 0;
	}
	measurement(v) {
		this._measurement = v;
		return this;
	}
	tag(k, v) {
		if (v) {
			this._tags[k] = v;
		} else {
			this._tags = _.extend(this._tags, k);
		}
		return this;
	}
	field(k, v) {
		if (v) {
			this._fields[k] = v;
		} else {
			this._fields = _.extend(this._fields, k);
		}
		return this;
	}
	time(v) {
		if (_.isNumber(v)) {
			this._time = v;
		} else {
			this._time = util.now();
		}
		return this;
	}
	end() {
		return this._client._influx.write(this.toJSON());
	}
	toJSON() {
		if (!this._time) {
			this.time();
		}
		return {
			measurement: this._measurement,
			tags: this._tags,
			fields: this._fields,
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