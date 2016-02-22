'use strict';
const Influx = require('simple-influx');
const client = new Influx({
	username: 'root',
	password: 'root',
	timePrecision: 'ms',
	host: 'localhost',
	port: 8086,
	protocol: 'http',
	database: 'mydb'
});
const series = 'http';
const error = (err) => {
	console.error(err);
};

client.write(series)
	.tag('uuid', '1234')
	.tag({
		status: '40x',
		size: '1K'
	})
	.value({
		code: 400,
		bytes: 1010,
		value: 1
	})
	.value('use', 30)
	.end()
	.then(data => {
		// data -> undefined
		console.info(data);
	}).catch(error);


client.series(series)
	.tag({
		status: '50x'
	})
	.value({
		code: 503
	})
	.queue();