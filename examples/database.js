'use strict';
const Influx = require('..');
const client = new Influx({
	username: 'root',
	password: 'root',
	timePrecision: 'ms',
	host: 'localhost',
	port: 8086,
	protocol: 'http',
	database: 'mydb'
});


function createDatabase() {
	return client.createDatabase().then(data => {
		// data -> undefined
		console.info('create database:mydb success');
	}).catch(err => {
		console.error(err);
	});
}


function dropDatabase() {
	return client.dropDatabase().then(data => {
		// data -> undefined
		console.info('drop database:mydb success');
	}).catch(err => {
		console.error(err);
	});
}


createDatabase().then(() => {
	dropDatabase();
});
