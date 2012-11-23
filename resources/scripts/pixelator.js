/**
 * Pixelator.js
 *
 * Adds a simple UI to David DeSandro's Close-Pixelate script:
 * http://desandro.com/resources/close-pixelate/
 *
 * Author: Ben Keen - @vancouverben / benjaminkeen.com
 */

var pixelator = {
	image_id:     "image",
	image_url:    null,
	canvas:       null,
	ctx:          null,
	num_settings: 0,
	root_url:     "http://thepixelator.com",
	save_image_dialog:    $("<div class=\"dialog\" />"),
	generate_link_dialog: $("<div class=\"dialog\" />"),
	generate_js_dialog:   $("<div class=\"dialog\" />"),
	no_canvas_dialog:     $("<div class=\"dialog\" />"),

	check_no_canvas: function() {
		if (!Modernizr.canvas) {
			$(pixelator.no_canvas_dialog).html("<p>Sorry! Your browser doesn't support the HTML5 Canvas tag. This website will not work for you.</p>"
				+ "<p>Try again in a more modern browser.</p>").dialog({
				title: "It's a sad day...",
				modal: true,
				minWidth: 400,
				buttons: {
					"Close": function() {
						$(this).dialog("close");
					}
				}
			});
		}
	},

	load_url: function(image) {
		pixelator.load_image($("#image_url").val());
	},

	load_remote_image: function(url) {
		var url = $("#image_url").val();
		if ($.trim(url) == "") {
			return;
		}
		$.ajax({
			method: "GET",
			data: { url: url },
			url: "code/get_remote_image.php",
			dataType: "JSON",
			success: function(response) {
				if (response.success) {
					pixelator.load_image("remote/" + response.message);
				} else {
					$("<div></div>").html(response.message).dialog({
						title: "Oops!",
						width: 400,
						modal: true,
						buttons: {
							"Close": function() {
								$(this).dialog("close");
							}
						}
					});
				}
			}
		});
	},

	/**
	 * Called anytime anything changes.
	 */
	repixelate: function() {
		if (pixelator.canvas == null) {
			pixelator.canvas = $("#image")[0];
			pixelator.ctx    = pixelator.canvas.getContext('2d');
			pixelator.canvas_width     = parseInt($(pixelator.canvas).attr("width"));
			pixelator.canvas_height    = parseInt($(pixelator.canvas).attr("height"))
		}

		ClosePixelate.renderClosePixels(pixelator.ctx, pixelator.get_settings(), pixelator.canvas_width, pixelator.canvas_height);
	},

	get_settings: function() {
		var settings = [];
		$("#settings .setting_group").each(function() {
			if (!$(this).find(".enabled").attr("checked")) {
				return;
			}
			settings.push({
				shape:      $(this).find(".shape").val(),
				resolution: parseInt($(this).find(".resolution").val()),
				offset:     parseInt($(this).find(".offset").val()),
				size:       parseInt($(this).find(".size").val()),
				alpha:      parseFloat($(this).find(".alpha").val())
			});
		});

		return settings;
	},

	add_setting: function(default_settings) {
		var data = $.extend({
			shape:            "circle",
			circle_selected:  "",
			square_selected:  "",
			diamond_selected: "",
			resolution:       32,
			offset:           0,
			size:             30,
			alpha:            0.5,
			repixelate:       false,
			row:              ++pixelator.num_settings
		}, default_settings);

		// yuck!
		switch (data.shape) {
			case "circle":
				data.circle_selected = "selected";
				break;
			case "diamond":
				data.diamond_selected = "selected";
				break;
			case "square":
				data.square_selected = "selected";
				break;
		}

		var new_setting_html = $("#setting_group_template").html();
		$.each(data, function(key, value) {
			var curr_key = new RegExp("%%" + key.toUpperCase() + "%%", "g");
			new_setting_html = new_setting_html.replace(curr_key, value);
		});

		$("#setting_groups").append(new_setting_html);
		pixelator.resort_layers();

		if (data.repixelate) {
			pixelator.repixelate();
		}

		// if there's no native support for the range element, offer the jQuery slider
		if (!Modernizr.inputtypes.range){
			$("input[type=range]").each(function() {
				if ($(this).nextAll(".slider").length) {
					return;
				}
				var range      = $(this);
				var slider_div = $("<div class=\"slider\" />");
				slider_div.width(range.width());
				range.after(slider_div.slider({
					min:   parseFloat(range.attr("min")),
					max:   parseFloat(range.attr("max")),
					value: parseFloat(range.val()),
					step:  parseFloat(range.attr("step")),
					slide: function(evt, ui) { range.val(ui.value); pixelator.repixelate(); },
					change: function(evt, ui) { range.val(ui.value); pixelator.repixelate(); }
				}));
			}).hide();
		}

		return false;
	},

	delete_setting: function() {
		$(this).closest(".setting_group").remove();
		pixelator.resort_layers();
		pixelator.repixelate();
	},

	// called whenever a layer is added, removed or re-sorted. It just updates the visual
	// order "Layer X" of the row
	resort_layers: function() {
		var curr_row = 1;
		$(".setting_group").each(function() {
			$(this).find(".enabled_group").html("Enable Layer " + curr_row);
			$(this).find(".row").html(curr_row);
			curr_row++;
		});
	},

	// this serializes the current settings and shortens the URL with google URL shortener
	generate_link: function() {
		var settings = pixelator.get_settings();
		var serialized_settings = [];
		for (var i=0, j=settings.length; i<j; i++) {
			serialized_settings.push("layers=shape:" + settings[i].shape + ",size:" + settings[i].size + ","
				+ "resolution:" + settings[i].resolution + ",alpha:" + settings[i].alpha + ",offset:" + settings[i].offset);
		}

		var settings_str = serialized_settings.join("|");
		var image_type   = $("input[name=ir]:checked").val();
		var image        = "";
		if (image_type == "examples") {
			image = $("#preset_images").val();
		} else {
			image = $("#image_url").val();
		}
		var current_url = pixelator.root_url + "?image_type=" + image_type + "&image=" + image + "&" + settings_str;

		$(pixelator.generate_link_dialog).html("<div class=\"loading\"></div>").dialog({
			title:    "Your Image URL",
			modal:    true,
			minWidth: 400,
			open: function() {
				$.ajax({
					type:     "POST",
					url:      "../code/get_short_url.php",
					dataType: "json",
					data:     { url: current_url },
					success: function(response) {
						$(pixelator.generate_link_dialog).html("<p>You can use this URL to link to your image.</p><input type=\"text\" id=\"short_url\" value=\"" + response.id + "\" />");
						$("#short_url").select();
					},
					// incomplete
					error: function(a, b, c) { }
				});
			},
			buttons: {
				"Close": function() {
					$(this).dialog("close");
				}
			}
		});

		return false;
	},

	// zero error checking on this
	decode_url: function() {
		var image_type   = pixelator._get_param_by_name("image_type");
		var custom_image = pixelator._get_param_by_name("image");
		if (image_type == "examples") {
			$("#ir1").attr("checked", "checked");
			$("#preset_images").val(custom_image);
		} else {
			$("#ir2").attr("checked", "checked");
			$("#image_url").val(custom_image);
		}

		var layers_str = pixelator._get_param_by_name("layers");
		var layers = layers_str.split("|");

		for (var i=0, j=layers.length; i<j; i++) {
			var pairs = layers[i].split(",");
			var curr_setting = {};
			for (var m=0; m<pairs.length; m++) {
				var key_val = pairs[m].split(":");

				switch(key_val[0]) {
					case "shape":
						curr_setting.shape = key_val[1];
						break;
					case "size":
						curr_setting.size = parseInt(key_val[1]);
						break;
					case "resolution":
						curr_setting.resolution = parseInt(key_val[1]);
						break;
					case "offset":
						curr_setting.offset = parseInt(key_val[1]);
						break;
					case "alpha":
						curr_setting.alpha = parseFloat(key_val[1]);
						break;
				}
			}

			pixelator.add_setting(curr_setting);
		}

		if (image_type == "examples") {
			pixelator.load_image();
		} else {
			pixelator.load_image(custom_image);
		}
	},

	generate_js: function() {
		var settings = pixelator.get_settings();

		var rows = [];
		for (var i=0; i<settings.length; i++) {
			rows.push("\t{ shape: '" + settings[i].shape + "', resolution: " + settings[i].resolution
							+ ", size: " + settings[i].size + ", offset: " + settings[i].offset + ", alpha: " + settings[i].alpha + " }");
		}
		var js = "[\n" + rows.join(",\n") + "\n]";

		var content = "<p>This option generates the javascript needed to recreate your current design. For more information on how to use it, download the "
					+ "<a href=\"https://github.com/desandro/close-pixelate\" target=\"blank\">Close-Pixelate</a> library from github.</p>"
					+ "<textarea>" + js + "</textarea>";
		$(pixelator.generate_js_dialog).html(content).dialog({
			title:   "Close-Pixelate JS",
			minWidth: 500,
			modal:    true,
			buttons: {
				"Close": function() {
					$(this).dialog("close");
				}
			}
		});

		return false;
	},

	load_preset: function(num, repixelate) {
		var num = parseInt(num);

		$("#setting_groups").html("");
		pixelator.num_settings = 0;

		var settings = [];
		switch (num) {
			case 1:
				settings = [
					{ shape: 'diamond', resolution: 98, size: 200, offset: 0, alpha: 1 },
					{ shape: 'circle', resolution: 20, size: 19, offset: 0, alpha: 1 }
				];
				break;
			case 2:
				settings = [
					{ shape: 'diamond', resolution: 14, size: 27, offset: 15, alpha: 0.991 },
					{ shape: 'circle', resolution: 50, size: 48, offset: 0, alpha: 0.651 },
					{ shape: 'circle', resolution: 50, size: 23, offset: 8, alpha: 0.5 },
					{ shape: 'circle', resolution: 50, size: 11, offset: 8, alpha: 0.441 }
				];
				break;
			case 3:
				settings = [
					{ shape: 'diamond', resolution: 200, size: 10, offset: 5, alpha: 0.8 },
					{ shape: 'diamond', resolution: 70, size: 80, offset: 15, alpha: 0.1 },
					{ shape: 'diamond', resolution: 112, size: 40, offset: 15, alpha: 0.3 },
					{ shape: 'diamond', resolution: 50, size: 20, offset: 10, alpha: 0.3 },
					{ shape: 'diamond', resolution: 32, size: 103, offset: 0, alpha: 0.041 }
				];
				break;
			case 4:
				settings = [
					{ shape: 'circle', resolution: 32, size: 180, offset: 0, alpha: 0.241 },
					{ shape: 'diamond', resolution: 8, size: 10, offset: 0, alpha: 0.391 },
					{ shape: 'circle', resolution: 52, size: 30, offset: 0, alpha: 0.261 },
					{ shape: 'circle', resolution: 40, size: 15, offset: 0, alpha: 0.471 }
				];
				break;
			case 5:
				settings = [
					{ shape: "square", resolution: 32, offset: 0, size: 4, alpha: 1 },
					{ shape: "square", resolution: 32, offset: 0, size: 30, alpha: 0.5 },
					{ shape: "diamond", resolution: 32, offset: 0, size: 90, alpha: 0.1 }
				];
				break;
			case 6:
				settings = [
					{ shape: 'circle', resolution: 8, size: 50, offset: 0, alpha: 0.741 },
					{ shape: 'diamond', resolution: 10, size: 13, offset: 13, alpha: 0.611 },
					{ shape: 'circle', resolution: 62, size: 73, offset: 0, alpha: 0.301 }
				];
				break;
			case 7:
				settings = [
					{ shape: 'square', resolution: 86, size: 83, offset: 0, alpha: 0.001 },
					{ shape: 'diamond', resolution: 200, size: 200, offset: 0, alpha: 0.161 },
					{ shape: 'circle', resolution: 8, size: 6, offset: 8, alpha: 1 }
				];
				break;
			case 8:
				settings = [
					{ shape: 'diamond', resolution: 32, size: 28, offset: 0, alpha: 0.501 },
					{ shape: 'diamond', resolution: 194, size: 194, offset: 100, alpha: 0.551 },
					{ shape: 'diamond', resolution: 32, size: 14, offset: 0, alpha: 0.5 },
					{ shape: 'circle', resolution: 32, size: 20, offset: 16, alpha: 0.821 },
					{ shape: 'circle', resolution: 32, size: 7, offset: 0, alpha: 1 }
				];
				break;
		}


		// display the preset settings
		for (var i=0, j=settings.length; i<j; i++) {
			var curr_setting_id = pixelator.num_settings;
			pixelator.add_setting(settings[i]);
		}

		// update the selected preset style
		$("#preset_styles li").removeClass("selected");
		$("#preset_styles li:nth-child(" + num + ")").addClass("selected");

		// render the image
		if (repixelate === true) {
			ClosePixelate.renderClosePixels(pixelator.ctx, settings, pixelator.canvas_width, pixelator.canvas_height);
		}
	},


	/**
	 * Called on page load and whenever someone selects one of the example images. It recreates the canvas with the current
	 * preset / custom settings. This ties to pixelator.image_loaded. That function fires when the image has actually been
	 * loaded in the page and is ready to mess around with.
	 */
	load_image: function(custom_image_url) {
		var image = "example_images/" + $("#preset_images").val();
		if (custom_image_url !== undefined) {
			image = custom_image_url;
		}
		$("#image_container").html("<img id=\"image\" />");

		$("#image").bind("load", function() {
			$Q.queue.push([
				function() {
					ClosePixelate.imgData = null;
					pixelator.canvas      = null;
					document.getElementById(pixelator.image_id).closePixelate(pixelator.get_settings());
				},
				function() {
					var ready = false;
					if ($("canvas#image").length) {
						pixelator.canvas = $("#image")[0];
						pixelator.ctx    = pixelator.canvas.getContext("2d");
						pixelator.canvas_width  = parseInt($(pixelator.canvas).attr("width"));
						pixelator.canvas_height = parseInt($(pixelator.canvas).attr("height"));
						ready = true;
					}
					return ready;
				}
			]);

			$Q.run();
		});

		$("#image_container img").attr("src", image);
	},

	save_image: function() {
		$(pixelator.save_image_dialog).html("<p>Please wait while we generate your image. You will prompted to download the .png.</p>"
			 + "<p>Note: images will be automatically delected from our server after 24 hours.</p><div class=\"loading\"></div>").dialog({
			title:    "Saving Image",
			modal:    true,
			minWidth: 400,
			open: function() {
				var str_dataURI = pixelator.canvas.toDataURL();
				var dialog = this;
				$(dialog).find(".loading").show();
				$.ajax({
					type:     "POST",
					url:      "../code/save_image.php",
					dataType: "json",
					data:     { data: str_dataURI },
					success: function(response) {
						$(dialog).find(".loading").hide();
						window.open("../code/prompt_image_download.php?filename=" + response.filename);
					}
				});
			},
			buttons: {
				"Close": function() {
					$(this).dialog("close");
				}
			}
		});

		return false;
	},


	_get_param_by_name: function(name) {
		name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
		var regexS = "[\\?&]"+name+"=([^&#]*)";
		var regex = new RegExp(regexS);
		var results = regex.exec(window.location.href);
		if (results == null) {
			return "";
		} else {
			return decodeURIComponent(results[1].replace(/\+/g, " "));
		}
	},

	about: function() {
		$("#about_content").dialog({
			title:   "About this site",
			minWidth: 650,
			modal:    true,
			open: function() {
				ns.init();
			},
			buttons: {
				"Close": function() {
					$(this).dialog("close");
				}
			}
		});
		return false;
	},

	toggle_about_source: function() {
		if ($("#swirly_source").css("display") == "none") {
			$("#swirly_source").show();
			$("#about_canvas").hide();
			$("#toggle_about_source").html("Back to Swirly");
		} else {
			$("#swirly_source").hide();
			$("#about_canvas").show();
			$("#toggle_about_source").html("Show Swirly Source");
		}
		return false;
	}
};

