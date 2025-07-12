// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsP80XFSykRlteD8LTQaw76TD8AJItMFw",
  authDomain: "daykart-77771.firebaseapp.com",
  databaseURL: "https://daykart-77771-default-rtdb.firebaseio.com",
  projectId: "daykart-77771",
  storageBucket: "daykart-77771.firebasestorage.app",
  messagingSenderId: "533666061468",
  appId: "1:533666061468:web:a40c38b11a93a18e776159",
  measurementId: "G-X1FCYK4XR1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
