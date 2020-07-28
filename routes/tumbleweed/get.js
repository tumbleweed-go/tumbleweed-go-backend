const express = require('express');
const router = express.Router();

const fb = require('./../../utils/firebase');
const logger = require('./../../utils/log');

// Enable CORS.
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

router.get('/', async (req, res, next) => {

  let promise = new Promise((resolve, reject) => {
    // Get tumbleweeds from firestore.
    fb.firestore.collection('tumbleweeds').get().then(snapshot => {
      let found = [];
      snapshot.forEach(docRef => {  // snapshot.map() doesn't exist. Using forEach() instead.
        found.push({
          ...{ _id: docRef.id },
          ...docRef.data()
        })
      });
      // Finished.
      resolve(found);
    }).catch(() => {
      reject();
    });
  });

  await promise.then(found => {
    // Get tumbleweed success.
    logger.log('/tumbleweed/get', 'Retrieved tumbleweeds.');
    res.status(200).send({ result: found });
  }).catch(() => {
    // Get tumbleweed fail.
    logger.log('/tumbleweed/get', 'Error getting tumbleweeds.');
    res.status(200).send({ result: 'Error getting tumbleweeds.' });
  });
});

module.exports = router;
