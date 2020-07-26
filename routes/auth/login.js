const express = require('express');
const router = express.Router();

const fb = require('./../../utils/firebase');

// Enable CORS.
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

router.post('/:email/:password', async (req, res, next) => {

  // Parse input from req.params.
  let email = req.params.email;
  let password = req.params.password;

  console.log(email, password);

  res.status(200).json({ result: 'test' });
});

module.exports = router;
