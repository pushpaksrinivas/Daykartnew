// js/account.js
import { auth, db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const form = document.getElementById("accountForm");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("name").value = data.name || "";
      document.getElementById("phone").value = data.phone || "";
      document.getElementById("email").value = data.email || "";
      document.getElementById("regno").value = data.regno || "";
      document.getElementById("collegeName").value = data.collegeName || "";
      document.getElementById("referral").value = data.referralCode || "";
    }
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const loading = document.getElementById("loading");
  const popup = document.getElementById("popup");

  loading.style.display = "block"; // Show spinner

  const user = auth.currentUser;
  if (!user) {
    loading.style.display = "none";
    showPopup("User not logged in.", false);
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      regno: document.getElementById("regno").value,
      collegeName: document.getElementById("collegeName").value
    });

    showPopup("Account updated successfully!", true);
  } catch (error) {
    console.error("Update failed: ", error);
    showPopup("Update failed. Please try again.", false);
  } finally {
    loading.style.display = "none"; // Hide spinner
  }
});

// Helper to show popup messages
function showPopup(message, success) {
  const popup = document.getElementById("popup");
  popup.textContent = message;
  popup.style.backgroundColor = success ? "#4caf50" : "#f44336"; // Green or red
  popup.style.display = "block";

  setTimeout(() => {
    popup.style.display = "none";
  }, 3000); // Hide after 3 seconds
}


document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
});