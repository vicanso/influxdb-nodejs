'use strict';
const Client = require('..');

const client = new Client({
	database: 'stats'
});


// get http request count 


client.query('http')
	.count('use')
	.group('status')
	.group('time(10s)')
	.where('time > now() - 1m')
	.end((err, data) => {
		if (err) {
			console.error(err);
		}
		console.dir(data.series.length);
		console.dir(JSON.stringify(data));
	});
