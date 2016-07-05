'use strict';
const assert = require('assert');
const HTTP = require('../lib/http');
const _ = require('lodash');
const request = require('superagent');
const db = 'vicanso';
describe('HTTP', () => {
  const http = new HTTP([
    {
      host: '127.0.0.1',
      port: 8086,
    }
  ], (backend, cb) => {
    const url = `${backend.protocol || 'http'}://${backend.host}:${backend.port || 80}/query?q=SHOW+SERIES+WHERE+FALSE`;
    request.get(url).end(cb);
  });

  it('get from backend', done => {
    http.get('/query?q=SHOW+SERIES+WHERE+FALSE').then(res => {
      assert(!_.isEmpty(res.body));
      done();
    }).catch(done);    
  });

  it('create database by get', done => {
    http.get('/query', {
      q: `create database if not exists ${db}`,
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

  it('drop db', done => {
    http.get('/query', {
      q: `drop database ${db}`,
    }).then(res => {
      assert(!_.isEmpty(res.body));
      done();
    }).catch(done);
  });

  it('set global timeout', done => {
    http.timeout = 1;
    assert(http.timeout, 1);
    http.get('/query?q=SHOW+SERIES+WHERE+FALSE').then().catch(err => {
      assert.equal(err.code, 'ECONNABORTED');
      http.timeout = 0;
      done();
    });
  });

  it('set single timeout', done => {
    http.get('/query?q=SHOW+SERIES+WHERE+FALSE').timeout(1).then().catch(err => {
      assert.equal(err.code, 'ECONNABORTED');
      done();
    });
  });
});
