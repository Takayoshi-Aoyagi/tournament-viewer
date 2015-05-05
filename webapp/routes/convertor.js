var async = require('async');
var fs = require('fs');
var util = require('util');

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

Convertor.executeByCollection = function (colname, callback) {
    console.log(colname);
    var names = colname.split('_');
    var categoryId = names[0];
    var classId = names[1];
    var outFilePath = util.format('data/json/tournament/%s/%s.json', categoryId, classId);
    var collection = global.db.collection(colname);
    collection.findOne(function (err, json) {
	if (err) {
	    callback(err);
	    return;
	}
	var players = json.players;
	if (!players) {
	    console.log(json);
	}
	var num = Convertor.padding(players);
	var tournament = Convertor.buildTournament(players);
	JSON.stringify(players, null, 2);
	fs.writeFileSync(outFilePath, JSON.stringify(tournament, null, 2));
	callback(null);
    });
};

Convertor.execute = function (callback) {
    console.log('Convertor.execute');
    global.db.listCollections().toArray(function (err, collections) {
	if (err) {
	    callback(err);
	    return;
	}
	async.each(collections, function (collection, next) {
	    if (collection.name === 'system.indexes') {
		next();
		return;
	    }
	    Convertor.executeByCollection(collection.name, function (err) {
		next();
	    });		
	}, function (err) {
	    callback(err);
	});
    });
};

module.exports = Convertor;
