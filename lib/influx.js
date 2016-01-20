'use strict';
const influx = require('influx');

class Influx {
	constructor(options) {
		this._client = influx(options);
	}
	dropDatabase(name) {
		return new Promise((resolve, reject) => {
			this._client.dropDatabase(name, (err) => {
				/* istanbul ignore if */
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
	createDatabase(name) {
		return new Promise((resolve, reject) => {
			this._client.createDatabase(name, (err) => {
				/* istanbul ignore if */
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
	query(q) {
		return new Promise((resolve, reject) => {
			this._client.queryRaw(q, (err, data) => {
				/* istanbul ignore if */
				if (err) {
					reject(err);
				} else {
					resolve(data && data[0]);
				}
			});
		});
	}
	write(measurement, values, tags) {
		return new Promise((resolve, reject) => {
			this._client.writePoint(measurement, values, tags, (err) => {
				/* istanbul ignore if */
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
}

module.exports = Influx;