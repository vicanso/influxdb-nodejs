'use strict';
const assert = require('assert');
const Client = require('..');
const _ = require('lodash');

describe('cuttle-client', () => {
	const client = new Client({
		database: 'mydb'
	});
	const series = 'http';
	let uuid = 0;


	it('create database success', done => {
		client.createDatabase('mydb')
			.then(done)
			.catch(done);
	});


	it('write points success', done => {
		const tags = {
			status: '40x',
			size: '1K'
		};
		const values = {
			code: 400,
			bytes: 1010,
			value: 1
		};
		client.write(series)
			.tag(tags)
			.tag('uuid', ++uuid)
			.value(values)
			.value('use', 30)
			.end()
			.then(done)
			.catch(done);
	});


	it('get points success', done => {
		client.query(series)
			.tag('uuid', uuid)
			.field('code', 'bytes')
			.field(['uuid', 'use'])
			.end()
			.then(data => {
				const series = data.series[0];
				const values = series.values[0];
				const columns = series.columns;
				assert.equal(series.name, 'http');
				assert.equal(columns.length, 5);
				assert.equal(columns[1], 'code');
				assert.equal(values[1], 400);

				assert.equal(columns[2], 'bytes');
				assert.equal(values[2], 1010);

				assert.equal(columns[3], 'uuid');
				assert.equal(values[3], '1');

				assert.equal(columns[4], 'use');
				assert.equal(values[4], 30);

				done();
			})
			.catch(done);
	});


	it('write points with callback success', done => {
		const tags = {
			status: '50x',
			size: '1K'
		};
		const values = {
			code: 503,
			bytes: 1010,
			value: 1
		};
		client.write(series)
			.tag(tags)
			.tag('uuid', ++uuid)
			.value(values)
			.value('use', 30)
			.end(err => {
				if (err) {
					return done(err);
				}
				done();
			});
	});


	it('get points with multi tag(object) success', done => {
		client.query(series)
			.tag({
				uuid: uuid,
				size: '1K'
			})
			.end()
			.then(data => {
				assert.equal(data.series[0].values.length, 1);
				done();
			})
			.catch(done);
	});


	it('get points with where(string) success', done => {
		client.query(series)
			.where("status='40x'")
			.end()
			.then(data => {
				assert.equal(data.series[0].values.length, 1);
				done();
			})
			.catch(done);
	});


	it('get points with regular expression success', done => {
		client.query(series)
			.where('status =~ /.*50.*/')
			.end((err, data) => {
				if (err) {
					return done(err);
				}
				const index = _.indexOf(data.series[0].columns, 'status');
				_.forEach(data.series[0].values, arr => {
					assert.notEqual(arr[index].indexOf('50'), -1);
				});
				done();
			});
	});

	it('get points by time success', done => {
		const now = Date.now();
		let count = 0;
		const finish = () => {
			count++;
			if (count == 2) {
				done();
			}
		};
		client.query(series)
			.where("time > now() - 2s")
			.end((err, data) => {
				if (err) {
					return done(err);
				}
				_.forEach(data.series, tmp => {
					_.forEach(tmp.values, arr => {
						assert(now - (new Date(arr[0])).getTime() < 2000);
					});
				});
				finish();
			});
		client.query(series)
			.where("time > now()")
			.end((err, data) => {
				if (err) {
					return done(err);
				}
				assert(_.isEmpty(data));
				finish();
			});
	});


	it('write multi points success', done => {

		function randomTags() {
			return {
				status: _.sample(['20x', '30x', '40x', '50x']),
				size: _.sample(['1K', '10K', '50K', '100K', '300K'])
			};
		}

		function randomValues() {
			return {
				code: _.random(200, 510),
				bytes: _.random(10, 400 * 1024),
				use: _.random(1, 1000),
				value: _.random(1, 2)
			}
		}
		const arr = [];
		for (let i = 5; i >= 0; i--) {
			arr.push(
				client.write(series)
				.tag(randomTags())
				.value(randomValues())
				.end()
			);
		}
		Promise.all(arr).then(data => {
			done();
		}).catch(done);
	});


	it('get points group by one tag success', done => {
		client.query(series)
			.group('status')
			.end()
			.then(data => {
				assert(data.series.length)
				const item = data.series[0];
				assert.equal(item.name, 'http');
				assert(item.tags.status);
				assert(item.columns.length);
				assert(item.values.length);
				done();
			})
			.catch(done);
	});


	it('get points group by multi tags success', done => {
		client.query(series)
			.group('status')
			.group('size')
			.end()
			.then(data => {
				assert(data.series.length)
				const item = data.series[0];
				assert.equal(item.name, 'http');
				assert(item.tags.status);
				assert(item.tags.size);
				assert(item.columns.length);
				assert(item.values.length);
				done();
			})
			.catch(done);
	});


	it('limit points success', done => {
		client.query(series)
			.group('*')
			.limit(1)
			.end()
			.then(data => {
				assert(data.series.length)
				const item = data.series[0];
				assert.equal(item.name, 'http');
				_.forEach(data.series, tmp => {
					assert.equal(tmp.values.length, 1);
				});
				done();
			})
			.catch(done);
	});


	it('slimit points success', done => {
		client.query(series)
			.group('*')
			.slimit(1)
			.end()
			.then(data => {
				assert(data.series.length, 1)
				done();
			})
			.catch(done);
	});

	it('order points desc success', done => {
		client.query(series)
			.desc()
			.end()
			.then(data => {
				let time = null;
				_.forEach(data.series[0].values, tmp => {
					if (!time) {
						time = tmp[0];
					}
					assert(time >= tmp[0]);
				});
				done();
			})
			.catch(done);
	});


	it('order points asc success', done => {
		client.query(series)
			.asc()
			.end((err, data) => {
				if (err) {
					return done(err);
				}
				let time = null;
				_.forEach(data.series[0].values, tmp => {
					if (!time) {
						time = tmp[0];
					}
					assert(time <= tmp[0]);
				});
				done();
			});
	});


	it('offset points success', done => {
		let checkData;
		client.query(series)
			.limit(2)
			.end()
			.then(data => {
				checkData = data;
				return client.query(series)
					.offset(1)
					.end();
			})
			.then(data => {
				assert.equal(checkData.series[0].values[1].join(','), data.series[0].values[0].join(','));
				done();
			})
			.catch(done);
	});


	it('write multi points success', done => {
		client.write(series)
			.tag({
				status: '50x',
				size: '2K'
			})
			.tag('uuid', ++uuid)
			.value({
				code: 502,
				bytes: 2489,
				value: 1
			})
			.value('use', 30)
			.queue();

		client.write(series)
			.tag({
				status: '50x',
				size: '8K'
			})
			.tag('uuid', ++uuid)
			.value({
				code: 504,
				bytes: 8031,
				value: 1
			})
			.value('use', 50)
			.queue();
		client.syncWrite().then(() => {
			return client.query(series)
				.tag('uuid', uuid)
				.end();
		}).then(data => {
			assert.equal(data.series[0].values.length, 1);
			done();
		}).catch(done);
	});

	it('query multi series success', done => {
		client.query(series)
			.tag('status', '40x')
			.queue();
		client.query(series)
			.tag('status', '50x')
			.queue();
		client.syncQuery().then(data => {
			assert.equal(data.length, 2);
			done();
		});
	});


	it('auto sync write queue success', done => {
		client.autoSyncWrite(2);
		client.write(series)
			.tag({
				status: '50x',
				size: '2K'
			})
			.tag('uuid', ++uuid)
			.value({
				code: 502,
				bytes: 2489,
				value: 1
			})
			.value('use', 30)
			.queue();

		client.write(series)
			.tag({
				status: '50x',
				size: '8K'
			})
			.tag('uuid', ++uuid)
			.value({
				code: 504,
				bytes: 8031,
				value: 1
			})
			.value('use', 50)
			.queue();

		setTimeout(() => {
			client.query(series)
				.tag('uuid', uuid)
				.end((err, data) => {
					if (err) {
						return done(err);
					}
					assert.equal(data.series[0].values.length, 1);
					done();
				});
		}, 500);
	});



	it('drop database success', done => {
		client.dropDatabase('mydb')
			.then(done)
			.catch(done);
	});
});