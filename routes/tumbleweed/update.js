const express = require('express');
const router = express.Router();

const fb = require('./../../utils/firebase');
const funcs = require('./../../utils/funcs');

// Enable CORS.
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

router.post('/', async (req, res, next) => {

  let promise = new Promise(resolve => {
    // Get tumbleweeds from firestore.
    fb.getFirestore(db => {
      db.collection('tumbleweeds').get().then(snapshot => {
        snapshot.forEach(async docRef => {  // snapshot.map() doesn't exist. Using forEach() instead.
          // Get Data.
          let id = docRef.id;
          let data = docRef.data();
          let updateElapsed = Date.now() - data.lastUpdateTime;
          // Update if last updated more than a day ago.
          if (updateElapsed > 1000 * 60 * 60 * 24) {  // 1 day.

            let newLocation = predictedLocations[1];  // Get the new location based on past predictions. Should be relatively accurate since the weather forecast is accurate for the given day.
            let predictedLocations = await funcs.getPredictedLocations(data.location._lat, data.location._long);

            fb.getTumbleweedById(id, doc => {
              doc.ref.update({
                location: newLocation,
                predictedLocations: predictedLocations,
                lastUpdateTime: Date.now()
              });
            });
          }
        });
        // Finished.
        resolve();
      });
    });
  });

  await promise.then(() => {
    return res.status(200).send({ result: 'success' });
  });
});

module.exports = router;
