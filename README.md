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

[API](https://vicanso.github.io/influxdb-nodejs/Client.html)

Query influxdb with multi where condition

```js
const Influx = require('influxdb-nodejs');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.query('http')
  .condition('spdy', '1')
  .condition('method', ['GET', 'POST'])
  .condition('use', 300, '>=')
  .then(console.info)
  .catch(console.error);
// => influx ql: select * from "http" where "spdy" = '1' and "use" >= 300 and ("method" = 'GET' or "method" = 'POST')
```

Write points to influxdb in queue

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


## Comparison

- `influx` It's complex for me. Before developing this module, I used influx, which was not straightforward; and its batch function can not be saved as queue. What's more, the function of query is too simple, just like I write influx ql.

- `influent` I have never used this module, but I have read its API. In my opinion, this module is not so convenient.

## License

MIT
