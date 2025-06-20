// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔢 Generate Random Order ID
function generateOrderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

// ✅ Check if it's the user's first order
async function isFirstOrder(uid) {
  const q = query(collection(db, "orders"), where("userId", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

// 🎁 Reward referrer for eligible order
async function rewardReferrerIfEligible(userData, orderTotal) {
  if (orderTotal <= 2499 || !userData.referredBy) return;

  const refQuery = query(collection(db, "users"), where("referralCode", "==", userData.referredBy));
  const refSnapshot = await getDocs(refQuery);

  if (!refSnapshot.empty) {
    const referrerDoc = refSnapshot.docs[0];
    const referrerId = referrerDoc.id;
    const referrerData = referrerDoc.data();
    const referrerRef = doc(db, "users", referrerId);

    const newBalance = (referrerData.referralBalance || 0) + 50;

    // Update balance
    await updateDoc(referrerRef, {
      referralBalance: newBalance
    });

    // Record the earning
    const earningRef = doc(collection(db, `users/${referrerId}/referralEarnings`));
    await setDoc(earningRef, {
      referredUserName: userData.name || "Anonymous",
      referredUserEmail: userData.email || "N/A",
      amountCredited: 50,
      timestamp: serverTimestamp()
    });
  }
}

// 🧠 Prefill order form with user data
async function prefillForm(uid) {
  const userRef = doc(db, "users", uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const nameParts = (data.name || "").split(" ");

    document.querySelector("input[placeholder='First name *']").value = nameParts[0] || "";
    document.querySelector("input[placeholder='Last name']").value = nameParts.slice(1).join(" ") || "";
    document.getElementById("email").value = data.email || "";
    document.getElementById("collegeName").value = data.collegeName || "";
    document.querySelector("input[placeholder='Phone *']").value = data.phone || "";
  }
}

// 🛒 Save the order and process logic
async function saveOrderToFirebase(uid) {
  // Show loading popup
  const loadingEl = document.getElementById("loadingOverlay");
  if (loadingEl) loadingEl.style.display = "flex";

  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];

  const coupon = document.getElementById("couponCode")?.value.trim().toUpperCase() || "";
  const subtotal = parseFloat(document.getElementById("subtotal")?.textContent.replace("₹", "")) || 0;
  let total = parseFloat(document.getElementById("total")?.textContent.replace("₹", "")) || 0;
  const saved = parseFloat(document.getElementById("youSaved")?.textContent.replace("₹", "")) || 0;
  const discount = saved;

  if (cartItems.length === 0 || total <= 0) {
    if (loadingEl) loadingEl.style.display = "none";
    alert("Your cart is empty or the total is invalid.");
    return;
  }

  const userDoc = await getDoc(doc(db, "users", uid));
  const userData = userDoc.exists() ? userDoc.data() : {};
  const { email = "", collegeName = "", name = "", phone = "" } = userData;

  const paymentMethod = document.querySelector("input[name='payment']:checked")?.value || "UPI";

  let shipping = 0;
  const isFirst = await isFirstOrder(uid);

  if (!isFirst) {
    if (total < 499) shipping = 59;
    else if (total < 1499) shipping = 99;
  }

  if (paymentMethod === "COD") shipping += 100;

  const shippingFeeEl = document.getElementById("shippingFee");
  if (shippingFeeEl) shippingFeeEl.textContent = `₹${shipping}`;

  const orderId = generateOrderId();
  const finalTotal = total + shipping;

  const orderData = {
    orderId,
    userId: uid,
    name,
    email,
    college: collegeName,
    phone,
    items: cartItems,
    subtotal,
    total: finalTotal,
    discount,
    saved,
    coupon,
    shipping,
    paymentMethod,
    firstOrder: isFirst,
    timestamp: serverTimestamp()
  };

  try {
    await runTransaction(db, async (transaction) => {
      const productRefs = cartItems.map(item => doc(db, "products", item.productId));
      const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));

      productSnaps.forEach((snap, index) => {
        const item = cartItems[index];
        if (!snap.exists()) throw new Error(`Product not found: ${item.productId}`);
        const productData = snap.data();
        if ((productData.quantity || 0) < item.qty) {
          throw new Error(`Insufficient stock for: ${productData.name}`);
        }
      });

      productSnaps.forEach((snap, index) => {
        const newQty = snap.data().quantity - cartItems[index].qty;
        transaction.update(productRefs[index], { quantity: newQty });
      });

      const orderRef = doc(collection(db, "orders"));
      transaction.set(orderRef, orderData);
    });

    // Clear user's cart in Firestore
    const cartRef = collection(db, `users/${uid}/cart`);
    const cartSnap = await getDocs(cartRef);
    const deletePromises = cartSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    await rewardReferrerIfEligible(userData, subtotal);
    localStorage.removeItem("cart");

    if (loadingEl) loadingEl.style.display = "none";

    alert(`Order placed successfully! Your Order ID is ${orderId}`);
    window.location.href = "/account/orders.html";

  } catch (error) {
    console.error("Order placement failed:", error);
    if (loadingEl) loadingEl.style.display = "none";
    alert(`Order failed: ${error.message}`);
  }
}


// ✅ On page load
window.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const uid = user.uid;
      prefillForm(uid);
      const btn = document.getElementById("placeOrderBtn");
      if (btn) {
        btn.addEventListener("click", () => saveOrderToFirebase(uid));
      }
    } else {
      alert("Please log in to place an order.");
      window.location.href = "/login.html";
    }
  });
});
