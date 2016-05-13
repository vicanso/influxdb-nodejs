'use strict';
const assert = require('assert');
const Reader = require('../lib/reader');
const Influx = require('../lib/influx');
const _ = require('lodash');

describe('Reader', () => {
  const influx = new Influx({
    servers: [
      {
        host: '127.0.0.1',
        port: 8086,
      }
    ],
    database: 'mydb',
  });

  it('write point', done => {
    influx.query('create database if not exists mydb').then(() => {
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
    reader.condition("type = '4'");
    reader.queue();
    assert.equal(set.size, 1);
    done();
  });

  it('set format type:json', done => {
    const reader = new Reader(influx);
    reader.measurement = 'http';
    reader.format = 'json';
    reader.then(data => {
      assert(data.http);
      assert.equal(data.http.length, 3);
      done();
    }).catch(done);
  });

  it('set format type:csv', done => {
    const reader = new Reader(influx);
    reader.measurement = 'http';
    reader.format = 'csv';
    reader.then(data => {
      assert(data.http);
      done();
    }).catch(done);
  });

  it('drop db', done => {
    influx.query('drop database mydb').then(data => {
      assert(!_.isEmpty(data));
      done();
    }).catch(done);
  });
});