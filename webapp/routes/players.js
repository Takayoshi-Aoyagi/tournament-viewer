var fs = require('fs');
var util = require('util');
var express = require('express');
var router = express.Router();

var categories = {};
var base = 'data/json/tournament';
var dirs = fs.readdirSync(base);
dirs.forEach(function (category) {
    var path = util.format('%s/%s', base, category);
    var files = fs.readdirSync(path);
    var json = {};
    files.forEach(function (file, i) {
	json[i] = {
	    id: i,
	    name: file.split("\.")[0]
	};
    });
    categories[category] = json;
});

router.get('/categories', function (req, res, next) {
    res.status(200).send(categories);
});

router.get('/:category/:id', function(req, res, next) {
    var category = req.params['category'],
	id = req.params['id'],
	clazz,
	path;
    clazz = categories[category][id];
    path = util.format('data/json/tournament/%s/%s.json', category, clazz.name);
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
    console.log(req.body);
    console.log(util.format("swapping: %s %s %s %s", category, id, swap1, swap2));
    res.status(200);
});

module.exports = router;
