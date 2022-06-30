/*
Flot plugin direction is used to show a visual arraw. Can be show wind data(wind speed and wind direction).
The data points you give in your data series should be three dimentions, like:[x_value, y_value, the_direction_value].

default options:
direction: {
            show: true,
            lineWidth: 1,
            color: "rgb(100, 60, 60)",
            fillColor: "rgb(100, 60, 60)",
            arrawLength: 8,
            angleType: "degree", //degree or radian
            openAngle: 30,
            zeroShow: false,
            threshold: 0.000001,
            angleStart: 0
        }

=========
 options
=========
"show" enable or disable the direction arraw show. Value: true or false.
"lineWidth", "color", "fillColor" is to set direction arraw's size, outline color, fill color.
"angleType" is default set to 'degree', another value is 'radian'. This set the direction value's type(the third dimentions' value).
"openAngle" set the arraw's head shape, used to be a sharp angle in degree, default is 30.
"zeroShow" when you want show zero value(value tha is less than "threshold" in abs), set it to true. see <attention> 2. Default is false, not show zero value.
"threshold" this is used when the "zeroShow" set to true only.
"angleStart" if you want change the start angle direction from north to east, set this value to -90 in degree, or from west set it to 90. See <attention> 1.

===========
 attention
===========
1. The angle diretion is start from north, and clockwise by default.
2. While the y's abosolut value is less than 0.000001 and zeroShow set to false(the default value), the direction arraw will not show.

=========
 changes
=========
version 1.4.2
-------------
fix bug that not draw the direction when the serial data is less than 3.

version 1.4.1
-------------
change the example section, now it works.

version 1.4
-------------
fix bug that set options in separate serie does not work well
fix bug that series ploted against the first axis only

version 1.3
-----------
fix bug that options can't set in sigle series
remove "disablePoints" options

version 1.2
------------
fix the bug when use radian angleType{bug: just show 0 ~ PI}
add options "zeroShow", "threshold", "angleStart"

version 1.1
-----------
fix bug that nonsense when change default options. {thanks Jernej Jerin}


=========
 example
=========
$.plot(
	"#place_holder",
	[
		[[1, 13, 50], [2, 20, 40], [3, 33, 50], [4, 13, 120], [5, 8, 270], [6, 26, 230]]
	],
	{
		series: {
			 points: {
				show: true,
				radius: 3,
				fill: false,
				symbol: 'circle'
			},
			 lines: {
				show: true,
				lineWidth: 2
			},
			 direction: {
				show: true
			}
		}
	}
);

=============
 acknowledge
=============
Jernej Jerin: Thank you for your testing any version of the plugin and reporting the bugs.
Xue Wei: the example section now works with flot v0.7 after version 1.4.1.

=========
 more :)
=========
Author: xb liu
Site: http://code.google.com/p/jquery-flot-direction/
License: GPL(any version) or Perl Artistic License
*/
((($) => {
	const options = {
		direction: {
			show: true,
			disablePoints: false,
			lineWidth: 1,
			color: 'rgb(100, 60, 60)',
			fillColor: 'rgb(100, 60, 60)',
			arrowLength: 8,
			angleType: 'degree', // degree or radian
			openAngle: 30,
		},
	};

	const init = (plot) => {
		// disable points when use arrow direction
		const disablePoints = (plot, ctx, series) => {
			const { direction } = plot.getOptions();
			if (!direction.show || !direction.disablePoints || series.data.length < 1 || series.data[0].length < 3) {
				return;
			}

			// remove points symbol
			series.points.symbol = () => {};
		};

		plot.hooks.drawSeries.push(disablePoints);

		const draw = (plot, ctx) => {
			$.each(plot.getData(), (ii, series) => {
				drawSeries(plot, ctx, series);
			});
		};

		function drawSeries(plot, ctx, series) {
			const { direction } = plot.getOptions();
			if (!direction.show || series.data.length < 1 || series.data[0].length < 3 || !series.lines.show) {
				return;
			}

			const points = series.data;

			const radius = direction.arrowLength;

			points.forEach((point) => {
				if (point.length < 3 || point[1] === null) {
					// don't plot this point
				} else {
					const x = point[0];

					// test for outside plot area
					if (x - radius < plot.getAxes().xaxis.min
						|| x + radius > plot.getAxes().xaxis.max) {
						// don't plot, outside axis
					} else {
						const offset = plot.pointOffset({
							x: point[0], y: point[1], xaxis: series.xaxis.n, yaxis: series.yaxis.n,
						});
						const x = offset.left;
						const y = offset.top;

						let direct = 0;
						if (direction.angleType == 'degree') {
							direct = ((90 - point[2]) % 360) * Math.PI / 180;
						} else {
							direct = (Math.PI / 2 - point[2]) % Math.PI;
						}

						const tail_percent = 0.5;
						const t_x = x + radius * Math.cos(direct);
						const t_y = y - radius * Math.sin(direct);
						const f_x = x - radius * Math.cos(direct) * tail_percent;
						const f_y = y + radius * Math.sin(direct) * tail_percent;

						const sharp_angle = (direction.openAngle * Math.PI / 180) % 90; // arrow open angle

						const r_x = f_x - radius / Math.cos(sharp_angle) * Math.cos(direct + sharp_angle);
						const r_y = f_y + radius / Math.cos(sharp_angle) * Math.sin(direct + sharp_angle);

						const l_x = f_x - radius / Math.cos(sharp_angle) * Math.cos(direct - sharp_angle);
						const l_y = f_y + radius / Math.cos(sharp_angle) * Math.sin(direct - sharp_angle);

						ctx.beginPath();

						ctx.strokeStyle = direction.color || series.color;
						ctx.lineWidth = 1;

						ctx.moveTo(f_x, f_y);
						ctx.lineTo(r_x, r_y);
						ctx.lineTo(t_x, t_y);
						ctx.lineTo(l_x, l_y);
						ctx.lineTo(f_x, f_y);
						ctx.closePath();

						ctx.fillStyle = direction.fillColor || series.fillColor;
						ctx.fill();

						ctx.stroke();
					}	// point fits on canvas
				}	// data exists for point
			});
		}

		plot.hooks.draw.push(draw);
	};

	$.plot.plugins.push({
		init,
		options,
		name: 'direction',
		version: '1.0',
	});
})(jQuery));
