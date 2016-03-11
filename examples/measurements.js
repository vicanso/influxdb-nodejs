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



function getMeasurements() {
	return client.getMeasurements().then(data => {
		// data -> {"series":[{"name":"measurements","columns":["name"],"values":[["http"]]}]}
		console.info(data);
	}).catch(done);
}


function dropMeasurement(name) {
	return client.dropMeasurement(name).then(data => {
		console.info(data);
	}).catch(done);
}


getMeasurements().then(() => {
	dropMeasurement('http');
});