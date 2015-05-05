var fs = require('fs');
var express = require('express');
var router = express.Router();

var json = {
    "name": "Clifford Shanks",
    "born": 1862,
    "died": 1906,
    "location": "Petersburg, VA",
    "children": [
	{
	    "name": "James Shanks",
	    "born": 1831,
	    "died": 1884,
	    "location": "Petersburg, VA",
	    "children": [
		{
		    "name": "Robert Shanks",
		    "born": 1781,
		    "died": 1871,
		    "location": "Ireland/Petersburg, VA"
		},
		{
		    "name": "Elizabeth Shanks",
		    "born": 1795,
		    "died": 1871,
		    "location": "Ireland/Petersburg, VA"
		}
	    ]
	},
	{
	    "name": "Ann Emily Brown",
	    "born": 1826,
	    "died": 1866,
	    "location": "Brunswick/Petersburg, VA",
	    "children": [
		{
		    "name": "Henry Brown",
		    "born": 1792,
		    "died": 1845,
		    "location": "Montgomery, NC"
		},
		{
		    "name": "Sarah Houchins",
		    "born": 1793,
		    "died": 1882,
		    "location": "Montgomery, NC"
		}
	    ]
	}
    ]
}
	
router.get('/', function(req, res, next) {
    res.send(json);
});

router.get('/:id', function(req, res, next) {
    var tournaments = [];
    var dir = 'data';
    var files = fs.readdirSync(dir);
    files.forEach(function (file) {
	var path = dir + '/' + file;
	console.log(path);
	var json = JSON.parse(fs.readFileSync(path));
	tournaments.push(json);
    });
    
    var id = req.param('id');
    res.send(tournaments[id]);
});

module.exports = router;
