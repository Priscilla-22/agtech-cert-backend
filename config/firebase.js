const admin = require('firebase-admin');

const firebaseConfig = {
  apiKey: "AIzaSyCnn7chE7cLE57VPhkfflIX_X5B4c76T9s",
  authDomain: "pesira-620dc.firebaseapp.com",
  projectId: "pesira-620dc",
  storageBucket: "pesira-620dc.firebasestorage.app",
  messagingSenderId: "870942666388",
  appId: "1:870942666388:web:30f8bf42582a8d1b1f8e81",
  measurementId: "G-BX0NC8K8FR"
};

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    // credential: admin.credential.applicationDefault(), // Use this in production
  });
}

const auth = admin.auth();

module.exports = {
  auth,
  firebaseConfig
};