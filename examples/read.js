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

client.query(series)
	.tag('status', '40x')
	.tag({
		uuid: '1234'
	})
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);


client.query(series)
	.where("status='40x'")
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);


client.query(series)
	.where('status =~ /50./')
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);


client.query(series)
	.where('time > now() - 2s')
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);

client.query(series)
	.group('status')
	.group('size')
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);


client.query(series)
	.group('*')
	.limit(1)
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);


client.query(series)
	.group('*')
	.slimit(1)
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);


client.query(series)
	.desc()
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);

client.query(series)
	.asc()
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);



client.query(series)
	.offset(1)
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);



client.query(series)
	.mean('use')
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);



client.query(series)
	.sum('use')
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);


client.query(series)
	.count('use')
	.end()
	.then(data => {
		console.info(data);
	}).catch(error);


client.query(series)
	.tag('status', '40x')
	.queue();
client.query(series)
	.tag('status', '50x')
	.queue();

client.syncQuery().then(data => {
	console.info(data);
}).catch(error);		