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
console.info(client.availableServers); //[{"host": "192.168.1.1", "port": 8086}, ...]
```

### unavailableServers

get unavailable servers

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@192.168.1.1:8086,192.168.1.2:8086,192.168.1.3:9086/mydatabase');
console.info(client.unavailableServers); //[{"host": "192.168.1.1", "port": 8086}, ...]
```



### timeout (get/set)

get/set request timeout(ms)


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydatabase');
client.timeout = 1000;
console.info(client.timeout); // 1000
```



### createDatabase

create database, if the database is exists, will throw an error

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.createDatabase().then(() => {
	console.info('create database:mydb success');
}).catch(err => {
	console.error(err);
});
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


### getMeasurements

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.getMeasurements().then(data => {
	console.info(data);
}).catch(err => {
	console.error(err);
});
```

### dropMeasurement

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.dropMeasurement('http').then(data => {
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



### Writer.end

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
client.syncWrite().catch(err => {
	console.error(err);
});
```

### query

get point from the measurement, return Reader instance


- `measurement` get point from the measurement

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const reader = client.query('http');
```




### Reader.tag

set query tag conditions, return Reader instance

- `key` tag name string or {key1: value1, key2: value2}

- `value` tag value string, optional

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
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



### Reader.where

get points by where conditions

- `conditions` string or regexp


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
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




### Reader.group

get points group by tag

- `groupTag` group tag name

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
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




### Reader.limit

get points by limit value

- `count` limit value


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
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




### Reader.slimit

get points by slimit value

- `count` slimit value

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
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




### Reader.desc, Reader.asc

get points sort by time(asc, desc)


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');

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

- `offset` offset value


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');

client.query('http')
	.offset(1)
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});
```


### Reader.mean

mean points

- `field` mean field


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.query('http')
	.mean('use')
	.end()
	.then(data => {
		console.info(data);
	}).catch(err => {
		console.error(err);
	});
```



### Reader.sum

sum points

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
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
const client = new Influx('http://127.0.0.1:8086/mydb');
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

- `value` fill value


```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
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


## License

MIT
