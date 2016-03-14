# influxdb-nodejs 
	
[![Build Status](https://travis-ci.org/vicanso/influxdb-nodejs.svg?branch=master)](https://travis-ci.org/vicanso/influxdb-nodejs)

An [InfluxDB](https://influxdata.com/) Node.js Client

## Installation

```js
$ npm install influxdb-nodejs
```

## Examples
	
View the [./examples](examples) directory for working examples. 


## API

### Constructor

```js
const Influx = require('influxdb-nodejs');
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


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@localhost:port,anotherhost:port,yetanother:port/mydatabase');
```




### createDatabase

```js
const Influx = require('influxdb-nodejs');
const client = new Influx({
	database: 'mydb'
});
client.createDatabase().then(() => {
	console.info('create database:mydb success');
}).catch(err => {
	console.error(err);
});
```

### createDatabaseNotExists

```js
const Influx = require('influxdb-nodejs');
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

drop data when is exists


```js
const Influx = require('influxdb-nodejs');
const client = new Influx({
	database: 'mydb'
});
client.dropDatabase().then(() => {
	console.info('drop database:mydb success');
}).catch(err => {
	console.error(err);
});
```


### getMeasurements

```js
const Influx = require('influxdb-nodejs');
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
const Influx = require('influxdb-nodejs');
const client = new Influx({
	database: 'mydb'
});
client.dropMeasurement('http').then(data => {
	console.info(data);
}).catch(err => {
	console.error(err);
});
```

### availableServers

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@192.168.1.1:8086,192.168.1.2:8086,192.168.1.3:9086/mydatabase');
console.dir(client.availableServers); //[{"host": "192.168.1.1", "port": 8086}, ...]
```

### unavailableServers

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@192.168.1.1:8086,192.168.1.2:8086,192.168.1.3:9086/mydatabase');
console.dir(client.unavailableServers); //[{"host": "192.168.1.1", "port": 8086}, ...]
```

### timeout (get/set)

get/set request timeout


```js
const Influx = require('influxdb-nodejs');
const client = new Influx({
	username: 'root',
	password: 'root',
	timePrecision: 'ms',
	host: 'localhost',
	port: 8086,
	protocol: 'http',
	database: 'mydb'
});
client.timeout = 1000;
console.info(client.timeout); // 1000
```




### write

write point to the series, return Writer instance


```js
const Influx = require('influxdb-nodejs');
const client = new Influx({
	database: 'mydb'
});
const writer = client.write('http');
```

- `series` write point to the series



### Writer.tag

set point tags, return Writer instance


```js
const Influx = require('influxdb-nodejs');
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


### Writer.value

```js
const Influx = require('influxdb-nodejs');
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

write point to server, return promise


```js
const Influx = require('influxdb-nodejs');
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



### Writer.queue

add writer instance to write queue, it will sync when call syncWrite


```js
const Influx = require('influxdb-nodejs');
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



### writeQueueLength

get write queue length


```js
const Influx = require('influxdb-nodejs');
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
console.info(client.writeQueueLength); // 2
```


### syncWrite

```js
const Influx = require('influxdb-nodejs');
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
client.syncWrite().catch(err => {
	console.error(err);
});
```

### query

get point from the series, return Reader instance


```js
const Influx = require('influxdb-nodejs');
const client = new Influx({
	database: 'mydb'
});
const reader = client.query('http');
```

- `series` get point from the series



### Reader.tag

set query tag conditions, return Reader instance


```js
const Influx = require('influxdb-nodejs');
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



### Reader.where

get points by where conditions


```js
const Influx = require('influxdb-nodejs');
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



### Reader.group

get points group by tag


```js
const Influx = require('influxdb-nodejs');
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



### Reader.limit

get points by limit value


```js
const Influx = require('influxdb-nodejs');
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



### Reader.slimit

get points by slimit value


```js
const Influx = require('influxdb-nodejs');
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



### Reader.desc, Reader.asc

get points sort by time(asc, desc)


```js
const Influx = require('influxdb-nodejs');
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



### Reader.offset

get points by offset


```js
const Influx = require('influxdb-nodejs');
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




### Reader.mean

mean points


```js
const Influx = require('influxdb-nodejs');
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



### Reader.sum

sum points

```js
const Influx = require('influxdb-nodejs');
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

count points


```js
const Influx = require('influxdb-nodejs');
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


### Reader.fill

fill `null` value with `fill value`


```js
const Influx = require('influxdb-nodejs');
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



### Reader.queue

add reader instance to reader queue


```js
const Influx = require('influxdb-nodejs');
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
}).catch(err => {
	console.error(err);
});
```



### syncQuery

get all query queue points result


```js
const Influx = require('influxdb-nodejs');
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



### queryQueueLength

get query queue length


```js
const Influx = require('influxdb-nodejs');
const client = new Influx({
	database: 'mydb'
});
client.query(series)
	.tag('status', '40x')
	.queue();
client.query(series)
	.tag('status', '50x')
	.queue();
console.info(client.queryQueueLength); // 2
```


## License

MIT
