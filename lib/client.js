'use strict';
const pkg = require('../package');
const Influx = require('./influx');
const _ = require('lodash');
const debug = require('debug')(pkg.name);
const InfluxQL = require('./influx-ql');
const Writer = require('./writer');
const Reader = require('./reader');

class Client {
	constructor(uri, options) {
		const reg = /(\S+?)\:\/\/(\S+?\:\S+?@)?(\S+?)\/(\S+)/;
		const result = reg.exec(uri);
		/* istanbul ignore if */
		if (!result || !result[1] || !result[3] || !result[4]) {
			throw new Error('Connect URI is wrong, eg: http://user:pass@localhost:port,anotherhost:port,yetanother:port/mydatabase');
		}
		options = _.extend({
			timePrecision: 'ms'
		}, options);
		options.servers = _.map(result[3].split(','), str => {
			const arr = str.split(':');
			return {
				protocol: result[1],
				host: arr[0],
				port: parseInt(arr[1])
			};
		});

		options.database = result[4];
		/* istanbul ignore else */
		if (result[2]) {
			const authInfos = result[2].substring(0, result[2].length - 1).split(':');
			options.username = authInfos[0];
			options.password = authInfos[1];
		}
		this._options = options;

		debug('init options:%j', this._options);
		this._influx = new Influx(this._options);
		this._writeQueue = [];
		this._queryQueue = [];
	}

	/**
	 * [availableServers description]
	 * @return {[type]} [description]
	 */
	get availableServers() {
		return this._influx.availableServers;
	}

	/**
	 * [unavailableServers description]
	 * @return {[type]} [description]
	 */
	get unavailableServers() {
		return this._influx.unavailableServers;
	}

	/**
	 * timeout 获取request timeout的值
	 * @return {[type]} [description]
	 */
	get timeout() {
		return this._influx.timeout;
	}

	/**
	 * timeout 设置request timeout的值
	 * @return {[type]} [description]
	 */
	set timeout(v) {
		this._influx.timeout = v;
	}

	/**
	 * writeQueueLength 获取写队列长度
	 * @return {[type]} [description]
	 */
	get writeQueueLength() {
		return this._writeQueue.length;
	}

	/**
	 * queryQueueLength 获取查询队列长度
	 * @return {[type]} [description]
	 */
	get queryQueueLength() {
		return this._queryQueue.length;
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
	 * [writePoint description]
	 * @param  {[type]} measurement [description]
	 * @param  {[type]} fields      [description]
	 * @param  {[type]} tags        [description]
	 * @return {[type]}             [description]
	 */
	writePoint(measurement, fields, tags) {
		const writer = new Writer(this, measurement, this._options.timePrecision);
		writer.field(fields);
		if (tags) {
			writer.tag(tags);
		}
		return writer.end();
	}
	/**
	 * write write point to measurement
	 * @param  {String} measurement measurement名称
	 * @return {Writer}        [description]
	 */
	write(measurement) {
		return new Writer(this, measurement, this._options.timePrecision);
	}

	/**
	 * [query description]
	 * @param  {[type]} measurement [description]
	 * @return {[type]}        [description]
	 */
	query(measurement) {
		return new Reader(this, measurement);
	}

	/**
	 * [_sync description]
	 * @param  {[type]} type [description]
	 * @return {[type]}      [description]
	 */
	_sync(type) {
		const arr = type === 'query' ? this._queryQueue : this._writeQueue;
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
			const data = _.map(arr, item => item.toJSON());
			arr.length = 0;
			return this._influx.writePoints(data);
		}

	}
}


module.exports = Client;