const firebase = require('firebase-admin');
const serviceAccount = require('./firebase-credentials.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: 'https://tumbleweed-go.firebaseio.com'
});

let firestore = firebase.firestore();
let auth = firebase.auth();

const getTumbleweedById = (id, callback = (() => {}), failCallback = (() => {})) => {
  firestore.collection('tumbleweeds').where('__name__', '==', id).get().then((querySnapshot) => {
    querySnapshot.forEach(doc => {    // Should only run once.
      callback(doc);
    });
    failCallback();  // Runs if no querySnapshot.
  });
}

module.exports = { firestore, auth, getTumbleweedById };
