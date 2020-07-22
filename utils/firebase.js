const firebase = require('firebase');

const config = {
  apiKey: process.env.API_KEY,
  authDomain: "tumbleweed-go.firebaseapp.com",
  databaseURL: "https://tumbleweed-go.firebaseio.com",
  projectId: "tumbleweed-go",
  storageBucket: "tumbleweed-go.appspot.com",
  messagingSenderId: "132451553649",
  appId: "1:132451553649:web:dafeed78152385c486a6d0"
};

let fb = null;

const getFirestore = (callback = (() => {})) => {
  if (fb) {
    callback(fb.firestore());
    return
  }
  else {
    fb = firebase.initializeApp(config);
    callback(fb.firestore());
  }
}

const getTumbleweedById = (id, callback = (() => {}), failCallback = (() => {})) => {
  getFirestore(db => {
    db.collection('tumbleweeds').where('__name__', '==', id).get().then((querySnapshot) => {
      querySnapshot.forEach(doc => {    // Should only run once.
        callback(doc);
      });
      failCallback();  // Runs if no querySnapshot.
    });
  });
}

module.exports = { getFirestore, getTumbleweedById };
