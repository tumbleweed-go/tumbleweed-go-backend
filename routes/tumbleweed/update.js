const express = require('express');
const router = express.Router();
const multer = require('multer');

const fb = require('./../../utils/firebase');
const logger = require('./../../utils/log');
const funcs = require('./../../utils/funcs');
const upload = multer();

const moveTumbleweed = async (id, data, callback) => {
  // Get new location and new predicted locations.
  let newLocation = data.location;
  if (data.predictedLocations.length >= 1) {
    newLocation = data.predictedLocations[0];
  }
  let predictedLocations = await funcs.getPredictedLocations(newLocation._latitude, newLocation._longitude);
  // Update tumbleweed in database.
  fb.getTumbleweedById(id, doc => {
    doc.ref.update({
      location: newLocation,
      predictedLocations: predictedLocations,
      lastUpdateTime: Date.now()
    }).then(() => {
      callback();
    });
  });
}

const refreshTumbleweed = async (id, data, callback) => {
  // Get new predicted locations.
  let predictedLocations = await funcs.getPredictedLocations(data.location._latitude, data.location._longitude);
  // Update tumbleweed in database.
  fb.getTumbleweedById(id, doc => {
    doc.ref.update({
      predictedLocations: predictedLocations,
    }).then(() => {
      callback();
    });
  });
}

// Enable CORS.
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

router.post('/', upload.none(), async (req, res, next) => {

  let forced = (req.body && req.body.forced === 'true') ? true : false;

  let promise = new Promise(resolve => {
    let updatedList = [];
    // Get tumbleweeds from firestore.
    fb.firestore.collection('tumbleweeds').get().then(snapshot => {
      // Loop through all tumbleweeds.
      let docsLeft = snapshot.size;
      snapshot.forEach(async docRef => {
        // Get Data.
        let id = docRef.id;
        let data = docRef.data();
        let updateElapsed = Date.now() - data.lastUpdateTime;
        let dayElapsedTime = 1000 * 60 * 60 * 24;
        // Update at most every 24 hrs.
        if (updateElapsed > dayElapsedTime) {
          moveTumbleweed(id, data, () => {
            updatedList.push(id);
            if (--docsLeft === 0) {
              resolve(updatedList);
            }
          });
        }
        else if (forced) {
          refreshTumbleweed(id, data, () => {
            if (--docsLeft === 0) {
              resolve(updatedList);
            }
          });
        }
        else {
          if (--docsLeft === 0) {
            resolve(updatedList);
          }
        }
      });
    });
  });

  await promise.then(updatedList => {
    logger.log('/tumbleweed/update', `Updated tumbleweeds: ${JSON.stringify(updatedList)}`);
    res.status(200).send({ result: 'success' });
  });
});

module.exports = router;
