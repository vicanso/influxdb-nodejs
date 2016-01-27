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
	query(q, cb) {
		return new Promise((resolve, reject) => {
			const multi = q.indexOf(';') !== -1;
			this._client.queryRaw(q, (err, data) => {
				/* istanbul ignore if */
				if (err) {
					cb(err);
					reject(err);
				} else {
					if (!multi) {
						data = data && data[0];
					}
					cb(null, data);
					resolve(data);
				}
			});
		});
	}
	write(series, values, tags, cb) {
		return new Promise((resolve, reject) => {
			this._client.writePoint(series, values, tags, (err) => {
				/* istanbul ignore if */
				if (err) {
					cb(err);
					reject(err);
				} else {
					cb();
					resolve();
				}
			});
		});
	}
	writeSeries(data, cb) {
		return new Promise((resolve, reject) => {
			this._client.writeSeries(data, (err) => {
				/* istanbul ignore if */
				if (err) {
					cb(err);
					reject(err);
				} else {
					cb();
					resolve();
				}
			});
		});
	}
}

module.exports = Influx;