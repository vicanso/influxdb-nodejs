'use strict';

const Influx = require('..');

const client = new Influx('http://127.0.0.1:8086/mydb');

client.createDatabase().then(() => {
  const tags = {
    method: 'GET',
    spdy: '1',
    type: '2',
  };
  return client.write('http')
    .tag(tags)
    .field({
      use: 500,
      status: 200,
    });
}).then(() => {
  const conditons = {
    method: 'GET',
  };
  return client.findOneAndUpdate('http', conditons, {
    status: 204,
  });
});
