# influxdb-nodejs

[![Build Status](https://travis-ci.org/vicanso/influxdb-nodejs.svg?branch=master)](https://travis-ci.org/vicanso/influxdb-nodejs)
[![Coverage Status](https://img.shields.io/coveralls/vicanso/influxdb-nodejs/master.svg?style=flat)](https://coveralls.io/r/vicanso/influxdb-nodejs?branch=master)
[![npm](http://img.shields.io/npm/v/influxdb-nodejs.svg?style=flat-square)](https://www.npmjs.org/package/influxdb-nodejs)
[![Github Releases](https://img.shields.io/npm/dm/influxdb-nodejs.svg?style=flat-square)](https://github.com/vicanso/influxdb-nodejs)

An [InfluxDB](https://influxdata.com/) Node.js Client.

## Installation

```js
$ npm install influxdb-nodejs
```

## Examples

View the [./examples](examples) directory for working examples.


## API

[API](https://vicanso.github.io/influxdb-nodejs/)


### New Client

```js
// no auth
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
```

```js
// normal auth (user and password will be added to URL query parameters)
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pwd@127.0.0.1:8086/mydb');
```

```js
// basic auth (will be used http basic auth)
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pwd@127.0.0.1:8086/mydb?auth=basic');
```

### Write point

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
// i --> integer
// s --> string
// f --> float
// b --> boolean
const fieldSchema = {
  use: 'i',
  bytes: 'i',
  url: 's',
};
const tagSchema = {
  spdy: ['speedy', 'fast', 'slow'],
  method: '*',
  // http stats code: 10x, 20x, 30x, 40x, 50x
  type: ['1', '2', '3', '4', '5'],
};
client.schema('http', fieldSchema, tagSchema, {
  // default is false
  stripUnknown: true,
});
client.write('http')
  .tag({
    spdy: 'fast',
    method: 'GET',
    type: '2',  
  })
  .field({
    use: 300,
    bytes: 2312,
    url: 'https://github.com/vicanso/influxdb-nodejs',
  })
  .then(() => console.info('write point success'))
  .catch(console.error);
```


### Query influxdb with multi where condition

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.query('http')
  .where('spdy', '1')
  .where('method', ['GET', 'POST'])
  .where('use', 300, '>=')
  .then(console.info)
  .catch(console.error);
// => influx ql: select * from "http" where "spdy" = '1' and "use" >= 300 and ("method" = 'GET' or "method" = 'POST')
```

Query influxdb using functon

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.query('http')
  .where('spdy', '1')
  .addFunction('count', 'url')
  .then(console.info)
  .catch(console.error);
// => select count("url") from "http" where "spdy" = '1'

client.query('http')
  .where('spdy', '1')
  .addFunction('bottom', 'use', 5)
  .then(console.info)
  .catch(console.error);
// select bottom("use",5) from "http" where "spdy" = '1'
```

### Write points to influxdb in queue

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
function loginStatus(account, ip, type) {
  client.write('login')
    .tag({
      type,  
    })
    .field({
      account,
      ip,  
    })
    .queue();
  if (client.writeQueueLength >= 10) {
    client.syncWrite()
      .then(() => console.info('sync write queue success'))
      .catch(err => console.error(`sync write queue fail, ${err.message}`));
  }
}

setInterval(() => {
  loginStatus('vicanso', '127.0.0.1', 'vip');
}, 5000);
```

### Sub query

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.query('http')
  .addFunction('max', 'use')
  .addGroup('type')
  .subQuery()
  .addFunction('sum', 'max')
  .then((data) => {
    // { name: 'http', columns: [ 'time', 'sum' ], values: [ [ '1970-01-01T00:00:00Z', 904 ] ] }
    console.info(data.results[0].series[0]);
  }).catch(console.error);
```

### Multi query

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const reader = client.query('request');
reader.set({
  limit: 2,
});
reader.multiQuery();
reader.measurement = 'login';
reader.set({
  limit: 1,
  tz: 'America/Chicago',
});
reader.set({
  format: 'json',
});
reader.then(data => {
  console.info(JSON.stringify(data));
}).catch(console.error);
```

### Use influxdb for express

```js
const express = require('express');
const app = express();
const _ = require('lodash');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const onHeaders = require('on-headers');

// set the http stats schema
client.schema('http', {
  use: 'integer',
  code: 'integer',
  bytes: 'integer',
  url: 'string',
});
client.on('writeQueue', () => {
  // sync write queue if the length is 100
  if (client.writeQueueLength === 100) {
    client.syncWrite()
      .then(() => {
        console.info('sync write success');
      })
      .catch(console.error);
  }
});

function httpStats(req, res, next) {
  const start = Date.now();
  onHeaders(res, () => {
    const code = res.statusCode;
    const use = Date.now() - start;
    const method = req.method;
    const bytes = parseInt(res.get('Content-Length') || 0, 10);
    const tags = {
      spdy: _.sortedIndex([100, 300, 1000, 3000], use),
      type: code / 100 | 0,
      method,
    };
    const fields = {
      use,
      code,
      bytes,
      url: req.url,
      route: req.route.path
    };
    // use queue for better performance
    client.write('http')
      .tag(tags)
      .field(fields)
      .queue();
  });
  next();
}

client.createDatabase().catch(err => {
  console.error('create database fail err:', err);
});

app.use(httpStats);

app.use((req, res, next) => {
  setTimeout(next, _.random(0, 5000));
});

app.get('/users/me', (req, res) => {
  res.json({
    account: 'vicanso',
    name: 'Tree Xie',
  });
});

app.get('/book/:id', (req, res) => {
  const {
    id,
  } = req.params;
  res.json({
    id: id,
    name: 'my book',
    author: 'vicanso',
  });
});

app.get('/order/:id', (req, res) => {
  res.status(400).json({
    error: 'The id is not valid',
  });
});

app.get('/author/:id', (req, res) => {
  res.status(500).json({
    error: 'The database is disconnected',
  });
});

let server;
const finish = () => {
  console.info(`listen on http://127.0.0.1:${server.address().port}/`);
};
if (process.env.PORT) {
  server = app.listen(process.env.PORT, finish);
} else {
  server = app.listen(finish);
}
```

## Influxdb Charts

HTTP Spdy(experss demo)

![](assets/http-spdy.png)

HTTP Type(experss demo)

![](assets/http-type.png)

HTTP Error(experss demo)

![](assets/http-error.png)

## Comparison

- `influx` It's complex for me. Before developing this module, I used influx, which was not straightforward; and its batch function can not be saved as queue. What's more, the function of query is too simple, just like I write influx ql.

- `influent` I have never used this module, but I have read its API. In my opinion, this module is not so convenient.

## License

MIT
