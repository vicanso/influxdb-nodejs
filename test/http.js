'use strict';
const assert = require('assert');
const HTTP = require('../lib/http');
const _ = require('lodash');
const db = 'vicanso';
describe('HTTP', () => {
  const http = new HTTP([
    {
      host: 'localhost',
      port: 8086,
    }
  ], 'round-robin');

  it('get from backend', done => {
    http.get('/ping').then(res => {
      assert.equal(res.status, 204);
      assert(res.get('X-Influxdb-Version'));
      done();
    }).catch(done);
  });

  it('create database by post', done => {
    http.post('/query', {
      q: `create database ${db}`,
    }).then(res => {
      assert(!_.isEmpty(res.body));
      done();
    }).catch(done);
  });

  it('post data to backend', done => {
    http.post('/write', 'cpu_load_short,host=server01,region=us-west value=0.64', {
      db,
    }).then(res => {
      done();
    }).catch(done);
  });

  it('drop db', function(done) {
    this.timeout(5000);
    http.post('/query', {
      q: `drop database ${db}`,
    }).then(res => {
      assert(!_.isEmpty(res.body));
      done();
    }).catch(done);
  });

  it('set global timeout', done => {
    http.timeout = 0.1;
    assert(http.timeout, 0.1);
    http.get('/query?q=SHOW+SERIES+WHERE+FALSE').then().catch(err => {
      assert.equal(err.code, 'ECONNABORTED');
      http.timeout = 0;
      done();
    });
  });

  it('set single timeout', done => {
    http.get('/query?q=SHOW+SERIES+WHERE+FALSE').timeout(0.1).then().catch(err => {
      assert.equal(err.code, 'ECONNABORTED');
      done();
    });
  });
});

