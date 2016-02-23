'use strict';
const Influx = require('./influx');
const _ = require('lodash');
const debug = require('debug')('simple-influx');
const InfluxQL = require('./influx-ql');
const Writer = require('./writer');
const Reader = require('./reader');

class Client {
	constructor(options) {
		this._options = _.extend({
			timePrecision: 'ms',
			host: 'localhost',
			port: 8086,
			protocol: 'http',
			database: ''
		}, options);
		debug('init options:%j', this._options);
		if (!this._options.database) {
			throw new Error('database can not be null');
		}
		this._influx = new Influx(this._options);
		this._writeQueue = [];
		this._queryQueue = [];
		this._writeQueueMax = 10;
	}

	/**
	 * setWriteQueueMax 设置write queue最大长度
	 * @param {Number} v queue长度
	 * @return {Influx}
	 */
	setWriteQueueMax(v) {
		this._writeQueueMax = v;
		return this;
	}

	/**
	 * dropDatabase 删除数据库
	 * @return {Promise}
	 */
	dropDatabase() {
		const ql = new InfluxQL();
		return this._influx.query(ql.dropDatabase(this._options.database)).then(_.noop);
	}

	/**
	 * createDatabase 创建数据库
	 * @return {Promise}
	 */
	createDatabase() {
		const ql = new InfluxQL();
		return this._influx.query(ql.createDatabase(this._options.database)).then(_.noop);
	}

	/**
	 * [createDatabaseNotExists description]
	 * @return {[type]} [description]
	 */
	createDatabaseNotExists() {
		const ql = new InfluxQL();
		return this._influx.query(ql.createDatabaseNotExists(this._options.database)).then(_.noop);
	}

	/**
	 * getMeasurements 获取数据库的所有measurements
	 * @return {Promise}
	 */
	getMeasurements() {
		const ql = new InfluxQL();
		return this._influx.query(ql.showMeasurements());
	}

	/**
	 * dropMeasurement 删除measurement
	 * @param  {String} measurement measurement名称
	 * @return {[type]}             [description]
	 */
	dropMeasurement(measurement) {
		const ql = new InfluxQL();
		return this._influx.query(ql.dropMeasurement(measurement));
	}

	/**
	 * queue 添加到queue队列
	 * @param  {Reader|Writer} inst Reader or Writer实例
	 * @return {[type]}      [description]
	 */
	queue(inst) {
		if (inst instanceof Reader) {
			this._queryQueue.push(inst);
		} else {
			this._writeQueue.push(inst);
			const max = this._writeQueueMax;
			if (max && this._writeQueue.length >= max) {
				this.syncWrite();
			}
		}
	}

	/**
	 * syncWrite 同步write queue
	 * @return {[type]} [description]
	 */
	syncWrite() {
		return this._sync('write');
	}

	/**
	 * syncQuery 同步read queue
	 * @return {[type]} [description]
	 */
	syncQuery() {
		return this._sync('query');
	}

	/**
	 * write write point to series
	 * @param  {String} series series名称
	 * @return {Writer}        [description]
	 */
	write(series) {
		return new Writer(this, series);
	}

	/**
	 * [query description]
	 * @param  {[type]} series [description]
	 * @return {[type]}        [description]
	 */
	query(series) {
		return new Reader(this, series);
	}

	/**
	 * [_sync description]
	 * @param  {[type]} type [description]
	 * @return {[type]}      [description]
	 */
	_sync(type) {
		const arr = type === 'query'? this._queryQueue : this._writeQueue;
		if (!arr.length) {
			return Promise.resolve();
		}
		if (type === 'query') {
			const queryArr = _.map(arr, tmp => {
				return tmp.q();
			});
			arr.length = 0;
			return this._influx.query(queryArr.join(';'));
		} else {
			const data = {};
			_.forEach(arr, item => {
				const tmpData = item.getData();
				const series = tmpData.series;
				if (!data[series]) {
					data[series] = [];
				}
				data[series].push({
					values: tmpData.values,
					tags: tmpData.tags
				});
			});
			arr.length = 0;
			return this._influx.writeSeries(data);
		}

	}
}


module.exports = Client;