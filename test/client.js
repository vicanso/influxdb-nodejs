'use strict';
const assert = require('assert');
const Client = require('..');
const _ = require('lodash');

describe('influxdb-nodejs:singleton', () => {
	const client = new Client({
		database: 'mydb'
	});
	const series = 'http';
	let uuid = 0;

	it('init client use uri', (done) => {

		const tmpClient = new Client('https://user:pwd@192.168.1.1:8087/test');
		assert.equal(JSON.stringify(tmpClient._options), '{"timePrecision":"ms","database":"test","servers":[{"protocol":"https","host":"192.168.1.1","port":8087}],"username":"user","password":"pwd"}');
		done();
	});

	it('create database success', done => {
		client.createDatabase()
			.then(data => {
				// data -> undefined
				assert.equal(data, undefined);
				done();
			})
			.catch(done);
	});


	it('safe create database if database exists success', done => {
		client.createDatabaseNotExists()
			.then(data => {
				// data -> undefined
				assert.equal(data, undefined);
				done();
			}).catch(done);
	});


	it('safe create database if database not exists success', done => {
		client.dropDatabase()
			.then(() => {
				return client.createDatabaseNotExists();
			}).then(data => {
				// data -> undefined
				assert.equal(data, undefined);
				done();
			}).catch(done);
	});


	it('write point success', done => {
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
			.then(data => {
				// data -> undefined
				assert.equal(data, undefined);
				done();
			})
			.catch(done);
	});


	it('write point(value field is null) success', done => {
		const tags = {
			status: '50x',
			size: '1K'
		};
		const values = {
			code: 503,
			bytes: 1010
		};
		client.write(series)
			.tag(tags)
			.tag('uuid', ++uuid)
			.value(values)
			.value('use', 30)
			.end()
			.then(data => {
				// data -> undefined
				assert.equal(data, undefined);
				done();
			}).catch(done);
	});



	it('write two points with same time value will save one point', done => {
		const id = ++uuid;
		const now = Date.now();
		client.write(series)
			.tag('uuid', id)
			.value({
				use: 40,
				time: now
			})
			.queue();
		client.write(series)
			.tag('uuid', id)
			.value({
				use: 30,
				time: now
			})
			.queue();
		client.syncWrite().then(() => {
			return client.query(series).tag('uuid', id).end();
		}).then(data => {
			assert.equal(data.series[0].values.length, 1);
			done();
		}).catch(err => {
			done(err);
		});

	});


	it('get points success', done => {
		client.query(series)
			.tag('uuid', uuid)
			.end()
			.then(data => {
				// data -> {"series":[{"name":"http","columns":["time","bytes","code","size","status","use","uuid","value"],"values":[["2016-02-17T06:11:41.644Z",1010,400,"1K","40x",30,"1",1]]}]}
				const keys = ["time", "bytes", "code", "size", "status", "use", "uuid", "value"].sort();
				assert.equal(data.series[0].name, 'http');
				assert.equal(data.series[0].columns.sort().join(), keys.join());
				assert.equal(data.series[0].values[0].length, keys.length);
				done();
			}).catch(done);
	});


	it('get points with multi tag(object) success', done => {
		client.query(series)
			.tag({
				status: '40x',
				size: '1K'
			})
			.end()
			.then(data => {
				// data -> {"series":[{"name":"http","columns":["time","bytes","code","size","status","use","uuid","value"],"values":[["2016-02-17T06:11:41.644Z",1010,400,"1K","40x",30,"1",1]]}]}
				const keys = ["time", "bytes", "code", "size", "status", "use", "uuid", "value"].sort();
				assert.equal(data.series[0].name, 'http');
				assert.equal(data.series[0].columns.sort().join(), keys.join());
				assert.equal(data.series[0].values[0].length, keys.length);
				done();
			}).catch(done);
	});


	it('get points with where(string) success', done => {
		client.query(series)
			.where("status='40x'")
			.end()
			.then(data => {
				// data -> {"series":[{"name":"http","columns":["time","bytes","code","size","status","use","uuid","value"],"values":[["2016-02-17T06:11:41.644Z",1010,400,"1K","40x",30,"1",1]]}]}
				const keys = ["time", "bytes", "code", "size", "status", "use", "uuid", "value"].sort();
				assert.equal(data.series[0].name, 'http');
				assert.equal(data.series[0].columns.sort().join(), keys.join());
				assert.equal(data.series[0].values[0].length, keys.length);
				done();
			}).catch(done);
	});


	it('get points white regular expression success', done => {
		client.query(series)
			.where('status =~ /50./')
			.end()
			.then(data => {
				// data -> {"series":[{"name":"http","columns":["time","bytes","code","size","status","use","uuid","value"],"values":[["2016-02-17T07:35:00.951Z",1010,503,"1K","50x",30,"2",1]]}]}
				const keys = ["time", "bytes", "code", "size", "status", "use", "uuid", "value"].sort();
				assert.equal(data.series[0].name, 'http');
				assert.equal(data.series[0].columns.sort().join(), keys.join());
				assert.equal(data.series[0].values[0].length, keys.length);
				done();
			}).catch(done);
	});


	it('get points by time success', done => {
		let count = 0;
		const now = Date.now();
		const finish = () => {
			count++;
			if (count === 2) {
				done();
			}
		};

		client.query(series)
			.where("time > now() - 2s")
			.end()
			.then(data => {
				// data -> {"series":[{"name":"http","columns":["time","bytes","code","size","status","use","uuid","value"],"values":[["2016-02-17T07:51:45.307Z",1010,400,"1K","40x",30,"1",1],["2016-02-17T07:51:45.32Z",1010,503,"1K","50x",30,"2",1]]}]}
				_.forEach(data.series, tmp => {
					_.forEach(tmp.values, arr => {
						assert(now - (new Date(arr[0])).getTime() < 2000);
					});
				});
				finish();
			}).catch(done);

		client.query(series)
			.where('time > now()')
			.end()
			.then(data => {
				// data -> {}
				assert(_.isEmpty(data));
				finish();
			}).catch(done);
	});


	it('set timeout success', done => {
		assert.equal(client.timeout, 0);
		client.timeout = 1;
		assert.equal(client.timeout, 1);
		client.query(series)
			.tag('uuid', uuid)
			.end()
			.catch(err => {
				assert.equal(err.code, 'ECONNABORTED');
				client.timeout = 0;
				assert.equal(client.timeout, 0);
				done();
			});
	});


	it('write multi points success', done => {
		const randomTags = () => {
			return {
				status: _.sample(['20x', '30x', '40x', '50x']),
				size: _.sample(['1K', '10K', '50K', '100K', '300K'])
			};
		};
		const randomValues = () => {
			return {
				code: _.random(200, 510),
				bytes: _.random(10, 400 * 1024),
				use: _.random(1, 1000),
				value: _.random(1, 2)
			};
		};
		const arr = [];
		for (let i = 2; i >= 0; i--) {
			arr.push(
				client.write(series)
				.tag(randomTags())
				.value(randomValues())
				.end()
			);
		}

		Promise.all(arr).then(data => {
			// data -> [null, null, null]
			done();
		}).catch(done);

	});


	it('get points group by multi tags success', done => {
		client.query(series)
			.group('status')
			.group('size')
			.end()
			.then(data => {
				// data -> {"series":[{"name":"http","tags":{"size":"100K","status":"50x"},"columns":["time","bytes","code","use","uuid","value"],"values":[["2016-02-17T08:00:49.068Z",88879,381,35,null,1]]},{"name":"http","tags":{"size":"1K","status":"30x"},"columns":["time","bytes","code","use","uuid","value"],"values":[["2016-02-17T08:00:49.068Z",80127,218,729,null,2]]},{"name":"http","tags":{"size":"1K","status":"40x"},"columns":["time","bytes","code","use","uuid","value"],"values":[["2016-02-17T08:00:48.985Z",1010,400,30,"1",1]]},{"name":"http","tags":{"size":"1K","status":"50x"},"columns":["time","bytes","code","use","uuid","value"],"values":[["2016-02-17T08:00:49Z",1010,503,30,"2",1]]},{"name":"http","tags":{"size":"50K","status":"30x"},"columns":["time","bytes","code","use","uuid","value"],"values":[["2016-02-17T08:00:49.068Z",232600,413,630,null,1]]}]}
				assert(data.series.length);
				const tags = _.map(data.series, item => {
					return `${item.tags.size}-${item.tags.status}`;
				});
				assert.equal(tags.join(), _.union(tags).join());
				done();
			}).catch(done);
	});


	it('limit points success', done => {
		client.query(series)
			.group('*')
			.limit(1)
			.end()
			.then(data => {
				// data -> {"series":[{"name":"http","tags":{"size":"10K","status":"40x","uuid":""},"columns":["time","bytes","code","use","value"],"values":[["2016-02-17T08:22:14.603Z",380886,453,67,1]]},{"name":"http","tags":{"size":"1K","status":"30x","uuid":""},"columns":["time","bytes","code","use","value"],"values":[["2016-02-17T08:22:14.603Z",77190,403,588,2]]},{"name":"http","tags":{"size":"1K","status":"40x","uuid":"1"},"columns":["time","bytes","code","use","value"],"values":[["2016-02-17T08:22:14.514Z",1010,400,30,1]]},{"name":"http","tags":{"size":"1K","status":"50x","uuid":"2"},"columns":["time","bytes","code","use","value"],"values":[["2016-02-17T08:22:14.529Z",1010,503,30,1]]},{"name":"http","tags":{"size":"300K","status":"30x","uuid":""},"columns":["time","bytes","code","use","value"],"values":[["2016-02-17T08:22:14.602Z",308696,286,54,1]]}]}
				assert(data.series.length);
				_.forEach(data.series, tmp => {
					assert.equal(tmp.values.length, 1);
				});
				done();
			}).catch(done);
	});


	it('slimit points success', done => {
		client.query(series)
			.group('*')
			.slimit(1)
			.end()
			.then(data => {
				assert(data.series.length, 1);
				done();
			}).catch(done);
	});


	it('order points desc success', done => {
		client.query(series)
			.desc()
			.end()
			.then(data => {
				let time;
				_.forEach(data.series[0].values, tmp => {
					if (time) {
						assert(time >= tmp[0]);
					}
					time = tmp[0]
				});
				done();
			}).catch(done);
	});


	it('order points asc success', done => {
		client.query(series)
			.asc()
			.end()
			.then(data => {
				let time;
				_.forEach(data.series[0].values, tmp => {
					if (time) {
						assert(time <= tmp[0]);
					}
					time = tmp[0]
				});
				done();
			}).catch(done);
	});


	it('offset points success', done => {
		let prevData;
		client.query(series)
			.limit(2)
			.end()
			.then(data => {
				prevData = data;
				return client.query(series)
					.offset(1)
					.end();
			})
			.then(data => {
				assert.equal(prevData.series[0].values[1].sort().join(','), data.series[0].values[0].sort().join(','));
				done();
			}).catch(done);
	});


	it('mean result success', done => {
		client.query(series)
			.mean('use')
			.end()
			.then(data => {
				// data -> {"series":[{"name":"http","columns":["time","mean"],"values":[["1970-01-01T00:00:00Z",61.8]]}]}
				assert.equal(data.series[0].columns.sort().join(','), 'mean,time');
				assert.equal(data.series[0].values[0].length, 2);
				done();
			}).catch(done);
	});


	it('sum result success', done => {
		client.query(series)
			.sum('use')
			.end()
			.then(data => {
				// data -> {"series":[{"name":"http","columns":["time","sum"],"values":[["1970-01-01T00:00:00Z",1601]]}]}
				assert.equal(data.series[0].columns.sort().join(','), 'sum,time');
				assert.equal(data.series[0].values[0].length, 2);
				done();
			}).catch(done);
	});


	it('count result success', done => {
		client.query(series)
			.count('use')
			.end()
			.then(data => {
				// data -> {"series":[{"name":"http","columns":["time","count"],"values":[["1970-01-01T00:00:00Z",5]]}]}
				assert.equal(data.series[0].columns.sort().join(','), 'count,time');
				assert.equal(data.series[0].values[0].length, 2);
				done();
			}).catch(done);
	});


	it('fill with 11 success', done => {
		const fillValue = 11;
		const tags = {
			status: '50x',
			size: '1K'
		};
		const values = {
			code: 503,
			bytes: 1010
		};
		client.write(series)
			.tag(tags)
			.tag('uuid', ++uuid)
			.value(values)
			.value('use', 30)
			.end()
			.then(data => {
				return client.query(series)
					.group('status')
					.fill(fillValue)
					.tag('uuid', uuid)
					.mean('value')
					.end();
			}).then(data => {
				// data -> {"series":[{"name":"http","tags":{"status":"50x"},"columns":["time","mean"],"values":[["1970-01-01T00:00:00Z",11]]}]}
				assert(data.series[0].values[0][1], fillValue);
				done();
			}).catch(done);
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
				size: '8K',
				uuid: ++uuid
			})
			.value({
				code: 504,
				bytes: 8031,
				value: 1,
				use: 50
			})
			.queue();

		assert.equal(client.writeQueueLength, 2);

		client.syncWrite().then(data => {
			// data -> undefined
			return client.query(series)
				.tag('uuid', uuid)
				.end();
		}).then(data => {
			assert.equal(data.series[0].values.length, 1);
			done();
		}).catch(done);
	});


	it('write multi points different series success', done => {
		const testSeries = 'test';
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
		client.write(testSeries)
			.tag({
				status: '50x',
				size: '8K',
				uuid: ++uuid
			})
			.value({
				code: 504,
				bytes: 8031,
				value: 1,
				use: 50
			})
			.queue();
		client.syncWrite().then(data => {
			// data -> undefined
			return client.query(testSeries)
				.tag('uuid', uuid)
				.end();
		}).then(data => {
			assert.equal(data.series[0].values.length, 1);
			return client.dropMeasurement(testSeries);
		}).then(data => {
			done();
		}).catch(done);
	});


	it('call sync write when queue is empty', done => {
		client.syncWrite().then(data => {
			// data -> undefined
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
		assert.equal(client.queryQueueLength, 2);
		client.syncQuery().then(data => {
			// data -> [{"series":[{"name":"http","columns":["time","code","size","status","bytes","use","uuid","value"],"values":[["2016-02-19T05:25:00.723Z",400,"1K","40x",1010,30,"1",1],["2016-02-19T05:25:00.805Z",492,"300K","40x",369823,146,null,1],["2016-02-19T05:25:00.805Z",441,"10K","40x",384615,301,null,2]]}]},{"series":[{"name":"http","columns":["time","code","size","status","bytes","use","uuid","value"],"values":[["2016-02-19T05:25:00.732Z",503,"1K","50x",1010,30,"2",1],["2016-02-19T05:25:00.904Z",502,"2K","50x",2489,30,"3",1],["2016-02-19T05:25:00.904Z",504,"8K","50x",8031,50,"4",1]]}]}]
			assert.equal(data.length, 2);
			done();
		}).catch(done);
	});


	it('query queue success', done => {
		client.query(series)
			.tag('status', '40x')
			.queue();
		client.query(series)
			.tag('status', '50x')
			.queue();

		client.syncQuery()
			.then(data => {
				// data -> [{"series":[{"name":"http","columns":["time","code","size","status","bytes","use","uuid","value"],"values":[["2016-02-22T01:33:35.522Z",400,"1K","40x",1010,30,"1",1],["2016-02-22T01:33:35.595Z",201,"50K","40x",401247,172,null,2]]}]},{"series":[{"name":"http","columns":["time","code","size","status","bytes","use","uuid","value"],"values":[["2016-02-22T01:33:35.537Z",503,"1K","50x",1010,30,"2",1],["2016-02-22T01:33:35.683Z",504,"8K","50x",8031,50,"4",1],["2016-02-22T01:33:35.683Z",502,"2K","50x",2489,30,"3",1],["2016-02-22T01:33:35.703Z",504,"8K","50x",8031,50,"6",1],["2016-02-22T01:33:35.703Z",502,"2K","50x",2489,30,"5",1]]}]}]
				assert.equal(data.length, 2);
				assert(data[0].series[0].values.length > 0);
				assert(data[1].series[0].values.length > 0);
				done();
			}).catch(done);
	});


	it('get measurements success', done => {
		client.getMeasurements().then(data => {
			// data -> {"series":[{"name":"measurements","columns":["name"],"values":[["http"]]}]}
			assert.equal(data.series[0].name, 'measurements');
			assert.equal(data.series[0].columns[0], 'name');
			assert.equal(data.series[0].values[0][0], 'http');
			done();
		}).catch(done);
	});


	it('drop measurement success', done => {
		client.dropMeasurement(series).then(data => {

			// data -> {}
			assert(_.isEmpty(data));
			return client.getMeasurements().then(data => {
				// data -> {}
				assert(_.isEmpty(data));
				done();
			});
		}).catch(done);
	});


	it('drop database success', done => {
		client.dropDatabase()
			.then(data => {
				// data -> undefined
				assert.equal(data, undefined);
				done();
			})
			.catch(done);
	});
});

describe('influxdb-nodejs:cluster', () => {
	const client = new Client({
		database: 'mydb',
		servers: [
			{
				host: '127.0.0.1',
				port: 8086
			},
			{
				host: '127.0.0.1',
				port: 9086
			}
		]
	});

	it('get available servers success', done => {
		setTimeout(() => {
			const servers = client.availableServers;
			assert.equal(servers.length, 1);
			assert.equal(servers[0].port, 8086);

			const unavailableServers = client.unavailableServers;
			assert.equal(unavailableServers.length, 1);
			assert.equal(unavailableServers[0].port, 9086);

			done();
		}, 1500);
	})
});