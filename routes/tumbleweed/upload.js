const express = require('express');
const router = express.Router();
const multer = require('multer');
const firebase = require('firebase-admin');

const fb = require('./../../utils/firebase');
const logger = require('./../../utils/log');
const funcs = require('./../../utils/funcs');
const upload = multer({ dest: './uploads' });

// File upload fields for POST request.
const uploadFields = [
  { name: 'image', maxCount: 1 }
];

// Enable CORS.
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

router.post('/:latitude/:longitude', upload.fields(uploadFields), async (req, res, next) => {

  // INPUT
  
  // Validate file input.
  if (!req.files) {
    return res.status(500).json({ result: 'Missing req.files.' });
  }
  if (!req.files.image) {
    return res.status(400).json({ result: 'Missing image.' });
  }

  // Parse input from req.params.
  let latitude = parseFloat(req.params.latitude);
  let longitude = parseFloat(req.params.longitude);

  // Validate coordinate input.
  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ result: 'Invalid latitude or longitude.' });
  }
  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({ result: 'Latitude out of range.' });
  }
  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({ result: 'Longitude out of range.' });
  }

  // Round coordinates to 7 decimal places.
  latitude = Math.round(latitude * 10000000) / 10000000;
  longitude = Math.round(longitude * 10000000) / 10000000;

  // IMAGE DETECTION

  // Exit if not tumbleweed.
  let imageFileName = req.files.image[0].filename;
  let imageDir = __dirname + `/../../uploads/${imageFileName}`;
  let isATumbleweed = await funcs.isATumbleweed(imageDir);
  if (!isATumbleweed) {
    return res.status(400).json({ result: 'Image doesn\'t contain a tumbleweed.' });
  }

  // UPLOAD COORDINATES

  let tumbleweedObj = {
    uploadTime: Date.now(),
    uploadLocation: new firebase.firestore.GeoPoint(latitude, longitude),
    location: new firebase.firestore.GeoPoint(latitude, longitude),
    lastUpdateTime: Date.now(),
    predictedLocations: []  // Will be updated right after returning request.
  }

  let promise = new Promise((resolve, reject) => {
    // Add tumbleweed to firestore.
    fb.firestore.collection('tumbleweeds').add(tumbleweedObj).then(docRef => {
      // Add tumbleweed success.
      resolve(docRef.id);
    }).catch(() => {
      // Add tumbleweed failed.
      reject();
    });
  });

  await promise.then(async (id) => {
    // Add tumbleweed success.
    logger.log('/tumbleweed/upload', `Uploaded tumbleweed: ${id}.`);
    res.status(200).json({ result: 'Tumbleweed uploaded successfully.' });
    // Update tumbleweed predictions.
    let predictedLocations = await funcs.getPredictedLocations(latitude, longitude);
    fb.getTumbleweedById(id, doc => {
      doc.ref.update({ predictedLocations: predictedLocations }).then(() => {
        // Update tumbleweed success.
        logger.log('/tumbleweed/upload', `Updated tumbleweed predicted locations: ${id}.`);
      }).catch(() => {
        // Update tumbleweed failed.
        logger.log('/tumbleweed/upload', 'Error updating tumbleweed predicted locations.');
      });
    }, () => {
      // Get tumbleweed failed.
      logger.log('/tumbleweed/upload', 'Error updating tumbleweed predicted locations.');
    });
  }).catch(() => {
    // Add tumbleweed failed.
    logger.log('/tumbleweed/upload', 'Error uploading tumbleweed.');
    res.status(500).send({ result: 'Error uploading tumbleweed.' });
  });
});

module.exports = router;
