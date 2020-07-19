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
        snapshot.forEach(async doc => {  // snapshot.map() doesn't exist. Using forEach() instead.
          // Get Data.
          let id = doc.id;
          let data = doc.data();
          let updateElapsed = Date.now() - data.lastUpdateTime;
          // Update if last updated more than a day ago.
          if (updateElapsed < 1000 * 60 * 60 * 24) {  // 1 day.

            let predictedLocations = await funcs.getPredictedLocations(data.location._lat, data.location._long);
            
            db.collection('tumbleweeds').where('__name__', '==', id).get().then(function(querySnapshot) {
              querySnapshot.forEach(function(doc) {
                doc.ref.update({
                  predictedLocations: predictedLocations,
                  lastUpdateTime: Date.now()
                });
              });
            })
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
