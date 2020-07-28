const firebase = require('firebase-admin');

const fb = require('./firebase');
const funcs = require('./funcs');

const getLogId = () => {
  let timeBased = funcs.padNumber(2 * Math.pow(10, 12) - Date.now(), 13);
  let randomBased = Math.floor(Math.random() * 10000000);
  return timeBased + '_' + randomBased;
}

const log = (path, msg) => {

  fb.firestore.collection('logs').doc(getLogId()).set({
    time: firebase.firestore.FieldValue.serverTimestamp(),
    path: path,
    message: msg
  }).catch(() => {});
}

module.exports = {log};
