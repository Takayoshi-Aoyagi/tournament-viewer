var async = require('async');
var fs = require('fs');
var util = require('util');
var child_process = require('child_process');
var express = require('express');
var JSON2Mongo = require('./json2mongo.js');
var Convertor = require('./convertor.js');

var router = express.Router();

router.get('/infiles', function(req, res, next) {
    fs.readdir('uploads', function (err, files) {
	var json = {
	    err: err,
	    files: files
	};
	res.send(json);
    });
});

router.post('/uploads', function(req, res) {
    var paths;
    console.dir(req.files);
    var thumbnail = req.files.thumbnail;
    if (util.isArray(thumbnail)) {
	paths = thumbnail;
    } else {
	paths = [thumbnail];
    }
    paths.forEach(function (path) {
	    console.log(path)
	var src = './uploads/' + path.name,
	    dst = './uploads/' + path.originalname;
	    /*
	fs.rename(src, dst, function(err) {
	    if (err) {
		throw err;
	    }
	    fs.unlink(src, function() {
		if (err) {
		    throw err;
		}
	    res.send('File uploaded to: ' + dst + ' - ' + path.size + ' bytes');
	    });
	});
	    */
	    res.send('File uploaded to: ' + dst + ' - ' + path.size + ' bytes');	    
    });
});

router.post('/generateData', function(req, res) {
    async.waterfall([
	function (cb) {
	    var paths = ['data/json/categories', 'data/json/tournament/massogi', 'data/json/tournament/tul'];
	    paths.forEach(function (path) {
	        var files;
		files = fs.readdirSync(path);
		files.forEach(function (file) {
		    fs.unlinkSync(util.format("%s/%s", path, file));
		});
	    });
	    cb();
	},
	function (cb) {
	    var cmd = "java -jar EntryListGeneratorMain.jar uploads /home/aoyagi/tournament-viewer/webapp/data/merge.json";
	    console.log(cmd);
	    child_process.exec(cmd, function (err, stdout, stderr) {
		    //console.log(stdout);
		    console.log(stderr);
		cb(err);
	    });
	},
	function (cb) {
	    JSON2Mongo.execute(function (err) {
		cb(err);
	    });
	},
	function (cb) {
	    console.log('Convertor');
	    Convertor.execute(function (err) {
		console.log('Convertor-');
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
