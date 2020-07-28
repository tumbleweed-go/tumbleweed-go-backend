const firebase = require('firebase-admin');
const serviceAccount = require('./firebase-credentials.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: 'https://tumbleweed-go.firebaseio.com'
});

let firestore = firebase.firestore();
let auth = firebase.auth();

const getTumbleweedById = (id, callback, failCallback) => {
  //console.log('get tumbleweed by id: ' + id);
  firestore.collection('tumbleweeds').where('__name__', '==', id).get().then((querySnapshot) => {
    if (querySnapshot.size === 0) {
      failCallback();
    }
    else {
      querySnapshot.forEach(doc => {    // Should only run once.
        callback(doc);
      });
    }
  });
}

module.exports = { firestore, auth, getTumbleweedById };
