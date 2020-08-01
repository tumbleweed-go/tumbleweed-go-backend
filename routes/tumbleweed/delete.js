const express = require('express');
const router = express.Router();
const multer = require('multer');

const fb = require('./../../utils/firebase');
const logger = require('./../../utils/log');
const upload = multer();

// Enable CORS.
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

router.post('/', upload.none(), async (req, res, next) => {

  // Validate file input.
  if (!req.body) {
    return res.status(500).json({ result: 'Missing req.body.' });
  }
  if (!req.body.id) {
    return res.status(400).json({ result: 'Missing tumbleweed ID.' });
  }

  let deleteId = req.body.id;

  let promise = new Promise((resolve, reject) => {
    fb.getObjectById('tumbleweeds', deleteId, () => {
      // Find tumbleweed success.
      fb.firestore.collection('tumbleweeds').doc(deleteId).delete().then(() => {
        // Delete tumbleweed success.
        resolve();
      }).catch(() => {
        // Delete tumbleweed fail.
        reject();
     });
    }, () => {
      // Find tumbleweed fail.
      reject();
    });
  });

  await promise.then(() => {
    // Delete tumbleweed success.
    logger.log('/tumbleweed/delete', `Deleted tumbleweed: ${deleteId}.`);
    res.status(200).send({ result: 'Deleted tumbleweed.' });
  }).catch(() => {
    // Delete tumbleweed fail.
    logger.log('/tumbleweed/delete', 'Error deleting tumbleweed.');
    res.status(500).send({ result: 'Error deleting tumbleweed.' });
  });
});

module.exports = router;
