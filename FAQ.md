## What is this?

The [National Weather Service](https://www.weather.gov/) provides a huge amount of forecast and climate data for free including an hour-by-hour forecast for the next 7 days. Unfortunately, getting it displayed in a concise format is not something they do well. The main graph to display the most relevant parts of the forecast (high and low temperature, wind chill, heat index, clouds, precipitation and dewpoint) in an easy to digest format.

## Why is this better than my weather app?

This web site is meant to be fast, fast, fast. If you add a bookmark to this web site to your home screen I'd be willing to guess that this web page loads faster than your weather app and gets you the information you're looking for 2-3x faster every time.

I chose an intentional minimal design to leave as much space as possible for the data. I'm an engineer, I prefer accurate information over cute, bubbly buttons.

There are some other things that make it faster too. The first time you load this page you'll download at most 2.5Mb of data. And you probably already have some of that in you're browser's cache from browsing other web sites. After that, it's about 60Kb of data to show the forecast and historical data. Personally, the fewer apps that I have installed on my phone the better. You can never be too sure what they're up to, if they're using data in the background, pilfering your contacts or running down your battery.

## Why a graph?

It makes it quicker to answer the typical weather questions like: Will it be warmer or cooler tomorrow? - Just compare the heights of the red line. Is it going to rain tomorrow? - Look for the blue filled areas. Will the sun be out on Saturday? - Look for no grey filled area on Saturday.

The graph makes it much easier to convey how the weather will change during the day. Your favorite weather app or search result card might simply say "Sunny, High of 80" today. But that tiny little bit of information might mask something important like the temperature dropping to 60 by 5 pm. That big temperature drop might mess up your evening plans if you were going to be outside.

If you're interested in the exact values, just tap any point on the graph to get the exact value and the time for that value. Or, If you want to view most of the data as a table, you can get one by clicking the table icon on the menu. I think you'll quickly see that the graph is a much easier to digest format.

## What time zone is shown?

Let's take this scenario: You're in New York and your Phone/Laptop/Tablet is set to the time in New York, but you're looking at a forecast that is for Chicago which is 1 hour behind New York. At the top of the page the time the forecast was last updated is displayed in your local time zone (New York) so you can quickly see, for example "This forecast is only 20 minutes old". The data in the graph is always displayed in the local time at your destination. This is intentional. If you're looing at a forecast for another location you're likely traveling there and it would be better to know that when your flight lands (for example) at 3pm (Chicago) that it will/won't be raining. This keeps you from having to do mental math for the time zones as you read the graph.

## Why do you work on this?

I'm a programmer and engineer. Javascript, HTML, Node.js and other web technologies are not part of my day job, but seem to be where the innovation is happening. I use this and other side projects to keep myself up to date with them.

## It loads to fast. I want to read all those funny messages

Check out the project on [Github](https://github.com/netbymatt/temperature-express). The complete source code is available, including those messages.

# Technical Notes
These technical notes include information about the production environment for https://temperature.express

* The web site is made up of static files stored in S3 and hosted by Cloudfront. (There's a weather pun in there!)
* Cloudfront is configured to provide mount points for the api.weather.gov API. This ensures that I meet their requirement of having a User-Agent string specific to this app. It also keeps all of the XHR requests on the same domain, side-stepping the occasional CORS issues that pop up with weather.api.gov
* [Flot](https://www.github.com/flot/flot) is used as the graphing tool. It is fast and small. It also renders the fastest and smoothest on mobile when informally compared to other plotting libraries.
* The code has undergone three major overhauls. The initial release in Fall of 2018 made extensive use of jQuery and jQuery UI. In fact, the color scheme still used is a hold-over from the Jquery UI theme Overcast.
* The next overhaul in 2021 removed jQuery, except for the reference to Flot that requires it (a separate side project of mine is removing jQuery from Flot).
* The 2022 overhaul moved from about 8 .js files to 20-some much more modular .mjs (module) files for easier code management. Sass was introduced at this time as well.
* Webpack is used to produce the minified, non-mjs code on the web site. But the raw .mjs files are used in development.
* Eslint and config-airbnb-base are used for code style with a few personal preferences added in.
* The above timeline does not include all of the features that have been added over time. Some of the more noticeable ones were:
		* Adding a table of data as an alternative view to the graph.
		* Local caching of api lookups necessary ahead of receiving actual weather data.
		* Addition of Snow Accumulation, Ice Accumulation, wind gusts, wind direction, barometer and lightning.
		* Loading animation (and those fun weather jokes!)
		* Use GPS to find location.
		* Side menu to support ever growing features: Sun/moon info, alerts, spc outlook and US or metric units.
		* Daytime and nighttime hours visualized in the graph.
		* A console-like view to help undersstand problems with api.weather.gov. (Click the version number in the side menu).
		* Holidays (US) displayed in chart.
		* Dark mode (follows system settings).