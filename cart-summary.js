import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  getDoc,
  getDocs,
  collection,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let userId = localStorage.getItem("userId");
if (!userId) {
  userId = `guest-${crypto.randomUUID()}`;
  localStorage.setItem("userId", userId);
}

let mrpTotal = 0;
let offerTotal = 0;
let shipping = 0;

async function loadCartSummary() {
  const cartRef = collection(db, `users/${userId}/cart`);
  const cartSnap = await getDocs(cartRef);
  const cartItems = cartSnap.docs;

  if (cartItems.length === 0) {
    document.getElementById("mrpTotal").textContent = "0.00";
    document.getElementById("offerTotal").textContent = "0.00";
    document.getElementById("youSaved").textContent = "0.00";
    document.getElementById("shippingCharge").textContent = "0.00";
    document.getElementById("finalTotal").textContent = "0.00";
    return;
  }

  for (const docSnap of cartItems) {
    const data = docSnap.data();
    const productSnap = await getDoc(doc(db, `products/${data.productId}`));
    if (!productSnap.exists()) continue;

    const product = productSnap.data();
    mrpTotal += product.mrp * data.qty;
    offerTotal += product.offerPrice * data.qty;
  }

  const youSaved = mrpTotal - offerTotal;

  shipping = offerTotal < 499 ? 59 : offerTotal < 1499 ? 99 : 0;

  document.getElementById("mrpTotal").textContent = mrpTotal.toFixed(2);
  document.getElementById("offerTotal").textContent = offerTotal.toFixed(2);
  document.getElementById("youSaved").textContent = youSaved.toFixed(2);
  document.getElementById("shippingCharge").textContent = shipping.toFixed(2);
  document.getElementById("finalTotal").textContent = (offerTotal + shipping).toFixed(2);
}

loadCartSummary();
