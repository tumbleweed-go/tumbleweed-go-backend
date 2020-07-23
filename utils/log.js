const firebase = require('firebase');

const fb = require('./firebase');
const funcs = require('./funcs');

const getLogId = () => {
  let timeBased = funcs.padNumber(2 * Math.pow(10, 12) - Date.now(), 13);
  let randomBased = Math.floor(Math.random() * 10000000);
  return timeBased + '_' + randomBased;
}

const log = (path, msg) => {

  let time = Math.floor(Date.now() / 1000);

  fb.getFirestore(db => {
    db.collection('logs').doc(getLogId()).set({
      time: new firebase.firestore.Timestamp(time),
      path: path,
      message: msg
    });
  })
}

module.exports = {log};
