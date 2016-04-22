'use strict';
const _ = require('lodash');
const assert = require('assert');
const util = require('../lib/util');
describe('util', () => {
  it('now', () => {
    const now = util.now();
    assert(_.isString(now));
    assert.equal(now.length, 19);
  });

  it('get error', () => {
    const e = new Error('400');
    e.response = {
      body: {
        error: 'Params is wrong'
      },
      error: {
        method: 'get',
        path: '/query',
        status: 400
      }
    };
    const newError = util.getError(e);
    assert.equal(newError.message, 'Params is wrong');
    assert.equal(newError.method, 'get');
    assert.equal(newError.path, '/query');
    assert.equal(newError.status, 400);
  });
});