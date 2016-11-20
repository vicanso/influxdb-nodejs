# API

## Influx

### Constructor

- `uri` influxdb connect uri string, eg: `http://user:pass@localhost:port,anotherhost:port,yetanother:port/mydb`

Create an influx instance

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
// two influxdb server
const clusterClient = new Influx('http://user:pass@127.0.0.1:8087,127.0.0.1:8088/mydb');
```

### startHealthCheck

- `ping` health check ping function, [optional]

Detection the backend whether is health

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.startHealthCheck();
// custom ping function
client.startHealthCheck((backend) => {
  // the backend fail if callback with error
  return Promise.resolve();
});
```

### stopHealthCheck

Stop health check

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.startHealthCheck();
setTimeout(() => {
  client.stopHealthCheck();
}, 1000);
```

### availableServers

Get available servers

```js
const Influx = require('influxdb-nodejs');
const uri = 'http://user:pass@192.168.1.1:8086,192.168.1.2:8086,192.168.1.3:9086/mydb';
const client = new Influx(uri);
//[{"host": "192.168.1.1", "port": 8086, "protocol": "http"}, ...]
setTimeout(() => {
  console.info(client.availableServers);
}, 1000);
```

### unavailableServers

Get unavailable servers(If health check ping fail, the backend is unavailable)

```js
const Influx = require('influxdb-nodejs');
const uri = 'http://user:pass@192.168.1.1:8086,192.168.1.2:8086,192.168.1.3:9086/mydb';
const client = new Influx(uri);
//[{"host": "192.168.1.1", "port": 8086, "protocol": "http"}, ...]
setTimeout(() => {
  console.info(client.unavailableServers);
}, 1000);
```

### timeout (get/set)

Get or set request timeout(ms), default is undefined

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
assert(!client.timeout);
client.timeout = 1000;
assert.equal(client.timeout, 1000);
```

### format (get/set)

Set or get query response format type

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.format = 'json';
client.query('http')
  .condition('spdy', 'fast')
  .then(console.info)
  .catch(console.error);
```

### epoch (get/set)

Set or get query epoch

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.epoch = 's';
client.query('http')
  .condition('spdy', 'fast')
  .then(console.info)
  .catch(console.error);
```

### createDatabase

Create database

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.createDatabase().then(() => {
  console.info('create database:mydb success');
});
```

### dropDatabase

Drop database

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.dropDatabase().then(() => {
  console.info('drop database:mydb success');
});
```

### createRetentionPolicy

Create retention policy

- `name` the retention policy name

- `duration` duration, eg: '2h'

- `replication` 1 for single node instances, default is 1 [optional]

- `isDefault` set as default rp, default is false [optional]

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.createRetentionPolicy('two-week', '2w').then(() => {
  console.info('createRetentionPolicy success');
});
```

### updateRetentionPolicy

Update retention policy

- `name` the retention policy name

- `duration` duration, eg: '2h'

- `replication` 1 for single node instances, default is 1 [optional]

- `shardDuration` shard duration, eg: '30m'

- `isDefault` set as default rp, default is false [optional]

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.updateRetentionPolicy('two-week', '2d').then(() => {
  console.info('updateRetentionPolicy success');
});
```


### dropRetentionPolicy

Drop retention policy

- `name` the retention policy name

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.dropRetentionPolicy('two-week').then(() => {
  console.info('dropRetentionPolicy success');
});
```

### showDatabases

Show all databases

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.showDatabases().then((dbs) => {
  assert.equal(dbs.join(','), '_internal,vicanso');
});
```

### showRetentionPolicies

Show retention policies of the database

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.showRetentionPolicies().then((rps) => {
  assert.equal(rps.length, 1);
  assert.equal(rps[0].name, 'autogen');
  // [{"name":"autogen","duration":"0","shardGroupDuration":"168h0m0s","replicaN":1,"default":true}]
  console.info(JSON.stringify(rps));
});
```

### showMeasurements

Show measurements of the database

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.showMeasurements().then((measurements) => {
  assert.equal(measurements.length, 1);
  // ['http']
  console.info(measurements);
});
```

### showTagKeys

- `measurement` the measurement's name, if no measurement, will get all measurement's tag key

Show tag keys of the measurement

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.showTagKeys().then((tagKeys) => {
  assert.equal(tagKeys.length, 2);
  // [{"name":"http","values":[{"key":"method"},{"key":"spdy"},{"key":"type"}]},{"name":"login","values":[{"key":"device"},{"key":"sex"}]}]
  console.info(tagKeys);
});
client.showTagKeys('http').then((tagKeys) => {
  assert.equal(tagKeys.length, 1);
  // [{"name":"http","values":[{"key":"method"},{"key":"spdy"},{"key":"type"}]}]
  console.info(tagKeys);
});
```

### showFieldKeys

Show field keys of the measurement

- `measurement` the measurement's name,  if no measurement, will get all measurement's field key

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.showFieldKeys().then((fieldKeys) => {
  assert.equal(fieldKeys.length, 2);
  // [{"name":"http","values":[{"key":"auth","type":"boolean"},{"key":"size","type":"float"},{"key":"url","type":"string"},{"key":"use","type":"integer"}]},{"name":"login","values":[{"key":"mobile","type":"string"}]}]
  console.info(JSON.stringify(fieldKeys));
});
client.showFieldKeys('http').then((fieldKeys) => {
  assert.equal(fieldKeys.length, 1);
  // [{"name":"http","values":[{"key":"auth","type":"boolean"},{"key":"size","type":"float"},{"key":"url","type":"string"},{"key":"use","type":"integer"}]}]
  console.info(JSON.stringify(fieldKeys));
});
```

