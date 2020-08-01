const express = require('express');
const router = express.Router();
const multer = require('multer');

const fb = require('./../../utils/firebase');
const logger = require('./../../utils/log');
const funcs = require('./../../utils/funcs');
const upload = multer();

const moveTumbleweed = async (id, data, callback, failCallback) => {
  // Get new location and new predicted locations.
  let newLocation = data.location;
  if (data.predictedLocations.length >= 1) {
    newLocation = data.predictedLocations[0];
  }
  let predictedLocations = await funcs.getPredictedLocations(newLocation._latitude, newLocation._longitude);
  // Update tumbleweed in database.
  fb.getObjectById('tumbleweeds', id, doc => {
    // Get Tumbleweed success.
    doc.ref.update({
      location: newLocation,
      predictedLocations: predictedLocations,
      lastUpdateTime: Date.now()
    }).then(() => {
      // Update tumbleweed success.
      callback();
    }).catch(() => {
      // Update tumbleweed fail.
      failCallback();
    });
  }, () => {
    // Get tumbleweed fail.
    failCallback();
  });
}

const refreshTumbleweed = async (id, data, callback, failCallback) => {
  // Get new predicted locations.
  let predictedLocations = await funcs.getPredictedLocations(data.location._latitude, data.location._longitude);
  // Update tumbleweed in database.
  fb.getObjectById('tumbleweeds', id, doc => {
    // Get Tumbleweed success.
    doc.ref.update({
      predictedLocations: predictedLocations,
    }).then(() => {
      // Update tumbleweed success.
      callback();
    }).catch(() => {
      // Update tumbleweed fail.
      failCallback();
    });
  }, () => {
    // Get tumbleweed fail.
    failCallback();
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

  let promise = new Promise((resolve, reject) => {
    let updatedList = [];
    // Get tumbleweeds from firestore.
    fb.firestore.collection('tumbleweeds').get().then(snapshot => {
      // Get tumbleweeds success.
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
            // Move tumbleweed success.
            updatedList.push(id);
            if (--docsLeft === 0) {
              resolve(updatedList);
            }
          }, () => {
            // Move tumbleweed fail.
            reject();
          });
        }
        else if (forced) {
          refreshTumbleweed(id, data, () => {
            // Move tumbleweed success.
            if (--docsLeft === 0) {
              resolve(updatedList);
            }
          }, () => {
            // Move tumbleweed fail.
            reject();
          });
        }
        else {
          if (--docsLeft === 0) {
            resolve(updatedList);
          }
        }
      });
    }).catch(() => {
      // Get tumbleweeds fail.
      reject();
    });
  });

  await promise.then(updatedList => {
    // Update tumbleweed success.
    logger.log('/tumbleweed/update', `Updated tumbleweeds: ${JSON.stringify(updatedList)}`);
    res.status(200).send({ result: 'Updated tumbleweeds.' });
  }).catch(() => {
    // Update tumbleweed fail.
    logger.log('/tumbleweed/update', 'Error updating tumbleweeds.');
    res.status(500).send({ result: 'Error updating tumbleweeds.' });
  });
});

module.exports = router;
