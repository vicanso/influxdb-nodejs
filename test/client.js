'use strict';
const assert = require('assert');
const Client = require('..');
const _ = require('lodash');

describe('cuttle-client', () => {
	const client = new Client({
		database: 'mydb'
	});
	const measurement = 'http';
	let uuid = 0;
	it('create database success', done => {
		client.createDatabase('mydb')
			.then(done)
			.catch(done);
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
		client.write(measurement)
			.tag(tags)
			.tag('uuid', ++uuid)
			.value(values)
			.value('use', 30)
			.end()
			.then(done)
			.catch(done);
	});

	it('get point success', done => {
		client.query(measurement)
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

	it('get point with multi tag(object)', done => {
		client.query(measurement)
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

	it('get point with tag(string)', done => {
		client.query(measurement)
			.tag("status='40x'")
			.end()
			.then(data => {
				assert.equal(data.series[0].values.length, 1);
				done();
			})
			.catch(done);
		});

	it('write multi points', done => {

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
				client.write(measurement)
					.tag(randomTags())
					.value(randomValues())
					.end()
			);
		}
		Promise.all(arr).then(data => {
			done();
		}).catch(done);
	});

	it('get points group by', done => {
		client.query(measurement)
			.group('status')
			.end()
			.then(data => {
				// TODO check data
				console.dir(JSON.stringify(data));
				done();
			})
			.catch(done);
	});


	it('drop database success', done => {
		client.dropDatabase('mydb')
			.then(done)
			.catch(done);
	});
});