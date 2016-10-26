var switchViewContainerNode = document.querySelector(".switch-view-container"),
	weatherDisplayContainerNode = document.querySelector(".weather-display-container"),
	searchBarNode = document.querySelector(".search-bar")

var googleGeocodeBaseUrl = "https://maps.googleapis.com/maps/api/geocode/json?",
	DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

//MODELS
var WeatherModel = Backbone.Model.extend({
	url: function() {
		return "https://api.darksky.net/forecast/" + 
			this._lat + ',' + this._long
	},
	_lat: "",
	_long: ""
})

var inputHandler = function(clickEvent) {
	var buttonClicked = clickEvent.target,
		//get value of clicked target, then make it lower case for future hash manipulation
		buttonName = buttonClicked.value,
		splitHash = location.hash.split("/")
		
		var newHash = replaceLastArrayEl(splitHash,buttonName)

	//names hash from HTML of button clicked by user (HTML should be current, hourly, or daily)
	location.hash = newHash.join("/")
}

var replaceLastArrayEl = function(array, elToReplace){
	var newArr = []
	for(var i = 0; i < array.length; i++){
		if(i === array.length - 1){
			newArr.push(elToReplace)
		} else {
			newArr.push(array[i])
		}
	}
	return newArr;
}

var search = function(eventObj){
	if(eventObj.keyCode === 13){
		var searchNode = eventObj.target,
		searchTerms = searchNode.value
		console.log(searchTerms)
	var searchPromise = fetchLocation(searchTerms)

	searchPromise.then(getLatAndLong)
	searchNode.value = ""
	}
}

var fetchLocation = function(searchTerms) {
	var googleGeocodeUrl = googleGeocodeBaseUrl + "&address=" + searchTerms,
		promise = $.getJSON(googleGeocodeUrl)

	return promise;
}

var getLatAndLong = function(geocodeData) {
	var geocodeDataArray = geocodeData.results,
		geocodeFirstResult = geocodeDataArray[0],
		geocodeLocationObject = geocodeFirstResult.geometry.location,
		latitude = geocodeLocationObject.lat,
		longitude = geocodeLocationObject.lng

	location.hash = latitude + "/" + longitude + "/Current"
}

var getDefaultLatAndLong = function(currentLocation){
	var coordinates = currentLocation.coords,
		latitude = coordinates.latitude,
		longitude = coordinates.longitude

	location.hash = latitude + "/" + longitude + "/Current"
}

//VIEWS
var displayCurrentWeather = function(model){
	var currentTemperature = model.get("currently").temperature
	htmlString = ""
	htmlString += "<p>" + formatTemperature(currentTemperature) + "</p>"
	weatherDisplayContainerNode.innerHTML = htmlString
}

var displayHourlyWeather = function(model){
	var hourlyWeatherArray = model.get("hourly").data,
		htmlString = "<ol class='hourly-weather'>"

	for(var i = 0; i <= 24; i++) {
		var timeToParse = new Date(parseInt(hourlyWeatherArray[i].time + "000")),
			hour = timeToParse.getHours()
			temperature = hourlyWeatherArray[i].temperature

		htmlString += "<li>" + formatHour(hour) + ": " + formatTemperature(temperature) + "</li>"
	}
	htmlString += "</ol>"

	weatherDisplayContainerNode.innerHTML = htmlString
}

var displayDailyWeather = function(model){
	var dailyWeatherArray = model.get("daily").data,
		htmlString = "<ol class='daily-weather'>"

	for(var i = 0; i <= 6; i++){
		var dayDetails = dailyWeatherArray[i]
			timeToParse = new Date(parseInt(dayDetails.time + "000")),
			dayOfTheWeek = DAYS[timeToParse.getDay()],
			minTemperature = dayDetails.temperatureMin,
			maxTemperature = dayDetails.temperatureMax

		htmlString += "<li>" + dayOfTheWeek + ": High - " + formatTemperature(maxTemperature)
		+ " Low - " + formatTemperature(minTemperature) + "</li>"
	}
	htmlString += "</ol>"

	weatherDisplayContainerNode.innerHTML = htmlString
}

var formatHour = function(hourInt) {
	if (hourInt > 12) {
	    hourInt -= 12
	    return hourInt + "PM"
	} else if (hourInt === 0) {
	   hourInt = 12;
	}
	return hourInt + "AM"
}

var formatTemperature = function(tempInt) {
	return Math.round(tempInt) + "F"
}

var showGif = function() {
	weatherDisplayContainerNode.innerHTML = '<img src="./imgs/sun loading.gif">'
}

//CONTROLLER
var Controller = Backbone.Router.extend({
	routes: {
		":lat/:long/Current": "handleCurrent",
		":lat/:long/Hourly": "handleHourly",
		":lat/:long/Daily": "handleDaily",
		"*default": "handleDefault"
	},
	handleCurrent: function(lat,long){
		var weatherModel = new WeatherModel()

		weatherModel._lat = lat
		weatherModel._long = long
		var promise = weatherModel.fetch()
		showGif()		
		promise.then(function(){
			displayCurrentWeather(weatherModel)
		})
	},
	handleHourly: function(lat,long){
		console.log("Hour")
		var weatherModel = new WeatherModel()

		weatherModel._lat = lat
		weatherModel._long = long
		var promise = weatherModel.fetch()
		showGif()		
		promise.then(function(){
			displayHourlyWeather(weatherModel)
		})
	},
	handleDaily: function(lat,long){
		console.log("Daily")
		var weatherModel = new WeatherModel()

		weatherModel._lat = lat
		weatherModel._long = long
		var promise = weatherModel.fetch()
		showGif()		
		promise.then(function(){
			displayDailyWeather(weatherModel)
		})
	},
	handleDefault: function(){
		navigator.geolocation.getCurrentPosition(getDefaultLatAndLong)
	},
	initialize: function(){
		Backbone.history.start()
	}
})

var controller = new Controller()

switchViewContainerNode.addEventListener('click',inputHandler)
searchBarNode.addEventListener('keydown',search)