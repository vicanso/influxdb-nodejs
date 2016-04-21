'use strict';
const assert = require('assert');
const Writer = require('../lib/writer');
const Reader = require('../lib/reader');
const Influx = require('../lib/influx');
const _ = require('lodash');

describe('Writer', () => {
  const influx = new Influx({
    servers: [
      {
        host: '127.0.0.1',
        port: 8086,
      }
    ],
    database: 'mydb',
  });

  it('create database', done => {
    influx.query('create database if not exists mydb').then(res => {
      assert(!_.isEmpty(res.body));
      done();
    }).catch(done);
  });


  it('write point', done => {
    const writer = new Writer(influx);
    writer.measurement = 'http'
    writer.tag({
      spdy: 'fast',
      type: '2',
      method: 'get',
    })
    .field({
      use: 500,
      size: 11 * 1024,
      code: 200
    }).then(data => {
      const reader = new Reader(influx);
      reader.measurement = 'http';
      return reader.condition('spdy', 'fast');
    }).then(data => {
      assert.equal(data.results[0].series[0].values.length, 1);
      done();
    }).catch(done);
  });

  it('drop db', done => {
    influx.query('drop database mydb').then(res => {
      assert(!_.isEmpty(res.body));
      done();
    }).catch(done);
  });

});