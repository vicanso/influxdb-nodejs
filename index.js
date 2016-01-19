'use strict';
module.exports = require('./lib/client');


// const client = new Client({
// 	database: 'mydb'
// });

// client.query('cpu_load_short')
// 	.tag('region', 'us-west')
// 	.field('value')
// 	.end().then(data => {
// 		console.dir(data);
// 	}).catch(err => {
// 		console.dir(err);
// 	});

// client.write('cpu_load_short')
// 	.tag({
// 		host: 'server01',
// 		region: 'us-west'
// 	})
// 	.field('value', Math.floor(Math.random() * 100) / 100)
// 	.end().then(data => {
// 		console.dir(data);
// 	}).catch(err => {
// 		console.dir(err);
// 	});


