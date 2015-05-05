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
    
    app.initAdmin();

}());
