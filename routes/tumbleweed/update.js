const express = require('express');
const router = express.Router();

const fb = require('./../../utils/firebase');
const logger = require('./../../utils/log');
const funcs = require('./../../utils/funcs');

// Enable CORS.
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

router.post('/', async (req, res, next) => {

  let promise = new Promise(resolve => {
    let updatedList = [];
    // Get tumbleweeds from firestore.
    fb.getFirestore(db => {
      db.collection('tumbleweeds').get().then(snapshot => {
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
            // Get new location and new predicted locations.
            let newLocation = data.location;
            if (data.predictedLocations.length >= 1) {
              newLocation = data.predictedLocations[0];
            }
            let predictedLocations = await funcs.getPredictedLocations(newLocation._lat, newLocation._long);
            // Update tumbleweed in database.
            fb.getTumbleweedById(id, doc => {
              doc.ref.update({
                location: newLocation,
                predictedLocations: predictedLocations,
                lastUpdateTime: Date.now()
              }).then(() => {
                updatedList.push(id);
                // Resolve if all tumbleweeds were processed.
                docsLeft--;
                if (docsLeft === 0) {
                  resolve(updatedList);
                }
              });
            });
          }
          else {
            // Resolve if all tumbleweeds were processed.
            docsLeft--;
            if (docsLeft === 0) {
              resolve(updatedList);
            }
          }
        });
      });
    });
  });

  await promise.then(updatedList => {
    logger.log('/tumbleweed/update', `Updated tumbleweeds: ${JSON.stringify(updatedList)}`);
    res.status(200).send({ result: 'success' });
  });
});

module.exports = router;
