// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxM57Rx4SZHvmQJw2wPhhojMdycGbTw9c",
  authDomain: "vk-chat-175ec.firebaseapp.com",
  databaseURL: "https://vk-chat-175ec-default-rtdb.europe-west1.firebasedatabase.app", // ← добавь эту строку
  projectId: "vk-chat-175ec",
  storageBucket: "vk-chat-175ec.firebasestorage.app",
  messagingSenderId: "903186405095",
  appId: "1:903186405095:web:968f0d753721368dacb442",
  measurementId: "G-LP39QRP10M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);