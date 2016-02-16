'use strict';
const Client = require('..');
const _ = require('lodash');

const client = new Client({
	database: 'stats'
});
let total = 0;

client.createDatabase('stats')
// client.dropDatabase('stats')


client.autoSyncWrite(20);

function httpStats(){
	const bytes = _.random(1, 512 * 1024);
	const use = _.random(1, 4000);
	const status = _.sample([100, 200, 204, 301, 302, 400, 403, 500, 501, 502, 503]);

	return client.write('http')
		.tag('spdy', _.sample(["puma","tiger","deer","rabbit","turtle"]))
		.tag('status', _.sample(["10x","20x","30x","40x","50x","xxx"]))
		.tag('size', _.sample(["2KB","10KB","50KB","100KB","300KB",">300KB"]))
		.value({
			bytes: bytes,
			use: use,
			code: status
		})
		.end();
}

setInterval(function() {
	httpStats().then(() => {
		console.info('total:' + (++total));
	}).catch(err => {
		console.error(err);
	});
}, _.random(1000, 5000));

// client.query('http')
// 	.where('time > now() - 2h')
// 	.group('spdy')
// 	.group('time(1h)')
// 	.field('COUNT(value)')
// 	.fill(0)
// 	.end()
// 	.then(data => {
// 		console.dir(JSON.stringify(data));
// 	}).catch(err => {
// 		console.error(err);
// 	});