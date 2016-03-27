'use strict';
const InfluxQL = require('./influx-ql');
const internal = require('./internal');
class Reader extends InfluxQL {
  constructor(client, measurement) {
    super();
    const internalData = internal(this);
    internalData.client = client;
    this.measurement(measurement);
  }
  end() {
    const q = this.q();
    return internal(this).client.influxQuery(q);
  }
  queue() {
    internal(this).client.queue(this);
  }
}

module.exports = Reader;
