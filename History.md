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
