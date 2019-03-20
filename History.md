# 3.0.0
  * Improve package scripts.
  * Regenerate documentation using updated doc generation packages.
  * Mocha `--exit` flag required for tests due to `superagent-load-balancer` using `interval`s that cannot be terminated.
  * Added `nyc` as `istanbul` is now deprecated.
  * Updated `debug` from 3.1.0 to 4.1.1.
  * Updated `lodash` from 4.17.10 to 4.17.11.
  * Updated `docdash` from 0.4.0 to 1.0.3.
  * Updated `eslint` from 3.12.2 to 5.15.3.
  * Updated `eslint-config-airbnb` from 13.0.0 to 17.1.0.
  * Updated `eslint-plugin-import` from 2.2.0 to 2.16.0.
  * Updated `eslint-plugin-jsx-a11y` from 2.2.3 to 6.2.1.
  * Updated `eslint-plugin-react` from 6.8.0 to 7.12.4.
  * Updated `jsdoc` from 3.4.3 to 3.5.5.
  * Updated `mocha` from 3.5.3 to 6.0.2.
  * Removed `istanbul`.

# 2.11.0
  * Support addPlugin function

# 2.10.0
  * Support tz(timezone) function

# 2.9.0
  * Support basic authentication, #29

# 2.8.0
  * Support multi query #27

# 2.7.6
  * Fix conversion of multiple spaces in field/tag (jakubknejzlik)

# 2.7.5
  * When queue is empty, `syncWrite` and `syncQuery` return `Promise.resolve()`

# 2.7.4
  * Support update function

# 2.7.3
  * Support abbreviation for fields type

# 2.7.2
  * Add `invalid-fields` and `invalid-tags` event

# 2.7.0
  * Add `sync` event and change `queue` event's data
  * Judge whether `Buffer.from` is equal to `Uint8Array.from` to avoid throw TypeError, #17
  * Add `addAlgorithm` function to support custom load balance
  * Use `epoch` in influx.query function #18

# 2.6.0
  * Use `nano-seconds` to get the time stamp
  * Update `influx-ql` to support `alias` function

# 2.5.1
  * Convert timestamp to string in `time` function
  * Check the timestamp in `queue` function of writer

# 2.5.0
  * Add `subQuery` function for `subqueries` in influxdb 1.2.0
  * Add `clean` function to clean the query options

# 2.4.5
  * Improve `startHealthCheck` function for support the check `interval` setting
  * Use `docker-compose` for test
  * Update `shard duration` test for influxdb 1.2 (It can't be less than 1h in version 1.2)
  * Imporve api docs

# 2.4.4
  * Add `database` getter for client

# 2.4.3
  * Update `influx-ql` for sort `field` and `functions`

# 2.4.2
  * Fixing bug so strings can end in i(Snipa22)
  * Update `superagent-load-balancer` to 2.x
  * Update `influx-ql` to support `where` function
