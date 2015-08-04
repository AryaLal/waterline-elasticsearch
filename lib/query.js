'use strict';

var objPath = require('object-path');

exports.buildQuery = function buildQuery(criteria, tables) {

  var query = {
    size: typeof criteria.limit === 'number' ? criteria.limit : 1000,
    from: typeof criteria.skip === 'number' ? criteria.skip : 0,
    _source: criteria.select
  };

  if (criteria.sort) query.sort = [criteria.sort];

  normalizeWhere(criteria.where, query);

  return query;
};

function normalizeWhere(fields, query) {
  if (!fields) return;
  return Object.keys(fields || {})
    .map(function (key) {
      var obj = { term: {} };
      obj.term[key] = fields[key];
      objPath.push(query, 'filter.and.filters', obj);
    });
}
