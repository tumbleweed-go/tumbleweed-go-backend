const express = require('express');
const router = express.Router();

const fb = require('./../../utils/firebase');

router.get('/', async (req, res, next) => {

  let promise = new Promise(resolve => {
    // Get tumbleweeds from firestore.
    fb.getFirestore(db => {
      db.collection('tumbleweeds').get().then(snapshot => {
        let found = [];
        snapshot.forEach(doc => found.push(doc.data()));  // snapshot.map() doesn't exist. Using forEach() instead.
        // Finished.
        resolve(found);
      });
    });
  });

  await promise.then(found => {
    return res.status(200).send({ result: found });
  });
});

module.exports = router;
