const express = require('express');
const router = express.Router();
const multer = require('multer');
const vision = require('@google-cloud/vision');
const colorsys = require('colorsys');
const firebase = require('firebase');

const fb = require('./../../utils/firebase');
const funcs = require('./../../utils/funcs');
const upload = multer({ dest: './uploads' });

// File upload fields for POST request.
const uploadFields = [
  { name: 'image', maxCount: 1 }
];

const isTumbleweedColour = (hsv) => {

  let range = {
    h: { low: 25, high: 45 },
    s: { low: 20, high: 65 },
    v: { low: 50, high: 80 }
  };

  // Check for correct hue.
  if (hsv.h < range.h.low || hsv.h > range.h.high) {
    return false;
  }
  // Check for correct saturation.
  if (hsv.s < range.s.low || hsv.s > range.s.high) {
    return false;
  }
  // Check for correct value.
  if (hsv.v < range.v.low || hsv.v > range.v.high) {
    return false;
  }

  return true;
}

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
    return res.status(500).json({ result: 'Missing req.files' });
  }
  if (!req.files.image) {
    return res.status(400).json({ result: 'Missing image' });
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

  // Round coordinates to 5 decimal places.
  latitude = Math.round(latitude * 100000) / 100000;
  longitude = Math.round(longitude * 100000) / 100000;

  // IMAGE DETECTION

  let isPlant = false;
  let correctColour = false

  let imageFileName = req.files.image[0].filename;
  let imageDir = __dirname + `/../../uploads/${imageFileName}`;

  // Detect if image has plant.
  let [ labelPropertiesResults ] = await new vision.ImageAnnotatorClient().labelDetection(imageDir);
  let labels = labelPropertiesResults.labelAnnotations;
  labels.forEach(label => {
    if (label.description === 'Plant') {
      isPlant = true;
    }
  });

  // Detect if image is the correct colour.
  let [ imagePropertiesResult ] = await new vision.ImageAnnotatorClient().imageProperties(imageDir);
  let colours = imagePropertiesResult.imagePropertiesAnnotation.dominantColors.colors;
  if (colours.length > 0) {  // Only check the first colour (the most prominent one).
    let rgb = colours[0].color;
    let hsv = colorsys.rgb_to_hsv(rgb.red, rgb.green, rgb.blue);
    correctColour = isTumbleweedColour(hsv);
  }

  // Exit if not tumbleweed.
  if (!isPlant || !correctColour) {
    return res.status(400).json({ result: 'Image doesn\'t contain a tumbleweed.' });
  }

  // UPLOAD COORDINATES

  let predictedLocations = await funcs.getPredictedLocations(latitude, longitude);

  let promise = new Promise(resolve => {
    // Add tumbleweed to firestore.
    fb.getFirestore(db => {
      db.collection('tumbleweeds').add({
        location: new firebase.firestore.GeoPoint(latitude, longitude),
        predictedLocations: predictedLocations,
        lastUpdateTime: Date.now()
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