var ns = {
	ctx:          null,
	currInterval: null,
	circle_size:  4,
	count:        0,

	init: function() {
		ns.ctx = document.getElementById('about_canvas').getContext('2d');
		ns.ctx.translate(310, 135);
		ns.start();
	},

	start: function() {
		ns.currInterval = setInterval(function() { ns.draw() }, 5);
	},

	draw: function() {
		ns.ctx.rotate(Math.PI*2 / 80);
		ns.ctx.fillStyle = 'rgb(0, ' + Math.ceil(ns.count * 1.02) + ', ' + Math.ceil(ns.count * 1.6) + ')';

		ns.ctx.beginPath();
		ns.ctx.arc(0+ns.count/2, 0+ns.count/3, ns.circle_size, 0, Math.PI*2, false);
		ns.ctx.fill();

		ns.count += .2;
		ns.circle_size -= 0.003;

		// once the circle is small enough, clear the interval
		if (ns.circle_size <= 0.01) {
			clearInterval(ns.currInterval);
		}
	}
}


var logo_ns = {
	ctx:          null,
	currInterval: null,
	circle_size:  2.6,
	count:        0,

	init: function() {
		logo_ns.ctx = document.getElementById('logo').getContext('2d');
		logo_ns.ctx.translate(50, 50);
		logo_ns.draw();
	},

	draw: function() {
		logo_ns.ctx.rotate(Math.PI*2 / 50);
		logo_ns.ctx.fillStyle = 'rgb(0, ' + Math.ceil(logo_ns.count * 2) + ', ' + Math.ceil(logo_ns.count * 5) + ')';

		logo_ns.ctx.beginPath();
		logo_ns.ctx.arc(0+logo_ns.count/2, 0+logo_ns.count/3, logo_ns.circle_size, 0, Math.PI*2, false);
		logo_ns.ctx.fill();

		logo_ns.count += .2;
		logo_ns.circle_size -= 0.0055;

		// once the circle is small enough, clear the interval
		if (logo_ns.circle_size >= 0.01) {
			logo_ns.draw();
		}
	}
}


// see: http://www.benjaminkeen.com/?p=344
var $Q = {
		// each index should be an array with two indexes, both functions:
		// 0: the code to execute
		// 1: boolean test to determine completion
		queue: [],
		run: function()
		{
				if (!$Q.queue.length)
						return;

				// if this code hasn't begun being executed, start 'er up
				if (!$Q.queue[0][2])
				{
						$Q.queue[0][0]();
						$Q.queue[0][2] = window.setInterval("$Q.process()", 50);
				}
		},
		process: function()
		{
				if ($Q.queue[0][1]())
				{
						window.clearInterval($Q.queue[0][2]);
						$Q.queue.shift();
						$Q.run();
				}
		}
}
