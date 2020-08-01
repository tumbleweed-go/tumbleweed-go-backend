const firebase = require('firebase-admin');
const serviceAccount = require('./firebase-credentials.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: 'https://tumbleweed-go.firebaseio.com'
});

let firestore = firebase.firestore();
let auth = firebase.auth();

const getUserByToken = async (token) => {

  let uid = null;
  let promise = new Promise(resolve => {
    auth.verifyIdToken(token).then(decodedToken => {
      // User exists.
      uid = decodedToken.uid;
      resolve();
    }).catch(() => {
      // User doesn't exist.
      // Keep uid as null.
      resolve();
    });
  });

  await promise;
  return uid;
}

const getObjectById = (collection, id, callback, failCallback) => {
  firestore.collection(collection).where('__name__', '==', id).get().then(snapshot => {
    // Get object success.
    if (snapshot.size === 0) {
      // Tumbleweed doesn't exist.
      failCallback('no-object');
    }
    else {
      // Tubleweed exists.
      snapshot.forEach(docRef => {    // Should only run once.
        callback(docRef);
      });
    }
  }).catch(() => {
    // Get object fail.
    failCallback('no-connection');
  });
}

module.exports = { firestore, auth, getUserByToken, getObjectById };
