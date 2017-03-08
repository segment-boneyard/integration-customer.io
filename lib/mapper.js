
/**
 * Module dependencies.
 */

var traverse = require('isodate-traverse');
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
  var traits = traverse(msg.traits({
    created: 'created_at',
    email: 'email'
  }));
  return convert(traits, time);
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
  mapped = traverse(mapped);
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
  var props = traverse(msg.properties());
  return {
    timestamp: time(msg.timestamp()),
    data: convert(props, time),
    name: msg.event()
  }
};

/**
 * Map page `msg`.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Object}
 */

exports.page = function(msg){
  var props = traverse(msg.properties());
  var url = props.url;
  delete props.url;

  return {
    timestamp: time(msg.timestamp()),
    type: 'page',
    name: url,
    data: convert(props, time)
  }
};

/**
 * Map screen `msg`.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Object}
 */

exports.screen = function(msg){
  var props = traverse(msg.properties());
  var name = `Viewed ${msg.name()} Screen`;
  delete props.name;

  return {
    timestamp: time(msg.timestamp()),
    name: name,
    data: convert(props, time)
  }
};