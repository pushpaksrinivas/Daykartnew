// js/address.js
import { auth, db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const form = document.getElementById("addressForm");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data().address || {};
      document.getElementById("line1").value = data.line1 || "";
      document.getElementById("line2").value = data.line2 || "";
      document.getElementById("street").value = data.street || "";
      document.getElementById("city").value = data.city || "";
      document.getElementById("dist").value = data.dist || "";
      document.getElementById("state").value = data.state || "";
      document.getElementById("pincode").value = data.pincode || "";
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
    showPopup("User not logged in", false);
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      address: {
        line1: document.getElementById("line1").value,
        line2: document.getElementById("line2").value,
        street: document.getElementById("street").value,
        city: document.getElementById("city").value,
        dist: document.getElementById("dist").value,
        state: document.getElementById("state").value,
        pincode: document.getElementById("pincode").value,
      }
    });

    showPopup("Address updated successfully!", true);
  } catch (error) {
    console.error("Address update failed:", error);
    showPopup("Failed to update address. Please try again.", false);
  } finally {
    loading.style.display = "none"; // Hide spinner
  }
});

// Popup function
function showPopup(message, success = true) {
  const popup = document.getElementById("popup");
  popup.textContent = message;
  popup.style.backgroundColor = success ? "#4caf50" : "#f44336"; // Green or red
  popup.style.display = "block";

  setTimeout(() => {
    popup.style.display = "none";
  }, 3000); // Hide after 3s
}

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
});