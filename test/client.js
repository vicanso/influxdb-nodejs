'use strict';
const assert = require('assert');
const Client = require('..');
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
			use: 30,
			value: 1
		};
		client.write(measurement)
			.tag(tags)
			.tag('uuid', ++uuid)
			.value(values)
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
				const item = data[0];
				assert(item.code)
				assert(item.bytes);
				assert(item.use);
				assert.equal(item.uuid, uuid);
				done();
			})
			.catch(done);
	});

	it('get point with multi tag', done => {
		client.query(measurement)
			.tag({
				uuid: uuid,
				size: '1K'
			})
			.end()
			.then(data => {
				const item = data[0];
				assert(item.code)
				assert(item.bytes);
				assert(item.use);
				assert.equal(item.uuid, uuid);
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