'use strict';
const koa = require('koa');
const app = koa();
const Influx = require('..');
const client = new Influx('http://localhost:8086/mydb');
const _ = require('lodash');

client.createDatabase();

app.use(function*(next) {
  const ctx = this;
  const start = Date.now();
  yield * next;
  const statusCode = ctx.status;
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

app.use(function*() {
  yield new Promise((resolve, reject) => {
    setTimeout(() => {
      this.body = 'Hello World';
      resolve();
    }, 1000);
  });
});

const server = app.listen();

console.info(`listen on http://127.0.0.1:${server.address().port}/`);