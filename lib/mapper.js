
/**
 * Module dependencies.
 */

var convert = require('convert-dates');
var object = require('obj-case');
var time = require('unix-time');

/**
 * Map identify `msg`.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Object}
 */

exports.identify = function(msg){
  return convert(msg.traits({
    created: 'created_at',
    email: 'email',
  }), time);
};

/**
 * Map group `msg`.
 *
 * @parma {Facade} msg
 * @param {Object} settings
 * @return {Object}
 */

exports.group = function(msg){
  var json = msg.json();
  var traits = json.traits || {};
  var mapped = {};
  var email;

  if (email = msg.email()) {
    mapped.email = email;
    object.del(traits, 'email');
  }

  Object.keys(traits).forEach(function(key){
    mapped['Group ' + key] = traits[key];
  });

  mapped['Group id'] = msg.groupId();
  mapped = convert(mapped, time);
  json.traits = mapped;
  json.userId = msg.userId();
  return json;
};

/**
 * Map track `msg`.
 *
 * @parma {Facade} msg
 * @param {Object} settings
 * @return {Object}
 */

exports.track = function(msg){
  var props = msg.properties();
  return {
    timestamp: time(msg.timestamp()),
    data: convert(props, time),
    name: msg.event()
  }
};
