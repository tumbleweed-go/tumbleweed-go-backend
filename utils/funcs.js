const axios = require('axios');
const firebase = require('firebase');

const directionAngles = {
  E:   Math.PI * 0 / 8,
  ENE: Math.PI * 1 / 8,
  NE:  Math.PI * 2 / 8,
  NNE: Math.PI * 3 / 8,
  N:   Math.PI * 4 / 8,
  NNW: Math.PI * 5 / 8,
  NW:  Math.PI * 6 / 8,
  WNW: Math.PI * 7 / 8,
  W:   Math.PI * 8 / 8,
  WSW: Math.PI * 9 / 8,
  SW:  Math.PI * 10 / 8,
  SSW: Math.PI * 11 / 8,
  S:   Math.PI * 12 / 8,
  SSE: Math.PI * 13 / 8,
  SE:  Math.PI * 14 / 8,
  ESE: Math.PI * 15 / 8
};

const getPredictedLocations = async (latitude, longitude) => {

  let array = [];
  let promise = new Promise(resolve => {
    getNextLocation(array, 0, latitude, longitude, () => {
      resolve(array);
    });
  });

  await promise;
  return array;
}

const getNextLocation = (locations, i, latitude, longitude, callback = null) => {

  if (i >= 12) { // Get locations for next 6 days.
    callback();
    return;
  }

  axios.get(`https://api.weather.gov/points/${latitude},${longitude}/forecast`).then(res => {

    let todayData = res.data.properties.periods[i];
    let windSpeedNumberMatches = todayData.windSpeed.match(/[\d.]+/g);
    
    // Get wind speed and wind angle.
    let windAngle = directionAngles[todayData.windDirection];
    let windSpeed = 0;
    windSpeedNumberMatches.forEach(speed => windSpeed += parseFloat(speed));
    windSpeed /= windSpeedNumberMatches.length;

    // Get latitude and longitude lengths (relative to mile). Note that longitude changes depending on latitude.
    // MAYBE TO DO: fix longitude conversion (less accurate if going NW / SW / etc.)
    let longitudeToMiles = Math.cos(latitude * Math.PI / 180) * 69.172;
    let latitudeToMiles = 69.172;
    
    // Calculate tumbleweed movement.
    // TODO: This calculation is for wind movement. Will be less for tumbleweeds.
    longitude += Math.cos(windAngle) * windSpeed * 1 / longitudeToMiles;
    latitude += Math.sin(windAngle) * windSpeed * 1 / latitudeToMiles;

    // Add location to array, recurse.
    locations.push(new firebase.firestore.GeoPoint(latitude, longitude));
    getNextLocation(locations, i + 2, latitude, longitude, callback);  // Increment by 2 because API counts by half-days.

  }).catch(err => {
    console.log(err);
    callback();
    return;
  });
}

module.exports = { getPredictedLocations };