### showSeries

Show series of the measurement

- `measurement` the measurement's name,  if no measurement, will get all measurement's fseries

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.showSeries().then((series) => {
  assert.equal(series.length, 2);
  // [ 'http,method=get,spdy=fast,type=2', 'login,device=mobile,sex=male' ]
  console.info(series);
});
client.showSeries('http').then((series) => {
  assert.equal(series.length, 1);
  // [ 'http,method=get,spdy=fast,type=2' ]
  console.info(series);
});
```

### write

Get Writer instance

- `measurement` the measurement's name

- `precision` [optional]

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.write('login')
  .tag({
    device: 'mobile',
    sex: 'male',
  })
  .field({
    mobile: '13800138000',
  }).then(() => {
    console.info('write point success');
  }).catch(err => {
    console.error(err);  
  });
```

### query

Get Reader instance

- `measurement` the measurement's name

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
client.query('http')
  .condition('spdy', 'lightning')
  .set({
    format: 'json',
    epoch: 's',
  })
  .then(data => {
    // {"http":[{"time":1476014599,"auth":null,"method":null,"size":null,"spdy":"lightning","type":null,"url":null,"use":100},{"time":1476014681,"auth":null,"method":null,"size":null,"spdy":"lightning","type":null,"url":null,"use":100}]}
    console.info(data);
  }).catch(err => console.error(err));
```

### writePoint

Simple way for write point

- `measurement` the measurement's name

- `fields` the fields object

- `tags` the tags object [optional]

- `precision` The timestamp precision. 'h', 'm', 's', 'ms', 'u', 'n' [optional]

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://user:pass@127.0.0.1:8086/mydb');
// data: {"time":"2016-10-09T14:00:00Z","auth":null,"code":500,"method":"get","size":null,"spdy":"slow","type":null,"url":null,"use":null}
client.writePoint('http', {
  code: 500,
}, {
  spdy: 'slow',
  method: 'get',
}, 'h').then(() => {
  console.info('complete');
}).catch(err => {
  console.error(err);
});
```

### writeQueueLength

Get the write queue length

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
  status: '40x',
  size: '1K'
});
writer.field({
  code: '400i',
  value: 1
});
writer.field('bytes', 1010);
writer.queue();
assert.equal(client.writeQueueLength, 1);
```

### syncWrite

Sync write queue

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
const writer = client.write('http');
writer.tag('uuid', '1234');
writer.tag({
  status: '40x',
  size: '1K'
});
writer.field({
  code: '400i',
  value: 1
});
writer.field('bytes', 1010);
writer.queue();
client.syncWrite().then(() => {
  console.info('complete sync write queue');
}).catch(err => console.error(err));
```

### queryQueueLength

Get the query queue length

```js
const assert = require('assert');
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.query('http')
  .tag('status', '40x')
  .queue();
client.query('http')
  .tag('status', '50x')
  .queue();
assert.equal(client.queryQueueLength, 2);
```

### syncQuery

Sync query queue

- `format` the point format type 'json', 'csv'

```js
const assert = require('assert');
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
}).catch(err => console.error(err));
```

## Reader

The class extends [influx-ql](https://github.com/vicanso/influx-ql), please read about it first.


### set

Set the option for reader

- `format` the result format type, support 'json', 'csv' and 'default'

- `epoch` the result epoch, support 'n', 'u', 'ms', 's', 'm', 'h'

- `RP start end limit slimit order offset soffset fill` the key for the influx-ql

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.query('http')
  .condition('spdy', 'fast')
  .set('format', 'json')
  .set('epoch', 's')
  .set({
    limit: 10,
    start: '-3h',
  })
  .then(console.info)
  .catch(console.error);
```

### get

Get the option of reader

### queue

Add the reader to the reader's queue

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

## Writer


### tag

Set the write point tag

- `key` the tag key

- `value` the tag value

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
  .then(() => console.info('write point success'))
  .catch(console.error);
```

### field

Set the write point field

- `key` the field key

- `value` the field value

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
  .then(() => console.info('write point success'))
  .catch(console.error);
```


### time

Set the write point timestamp, If you do not specify a timestamp for your data point InfluxDB uses the server’s local nanosecond timestamp in UTC.

- `v` the timestamp

- `precision` the precision, [optional]

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


### queue

Add the writer to the writer's queue, If you do not specify a timestamp for your data point InfluxDB uses the server’s local nanosecond timestamp in UTC. Notice the timestamp must be the same precision.

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
  }).queue();
client.write('http')
  .tag('spdy', 'slow')
  .tag({
    type: '2',
    method: 'get',
  })
  .field('use', 300)
  .field({
    code: 200,
    size: 10 * 1024,
  }).queue();
client.syncWrite().then(() => console.info('write point success'))
  .catch(console.error);
```