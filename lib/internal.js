'use strict';

const map = new WeakMap();

module.exports = function internal(object) {
  if (!map.has(object)) {
    map.set(object, {});
  }
  return map.get(object);
};
