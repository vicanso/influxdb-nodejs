'use strict';
const influx = require('influx');

class Influx {
	constructor(options) {
		this._client = influx(options);
	}
	dropDatabase(name) {
		return new Promise((resolve, reject) => {
			this._client.dropDatabase(name, (err) => {
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
			this._client.query(q, (err, data) => {
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