/**
 * Module Dependencies
 */
var Promise    = require('bluebird');
var _          = require('lodash');
var moment     = require('moment');
var elasticsearch = require('elasticsearch');
var captains   = require('captains-log');
var Errors     = require('waterline-errors').adapter;
var Connection = require('./connection');
var assign     = require('object-assign');
var buildQuery = require('./query').buildQuery;
var objPath    = require('object-path');
var log        = captains();

// Keep track of all the connections used by the app
var connections = {};

module.exports = {
  // to track schema internally
  syncable: false,
  defaults: {
    maxConnectionAge: {unit: 'minutes', val: 30}
  },

  /**
   * regiserConnection
   */
  registerConnection: function (connection, collections, cb) {
    Promise
      .resolve()
      .then(function () {
        if (!connection.identity) {
          throw new Error(Errors.IdentityMissing);
        }
        if (connections[connection.identity]) {
          throw new Error(Errors.IdentityDuplicate);
        }

        connections[connection.identity] = new Connection({
          config: connection,
          collections: collections,
          connection: null,
          expiresOn: 0
        });

        return connections[connection.identity].getConnection();
      })
      .nodeify(cb);
  },

  /**
   * find
   */
  find: function (connectionName, collectionName, options, cb) {
    var collection = connections[connectionName].collections[collectionName];

    if (options.select) {
      // Shim in required query params and parse any logical operators.
      options.select = (options.select || [])
        .map(function(def){
         return collection._transformer._transformations[def];
        })
        .filter(function(def){
          return !!def;
        });
    } else {
      options.select = Object.keys(collection.definition);
    }

    if(!options.select.length) options.select = ['*'];

    connections[connectionName]
      .getConnection()
      .then(function (connection) {
        var parts = collectionName.split('/');

        return connection.search({
          index: parts[0],
          type: parts[1],
          body: buildQuery(options)
        });
      })
      .then(function (results) {
        return objPath.get(results, 'hits.hits')
          .map(function (hit) {
            return flatten(hit._source);
          });
      })
      .nodeify(cb);
  },

  /**
   * count
   */
  count: function(connectionName, collectionName, options, cb) {
    options = options || {};
    var connectionObject = connections[connectionName];
    var collection = connectionObject.collections[collectionName];

    // Find matching documents and return the count
    collection.count(options, function(err, results) {
      if(err) return cb(err);
      cb(null, results);
    });
  },

  /**
   * native
   */
  native: function (connectionName, collectionName, cb) {
    connections[connectionName]
      .getConnection()
      .then(function (connection) {
        return connection.sobject(collectionName);
      })
      .nodeify(cb);
  },

  // TODO: Implement teardown process.
  teardown: function(connectionName, cb) { cb(); },
  // TODO: Implement `Model.define()` functionality.
  define: function(connectionName, collectionName, definition, cb) { cb(); },
  // TODO: Implement `Model.describe()` functionality.
  describe: function(connectionName, collectionName, cb) { cb(); },
  // TODO: Implement `Model.drop` functionality.
  drop: function(connectionName, collectionName, relations, cb) { cb(); },
  // TODO: Implement `Model.destroy` functionality.
  destroy: function(connectionName, collectionName, options, cb) { cb(); },

  ///////////////////////////////////////////////////////////////////////////
  // Optional Overrides :: Methods defined here can override built in dynamic
  //                       finders such as `Model.findOrCreate`.

  ///////////////////////////////////////////////////////////////////////////
  // Custom Methods :: Methods defined here will be available on all models
  //                   which are hooked up to this adapter.

};

function flatten(obj, delimiter, prefix) {
  delimiter = delimiter || '.';
  prefix = prefix ? prefix + delimiter : '';
  if (!obj) { return obj; }
  Object.keys(obj).forEach(function (prop) {
    if (isObject(obj[prop])) {
      assign(
        obj,
        flatten(obj[prop], delimiter, prefix + prop)
      );
      delete obj[prop];
    } else {
      obj[prefix + prop] = obj[prop];
      if (prefix) { delete obj[prop]; }
    }
  });

  return obj;
}

function isObject(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}
