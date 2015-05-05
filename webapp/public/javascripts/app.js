var app = app || {};

(function () {

    "use strict";
    
    app.InputFilesView = Backbone.View.extend({

	el: "#input_files_view",

	render: function () {
	    var that = this,
		params = {
		    url: 'admin/infiles'
		};
	    AjaxUtils.get(params, function (err, data) {
		var html = '<ul>';
		data.files.forEach(function (file) {
		    html += '<li>' + file + '</li>';
		});
		html += '<ul>';
		that.$el.html(html);
	    });
	}
    });

    app.DataGenerateButton = Backbone.View.extend({

	el: "#data_generate_button",

	events:	{
	    "click": "onClick"
	},

	onClick: function (x,y,z) {
	    var params = {
		url: 'admin/generateData'
	    };
	    AjaxUtils.post(params, function (err, data) {
		console.log(data);
	    });
	}
    });
    
    app.initAdmin = function () {
	app.inputFilesView = new app.InputFilesView();
	app.inputFilesView.render();
	app.dataGenerateButton = new app.DataGenerateButton();
    };

    function draw (classId) {
	var getUrlVars = function(){
	    var vars = {};
	    var param = location.search.substring(1).split('&');
	    for (var i = 0; i < param.length; i++) {
		var keySearch = param[i].search(/=/);
		var key = '';
		if(keySearch != -1) key = param[i].slice(0, keySearch);
		var val = param[i].slice(param[i].indexOf('=', 0) + 1);
		if(key != '') vars[key] = decodeURI(val);
	    }
	    return vars;
	};

	var id = getUrlVars().id;
	console.log(id)
	var margin = {top: 0, right: 320, bottom: 0, left: 0},
	    width = 960 - margin.left - margin.right,
	    height = 500 - margin.top - margin.bottom;

	var tree = d3.layout.tree()
	//.separation(function(a, b) { return a.parent === b.parent ? 1 : .5; })
	    .separation(function(a, b) { return a.children === b.children ? 1 : .5; })
	//.children(function(d) { return d.parents; })
	    .size([height, width]);

	d3.select("body").select("svg").remove();
	var svg = d3.select("body").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	d3.json("/players/massogi/" + classId, function(json) {
	    var nodes = tree.nodes(json);

	    var link = svg.selectAll(".link")
		.data(tree.links(nodes))
		.enter().append("path")
		.attr("class", "link")
		.attr("d", elbow);

	    var node = svg.selectAll(".node")
		.data(nodes)
		.enter().append("g")
		.attr("class", "node")
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

	    node.append("text")
		.attr("class", "name")
		.attr("x", 8)
		.attr("y", -6)
		.text(function(d) {
		    if (d.name) {
			return d.name + ' (' + d.kana + ')';
		    } else {
			return "";
		    }
		});

	    node.append("text")
		.attr("x", 8)
		.attr("y", 8)
		.attr("dy", ".71em")
		.attr("class", "about lifespan")
		.text(function(d) { return d.dojo; });

	    node.append("text")
		.attr("x", 8)
		.attr("y", 8)
		.attr("dy", "1.86em")
		.attr("class", "about location")
		.text(function(d) { return ""; });
	});

	function elbow(d, i) {
	    return "M" + d.source.y + "," + d.source.x
		+ "H" + d.target.y + "V" + d.target.x
		+ (d.target.children ? "" : "h" + margin.right);
	}
    }

    app.ClassSelectorView = Backbone.View.extend({

	el: '#class_selector_view',

	initialize: function (json) {
	    this.json = json
	},

	render: function () {
	    var that = this,
		html = '';
	    html += '<select id="class_selector">';
	    Object.keys(this.json).forEach(function (key) {
		var clazz = that.json[key];
		if (clazz.name === '×') {
		    return;
		}
		html += sprintf('<option value="%s">%s</option>', clazz.id, clazz.name);
	    });
	    html += '</select>';
	    this.$el.html(html);

	    $("#class_selector").change(function () {
		var val = $(this).val();
		console.log(val);
		draw(val);
	    });
	}
    });
    
    app.init = function () {
	var params = {
	    url: "/players/categories"
	};
	AjaxUtils.get(params, function (err, json) {
	    app.classSelectorView = new app.ClassSelectorView(json['massogi']);
	    app.classSelectorView.render();
	});
    };
}());
