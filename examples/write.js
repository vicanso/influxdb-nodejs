'use strict';
const Influx = require('..');
const client = new Influx({
	username: 'root',
	password: 'root',
	timePrecision: 'u',
	host: 'localhost',
	port: 8086,
	protocol: 'http',
	database: 'mydb'
});
const series = 'http';
const error = (err) => {
	console.error(err);
};

client.createDatabaseNotExists().then(() => {
	// client.write(series)
	// 	.tag('uuid', '1234')
	// 	.tag({
	// 		status: '40x',
	// 		size: '1K'
	// 	})
	// 	.value({
	// 		code: 400,
	// 		bytes: 1010,
	// 		value: 1
	// 	})
	// 	.value('use', 30)
	// 	.end()
	// 	.then(data => {
	// 		// data -> undefined
	// 		console.info(data);
	// 		return client.query(series).tag('uuid', '1234').end();
	// 	}).then(data => {
	// 		console.dir(data.series[0].values);
	// 	}).catch(error);


	client.write(series)
		.tag({
			status: '50x'
		})
		.value({
			code: 503
		})
		.queue();

	client.write(series)
		.tag({
			status: '50x'
		})
		.value({
			code: 504
		})
		.queue();

	client.syncWrite().catch(err => {
		console.error(err);
	});
});