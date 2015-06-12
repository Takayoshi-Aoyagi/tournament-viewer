var fs = require('fs');
var util = require('util');
var async = require('async');
var assert = require('assert');

var JSON2Mongo = function () {};

JSON2Mongo.getJSON = function (path) {
    var text, json;
    text = fs.readFileSync(path);
    json = JSON.parse(text);
    return json;
};

JSON2Mongo.padding = function (players) {
    var size = 4;
    var num = players.length;
    var numPadding, i, json;
    if (num <= 2) {
	return num;
    }
    while(true) {
	if (num > size) {
	    size *= 2;
	    continue;
	}
	numPadding = size - num;
	for (i = 0; i < numPadding; i++) {
	    json = { 
		kana: '---',
		name: '---',
	    }
	    players.push(json);
	}
	break;
    }
};

JSON2Mongo.executeByCategory = function (db, category, callback) {
    var inFilePath = util.format('data/json/categories/%s.json', category.name);
    var json = JSON2Mongo.getJSON(inFilePath);
    var classes = json.data;
    var dir = 'data/json/tournament';
    if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir);
	fs.mkdirSync(dir + '/massogi');
	fs.mkdirSync(dir + '/tul');
    }
    var keys = Object.keys(classes);
    var classIndex = 0;
    async.eachSeries(keys, function (className, next) {
	var outFilePath = util.format('data/json/tournament/%s/%s.json', category.id, className);
	var players = classes[className];
	JSON2Mongo.padding(players);
	JSON2Mongo.insert2mongo(db, category.id, classIndex, className, players, function (err) {
	    classIndex++;
	    next();
	});
    }, function (err) {
	callback(err);
    });
};

JSON2Mongo.insert2mongo = function (db, categoryId, classIndex, className, players, callback) {
    var collection = db.collection(util.format('%s_%s', categoryId, classIndex));
    players.forEach(function (player, index) {
	player.order = index;
    });
    var json = {};
    json.categoryId = categoryId;
    json.classId = classIndex;
    json.className = className;
    json.players = players;
    var collection = db.collection(util.format('%s_%s', categoryId, classIndex));
    collection.insert(json, function (err, result) {
	callback(err);
    });
};

JSON2Mongo.deleteCollections = function (db, callback) {
    db.collections(function (err, collections) {
	async.each(collections, function (collection, next) {
	    var colname = collection.s.name;
	    if (colname === 'system.indexes') {
		next();
		return;
	    }
	    collection.drop(function (err, reply) {
		next(err);
	    });
	}, function (err) {
	    callback(err);
	});
    });
};

JSON2Mongo.execute = function (callback) {
    var array = [
	{
	    name: "マッソギ",
	    id: "massogi"
	},
	{
	    name: "トゥル",
	    id: "tul"
	}
    ];
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
	    JSON2Mongo.deleteCollections(db, function (err) {
		    cb(err, db);
	    });
	},
	function (db, cb) {
	    async.each(array, function (category, next) {
		JSON2Mongo.executeByCategory(db, category, function (err) {
		    next(err)
	       	});
	    }, function (err) {
		cb(err);
	    });
	}
    ], function (err) {
        if (db) {
	    db.close();
        }
        callback(err);
    });
};

module.exports = JSON2Mongo;
