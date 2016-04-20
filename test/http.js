'use strict';
const assert = require('assert');
const HTTP = require('../lib/http');
const _ = require('lodash');

describe('HTTP', () => {
  const http = new HTTP([
    {
      host: '127.0.0.1',
      port: 8086,
    }
  ]);

  it('get from backend', done => {
    http.get('/query?q=SHOW+SERIES+WHERE+FALSE').then(data => {
      assert(data)
      done();
    }).catch(done);    
  });

  it('create database by get', done => {
    http.get('/query', {
      q: 'create database if not exists mydb',
    }).then(data => {
      assert(data);
      done();
    }).catch(done);
  });

  it('post data to backend', done => {
    http.post('/write', 'cpu_load_short,host=server01,region=us-west value=0.64 1434055562000000000', {
      db: 'mydb'
    }).then(data => {
      console.dir(data);
      done();
    }).catch(done);
  });
});
