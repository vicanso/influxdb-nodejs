'use strict';
const assert = require('assert');
const Influx = require('../lib/influx');
const _ = require('lodash');
const db = 'vicanso';
describe('Influx', () => {
  const influx = new Influx({
    servers: [
      {
        host: 'localhost',
        port: 8086,
      }
    ],
    database: db,
  });

  it('query when db is not exists', done => {
    influx.query('select * from cpu_load_short').then(data => {
      assert(data.results[0].error)
      done();
    }).catch(done);
  });

  it('create database', done => {
    influx.queryPost(`create database ${db}`).then(data => {
      assert(!_.isEmpty(data));
      done();
    }).catch(done);
  });

  it('write point', done => {
    influx.write({
      measurement: 'cpu_load_short',
      tags: {
        host: 'server01',
        region: 'us-west',
      },
      fields: {
        value: 0.64,
      },
    }).then(data => {
      done();
    }).catch(done);
  });

  it('query', done => {
    influx.query('select * from cpu_load_short', null, 's').then(data => {
      assert.equal(`${data.results[0].series[0].values[0][0]}`.length, 10);
      assert(data.results[0].series[0]);
      done();
    }).catch(done);
  });

  it('set timeout', done => {
    influx.timeout = 1;
    assert.equal(influx.timeout, 1);
    influx.query('select * from cpu_load_short').then().catch(err => {
      assert.equal(err.code, 'ECONNABORTED');
      influx.timeout = 0;
      done();
    });
  });

  it('drop db', done => {
    influx.query(`drop database ${db}`).then(data => {
      assert(!_.isEmpty(data));
      done();
    }).catch(done);
  });
});


