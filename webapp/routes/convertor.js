var async = require('async');
var fs = require('fs');
var util = require('util');
var assert = require('assert');

var Convertor = function () {};

Convertor.padding = function (players) {
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
		kana: '',
		name: '',
		seq: ''
	    }
	    players.push(json);
	}
	break;
    }
    return size;
};

function pair (nodes) {
    var pairs = [];
    var num = nodes.length / 2;
    for (var i = 0; i < num; i++) {
	var n1 = nodes[i * 2];
	var n2 = nodes[i * 2 + 1];
	var json = {
	    name: "",
	    kana: "",
	    children: [n1, n2]
	};
	pairs.push(json);
    }
    //console.log(JSON.stringify(pairs, null, 2));
    return pairs;
}

Convertor.buildTournament = function (pairs) {
    var paired = pair(pairs);
    while (paired.length > 1) {
	paired = pair(paired);
    }
    return paired[0];
};

Convertor.executeByCollection = function (collection, callback) {
    console.log(collection.s.name);
    var names = collection.s.name.split('_');
    var categoryId = names[0];
    var classId = names[1];
    var outFilePath = util.format('data/json/tournament/%s/%s.json', categoryId, classId);
    console.log(outFilePath);
    collection.findOne(function (err, json) {
	if (err) {
	    callback(err);
	    return;
	}
	var players = json.players;
	if (!players) {
	    console.log("----");
	    console.log(json);
	} else {
	    console.log(players)
	}

	var num = Convertor.padding(players);
	var tournament = Convertor.buildTournament(players);
	JSON.stringify(players, null, 2);
	fs.writeFile(outFilePath, JSON.stringify(tournament, null, 2), function (err) {
	    callback(err);
	});
    });
};

Convertor.execute = function (callback) {
    console.log('Convertor.execute');
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
	    async.eachSeries(collections, function (collection, next) {
		if (collection.s.name === 'system.indexes') {
		    next();
		    return;
		}
		Convertor.executeByCollection(collection, function (err) {
		    next();
		});
	    }, function (err) {
		cb(err);
	    });
	}
    ], function (err) {
	console.log('Convertor.execute END');
	callback(err);
    });
};

module.exports = Convertor;
