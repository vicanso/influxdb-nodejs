'use strict';
const assert = require('assert');
const Client = require('..');

describe('Client:singleton', () => {
  const client = new Client('http://127.0.0.1:8086,127.0.0.1:8087/mydb');
  client.startHealthCheck();
  it('init', done => {
    setTimeout(done, 1500);
  });

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
        type: '3'
      })
      .field({
        use: 200,
      })
      .queue();
    assert.equal(client.writeQueueLength, 1);
  });

  it('write point', done => {
    client.writePoint('http', {
      use: 301,
    }, {
      spdy: 'faster',
    }).then(data => {
      return client.query('http')
        .condition('spdy', 'faster');
    }).then(data => {
      assert.equal(data.results[0].series[0].values[0][4], 'faster');
      done();
    }).catch(done);
  });

  it('write point with precision', done => {
    client.writePoint('http', {
      use: 404,
    }, {
      spdy: 'faster',
    }, 'ms')
    .then(data => {
      return client.query('http')
        .condition('spdy', 'faster');
    }).then(data => {
      assert.equal(data.results[0].series[0].values[0][4], 'faster');
      done();
    }).catch(done);
  });

  it('sync write queue', done => {
    client.syncWrite().then(data => {
      done();
    }).catch(done);
  });

  it('get point queue', () => {
    client.query('http')
      .condition('type', '2')
      .queue();
    client.query('http')
      .condition('type', '3')
      .queue();
    assert.equal(client.queryQueueLength, 2);
  });

  it('sync query queue', done => {
    client.syncQuery().then(data => {
      assert.equal(data.results.length, 2);
      assert.equal(data.results[0].series[0].values[0][5], '2');
      assert.equal(data.results[1].series[0].values[0][5], '3');
      done();
    }).catch(done);
  });

  it('sync query queue, format:json', done => {
    client.query('http')
      .condition('type', '2')
      .queue();
    client.query('http')
      .condition('type', '3')
      .queue();
    client.syncQuery('json').then(data => {
      assert(data.http);
      assert.equal(data.http.length, 2);
      done();
    }).catch(done);
  });

  it('sync query queue, format:csv', done => {
    client.query('http')
      .condition('type', '2')
      .queue();
    client.query('http')
      .condition('type', '3')
      .queue();
    client.syncQuery('csv').then(data => {
      assert(data.http);
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

  it('query point by tag', done => {
    client.query('http')
      .tag('spdy', 'fast')
      .then(data => {
        assert.equal(data.results[0].series[0].values.length, 2);
        done();
      }).catch(done);
  });

  it('query point by field', done => {
    client.query('http')
      .field('use', 301)
      .then(data => {
        assert.equal(data.results[0].series[0].values.length, 1);
        done();
      }).catch(done);
  });
  
  it('set timeout', done => {
    client.timeout = 1;
    assert.equal(client.timeout, 1);
    client.query('http')
      .then()
      .catch(err => {
        assert.equal(err.code, 'ECONNABORTED');
        client.timeout = 0;
        done();
      });
  });

  it('show databases', done => {
    client.showDatabases().then(data => {
      assert(data.results[0].series[0].values.length);
      done();
    }).catch(done);
  });

  it('show retention policies', done => {
    client.showRetentionPolicies().then(data => {
      assert(data.results[0].series[0].values.length);
      done();
    }).catch(done);
  });

  it('show measurements', done => {
    client.showMeasurements().then(data => {
      assert(data.results[0].series[0].values.length);
      done();
    }).catch(done);
  });

  it('show tag keys of measurements', done => {
    client.showTagKeys('http').then(data => {
      assert(data.results[0].series[0].values.length);
      done();
    }).catch(done);
  });

  it('show tag keys of all measurements', done => {
    client.showTagKeys().then(data => {
      assert(data.results[0].series[0].values.length);
      done();
    }).catch(done);
  });

  it('show field keys of measurements', done => {
    client.showFieldKeys('http').then(data => {
      assert(data.results[0].series[0].values.length);
      done();
    }).catch(done);
  });

  it('show field keys of all measurements', done => {
    client.showFieldKeys().then(data => {
      assert(data.results[0].series[0].values.length);
      done();
    }).catch(done);
  });

  it('show series', done => {
    client.showSeries().then(data => {
      assert(data.results[0].series[0].values.length);
      done();
    }).catch(done);
  });

  it('drop database', done => {
    client.stopHealthCheck();
    client.dropDatabase().then(() => {
      done();
    }).catch(done);
  });
});


describe('Client:Auth', () => {
  const client = new Client('http://vicanso:mypwd@127.0.0.1:8085/mydb');
  
  client.startHealthCheck();
  it('init', done => {
    setTimeout(done, 1500);
  });

  it('create user', done => {
    client.queryRaw('create user vicanso with password \'mypwd\' with all privileges').then(data => {
      done();
    }).catch(err => {
      done();
    });
  });

  it('on auth client', done => {
    const tmp = new Client('http://127.0.0.1:8085/mydb');
    tmp.createDatabaseNotExists().then(() => {
      done(new Error('no auth client can not create database'));
    }).catch(err => {
      assert.equal(err.status, 401);
      done();
    });
  });

  it('create database if not exists', done => {
    client.createDatabaseNotExists().then(() => {
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

  it('query point', done => {
    client.query('http')
      .tag({
        spdy: 'fast',
        type: '2',
      })
      .then(data => {
        assert(data.results[0].series[0].values.length);
        done();
      }).catch(done);
  });

  it('drop database', done => {
    client.dropDatabase().then(() => {
      done();
    }).catch(done);
  });
});
