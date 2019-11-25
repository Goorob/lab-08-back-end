'use strict';

require('dotenv').config();

const express = require('express');

const cors = require('cors');

const superagent = require('superagent');
const pg =require('pg');

const PORT = process.env.PORT;

const app = express();

app.use(cors());
const client = new pg.Client(process.env.DATABASE_URL); 
client.on('error', err => console.error(err));



app.get('/location', locationinfo);

app.get('/weather', weatherinfo);

app.get('/events', eventinfo);

/**************************************/
// Location
/**************************************/
function locationinfo(request, response) {
    console.log('am iniside location');
  // let locationData = getlocationinfo(request.query.data)
  // response.status(200).json(`locationData`);
  const city = request.query.data
  getlocationinfo(city)
    .then( locationData => response.status(200).json(locationData) )
    .catch((error) => errorHandler(error, request, response));
}
function getlocationinfo(city) {

  let SQL = 'select * FROM searchLoction WHERE search_query = $1 ';
  let values = [city];
  return client.query(SQL, values)
    .then(results => {
      if (results.rowCount) { return results.rows[0]; }
      else {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${city}&key=${process.env.GEOCODE_API_KEY}`;
        return superagent.get(url)
          .then(data => cacheLocation(city, data.body));
          return new Location (city , data.body);
      }
      
    });
};
let cache = {};
function cacheLocation(city, data) {
  const location = new Location(data.results[0]);
  let SQL = 'INSERT INTO searchLoction (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *';
  let values = [city, location.formatted_query, location.latitude, location.longitude];
  return client.query(SQL, values)
    .then(results => {
      const savedLocation = results.rows[0];
      cache[city] = savedLocation;
      return savedLocation;
    });
}

  // let data = require('./data/geo.json');
  // const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${city}&key=${process.env.GEOCODE_API_KEY}`;
  // console.log(url );
  // return new Location(city, data);
  // return superagent.get(url)
  //   .then( data => {
  //     return new Location(city, data.body);


//to test location no local host : http://localhost:3000/location
function Location(city, data) {
  // this.search_query = city;
  this.formatted_query = data.results[0].formatted_address;
  this.latitude = data.results[0].geometry.location.lat;
  this.longitude = data.results[0].geometry.location.lng;
}
/**************************************/
// Weather
/**************************************/
function weatherinfo(request, response) {
//   let weatherData = getweatherinfo(request.query.data);
//   response.status(200).json(weatherData);
console.log('request.query : ', request.query);
  getweatherinfo(request.query.data)
    .then( weatherData => response.status(200).json(weatherData) );
}
function getweatherinfo(query) {
//   let data = require('./data/darksky.json');
  //   return data.daily.data.map((day) => {
  //     return new Weather(day);
  //   });
  const url = `https://api.darksky.net/forecast/${process.env.DARKSKY_API_KEY}/${query.latitude},${query.longitude}`;

  return superagent.get(url)
    .then( data => {
      let weather = data.body;
      return weather.daily.data.map( (day) => {
        return new Weather(day);
      });
    });
}
//to test weather no local host : http://localhost:3000/weather?data[latitude]=31.9539494&data[longitude]=35.910635
function Weather(day) {

  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toDateString();
//   this.sunriseTime =day.sunriseTime ;
}
/**************************************/
// Event
/**************************************/
function eventinfo(request, response) {
  //   let weatherData = getweatherinfo(request.query.data);
  //   response.status(200).json(weatherData);
  // console.log('request.query : ', request.query);
  geteventinfo(request.query.data)
    .then( eventData => response.status(200).json(eventData) );
}
function geteventinfo(query) {
  //   let data = require('./data/darksky.json');
  //   return data.daily.data.map((day) => {
  //     return new Weather(day);
  //   });
  const url = `http://api.eventful.com/json/events/search?app_key=${process.env.EVENTBRITE_API_KEY}&location=${query.formatted_query}`;

  return superagent.get(url)
    .then( data => {
      // console.log('data : ', data);
      let list = JSON.parse(data.text);
      return list.events.event.map( (day) => {
        return new Event(day);
      });
    });
}
//to test events no local host : http://localhost:3000/events?data[search_query]=amman&data[formatted_query]=Amman, Jordan&data[latitude]=31.9539494&data[longitude]=35.910635
function Event(day) { 
  this.link = day.url;
  this.name = day.title;
  this.event_date = day.start_time;
  this.summary = day.description;
}
/**************************************/
// else
/**************************************/
app.get('/boo',(request,response) =>{
  throw new Error('something goes wrong ');
});
app.use('*', (request, response) => {
  response.status(404).send('Not Found');
});
app.use((error,request,response) => {
  response.status(500).send(error);
});
function errorHandler(error, req, res) {
  res.status(500).send(error);
}


client.connect()
.then( () =>{
    app.listen(PORT, () => console.log(`App Listening on ${PORT}`));
    });

