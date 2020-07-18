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

const getFirestore = (callback = null) => {
  if (fb) {
    callback(fb.firestore());
    return
  }
  else {
    fb = firebase.initializeApp(config);
    callback(fb.firestore());
  }
}

module.exports = { getFirestore };
