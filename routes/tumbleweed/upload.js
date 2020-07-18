const express = require('express');
const router = express.Router();
const firebase = require('firebase');

const fb = require('./../../utils/firebase');

// Enable CORS.
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

router.post('/:latitude/:longitude', async (req, res, next) => {

  // Parse input from req.params.
  let latitude = parseFloat(req.params.latitude);
  let longitude = parseFloat(req.params.longitude);

  // Check if coordinates are numbers.
  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ result: 'Invalid latitude or longitude.' });
  }
  // Check for valid latitude.
  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({ result: 'Latitude out of range.' });
  }
  // Check for valid longitude.
  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({ result: 'Longitude out of range.' });
  }

  // Round to 5 decimal places.
  latitude = Math.round(latitude * 100000) / 100000;
  longitude = Math.round(longitude * 100000) / 100000;

  let promise = new Promise(resolve => {
    // Add tumbleweed to firestore.
    fb.getFirestore(db => {
      db.collection('tumbleweeds').add({
        location: new firebase.firestore.GeoPoint(latitude, longitude)
      });
      // Finished.
      resolve();
    });
  });

  await promise.then(() => {
    return res.status(200).json({ result: 'Tumbleweed added successfully.' });
  });
});

module.exports = router;
