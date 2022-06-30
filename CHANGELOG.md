# Significant changes
Notable changes to the code and feature updates are listed below. View the commits to see all changes including bug fixes.

# Development
Changes listed below document the development of the software before the initial release. Some changes specific to the production version of temperature.express have been omitted.

## 1.19.4
- update about

## 1.19.3
- update loading phrases

## 1.19.2
- forecast, location refactor
- location refactor
- more refactoring
- alerts refactoring
- alerts refactor

## 1.19.1
- always scroll to bottom of console on load

## 1.19.0
- console copy and paste
- message formatting
- refactor progressbar
- display messages in gui
- better retry strategy throughout
- continue retrying load of forecast in background
- modularization

## 1.18.0
- modularize
- add webpack

## 1.17.8
- fix char visibility when loading
- modules complete
- initial conversion and test changes
- change global naming structure

## 1.17.7
- fix time zone offset for text forecast
- review foreach usage
- use forEachElem
- legend cleanup
- update luxon
- interface cleanup

## 1.17.6
- fix outlook/alert popups on top of each other

## 1.17.5
- fix loading throbber error

## 1.17.4
- separate chart marking
- relocate progress bar code

## 1.17.3
- update tooltip references

## 1.17.2
- refactor data organization
- refactor legend and loading
- refactor tooltip

## 1.17.1
- always hide text forecast when no message

## 1.17.0
- allow multiple lines
- styling
- make weather text strings
- correct 1px changeover error
- toggle area for text
- less code in formatting loop
- add lightning and null some zero values

## 1.16.2
- change barometer scaling

## 1.16.1
- fix wind gust fill color

## 1.16.0
- dark mode
- single scss file

## 1.15.0
- change to scss

## 1.14.2
- update spc ux

## 1.2.6

## 1.14.1
- update font awesome

## 1.14.0
- fix map dialog maximum width
- always list 3 spc outlook days

## 1.13.1
- close more dialogs automatically

## 1.13.0
- navigate through spc maps
- add spc maps

## 1.12.1
- Has warning only if active

## 1.12.0
- add wind gust
- wind direction in observations

## 1.11.0
- add barometer to forecast
- add barometer

## 1.10.1
- menu code cleanup
- location code cleanup
- holiday code cleanup
- astronomical code cleanup
- cleanup alert code
- forecast code cleanup
- modularize code

## 1.10.0
- remove location history from dialog

## 1.9.6
- red/yellow spc outlook button
- red/yellow alert button coloring

## 1.9.5
- update vendor dependencies

## 1.9.4
- dialog functionality cleanup

## 1.9.3
- properly handle holes in geojson
- update dependencies

## 1.9.2
- fix overflow css

## 1.9.1
- remove unnecessary console.log

## 1.9.0
- list history locations in menu

## 1.8.1
- nice show/hide of chart icons
- show icon animation

## 1.8.0
- add spc outlook

## 1.7.1
- make sunrise/sunset follow forecast location time zone

## 1.7.0
- graph in forecast location local time

## 1.6.7
- handle cancel updates to alert properly after supersceded was implemented

## 1.6.6
- add old data indication
- update dependencies

## 1.6.5
- fix days z-index

## 1.6.4
- add retry button

## 1.6.3
- allow days height to collapse

## 1.6.2
- switch to local urls

## 1.6.1
- annunciate error from nws

## 1.6.0
- track updated alerts
- add geolocation unavailable handling

## 1.5.4
- better progress bar, alerts failed indication

## 1.5.3
- correct handling when observations arrive first

## 1.5.2
- calculate oldest data even when observations are out of order
- update about

## 1.5.1
- fix vertical centering of loading icon

## 1.5.0
- remove jquery ui
- remove location from jquery dialog
- remove legend from jquery dialog
- drop dialog-error
- remove astronomical info from jquery dialog
- separate dialog css

## 1.4.1
- minify css

## 1.4.0
- add holidays

## 1.3.10
- hide table when changing location
- alert box hide/show animation
- remove jquery from astronomical info

## 1.3.9

## 1.3.8
- add loading transition

## 1.3.7
- remove jquery from loading
- remove jquery from legend
- remove jquery from days plotting
- hide tooltip on pan

## 1.3.6
- hide alert button on load
- remove more jquery
- more css transitions

## 1.3.5
- better tooltip
- update scaled-number dependencies

## 1.3.4
- code cleanup
- update dependencies

## 1.3.3
- side menu css fix
- update dependencies

## 1.3.2
- retry one time when nws api fails

## 1.3.1
- allow for no city name when using lat/lon lookup

## 1.3.0
- extract place name from open street map

## 1.2.11
- don't show null values in observations
- add gulp full_publish

## 1.2.10
- sort observation data

## 1.2.9
- fix css overflow

## 1.2.8
- fix alert box styling on mobile

## 1.2.7

## 1.2.6
- remove jquery from menu

## 1.2.5
- fix menu height issue

## 1.2.4
- sun/moon cleanup
- modernize alerts

## 1.2.3
- fix css compression

## 1.2.2
- linting cleanup
- cleanup scaled number
- upgrade luxon
- remove jquery from menu

## 1.2.1
- fix width and height on mobile

## 1.2.0
- remove jquery from alerts
- remove quirks mode
- add observation station
- switch to ejs
- update installability per pwa guidelines
- fix expires/end for alerts when one is not present
- change snow scale
- better error handling and code cleanup
- change ajax to async/await
- switch eslint styling
- change drawing of days to something more robust
- Source wind speed changed from m/s to km/h
- fix day of week
- Fix off by one day headers
- Update flot
- Add search history
- List history in location prompt
- History of places
- Check for fresh data on visibility event
- add location error messages
- clean start doesn't prompt user
- Hide address bar
- Added forecast to side menu
- Spelling
- Unit conversion complete
- Fix some table styling
- Add some style to the side menu
- Fix degree symbol
- Hide menu when opening alerts
- Add alerts to menu
- Change filtering ends/expires for alerts
- Remove focus from use gps
- Additional fixes
- Update menu options
- Fix loading text animation when page is not in foreground
- Change arrow.js to es6
- hide arrows with wind plot
- Spelling cleanup
- Update progress bar for alerts
- Alerts when active
- Progress bar always completes
- Loading progress bar
- Allow plotting observation data after forecast data arrives
- Fix table for data-on-series
- Additional on-series cleanup
- data moved to series
- Fix background markings for freezing threshold
- use visibility from series data
- Change z order of graphs
- Add ice accumulation
- Eslint cleanup
- Add snow accumulation
- Fix Mozilla width and height calculation
- save legend settings
- duplicate legend values
- cache previous location
- scrollbars during load
- Add doctype for Mozilla
- Loading messages
- Restore day-of-week display
- table.js to es6 functions
- HTML sticky table
- Restore table and remove fixed header plugin
- Tick formatter
- Fix legend colors
- Remove range slider
- Fix slider
- Fix eslint for arrow.js
- Add flot to resources
- Change forecast.js to es6
- Add zoom and pan limits
- Bring in local copy of flot
- Speed up formatData
- Add express for local testing
- Flot 2.0 now runs
- Change to flot 2.0
- Initial commit
