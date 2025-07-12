import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// UI Toggle
const container = document.querySelector('.container');
document.querySelector('.register-btn').addEventListener('click', () => container.classList.add('active'));
document.querySelector('.login-btn').addEventListener('click', () => container.classList.remove('active'));

// Helper: Referral code generator
function generateReferralCodeFromInput(username, email) {
  const getSafeString = (str, len, fromEnd = false) => {
    if (!str) return '';
    return fromEnd
      ? str.slice(-len).padStart(len, 'X')
      : str.slice(0, len).padEnd(len, 'X');
  };

  const part1 = getSafeString(username, 2).toUpperCase();
  const part2 = getSafeString(email, 2, true).toUpperCase(); // Take last 2 chars of email
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return `${part1}${part2}${randomPart}`;
}

async function generateUniqueReferralCode(username = "", email = "") {
  let referralCode, isUnique = false;
  while (!isUnique) {
    referralCode = generateReferralCodeFromInput(username, email);
    const q = query(collection(db, "users"), where("referralCode", "==", referralCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) isUnique = true;
  }
  return referralCode;
}


window.addEventListener('DOMContentLoaded', () => {
  const savedEmail = localStorage.getItem('rememberedEmail');
  const rememberMe = document.getElementById('rememberMe');

  if (savedEmail) {
    document.getElementById('email').value = savedEmail;
    rememberMe.checked = true;
  }
});

// Login
document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorPopup = document.getElementById("errorPopup");
  const rememberMe = document.getElementById("rememberMe");

  try {
    await signInWithEmailAndPassword(auth, email, password);

    // Store or clear remembered email
    if (rememberMe.checked) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    window.location.href = "/index.html";
  } catch (err) {
    errorPopup.textContent = err.message;
    errorPopup.style.display = "block";
    setTimeout(() => errorPopup.style.display = "none", 5000);
  }
};

// Register
document.getElementById("signupBtn").onclick = async () => {
  const username = document.getElementById("username").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const confirm = document.getElementById("confirmpass").value;
  const refInput = document.getElementById("refcode").value;

  if (password !== confirm) return alert("Passwords do not match.");

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    const referralCode = await generateUniqueReferralCode(username, email);

    await setDoc(doc(db, "users", uid), {
      username,
      email,
      referralCode,
      referredBy: refInput || null,
      uid
    });

    console.log("User created successfully. Redirecting...");
    window.location.href = "/index.html";
  } catch (err) {
    alert("Signup error: " + err.message);
  }
};


// Google Signup/Login
document.querySelectorAll("#googleSignup").forEach(btn => {
  btn.onclick = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const uid = result.user.uid;
      const docRef = doc(db, "users", uid);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        const referralCode = await generateUniqueReferralCode();
        await setDoc(docRef, {
          username: result.user.displayName || "User",
          regno: "",
          email: result.user.email,
          referralCode,
          referredBy: null,
          uid
        });
      }
      window.location.href = "/index.html";
    } catch (err) {
      alert("Google signup error: " + err.message);
    }
  };
});

document.querySelectorAll('.toggle-password').forEach(icon => {
  icon.addEventListener('click', () => {
    const target = document.querySelector(icon.getAttribute('toggle'));
    if (target.type === "password") {
      target.type = "text";
      icon.classList.remove('bxs-lock-alt');
      icon.classList.add('bxs-lock-open');
    } else {
      target.type = "password";
      icon.classList.remove('bxs-lock-open');
      icon.classList.add('bxs-lock-alt');
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
});