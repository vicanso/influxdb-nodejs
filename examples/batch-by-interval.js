'use strict';
const express = require('express');
const app = express();
const Influx = require('..');
const _ = require('lodash');
const client = new Influx('http://localhost:8086/mydb');
const onHeaders = require('on-headers');
client.createDatabase().catch(err => {
  console.error('create database fail err:', err);
});
// batch post to influxdb  every 10s
setInterval(() => {
  if (client.writeQueueLength) {
    client.syncWrite()
      .then(() => console.info('sync write queue success'))
      .catch(console.error);
  }
}, 10 * 1000);

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
    // add to the queue
    // all batch point has the same time
    client.write('http')
      .field(fields)
      .tag(tags)
      .queue();
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
  console.info(`listen on http://127.0.0.1:${server.address().port}/`);
});


