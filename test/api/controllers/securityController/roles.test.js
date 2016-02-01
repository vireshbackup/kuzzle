var
  should = require('should'),
  q = require('q'),
  params = require('rc')('kuzzle'),
  Kuzzle = require.main.require('lib/api/Kuzzle'),
  RequestObject = require.main.require('lib/api/core/models/requestObject'),
  ResponseObject = require.main.require('lib/api/core/models/responseObject'),
  BadRequestError = require.main.require('lib/api/core/errors/badRequestError');

describe('Test: security controller - roles', function () {
  var
    kuzzle;

  before(function (done) {
    kuzzle = new Kuzzle();
    kuzzle.start(params, {dummy: true})
      .then(function () {
        // Mock
        kuzzle.repositories.role.validateAndSaveRole = role => {
          return q({
            _index: kuzzle.config.internalIndex,
            _type: 'roles',
            _id: role._id,
            created: true
          });
        };
        kuzzle.repositories.role.loadOneFromDatabase = id => {
          return q({
            _index: kuzzle.config.internalIndex,
            _type: 'roles',
            _id: id,
            _source: {}
          });
        };
        kuzzle.repositories.role.loadMultiFromDatabase = ids => {
          return q(ids.map(id => {
            return {
              _id: id,
              _source: null
            };
          }));
        };
        kuzzle.services.list.readEngine.search = requestObject => {
          return q(new ResponseObject(requestObject, {
            hits: [{_id: 'test'}],
            total: 1
          }));
        };
        kuzzle.repositories.role.deleteFromDatabase = requestObject => {
          return q(new ResponseObject(requestObject, {_id: 'test'}));
        };

        done();
      });
  });

  describe('#createOrReplaceRole', function () {
    it('should resolve to a responseObject on a putRole call', done => {
      kuzzle.funnel.security.createOrReplaceRole(new RequestObject({
          body: {_id: 'test', indexes: {}}
        }))
        .then(result => {
          should(result).be.an.instanceOf(ResponseObject);
          should(result.data.body._id).be.exactly('test');
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

  describe('#getRole', function () {
    it('should resolve to a responseObject on a getRole call', done => {
      kuzzle.funnel.security.getRole(new RequestObject({
          body: {_id: 'test'}
        }))
        .then(result => {
          should(result).be.an.instanceOf(ResponseObject);
          should(result.data.body._id).be.exactly('test');
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

  describe('#mGetRoles', function () {
    it('should reject an error if no ids is provided', () => {
      return should(kuzzle.funnel.security.mGetRoles(new RequestObject({body: {}}))).be.rejectedWith(BadRequestError);
    });

    it('should resolve to a responseObject', done => {
      kuzzle.funnel.security.mGetRoles(new RequestObject({
          body: {ids: ['test']}
        }))
        .then(result => {
          should(result).be.an.instanceOf(ResponseObject);
          should(result.data.body.hits).be.an.Array();
          should(result.data.body.hits).not.be.empty();

          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

  describe('#searchRoles', function () {
    it('should return response with an array of roles on searchRole call', done => {
      kuzzle.funnel.security.searchRoles(new RequestObject({
          body: {_id: 'test'}
        }))
        .then(result => {
          var jsonResponse = result.toJson();

          should(result).be.an.instanceOf(ResponseObject);
          should(jsonResponse.result.hits).be.an.Array();
          should(jsonResponse.result.hits[0]._id).be.exactly('test');

          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

  describe('#deleteRole', function () {
    it('should return response with on deleteRole call', done => {
      kuzzle.funnel.security.deleteRole(new RequestObject({
          body: {_id: 'test'}
        }))
        .then(result => {
          var jsonResponse = result.toJson();

          should(result).be.an.instanceOf(ResponseObject);
          should(jsonResponse.result._id).be.exactly('test');

          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

});
