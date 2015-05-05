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

    /**
     * 階級選択のプルダウンメニュー
     */
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
		app.classId = val;
		app.tournamentView.draw(val);

	    });
	    $("#class_selector").val(4).change();
	}
    });

    /**
     * トーナメント
     */
    app.TournamentView = Backbone.View.extend({
	
	draw: function (classId) {
	    this.classId = classId;
	    this.render();
	},
	    
	render: function () {
	    var margin = {top: 0, right: 320, bottom: 0, left: 0},
		width = 960 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

	    var tree = d3.layout.tree()
	    //.separation(function(a, b) { return a.parent === b.parent ? 1 : .5; })
		.separation(function(a, b) { return a.children === b.children ? 1 : .5; })
		.size([height, width]);

	    d3.select("body").select("svg").remove();
	    var svg = d3.select("body").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	    d3.json("/players/massogi/" + this.classId, function(json) {
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

		node.on("click", function (d, i) {
		    if (!app.prev) {
			app.prev = {
			    d: d,
			    i: i
			};
			d3.select(this).style("fill", "red");
		    } else if (app.prev.i === i) {
			app.prev = undefined;
			d3.select(this).style("fill", "black");
		    } else {
			swap(app.prev.i, i);
		    }
		    console.log(node);
		    console.log(d);
		    console.log(i);
		});
	    });

	    function swap(a, b) {
		var data = {
		    swap1: a,
		    swap2: b
		};
		var params = {
		    url: sprintf('players/%s/%s/swap', 'massogi', app.classId),
		    contentTpe: 'application/json',
		    data: data
		};
		AjaxUtils.post(params, function (err, json) {
		    console.log(json);
		});
	    }
	    
	    function elbow(d, i) {
		return "M" + d.source.y + "," + d.source.x
		    + "H" + d.target.y + "V" + d.target.x
		    + (d.target.children ? "" : "h" + margin.right);
	    }
	}
    });

    app.init = function () {
	var params = {
	    url: "/players/categories"
	};
	AjaxUtils.get(params, function (err, json) {
	    app.tournamentView = new app.TournamentView();
	    app.classSelectorView = new app.ClassSelectorView(json['massogi']);
	    app.classSelectorView.render();
	});
    };
}());
