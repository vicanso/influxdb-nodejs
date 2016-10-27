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
