'use strict';

var influx = require('influx')

var client = influx({
  host : 'localhost',
  port : 8086,
  database : 'cuttle'
});


// client.dropMeasurement('http', (err, data) => {
//   console.dir(err);
//   console.dir(data);
// });


client.query('SELECT * FROM myseries; SELECT AVG(VALUE) as avgvalue from myseries', function (err, results) {});