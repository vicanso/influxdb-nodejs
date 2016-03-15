'use strict';
const express = require('express');
const app = express();
const Influx = require('..');
const _ = require('lodash');
const client = new Influx('http://localhost:8086/my-app');
const onHeaders = require('on-headers');
client.createDatabaseNotExists().catch(err => {
	console.error('create database fail err:', err);
});

app.use((req, res, next) => {
	const start = Date.now();
	onHeaders(res, () => {
		const statusCode = res.statusCode;
		const use = Date.now() - start;
		const tags = {
			status: _.sortedIndex([99, 199, 299, 399, 499, 599], statusCode),
			spdy: _.sortedIndex([100, 300, 1000, 3000], use)
		};
		const fields = {
			use: use,
			code: statusCode
		};
		client.writePoint('http', fields, tags).then(() => {
			console.info('write point to http measurement success');
		}).catch(err => {
			console.error(err);
		});
	});
	next();
});

app.get('/', (req, res) => {
	setTimeout(() => {
		res.json({
			name: 'Tree Xie'
		});
	}, 1000);
});

const server = app.listen(() => {
	console.info(`listen on ${server.address().port}`);
});
