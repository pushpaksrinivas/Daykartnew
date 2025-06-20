import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const adminContainer = document.getElementById("admin-container");
const loadingMsg = document.getElementById("loading-msg");

onAuthStateChanged(auth, async (user) => {
  console.log("Auth state changed. User:", user);

  if (!user) {
    alert("Please log in to access this page.");
    window.location.href = "../account/login.html"; // Make sure this file exists
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const data = userSnap.data();

    // Optional admin role check
    if (!data?.isAdmin) {
      alert("Admins only!");
     //  return window.location.href = "/unauthorized.html";
    }

    adminContainer.style.display = "block";
    loadingMsg.style.display = "none";
  } catch (err) {
    console.error("Error fetching user:", err);
    alert("Error verifying user.");
  }
});
