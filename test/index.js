
var Test = require('segmentio-integration-tester');
var helpers = require('./helpers');
var facade = require('segmentio-facade');
var convert = require('convert-dates');
var mapper = require('../lib/mapper');
var del = require('obj-case').del;
var time = require('unix-time');
var assert = require('assert');
var should = require('should');
var CustomerIO = require('..');

describe('Customer.io', function(){
  var settings;
  var payload;
  var test;
  var cio;

  beforeEach(function(){
    settings = {
      siteId: '61837a6c9e8b49d0ef71',
      apiKey: '1d425925af6dbcd47fc4'
    };
    cio = new CustomerIO(settings);
    test = Test(cio, __dirname);
    test.mapper(mapper);
    payload = {};
  });

  it('should have the correct settings', function(){
    test
      .name('Customer.io')
      .endpoint('https://app.customer.io/api/v1/customers/')
      .ensure('settings.siteId')
      .ensure('settings.apiKey')
      .ensure('message.userId')
      .channels(['server']);
  });

  describe('.validate()', function(){
    it('should be invalid when apiKey is missing', function(){
      test.invalid({ userId: 'user-id' }, { siteId: 'xxx' });
    });

    it('should be invalid when siteId is missing', function(){
      test.invalid({ userId: 'user-id' }, { apiKey: 'api-key' });
    });

    it('should be invalid when userId is missing', function(){
      test.invalid({}, settings);
    });

    it('should be valid when siteId and apiKey is given', function(){
      test.valid({ userId: 'user-id' }, settings);
    });
  });

  describe('mapper', function(){
    describe('identify', function(){
      it('should map basic message', function(){
        test.maps('identify-basic');
      });
    });

    describe('group', function(){
      it('should map basic message', function(){
        test.maps('group-basic');
      });
    });

    describe('track', function(){
      it('should map basic message', function(){
        test.maps('track-basic');
      });
    });

    describe('page', function(){
      it('should map basic message', function(){
        test.maps('page-basic');
      });
    });

    describe('screen', function(){
      it('should map basic message', function(){
        test.maps('screen-basic');
      });
    });
  });

  describe('.page()', function(){
    it('should get a good response from the API', function(done){
      var page = helpers.page();
      var data = helpers.page().properties();
      var url = data.url;
      delete data.url;

      payload.timestamp = time(page.timestamp());
      payload.data = convert(data, time);
      payload.type = 'page';
      payload.name = url;
      test
        .page(page)
        .requests(2)
        .request(1)
        .sends(payload)
        .expects(200, done)
    });

    it('will error on an invalid set of keys', function(done){
      test
        .set({ apiKey: 'x', siteId: 'x' })
        .page(helpers.page())
        .expects(401)
        .error(done);
    });
  });

  describe('.screen()', function(){
    it('should get a good response from the API', function(done){
      var screen = helpers.screen();
      var data = helpers.screen().properties();
      var name = data.name;
      delete data.name;

      payload.timestamp = time(screen.timestamp());
      payload.data = convert(data, time);
      payload.name = `Viewed ${name} Screen`;
      test
        .screen(screen)
        .requests(2)
        .request(1)
        .sends(payload)
        .expects(200, done)
    });

    it('will error on an invalid set of keys', function(done){
      test
        .set({ apiKey: 'x', siteId: 'x' })
        .screen(helpers.screen())
        .expects(401)
        .error(done);
    });
  });

  describe('.track()', function(){
    it('should get a good response from the API', function(done){
      var track = helpers.track();
      payload.timestamp = time(track.timestamp());
      payload.data = convert(track.properties(), time);
      payload.name = track.event();
      test
        .track(track)
        .requests(1)
        .request(0)
        .sends(payload)
        .expects(200, done)
    });

    it('will error on an invalid set of keys', function(done){
      test
        .set({ apiKey: 'x', siteId: 'x' })
        .track(helpers.track())
        .expects(401)
        .error(done);
    });
  });

  describe('.identify()', function(){
    it('should get a good response from the API', function(done){
      var identify = helpers.identify();
      payload = identify.traits();
      payload.created_at = time(identify.created());
      payload.email = identify.email();
      del(payload, 'created');
      payload = convert(payload, time);
      test
        .identify(identify)
        .requests(1)
        .request(0)
        .sends(payload)
        .expects(200, done);
    });

    it('will error on an invalid set of keys', function(done){
      test
        .set({ apiKey: 'x', siteId: 'x' })
        .identify(helpers.identify())
        .expects(401)
        .error(done);
    });

    it('should identify with only an email as id', function(done){
      test
        .identify({ userId: 'amir@segment.io' })
        .expects(200, done);
    });
  });


  describe('.group()', function(){
    it('should get a good response from the API', function(done){
      var group = helpers.group();
      payload = group.traits();
      del(payload, 'email');
      payload = prefixKeys('Group ', payload);
      payload['Group id'] = group.groupId();
      payload = convert(payload, time);
      payload.id = group.userId();
      payload.email = group.proxy('traits.email');
      test
        .group(group)
        .requests(1)
        .request(0)
        .sends(payload)
        .expects(200, done);
    });
  });

  describe('.visit()', function(){
    it('should not send the request if active is false', function(done){
      var track = helpers.track();
      track.obj.options.active = false;
      cio.visit(track, function(){
        arguments.length.should.eql(0);
        done();
      });
    });

    it('should send the request if active is true', function(done){
      var track = helpers.track(); // true by default.
      cio.visit(track, done);
    });
  });
});

/**
 * Prefix keys
 */

function prefixKeys(prefix, obj){
  return Object.keys(obj).reduce(function(ret, key){
    ret[prefix + key] = obj[key];
    return ret;
  }, {});
}
