
import { auth } from './firebase-config.js';
import {
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.getElementById("resetBtn").onclick = async () => {
  const email = document.getElementById("email").value;
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Reset email sent!");
  } catch (err) {
    alert(err.message);
  }
};
