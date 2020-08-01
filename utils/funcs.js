const axios = require('axios');
const firebase = require('firebase-admin');
const vision = require('@google-cloud/vision');
const colorsys = require('colorsys');

const fb = require('./firebase');

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

const padNumber = (num, length) => {
  var s = String(num);
  while (s.length < length) {
    s = '0' + s;
  }
  return s;
}

const getPredictedLocations = async (latitude, longitude) => {

  let array = [];
  let promise = new Promise(resolve => {
    getNextPredictedLocation(array, 0, latitude, longitude, () => {
      resolve(array);
    });
  });

  await promise;
  return array;
}

const getNextPredictedLocation = (locations, period, latitude, longitude, callback) => {

  if (period >= 14) { // Get locations for next 7 days.
    callback();
    return;
  }

  axios.get(`https://api.weather.gov/points/${latitude},${longitude}`).then(async res => {

    // Three attempts.
    let endpoint = res.data.properties.forecast;
    let attempt = new Promise((resolve, reject) => {
      axios.get(endpoint).then(res => resolve(res.data)).catch(() => {
        console.log('fetch data - fail #1');
        axios.get(endpoint).then(res => resolve(res.data)).catch(() => {
          console.log('fetch data - fail #2');
          axios.get(endpoint).then(res => resolve(res.data)).catch(() => {
            console.log('fetch data - fail #3');
            reject();
          });
        });
      });
    });

    await attempt.then(res => {

      console.log(latitude, longitude);
      let todayData = res.properties.periods[period];
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
      let tumbleweedSpeedToWindSpeedRatio = 1;
      longitude += Math.cos(windAngle) * windSpeed * 1 / longitudeToMiles * tumbleweedSpeedToWindSpeedRatio;
      latitude += Math.sin(windAngle) * windSpeed * 1 / latitudeToMiles * tumbleweedSpeedToWindSpeedRatio;
  
      // Round coordinates to 7 decimal places.
      latitude = Math.round(latitude * 10000000) / 10000000;
      longitude = Math.round(longitude * 10000000) / 10000000;
  
      // Add location to array, recurse.
      locations.push(new firebase.firestore.GeoPoint(latitude, longitude));
      getNextPredictedLocation(locations, period + 2, latitude, longitude, callback);  // Increment by 2 because API counts by half-days.

    });
  }).catch(() => {
    console.log('axios error');
    callback();
    return;
  });
}

const isTumbleweedColour = (hsv) => {

  let range = { h: { low: 25, high: 45 }, s: { low: 20, high: 65 }, v: { low: 50, high: 80 } };

  if (hsv.h < range.h.low || hsv.h > range.h.high) {
    return false;
  }
  if (hsv.s < range.s.low || hsv.s > range.s.high) {
    return false;
  }
  if (hsv.v < range.v.low || hsv.v > range.v.high) {
    return false;
  }
  return true;
}

const isATumbleweed = async (imgDir) => {

  let isPlant = false;
  let correctColour = false;

  // Detect if image has plant.
  let [ labelPropertiesResults ] = await new vision.ImageAnnotatorClient().labelDetection(imgDir);
  let labels = labelPropertiesResults.labelAnnotations;
  labels.forEach(label => {
    if (label.description === 'Plant') {
      isPlant = true;
    }
  });

  // Detect if image is the correct colour.
  let [ imagePropertiesResult ] = await new vision.ImageAnnotatorClient().imageProperties(imgDir);
  let colours = imagePropertiesResult.imagePropertiesAnnotation.dominantColors.colors;
  if (colours.length > 0) {  // Only check the first colour (the most prominent one).
    let rgb = colours[0].color;
    let hsv = colorsys.rgb_to_hsv(rgb.red, rgb.green, rgb.blue);
    correctColour = isTumbleweedColour(hsv);
  }

  return isPlant && correctColour;
}

const incrementTumbleweedsFound = (uid, callback, failCallback) => {
  // Get user.
  fb.getObjectById('users', uid, doc => {
    // Get user success.
    // Update user.
    doc.ref.update({
      tumbleweedsFound: firebase.firestore.FieldValue.increment(1)
    }).then(() => {
      // Update user success.
      callback();
    }).catch(() => {
      // Update user fail.
      failCallback();
    });
  }, err => {
    // Get user fail.
    if (err === 'no-object') {
      // Create object.
      fb.firestore.collection('users').doc(uid).set({
        tumbleweedsFound: 1,
      }).then(() => {
        // Create object success.
        callback();
      }).catch(() => {
        // Create object fail.
        failCallback();
      });
    }
    else {
      // Get user fail.
      failCallback();
    }
  });
}

module.exports = { getPredictedLocations, isATumbleweed, incrementTumbleweedsFound, padNumber };
