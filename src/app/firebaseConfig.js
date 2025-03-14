// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCY9SoO84TzGUeU40rxAvhPVEGJRn4QMko",
  authDomain: "polling-app-882ec.firebaseapp.com",
  projectId: "polling-app-882ec",
  storageBucket: "polling-app-882ec.firebasestorage.app",
  messagingSenderId: "924030565668",
  appId: "1:924030565668:web:b7b279f9c1bca0389407b1",
  measurementId: "G-971GZ8P6Z6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
