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

### Constructor

- `uri` influxdb connect uri string, eg: `http://user:pass@localhost:port,anotherhost:port,yetanother:port/mydatabase`

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydatabase');
```

### availableServers

get available servers

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@192.168.1.1:8086,192.168.1.2:8086,192.168.1.3:9086/mydatabase');
console.info(client.availableServers); //[{"host": "192.168.1.1", "port": 8086, "protocol": "http"}, ...]
```

### unavailableServers

get unavailable servers

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@192.168.1.1:8086,192.168.1.2:8086,192.168.1.3:9086/mydatabase');
console.info(client.unavailableServers); //[{"host": "192.168.1.1", "port": 8086, "protocol": "http"}, ...]
```



### timeout (get/set)

get/set request timeout(ms)


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydatabase');
client.timeout = 1000;
console.info(client.timeout); // 1000
```


### createDatabaseNotExists

create database if the database is not exists

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.createDatabaseNotExists().then(() => {
  console.info('create database:mydb success');
}).catch(err => {
  console.error(err);
});
```


### dropDatabase

drop database when the database is exists


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.dropDatabase().then(() => {
  console.info('drop database:mydb success');
}).catch(err => {
  console.error(err);
});
```

### showRetentionPolicies

show retention policies of db

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.showRetentionPolicies().then((data) => {
  console.info(data);
}).catch(err => {
  console.error(err);
});
```

### showMeasurements

show measurements of db

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.showMeasurements().then(data => {
  console.info(data);
}).catch(err => {
  console.error(err);
});
```

### showTagKeys

- `measurement` measurement name, [optional]

show tag keys of measurement/db

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
// show tag keys of mydb
client.showTagKeys().then(data => {
  console.info(data);
}).catch(err => {
  console.error(err);
});
// show tag keys of http
client.showTagKeys('http').then(data => {
  console.info(data);
}).catch(err => {
  console.error(err);
});
```


### showFieldKeys

- `measurement` measurement name, [optional]

show field keys of measurement/db

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
// show field keys of mydb
client.showFieldKeys().then(data => {
  console.info(data);
}).catch(err => {
  console.error(err);
});
// show field keys of http
client.showFieldKeys('http').then(data => {
  console.info(data);
}).catch(err => {
  console.error(err);
});
```

### showSeries

- `measurement` measurement name, [optional]

show series of measurement/db

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
// show series of mydb
client.showSeries().then(data => {
  console.info(data);
}).catch(err => {
  console.error(err);
});
// show series of http
client.showSeries('http').then(data => {
  console.info(data);
}).catch(err => {
  console.error(err);
});
```

### writePoint

write point to the influxdb's measurement

- `measurement` measurement name

- `fields` field set

- `tags` tag set, optional


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.writePoint('http', {
  code: 400,
  bytes: 1010
}, {
  status: '40x',
  size: '1K'
});
```



### write

write point to the influxdb's measurement, return Writer instance


- `measurement` write point to the measurement


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const writer = client.write('http');
```




### Writer.tag

set point tags, return Writer instance

- `key` tag name string or {key1: value1, key2: value2}

- `value` tag value string, optional


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
  status: '40x',
  size: '1K'
});
```



### Writer.field


- `key` value name string or {key1: value1, key2: value2}

- `value` field value, optional

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
  status: '40x',
  size: '1K'
});
writer.field({
  code: 400,
  value: 1
});
writer.field('bytes', 1010);
```



### Writer.then

write point to server, return promise


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
  status: '40x',
  size: '1K'
});
writer.field({
  code: 400,
  value: 1
});
writer.field('bytes', 1010);
writer.then(() => {
  console.info('write point success');
}).catch(err => {
  console.error(err);
});
```



### Writer.queue

add writer instance to write queue, it will sync when call syncWrite


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
  status: '40x',
  size: '1K'
});
writer.field({
  code: 400,
  value: 1
});
writer.field('bytes', 1010);
writer.queue();
```



### writeQueueLength

get write queue length


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
  status: '40x',
  size: '1K'
});
writer.field({
  code: 400,
  value: 1
});
writer.field('bytes', 1010);
writer.queue();
console.info(client.writeQueueLength); // 2
```


### syncWrite

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
  status: '40x',
  size: '1K'
});
writer.field({
  code: 400,
  value: 1
});
writer.vafieldlue('bytes', 1010);
writer.queue();
client.syncWrite().then(() => {
  console.info('sync write success');
}).catch(err => {
  console.error(err);
});
```

### query

get point from the measurement, return Reader instance extends  [influx-ql](https://github.com/vicanso/influx-ql)


- `measurement` get point from the measurement

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const reader = client.query('http');
reader.addField('status', 'spdy', 'fetch time');
reader.start = '2016-01-01';
reader.end = '-3h';
reader.limit = 10;
reader.slimit = 5;
reader.condition('code', 400);
reader.tag('spdy', 'fast');
reader.addCondition('use <= 30');
reader.fill = 0;
// return data format type: 'default', 'json', 'csv'
reader.format = 'json';
reader.then(data => {
  console.info(data);
}).catch(err => {
  console.error(err);
});
```




### Reader.queue

add reader instance to reader queue


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.query('http')
  .tag('status', '40x')
  .queue();
client.query('http')
  .tag('status', '50x')
  .queue();

client.syncQuery().then(data => {
  console.info(data);
}).catch(err => {
  console.error(err);
});
```



### syncQuery

get all query queue points result

- `format`  format type, `default`, `json`, `csv` 


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.query('http')
  .tag('status', '40x')
  .queue();
client.query('http')
  .tag('status', '50x')
  .queue();

client.syncQuery('json').then(data => {
  console.info(data);
}).catch(error);
```



### queryQueueLength

get query queue length


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.query('http')
  .tag('status', '40x')
  .queue();
client.query('http')
  .tag('status', '50x')
  .queue();
console.info(client.queryQueueLength); // 2
```

### startHealthCheck

- `ping` health check ping function, [optional]

detection the backend whether is health

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.startHealthCheck();
// custom ping function
client.startHealthCheck((backend, cb) => {
  // the backend fail if callback with error
  setTimeout(cb, 10); 
});
```

### stopHealthCheck

stop health check

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.startHealthCheck();
setTimeout(() => {
  client.stopHealthCheck();
}, 1000);
```

## License

MIT
