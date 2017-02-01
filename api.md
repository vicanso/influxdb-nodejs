# influxdb-nodejs

[![Build Status](https://travis-ci.org/vicanso/influxdb-nodejs.svg?branch=master)](https://travis-ci.org/vicanso/influxdb-nodejs)
[![Coverage Status](https://img.shields.io/coveralls/vicanso/influxdb-nodejs/master.svg?style=flat)](https://coveralls.io/r/vicanso/influxdb-nodejs?branch=master)
[![npm](http://img.shields.io/npm/v/influxdb-nodejs.svg?style=flat-square)](https://www.npmjs.org/package/influxdb-nodejs)
[![Github Releases](https://img.shields.io/npm/dm/influxdb-nodejs.svg?style=flat-square)](https://github.com/vicanso/influxdb-nodejs)

A simple clinet for influxdb, including these features:

- Writing multiple points

- Querying from multi influxdb servers and writing with influxdb-relay

- Schema for fields and tags

## Installation

```js
$ npm install influxdb-nodejs
```

## Examples

Writing multiple points and set schema for measurment

```js
const Influx = require('influxdb-nodejs');
const clinet = new Influx('http://127.0.0.1:8086/mydb');
const fieldSchema = {
  use: 'integer',
  bytes: 'integer',
  url: 'string',
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
  .queue();

client.write('http')
  .tag({
    spdy: 'slow',
    method: 'GET',
    type: '2',
  })
  .field({
    use: 3000,
    bytes: 2312,
    url: 'https://github.com/vicanso/influxdb-nodejs',
  })
  .queue();

client.synceWrite()
  .then(() => console.info('sync write queue success'))
  .catch(err => console.error(`sync write queue fail, err:${err.message}`));
```

Using influxdb-relay for high availability (2 influxdb server and 2 influxdb-relay)

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:9086,127.0.0.1:9097/mydb', {
  loadBalancingAlgorithm: 'round-robin',
});
client.startHealthCheck();
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
  .then(() => console.info('write point to influxdb-relay success'))
  .catch(err => console.error(`write point to influxdb-relay fail, err:${err.message}`));
```
