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
