'use strict';
const assert = require('assert');
const Reader = require('../lib/reader');
const Influx = require('../lib/influx');
const _ = require('lodash');
const db = 'vicanso';
describe('Reader', () => {
  const influx = new Influx({
    servers: [
      {
        host: 'localhost',
        port: 8086,
      }
    ],
    database: db,
  });

  it('write point', done => {
    influx.createDatabase(db).then(() => {
      return influx.write([
        {
          measurement: 'http',
          tags: {
            spdy: 'slow',
            type: '2',
            method: 'get',
          },
          fields: {
            use: 5000,
            size: 10 * 1024,
            code: 200
          },
        },
        {
          measurement: 'http',
          tags: {
            spdy: 'fast',
            type: '3',
            method: 'post',
          },
          fields: {
            use: 1000,
            size: 15 * 1024,
            code: 304
          },
        },
        {
          measurement: 'http',
          tags: {
            spdy: 'normal',
            type: '4',
            method: 'get',
          },
          fields: {
            use: 3000,
            size: 20 * 1024,
            code: 400
          },
        },
      ]);
    })
    .then(res => {
      done();
    }).catch(done);
  });

  it('toString', () => {
    const reader = new Reader(influx);
    reader.measurement = 'http';
    reader.condition('spdy', '1');
    assert.equal(reader.toString(), 'select * from "http" where "spdy" = \'1\'');
  });

  it('query point', done => {
    const reader = new Reader(influx);
    reader.measurement = 'http';
    reader.then(data => {
      assert.equal(data.results[0].series[0].values.length, 3);
      done();
    }).catch(done);
  });

  it('query point by condition', done => {
    const reader = new Reader(influx);
    reader.measurement = 'http';
    reader.condition('type', '4');
    reader.then(data => {
      assert.equal(data.results[0].series[0].values.length, 1);
      done();
    }).catch(done);
  });

  it('query queue', done => {
    const set = new Set();
    const reader = new Reader(influx, set);
    reader.measurement = 'http';
    reader.condition('"type" = \'4\'');
    reader.queue();
    assert.equal(set.size, 1);
    done();
  });

  it('set format type:json', done => {
    const reader = new Reader(influx);
    reader.measurement = 'http';
    reader.set('format', 'json');
    reader.then(data => {
      assert(data.http);
      assert.equal(data.http.length, 3);
      _.forEach(data.http, item => {
        const keys = _.keys(item).sort();
        assert.equal(keys.join(','), 'code,method,size,spdy,time,type,use');
      });
      done();
    }).catch(done);
  });

  it('set format type:csv', done => {
    const reader = new Reader(influx);
    reader.measurement = 'http';
    reader.set('format', 'csv');
    reader.then(data => {
      const arr = data.http.split('\n');
      assert.equal(arr.length, 4);
      assert.equal(arr[0], 'time,code,method,size,spdy,type,use');
      done();
    }).catch(done);
  });

  it('drop db', function(done) {
    this.timeout(5000);
    influx.dropDatabase(db).then(data => {
      assert(!_.isEmpty(data));
      done();
    }).catch(done);
  });
});