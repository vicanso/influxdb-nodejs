'use strict';
const _ = require('lodash');
const Influx = require('..');
const client = new Influx('http://127.0.0.1:8086/mydb');

// select code,spdy,type from ajax where spdy = '0' and time >= now() - 3h and use <= 300 limit 2
{
  const reader = client.query('http');
  reader.addField('code', 'spdy', 'type');
  reader.start = '-3h';
  reader.limit = 2;
  reader.tag('spdy', '0');
  reader.addCondition('use <= 300');
  reader.fill = 0;
  reader.then(data => {
    console.info(JSON.stringify(data));
  }).catch(err => {
    console.error(err);
  });
}
// select mean(use) from ajax where time >= now() - 1h group by spdy,time(5m) fill(0)
{
  const reader = client.query('http');
  reader.addCalculate('mean', 'use');
  reader.start = '-1h';
  reader.addGroup('spdy', 'time(5m)');
  reader.fill = 0;
  reader.then(data => {
    console.info(JSON.stringify(data));
  }).catch(err => {
    console.error(err);
  });
}
