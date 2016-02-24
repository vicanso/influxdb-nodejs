# simple-influx

An [InfluxDB](https://influxdata.com/) Node.js Client

## Installation

```js
$ npm install simple-influx
```

## Examples
	
View the [./examples](examples) directory for working examples. 


## API

### Constructor

```js
const Influx = require('simple-influx');
const client = new Influx({
	username: 'root',
	password: 'root',
	timePrecision: 'ms',
	host: 'localhost',
	port: 8086,
	protocol: 'http',
	database: 'mydb'
});
```

- `username` username

- `password` password

- `timePrecision` time precision, default: `ms`

- `host` influxdb server host, default: `localhost`

- `port` influxdb server port, default: `8086`

- `protocol` protocol, default:`http`

- `database` database name


### createDatabase

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.createDatabase().then(() => {
	console.info('create database:mydb success');
}).catch(err => {
	console.error(err);
});
```

create database

### createDatabaseNotExists

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.createDatabaseNotExists().then(() => {
	console.info('create database:mydb success');
}).catch(err => {
	console.error(err);
});
```


### dropDatabase

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.dropDatabase().then(() => {
	console.info('drop database:mydb success');
}).catch(err => {
	console.error(err);
});
```
drop data when is exists


### getMeasurements

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.getMeasurements().then(data => {
	console.info(data);
}).catch(err => {
	console.error(err);
});
```

### dropMeasurement

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.dropMeasurement('http').then(data => {
	console.info(data);
}).catch(err => {
	console.error(err);
});
```

### setWriteQueueMax

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.setWriteQueueMax(20);
```

- `count` write queue max length

set the write queue max length


### write

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
const writer = client.write('http');
```

- `series` write point to the series

write point to the series, return Writer instance


### Writer.tag

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
	status: '40x',
	size: '1K'
});
```

- `key` tag name string or {key1: value1, key2: value2}

- `value` tag value string

set point tags, return Writer instance

### Writer.value

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
	status: '40x',
	size: '1K'
});
writer.value({
	code: 400,
	value: 1
});
writer.value('bytes', 1010);
```

- `key` value name string or {key1: value1, key2: value2}

- `value` value


### Writer.end

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
	status: '40x',
	size: '1K'
});
writer.value({
	code: 400,
	value: 1
});
writer.value('bytes', 1010);
writer.end().then(() => {
	console.info('write point success');
}).catch(err => {
	console.error(err);
});
```

write point to server, return promise


### Writer.queue

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
	status: '40x',
	size: '1K'
});
writer.value({
	code: 400,
	value: 1
});
writer.value('bytes', 1010);
writer.queue();
```

add writer instance to write queue, it will sync when call syncWrite or the queue length reach max.


### syncWrite

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
	status: '40x',
	size: '1K'
});
writer.value({
	code: 400,
	value: 1
});
writer.value('bytes', 1010);
writer.queue();
client.syncWrite().then(data => {
	console.info(data);
}).catch(err => {
	console.error(err);
});
```

### query

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
const reader = client.query('http');
```

- `series` get point from the series

get point from the series, return Reader instance


### Reader.tag

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
const reader = client.query('http');
reader.tag('status', '40x');
reader.tag({
	uuid: '1234'
});
reader.end().then(data => {
	console.info(data);
}).catch(err => {
	console.error(err);
});
```

- `key` tag name string or {key1: value1, key2: value2}

- `value` tag value string

set query tag conditions, return Reader instance


### Reader.where

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
const reader = client.query('http');
reader.where("status='40x'").end().then(data => {
	console.info(data);
}).catch(err => {
	console.error(err);
});

client.query('http')
	.where('status =~ /50./')
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});
```

- `conditions` string or regexp

get points by where conditions


### Reader.group

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.query('http')
	.group('status')
	.group('size')
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});
```

- `groupTag` group tag name

get points group by tag


### Reader.limit

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.query('http')
	.group('*')
	.limit(1)
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});
```

- `count` limit value

get points by limit value


### Reader.slimit

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.query('http')
	.group('*')
	.slimit(1)
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});
```

- `count` slimit value

get points by slimit value


### Reader.desc, Reader.asc

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});

client.query('http')
	.desc()
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});

client.query('http')
	.asc()
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});
```

get points sort by time(asc, desc)


### Reader.offset

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});

client.query('http')
	.offset(1)
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});
```

- `offset` offset value

get points by offset



### Reader.mean

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.query('http')
	.mean('use')
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});
```
- `field` mean field

mean points


### Reader.sum

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.query('http')
	.sum('use')
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});
```

### Reader.count

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.query('http')
	.count('use')
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});
```
- `count` count field

count points

### Reader.fill

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.query('http')
	.group('status')
	.fill(1)
	.tag('uuid', uuid)
	.mean('value')
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});

```

- `value` fill value

fill `null` value with `fill value`


### Reader.queue

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.query(series)
	.tag('status', '40x')
	.queue();
client.query(series)
	.tag('status', '50x')
	.queue();

client.syncQuery().then(data => {
	console.info(data);
}).catch(error);
```

add reader instance to reader queue


### syncQuery

```js
const Influx = require('simple-influx');
const client = new Influx({
	database: 'mydb'
});
client.query(series)
	.tag('status', '40x')
	.queue();
client.query(series)
	.tag('status', '50x')
	.queue();

client.syncQuery().then(data => {
	console.info(data);
}).catch(error);
```

get all query queue points result


## License

MIT