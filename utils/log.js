const firebase = require('firebase');

const fb = require('./firebase');

const log = (path, msg) => {

  fb.getFirestore(db => {
    db.collection('logs').add({
      time: new firebase.firestore.Timestamp(Math.floor(Date.now() / 1000)),
      path: path,
      message: msg
    });
  })
}

module.exports = {log};
