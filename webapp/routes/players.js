"use strict";

var async = require('async');
var fs = require('fs');
var util = require('util');
var express = require('express');
var Convertor = require('./convertor');
var router = express.Router();


var categories = undefined;

function getCategories(callback) {
    categories = {};
    global.db.listCollections().toArray(function (err, collections) {
	if (err) {
	    callback(err);
	    return;
	}
	var json = {};
	async.eachSeries(collections, function (collection, next) {
	    if (collection.name === 'system.indexes') {
		next();
		return;
	    }
	    var col = global.db.collection(collection.name);
	    col.findOne(function (err, data) {
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
	    callback(err);
	});
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
    var colname = util.format('%s_%s', category, id);
    var collection = global.db.collection(colname);
    collection.findOne(function (err, doc) {
	if (err) {
	    res.status(500).send(err);
	}
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
	    console.log(doc);
	    if (err) {
		res.status(500).send(err);
		return;
	    }
	    Convertor.execute(function (err) {
		console.log("hoge");
		console.log(err);
		if (err) {
		    res.status(500).send(err);
		    return;
		}
		res.status(200).send("");
	    });
	});
    });
});

module.exports = router;
