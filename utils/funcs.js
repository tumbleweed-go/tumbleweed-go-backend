const axios = require('axios');
const firebase = require('firebase');

const directionAngles = { E: 0, NE: Math.PI / 4, N: Math.PI / 2, NW: Math.PI * 3 / 4, W: Math.PI, SW: Math.PI * 5 / 4, S: Math.PI * 3 / 2, SE: Math.PI * 7 / 4 };

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

    console.log(latitude, longitude);

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

    console.log('repeat');
    getNextLocation(locations, i + 2, latitude, longitude, callback);  // Increment by 2 because API counts by half-days.

  }).catch(err => {
    console.log(err);
    callback();
    return;
  });
}

module.exports = { getPredictedLocations };
