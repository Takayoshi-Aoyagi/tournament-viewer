var fs = require('fs');
var util = require('util');

var Convertor = function () {};

Convertor.getJSON = function (path) {
    var text, json;
    text = fs.readFileSync(path);
    json = JSON.parse(text);
    return json;
};

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

Convertor.executeByCategory = function (category) {
    var inFilePath = util.format('data/json/categories/%s.json', category.name);
    var json = Convertor.getJSON(inFilePath);
    var classes = json.data;
    var dir = 'data/json/tournament';
    if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir);
	fs.mkdirSync(dir + '/massogi');
	fs.mkdirSync(dir + '/tul');
    }
    Object.keys(classes).forEach(function (className) {
	var outFilePath = util.format('data/json/tournament/%s/%s.json', category.id, className);
	var players = classes[className];
	var num = Convertor.padding(players);
	// shuffle players
	players.sort(function () {
	    return Math.random()-.5;
	});
	var tournament = Convertor.buildTournament(players);
	fs.writeFileSync(outFilePath, JSON.stringify(tournament, null, 2));
    });
};

Convertor.execute = function () {
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
    array.forEach(function (category) {
	Convertor.executeByCategory(category);
    });
};

//Convertor.execute();

module.exports = Convertor;
