# Temperature Express
![Temperature Express Logo](https://github.com/netbymatt/temperature-express/blob/main/html/images/tempexp-192.png?raw=true)

This is the base code for https://temperature.express which is available as a web site and progressive web app.

A graphical representation of the hourly forecast data and observations available through [https://api.weather.gov](https://www.weather.gov/documentation/services-web-api).

## Features
- Graph display of forcast for the next 7 days and observations for the previous ~7 days in an hour-by-hour format.
	- Temperature
	- Wind chill and heat index, shown as "Feels Like" as appropriate
	- Clouds
	- Precipitation: Rain, Snow, Ice
	- Wind
	- Dewpoint
	- Lightning
	- Barometer (observations only)
- GPS enabled to find your location and retreive a forcast
- Displays active alerts such as: Tornado, Severe Thunderstorm, Flash Flood
- Displays SPC Outlook when the location is inside of one of the highlighted risk areas
- Installable as a progressive web app (production site only)
- Alternative table view
- Sunrise and sunset times in graph and separately

## Source Data
The API for the National Weather Service has a huge amount of forecast and climate data for free including an hour-by-hour forecast for the next 7 days. Unfortunately, getting it displayed in a	concise	format is not something they do well. The main graph that this application produces attempts to display the most relevant parts of the forecast (high and low temperature, wind chill, heat index, clouds, precipitation and dewpoint) in an easy to digest format.

## Project Technical Info
In the production environment it is built to be very fast and to be installed as a [progressive web app](https://web.dev/progressive-web-apps/). The speed optimizations (service worker caching, minified javascript, etc) are not included in this repo as I would like this to also serve as a reasonably-sized web app for learning purposes.

# Usage
The project is a static set of HTML, Javascript and CSS files located in the ```html/``` folder. You can host them however you'd like. Keep in mind that there are CORS considerations when hosting this and that the NWS API does not always have the appropriate headers. It will not run by simply double-clicking the index.html file.

For simplicity, I've included a Node.js script that launches express web server and also passes through any requests to the NWS API so that everything can come from a single source, side-stepping the CORS issue.

``` bash
git clone git@github.com:netbymatt/temperature-express.git
npm i
node index.js
```
Open your web browser and point it at http<span>://</span>localhost:3000

If you're using VSCode, a launch.json file includes configurations for launching both the server and an instance of Chrome for client-side debugging.

# Donation
If you find this repo or https://temperature.express useful I would appreciate a little support to help pay for the cost of hosting the site.

<a href="https://www.buymeacoffee.com/temp.exp" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me An Umbrella" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

# Caution
The NWS API that supplies data for this project is still in active development and not all parts of it are considered production ready. It has a fairly reliable uptime, but this project should not be your only source of weather information during severe events.

# FAQ

Read the complete [FAQ](FAQ.md).