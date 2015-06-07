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

	    initialize: function (type, json) {
		this.type = type;
		this.el = '#' + this.type + '_class_selector_view';
		this.json = json;
	},

	render: function () {
	    var that = this,
	    html = '',
	    hash = {
		'tul': 'トゥル',
		'massogi': 'マッソギ'
	    };
	    html += sprintf('<select name="select-choice-mini" data-mini="true" data-inline="true" id="%s_class_selector">', that.type);
	    Object.keys(this.json).forEach(function (key) {
		var clazz = that.json[key];
		if (clazz.name === '×') {
		    return;
		}
		html += sprintf('<option value="%s">%s - %s</option>', clazz.id, hash[that.type], clazz.name);
	    });
	    html += '</select>';
	    $(this.el).html(html);

	    $("#" + that.type + "_class_selector").change(function () {
		var val = $(this).val();
		console.log(val);
		app.classId = val;
		app.tournamentView[that.type].draw(val);
		app.prev = undefined;
	    });
	    $("#" + that.type + "_class_selector").val(1).change();
	}
    });

    /**
     * トーナメント
     */
    app.TournamentView = Backbone.View.extend({
	
	draw: function (classId) {
		var that = this;
	    this.classId = classId;
	    d3.json("/players/" + that.type + "/" + this.classId, function(json) {
		    var ns;
		    try {
			ns = d3.layout.tree().nodes(json).length;
		    } catch (e) {
			console.log(e)
		    }
		    if (ns === 3) {
			that.baseHeight = 200;
			that.baseWidth = 430;
		    } else if (ns === 7) {
			that.baseHeight = 250;
			that.baseWidth = 630;
		    } else if (ns === 15) {
			that.baseHeight = 500;
			that.baseWidth = 730;
		    } else {
			that.baseHeight = 800;
			that.baseWidth = 860;
		    }
		    that.json = json;
		    that.render();
		});
	},
	    
	initialize: function (type) {
		this.type = type;
	    },

	render: function () {
		    var that = this;
	    var margin = {top: 0, right: 220, bottom: 0, left: 0},
		width = that.baseWidth - margin.left - margin.right,
		height = that.baseHeight - margin.top - margin.bottom;

	    var tree = d3.layout.tree()
		.separation(function(a, b) { return a.children === b.children ? 1 : .5; })
		.size([height, width]);

	    d3.select("body").select("svg").remove();
	    var svg = d3.select("#t_" + that.type).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


		var nodes = tree.nodes(that.json);

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
			    var dojo = d.dojo || '   ',
			    seq = d.seq || '  ';
			if (d.name) {
			    return seq + '  ' + d.name + ' (' + dojo + ')';
			} else {
			    return "";
			}
		    });

		node.append("text")
		    .attr("x", 8)
		    .attr("y", 8)
		    .attr("dy", ".71em")
		    .attr("class", "about lifespan")
		    .text(function(d) { return d.kana; });

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
			swap(app.prev.d.order, d.order, function (err, json) {
			    app.prev = undefined;
			    if (err) {
				console.log(err);
			    } else {
				app.tournamentView[that.type].draw(app.classId);
			    }
			});
		    }
	    });

	    function swap(a, b, callback) {
		var data = {
		    swap1: a,
		    swap2: b
		};
		var params = {
		    //url: sprintf('players/%s/%s/swap', 'massogi', app.classId),
		    url: sprintf('players/%s/%s/swap', that.type, app.classId),
		    contentTpe: 'application/json',
		    data: data
		};
		AjaxUtils.post(params, function (err, json) {
		    callback(err, json);
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
		app.tournamentView = {};
	    app.tournamentView.tul = new app.TournamentView("tul");
	    app.tournamentView.massogi = new app.TournamentView("massogi");
	    app.tulClassSelectorView = new app.ClassSelectorView("tul", json['tul']);
	    app.tulClassSelectorView.render();

	    app.massogiClassSelectorView = new app.ClassSelectorView("massogi", json['massogi']);
	    app.massogiClassSelectorView.render();

	    /*
	    $('#save_btn').click(function () {
		    //var svgText = document.getElementById('t_massogi').innerHTML;
		    var svgText = $('#t_massogi')[0].innerHTML;
		    canvg('canvas', svgText);
		    // Canvas要素取得
		    var canvas = document.getElementById('canvas');
		    // Blob形式に変換し、保存する
		    canvas.toBlob(function(blob) {
			    saveAs(blob, "graph.png");
			}, "image/png");
		});
	    */
	    });
    };
}());
