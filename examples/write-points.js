'use strict';
const _ = require('lodash');
const Influx = require('..');
const client = new Influx('http://127.0.0.1:8086/mydb');
client.createDatabaseNotExists().then(() => {
});
function writePoint(measurement) {
  client.write(measurement)
    .tag({
      type: _.sample(['1', '2', '3', '4', '5']),
      spdy: _.sample(['0', '1', '2', '3']),
      method: _.sample(['get', 'post', 'put', 'delete']),
    })
    .field({
      code: _.random(100, 600),
      use: _.random(30, 3000),
    }).then(data => {
      console.info(`write point to ${measurement} success`);
      setTimeout(() => {
        writePoint(measurement);
      }, _.random(1000, 10 * 1000));
    }).catch(err => {
      console.error(err);
    });
}

client.createDatabaseNotExists().then(data => {
  setTimeout(() => {
    writePoint('http');
  }, _.random(1000, 10 * 1000));
  setTimeout(() => {
    writePoint('ajax');
  }, _.random(1000, 10 * 1000));
});




