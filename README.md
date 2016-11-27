# influxdb-nodejs 
  
[![Build Status](https://travis-ci.org/vicanso/influxdb-nodejs.svg?branch=master)](https://travis-ci.org/vicanso/influxdb-nodejs)
[![Coverage Status](https://img.shields.io/coveralls/vicanso/influxdb-nodejs/master.svg?style=flat)](https://coveralls.io/r/vicanso/influxdb-nodejs?branch=master)
[![npm](http://img.shields.io/npm/v/influxdb-nodejs.svg?style=flat-square)](https://www.npmjs.org/package/influxdb-nodejs)
[![Github Releases](https://img.shields.io/npm/dm/influxdb-nodejs.svg?style=flat-square)](https://github.com/vicanso/influxdb-nodejs)

An [InfluxDB](https://influxdata.com/) Node.js Client.

* The branch is for influxdb 1.x. If use below 1.x, please get branch v1.x

* I maintain the project in my spare time, so the reply may be delayed; However I will reply asap.

## Installation

```js
$ npm install influxdb-nodejs
```

## Examples
  
View the [./examples](examples) directory for working examples. 


## API

[View the detail](api.md)

## How to query data

First write data to influxdb by [examples/write-points.js](examples/write-points.js).

Note: My time zone is UTC+8.

- measurement:request
  - field:code 200, 304, 400, 500, 502
  - field:use 300, 1000, 3000, 6000
  - tag:method GET', 'POST', 'PUT', 'PATCH', 'DELETE'
  - tag:spdy '0', '1', '2', '3', '4'
  - tag:type '2', '3', '4', '5'

- measurement:login
  - field:account
  - tag:type 'vip', 'member'
  
### Count today's login times 

```js
const client = new Influx('http://127.0.0.1:8086/mydb');
// { login: [ { time: '2016-11-26T16:00:00Z', count: 99 } ] }
client.query('login')
  .addCalculate('count', 'account')
  .set({
    start: '2016-11-26T16:00:00.000Z',
    format: 'json',
  })
  .then(console.info);
```

### Count yesterday's login times

```js
const client = new Influx('http://127.0.0.1:8086/mydb');
// {"results":[{"series":[{"name":"login","columns":["time","count"],"values":[["2016-11-25T16:00:00Z",58]]}]}]}
client.query('login')
  .addCalculate('count', 'account')
  .set({
    start: '2016-11-25T16:00:00.000Z',
    end: '2016-11-26T16:00:00.000Z',
  })
  .then(console.info);
```

### Count today's login times group by type

```js
const client = new Influx('http://127.0.0.1:8086/mydb');
// { login:
//   [ { time: '2016-11-26T16:00:00Z', count: 71, type: 'member' },
//     { time: '2016-11-26T16:00:00Z', count: 28, type: 'vip' } ] }
client.query('login')
  .addCalculate('count', 'account')
  .addGroup('type')
  .set({
    start: '2016-11-26T16:00:00.000Z',
    format: 'json',
  })
  .then(console.info);
```

### Count today's login times group by type and 5m

```js
const client = new Influx('http://127.0.0.1:8086/mydb');
// { login:
//   [ { time: '2016-11-26T16:00:00Z', count: 1, type: 'member' },
//     { time: '2016-11-26T16:05:00Z', count: 0, type: 'member' },
//     { time: '2016-11-26T16:10:00Z', count: 1, type: 'member' },
//     ...
client.query('login')
  .addCalculate('count', 'account')
  .addGroup('type', 'time(5m)')
  .set({
    start: '2016-11-26T16:00:00.000Z',
    format: 'json',
  })
  .then(console.info);
```

### Get today's request count times and mean use (spdy:"3")

```js
const client = new Influx('http://127.0.0.1:8086/mydb');
//{ request:
//   [ { time: '2016-11-26T16:00:00Z',
//       count: 49,
//       mean: 4530.081632653061 } ] }
client.query('request')
  .condition('spdy', '3')
  .addCalculate('count', 'code')
  .addCalculate('mean', 'use')
  .set({
    start: '2016-11-26T16:00:00.000Z',
    format: 'json',
  })
  .then(console.info);
```
### Get the last 30 min request

```js
const client = new Influx('http://127.0.0.1:8086/mydb');
//{ request:
//   [ { time: '2016-11-27T00:27:20.656596231Z',
//       code: 304,
//       method: 'GET',
//       spdy: '1',
//       type: '3',
//       use: 842 },
//     { time: '2016-11-27T00:27:42.667793891Z',
//       code: 200,
//       method: 'GET',
//       spdy: '0',
//       type: '2',
//       use: 84 },
//      ...
client.query('request')
  .set({
    start: '-30m',
    format: 'json',
  })
  .then(console.info);
```

### Get the last 30 min request's method and use order by time desc

```js
const client = new Influx('http://127.0.0.1:8086/mydb');
//{ request:
//   [ { time: '2016-11-27T00:36:33.09489012Z',
//       method: 'GET',
//       use: 176 },
//     { time: '2016-11-27T00:36:13.085100861Z',
//       method: 'GET',
//       use: 209 },
client.query('request')
  .addField('method', 'use')
  .set({
    start: '-30m',
    format: 'json',
    order: 'desc',
  })
  .then(console.info);
```

### Count today's the request time where use time is more than 300ms

```js
const client = new Influx('http://127.0.0.1:8086/mydb');
// { request: [ { time: '2016-11-26T16:00:00Z', count: 263 } ] }
client.query('request')
  .addCalculate('count', 'use')
  .condition('"use" > 300')
  .set({
    start: '2016-11-26T16:00:00.000Z',
    format: 'json',
  })
  .then(console.info);
```

## Simple Demo

### Write point

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.write('http')
  .tag('spdy', 'fast')
  .tag({
    type: '2',
    method: 'get',
  })
  .field('use', 300)
  .field({
    code: 200,
    size: 10 * 1024,
  })
  .time(Date.now(), 'ms')
  .then(() => console.info('write point success'))
  .catch(console.error);
```

### Batch write points

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.write('http')
  .tag('spdy', 'fast')
  .tag({
    type: '2',
    method: 'get',
  })
  .field('use', 300)
  .field({
    code: 200,
    size: 10 * 1024,
  })
  .queue();
client.write('http')
  .tag('spdy', 'slow')
  .tag({
    type: '5',
    method: 'post',
  })
  .field('use', 3000)
  .field({
    code: 500,
    size: 300,
  })
  .queue();
client.syncWrite()
  .then(() => console.info('batch write points success'))
  .catch(console.error);
```

### Query point

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.query('http')
  .condition('spdy', 'fast')
  .addCondition('"use" <= 30')
  .addField('spdy', 'status', 'fetch time')
  .set('epoch', 'ms')
  .set('format', 'json')
  .set({
    start: '-24h',
    end: '-12h',
    limit: 10,
    slimit: 5,
    order: 'desc',
    offset: 10,
    soffset: 5,
    fill: 0,
  })
  .then(console.info)
  .catch(console.error);
```

### Batch query point

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.query('http')
  .condition('spdy', 'fast')
  .queue();

client.query('http')
  .condition('spdy', 'slow')
  .queue();

client.syncQuery('json')
  .then(console.info)
  .catch(console.error);
```

## Comparison

- `influx` It's complex for me. Before developing this module, I used influx, which was not straightforward; and its batch function can not be saved as queue. What's more, the function of query is too simple, just like I write influx ql.

- `influent` I have never used this module, but I have read its API. In my opinion, this module is not so convenient.

## License

MIT
