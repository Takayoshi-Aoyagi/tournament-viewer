"use strict";

var async = require('async');
var assert = require('assert');
var fs = require('fs');
var util = require('util');
var express = require('express');
var Convertor = require('./convertor');
var router = express.Router();


var categories = undefined;

function getCategories(callback) {
    categories = {};
    async.waterfall([
        function (cb) {
	    var MongoClient = require('mongodb').MongoClient;
	    var url = 'mongodb://localhost:27017/tournament';
	    MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected correctly to server");
		cb(err, db);
	    });
	},
	function (db, cb) {
	    db.collections(function (err, collections) {
		cb(err, collections);
	    });
	},
	function (collections, cb) {
	    var json = {};
	    async.eachSeries(collections, function (collection, next) {
		if (collection.s.name === 'system.indexes') {
		    next();
		    return;
		}
		collection.findOne(function (err, data) {
		    if (!categories[data.categoryId]) {
			categories[data.categoryId] = {};
		    }
		    categories[data.categoryId][data.classId] = {
			id: data.classId,
			name: data.className
		    };
		    next();
		});
	    }, function (err) {
		cb(err);
	    });
	}
    ], function (err) {
	callback(err);
    });
}

router.get('/categories', function (req, res, next) {
    if (!categories) {
	getCategories(function (err) {
	    res.status(200).send(categories);
	});
    } else {
	res.status(200).send(categories);
    }
});

router.get('/:category/:id', function(req, res, next) {
    var category = req.params['category'],
	id = req.params['id'],
	clazz,
	path;
    clazz = categories[category][id];
    path = util.format('data/json/tournament/%s/%s.json', category, clazz.id);
    console.log(path);
    fs.readFile(path, function (err, data) {
	var json = JSON.parse(data);
	res.status(200).send(json);
    });
});

router.post('/:category/:id/swap', function(req, res, next) {
    var category = req.params['category'],
	id = req.params['id'],
	swap1 = req.body.swap1,
    	swap2 = req.body.swap2;
    console.log(util.format("swapping: %s %s %s %s", category, id, swap1, swap2));

    async.waterfall([
        function (cb) {
	    var MongoClient = require('mongodb').MongoClient;
	    var url = 'mongodb://localhost:27017/tournament';
	    MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected correctly to server");
		cb(err, db);
	    });
	},
	function (db, cb) {
	    var colname = util.format('%s_%s', category, id);
	    var collection = db.collection(colname);
	    collection.findOne(function (err, doc) {
		cb(err, doc);
	    });
	},
	function (doc, cb) {
	    console.log(doc);
	    var tmp = doc.players[swap1];
	    doc.players[swap1] = doc.players[swap2];
	    doc.players[swap2] = tmp;
	    // swap order
	    tmp = doc.players[swap1].order;
	    doc.players[swap1].order = doc.players[swap2].order;
	    doc.players[swap2].order = tmp;
	    console.log(doc);
	    collection.update({}, doc, function (err, doc) {
		cb(err);
	    });
	},
	function (cb) {
	    Convertor.execute(function (err) {
		cb(err);
	    });
	}
    ], function (err) {
        if (err) {
	    console.log(err);
	    res.status(500).send(err);
	    return;
	}
	res.status(200).send("");
    });
});

module.exports = router;
