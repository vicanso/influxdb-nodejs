'use strict';
const _ = require('lodash');
const Influx = require('..');
const client = new Influx('http://127.0.0.1:8086/simulate');

function getBase() {
  const hours = (new Date()).getHours();
  return [1, 1.2, 1.4, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 5, 5, 4, 3.5, 4, 5, 6, 6, 7, 8, 9, 10, 8, 3][hours];
}

function getRandomData(arr) {
  const v = _.random(0, 99);
  return _.find(arr, item => v < item.v);
}

function getRandomHTTPCode() {
  const codeList = [
    {
      v: 85,
      code: 200,
    },
    {
      v: 90,
      code: 304,
    },
    {
      v: 94,
      code: 400,
    },
    {
      v: 98,
      code: 500,
    },
    {
      v: 100,
      code: 502,
    },
  ];
  const item = getRandomData(codeList);
  return item.code;
}

function getRandomHTTPUse() {
  const v = _.random(0, 99);
  const useList = [
    {
      v: 80,
      ms: 300,
    },
    {
      v: 90,
      ms: 1000,
    },
    {
      v: 96,
      ms: 3000,
    },
    {
      v: 100,
      ms: 6000,
    },
  ];
  const index = _.findIndex(useList, item => v < item.v);
  const getUse = (i) => {
    return _.get(useList, `[${i}].ms`, 0);
  };
  return _.random(getUse(index - 1), getUse(index));
}

function getRandomHTTPMethod() {
  const methodList = [
    {
      v: 80,
      method: 'GET',
    },
    {
      v: 90,
      method: 'POST',
    },
    {
      v: 95,
      method: 'PUT',
    },
    {
      v: 98,
      method: 'PATCH',
    },
    {
      v: 100,
      method: 'DELETE',
    },
  ];
  const item = getRandomData(methodList);
  return item.method;
}

function simulateClientRequest() {
  const code = getRandomHTTPCode();
  const use = getRandomHTTPUse();
  const tags = {
    method: getRandomHTTPMethod(),
    spdy: _.sortedIndex([300, 1000, 3000, 6000], use),
    type: code / 100 | 0,
  };
  const fields = {
    code,
    use,
  };
  const interval = _.random(0, 10 / getBase() * 10) * 1000;
  client.write('request')
    .tag(tags)
    .field(fields)
    .then(() => {
      // console.info('simulateClientRequest success');
      setTimeout(simulateClientRequest, interval);
    }).catch(err => {
      console.error(err);
      setTimeout(simulateClientRequest, interval);
    });
}


function simulateClientLogin() {
  const account = _.shuffle('abcdefghijklnmopgrstuvwxyz'.split('')).join('').substring(0, 5);
  const interval = _.random(0, 10 / getBase() * 120) * 1000;
  client.write('login')
    .tag({
      type: _.sample(['vip', 'member', 'member', 'member']),
    })
    .field({
      account,
    })
    .then(() => {
      setTimeout(simulateClientLogin, interval);
    }).catch(err => {
      console.error(err);
      setTimeout(simulateClientLogin, interval);
    });
}

client.createDatabaseNotExists().then(() => {
  simulateClientRequest();
  simulateClientLogin()
});

