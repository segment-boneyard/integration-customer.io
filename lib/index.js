
/**
 * Module dependencies.
 */

var convert = require('convert-dates');
var integration = require('segmentio-integration');
var Identify = require('segmentio-facade').Identify;
var mapper = require('./mapper');
var object = require('obj-case');
var time = require('unix-time');

/**
 * Expose `CustomerIO`
 */

var CustomerIO = module.exports = integration('Customer.io')
  .endpoint('https://app.customer.io/api/v1/customers/')
  .channels(['server'])
  .ensure('settings.siteId')
  .ensure('settings.apiKey')
  .ensure('message.userId')
  .retries(2);

/**
 * Identify.
 *
 * http://customer.io/docs/api/rest.html#section-Creating_or_updating_customers
 *
 * @param {Identify} identify
 * @param {Function} fn
 * @api public
 */

CustomerIO.prototype.identify = function(identify, fn){
  var self = this;
  this.visit(identify, function(){
    self
    .put(identify.userId())
    .auth(self.settings.siteId, self.settings.apiKey)
    .type('json')
    .send(mapper.identify(identify))
    .end(self.handle(fn));
  });
};

/**
 * Group.
 *
 * http://customer.io/docs/api/rest.html#section-Creating_or_updating_customers
 *
 * @param {Group} group
 * @param {Function} fn
 * @api public
 */

CustomerIO.prototype.group = function(group, fn){
  var json = mapper.group(group);
  var identify = new Identify(json);
  this.identify(identify, fn);
};

/**
 * Track.
 *
 * http://customer.io/docs/api/rest.html#section-Track_a_custom_event
 *
 * @param {Track} track
 * @param {Function} fn
 * @api public
 */

CustomerIO.prototype.track = function(track, fn){
  var self = this;
  this.visit(track, function(err){
    if (err) return fn(err);
    self
    .post(track.userId() + '/events')
    .auth(self.settings.siteId, self.settings.apiKey)
    .send(mapper.track(track))
    .type('json')
    .end(self.handle(fn));
  });
};

/**
 * Visit.
 *
 * @param {Facade} message
 * @param {Function} fn
 * @api private
 */

CustomerIO.prototype.visit = function(message, fn){
  if (!message.active()) return process.nextTick(fn);
  this
  .put(message.userId())
  .auth(this.settings.siteId, this.settings.apiKey)
  .send({ _last_visit: time(message.timestamp()) })
  .type('json')
  .end(this.handle(fn));
};
