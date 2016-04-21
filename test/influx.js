'use strict';
const assert = require('assert');
const Influx = require('../lib/influx');
const _ = require('lodash');

describe('Influx', () => {
  const influx = new Influx({
    servers: [
      {
        host: '127.0.0.1',
        port: 8086,
      }
    ],
    database: 'mydb',
    epoch: 's'
  });

  it('query when db is not exists', done => {
    influx.query('select * from cpu_load_short').then(res => {
      assert(res.body.results[0].error)
      done();
    }).catch(done);
  });

  it('create database', done => {
    influx.query('create database if not exists mydb').then(res => {
      assert(!_.isEmpty(res.body));
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
        value: '0.64',
      },
    }).then(res => {
      done();
    }).catch(done);
  });

  it('query', done => {
    influx.query('select * from cpu_load_short').then(res => {
      assert(res.body.results[0].series[0]);
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


