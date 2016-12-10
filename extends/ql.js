// The file is just for API
/**
 * Influx QL
 */
class QL {
  /**
   * Set the query condition
   * @param  {String} key - The key of condition
   * @param  {Any} value - The value of condition
   * @param  {String} operator - The condition operator
   * @return {Reader}
   * @since 2.2.0
   * @example
   * const ql = client.query('http')
   *   .condition('spdy', 'fast')
   *   .toString();
   * console.info(ql);
   * // => select * from "http" where "spdy" = 'fast'
   * @example
   * const ql = client.query('http')
   *   .condition('use', 300, '>=')
   *   .toString();
   * console.info(ql);
   * // => select * from "http" where "use" >= 300
   * @example
   * const ql = client.query('http')
   *   .condition({spdy: 'fast'})
   *   .toString();
   * console.info(ql);
   * // => select * from "http" where "spdy" = 'fast'
   * @example
   * const ql = client.query('http')
   *   .condition({spdy: 'fast'})
   *   .condition("method = 'GET'")
   *   .toString();
   * console.info(ql);
   * // => select * from "http" where "spdy" = 'fast' and method = 'GET
   * @example
   * const ql = client.query('http')
   *   .condition("method = 'GET' or spdy = 'fast'")
   *   .toString();
   * console.info(ql);
   * // => select * from "http" where method = 'GET' or spdy = 'fast'
   */
  condition(key, value, operator) {
    // Get the code from influx-ql
  }
  /**
   * Add the field for the query
   * @param {String} field - The field
   * @return {Reader}
   * @since 2.2.0
   * @example
   * const ql = client.query('http')
   *   .addField('spdy')
   *   .toString();
   * console.info(ql);
   * // => select "spdy" from "http"
   * @example
   * const ql = client.query('http')
   *   .addField('spdy', 'use')
   *   .toString();
   * console.info(ql);
   * // => select "spdy","use" from "http"
   */
  addField(field) {
    // Get the code from influx-ql
  }
  /**
   * Set the tag condition
   * @param  {String} key - The key of tag
   * @param  {String} value - The key of value
   * @return {Reader}
   * @since 2.2.0
   * @example
   * const ql = client.query('http')
   *   .tag('method', 'GET')
   *   .toString();
   * console.info(ql);
   * // => select * from "http" where "method" = 'GET'
   * @example
   * const ql = client.query('http')
   *   .tag({
   *     method: 'GET',
   *     spdy: 'slow',
   *   })
   *   .toString();
   * console.info(ql);
   * // => select * from "http" where "method" = 'GET' and "spdy" = 'slow'
   */
  tag(key, value) {
    // Get the code from influx-ql
  }
  /**
   * Set the field condition
   * @param  {String} key - The key of field
   * @param  {String} value - The key of value
   * @return {Reader}
   * @since 2.2.0
   * @example
   * const ql = client.query('http')
   *   .field('code', 404)
   *   .toString();
   * console.info(ql);
   * // => select * from "http" where "code" = 404
   * @example
   * const ql = client.query('http')
   *   .field({
   *     code: 404,
   *   })
   *   .toString();
   * console.info(ql);
   * // => select * from "http" where "code" = 404
   */
  field(key, value) {
    // Get the code from influx-ql
  }
  /**
   * Add the calculate for the query
   * @param {String} type - The calculate type
   * @param {String} field - The calculate field
   * @since 2.2.0
   * @example
   * const ql = client.query('http')
   *   .tag('spdy', 'fast')
   *   .addCalculate('count', 'use')
   *   .toString();
   * console.info(ql);
   * // => select count("use") from "http" where "spdy" = 'fast'
   * @example
   * const ql = client.query('http')
   *   .tag('spdy', 'fast')
   *   .addCalculate('count', 'use')
   *   .addCalculate('mean', 'use')
   *   .toString();
   * console.info(ql);
   * // => select count("use"),mean("use") from "http" where "spdy" = 'fast'
   */
  addCalculate(type, field) {
    // Get the code from influx-ql
  }
  /**
   * Add the group field for the query
   * @param {String} field - The group field
   * @since 2.2.0
   * @example
   * const ql = client.query('http')
   *   .addCalculate('count', 'use')
   *   .addGroup('sdpy')
   *   .toString();
   * console.info(ql);
   * // => select count("use") from "http" group by "sdpy"
   * @example
   * const ql = client.query('http')
   *   .addCalculate('count', 'use')
   *   .addGroup('sdpy', 'time(5m)')
   *   .toString();
   * console.info(ql);
   * // => select count("use") from "http" group by "sdpy",time(5m)
   */
  addGroup(field) {
    // Get the code from influx-ql
  }
}
