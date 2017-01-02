'use strict';
const assert = require('assert');
const Writer = require('../lib/writer');
const Reader = require('../lib/reader');
const Influx = require('../lib/influx');
const _ = require('lodash');
const db = 'vicanso';
describe('Writer', () => {
  const delay = (ms) => {
    return new Promise(resolve => {
      setTimeout(resolve, ms).unref();
    });
  };
  const influx = new Influx({
    servers: [
      {
        host: 'localhost',
        port: 8086,
      }
    ],
    database: db,
  });

  it('create database', done => {
    influx.createDatabase(db).then(data => {
      assert(!_.isEmpty(data));
      done();
    }).catch(done);
  });

  it('write point', done => {
    const writer = new Writer(influx);
    writer.measurement = 'http'
    assert.equal(writer.measurement, 'http');
    writer.tag({
      spdy: 'fast',
      type: '2',
      route: null,
    })
    .tag('method', 'get')
    .field({
      use: '500i',
      size: 11 * 1024,
      url: '/user/session',
      auth: 'T',
    })
    .field('code', 400)
    .then(() => {
      const reader = new Reader(influx);
      reader.measurement = 'http';
      return reader.condition('spdy', 'fast');
    })
    .then(data => {
      const values = data.results[0].series[0].values;
      assert.equal(values.length, 1);
      assert.equal(values[0][1], true);
      assert.equal(values[0][8], 500);
      done();
    }).catch(done);
  });

  it('write point to test-ql measurement', done => {
    const measurement = 'test-ql';
    const writer = new Writer(influx);
    writer.measurement = measurement;
    writer.tag({
      'location dc': 'gd gz',
    })
    .field('city,name', 'gz,ch')
    .field('my nick', 'tree xie')
    .then(() => {
      return delay(100);
    })
    .then(() => {
      const reader = new Reader(influx);
      reader.measurement = measurement;
      return reader;
    })
    .then(data => {
      const series = data.results[0].series[0];
      assert.equal(series.columns.join(','), 'time,city,name,location dc,my nick');
      const arr = series.values[0];
      arr.shift();
      assert.equal(arr.join(','), 'gz,ch,gd gz,tree xie');
      done();
    }).catch(done);
  });

  it('write point with time', done => {
    const ms = Date.now();
    const us = `${Math.ceil(process.hrtime()[1] / 1000)}`;
    const ns = `${ms}${_.padStart(us, '6', '0')}`;
    const writer = new Writer(influx);
    writer.measurement = 'http';
    writer.tag('spdy', 'lightning')
      .field('use', '100i')
      .time(ns)
      .then(() => {
        return delay(100);
      })
      .then(() => {
        const reader = new Reader(influx);
        reader.measurement = 'http';
        return reader.condition('spdy', 'lightning');
      })
      .then(data => {
        assert.equal(data.results[0].series[0].values.length, 1);
        done();
      }).catch(done);
  });

  it('write point with time and precision', done => {
    const writer = new Writer(influx);
    writer.measurement = 'http';
    assert.equal(writer.precision, undefined);
    writer.precision = 'ms';
    assert.equal(writer.precision, 'ms');
    writer.tag('usePrecision', 'true')
      .field('use', '100i')
      .time(1463413422809)
      .then(() => {
        return delay(100);
      })
      .then(() => {
        const reader = new Reader(influx);
        reader.measurement = 'http';
        return reader.condition('usePrecision', 'true');
      })
      .then(data => {
        assert.equal(data.results[0].series[0].values.length, 1);
        assert.equal(new Date(data.results[0].series[0].values[0][0]).getTime(), 1463413422809);
        done();
      }).catch(done);
  });

  it('write queue', done => {
    const set = new Set();
    const writer = new Writer(influx, (data) => {
      set.add(data);
    });
    writer.measurement = 'http';
    writer.tag('spdy', 'fast');
    writer.field('use', '200i');
    writer.queue();
    for (let item of set) {
      assert.equal(item.measurement, 'http');
      assert.equal(item.tags.spdy, 'fast');
      assert.equal(item.fields.use, '200i');
      // ns
      assert.equal(item.time.length, 19);
    }
    assert.equal(set.size, 1);
    done();
  });

  it('drop db', function(done) {
    this.timeout(5000);
    influx.dropDatabase(db).then(data => {
      assert(!_.isEmpty(data));
      done();
    }).catch(done);
  });
});
