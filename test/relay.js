'use strict';

const assert = require('assert');
const Influx = require('..');
const client8086 = new Influx('http://127.0.0.1:8086/relay');
const client8087 = new Influx('http://127.0.0.1:8087/relay');
const relayClient = new Influx('http://127.0.0.1:9096,127.0.0.1:9097/relay');
relayClient.startHealthCheck();
describe('Influxdb-relay', () => {
  it('init', (done) => {
    client8086.createDatabase()
      .then(() => client8087.createDatabase())
      .then(() => done())
      .catch(done);
  });
  it('write point', (done) => {
    relayClient.write('http')
      .tag({
        spdy: '1',
        method: 'GET',
      })
      .field({
        use: 300,
        url: '/users/me',
      })
      .then(() => {
        return new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      }).then(() => {
        return client8086.query('http');
      }).then((data) => {
        assert.equal(data.results[0].series[0].values.length, 1);
        return client8087.query('http');
      }).then((data) => {
        assert.equal(data.results[0].series[0].values.length, 1);
        done();
      }).catch(done);
  });

  it('drop database', function(done) {
    this.timeout(10 * 1000);
    client8086.dropDatabase()
      .then(() => client8087.dropDatabase())
      .then(() => done())
      .catch(done);
  });
});
