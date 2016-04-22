'use strict';
const assert = require('assert');
const Client = require('..');

describe('Client:singleton', () => {
  const client = new Client('http://127.0.0.1:8086,127.0.0.1:8087/mydb');

  it('init', done => {
    setTimeout(done, 1500);
  })

  it('get available servers', () => {
    assert.equal(client.availableServers.length, 1);
    assert.equal(client.availableServers[0].port, 8086);
  });

  it('get unavailable servers', () => {
    assert.equal(client.unavailableServers.length, 1);
    assert.equal(client.unavailableServers[0].port, 8087);
  });

  it('create database if not exists', done => {
    client.createDatabaseNotExists().then(data => {
      done();
    }).catch(done);
  });

  it('write point', done => {
    client.write('http')
      .tag({
        spdy: 'fast',
        type: '2',
        method: 'get',
      })
      .field({
        use: 300,
        code: 200,
        size: 10 * 1024,
      })
      .then(data => {
        done();
      }).catch(done);
  });

  it('write point queue', () => {
    client.write('http')
      .tag({
        spdy: 'fast',
      })
      .field({
        use: 200,
      })
      .queue();
    assert.equal(client.writeQueueLength, 1);
  });

  it('sync write queue', done => {
    client.syncWrite().then(data => {
      done();
    }).catch(done);
  });

  it('query point', done => {
    client.query('http')
      .condition('spdy', 'fast')
      .then(data => {
        assert.equal(data.results[0].series[0].values.length, 2);
        done();
      }).catch(done);
  });
  
  it('drop database', done => {
    client.dropDatabase().then(() => {
      done();
    }).catch(done);
  });
});