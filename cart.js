import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get user ID from localStorage
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = `guest-${crypto.randomUUID()}`;
  localStorage.setItem("userId", userId);
}

// DOM Elements
const cartRef = collection(db, `users/${userId}/cart`);
const cartItemsContainer = document.getElementById("cart-items");
const totalEl = document.getElementById("total");
const cartCountEl = document.getElementById("cart-count");

// Sync cart to localStorage with extra fields
async function syncCartToLocalStorage() {
  const snapshot = await getDocs(cartRef);
  const cartDocs = snapshot.docs;

  const productPromises = cartDocs.map(docSnap => {
    const cartItem = docSnap.data();
    return getDoc(doc(db, `products/${cartItem.productId}`));
  });

  const productSnaps = await Promise.all(productPromises);

  const cartItems = cartDocs.map((cartDoc, i) => {
    const cartData = cartDoc.data();
    const productSnap = productSnaps[i];

    if (!productSnap.exists()) return null;

    const product = productSnap.data();

    return {
      title: cartData.title,
      image: cartData.image,
      productId: cartData.productId,
      qty: cartData.qty,
      offerPrice: product.offerPrice,
      mrp: product.mrp
    };
  }).filter(item => item !== null);

  localStorage.setItem("cart", JSON.stringify(cartItems));
}

async function loadCart() {
  try {
    const snapshot = await getDocs(cartRef);
    const cartDocs = snapshot.docs;

    if (cartDocs.length === 0) {
      cartItemsContainer.innerHTML = `<p style="text-align:center;">🛒 Your cart is empty.</p>`;
      totalEl.textContent = "0.00";
      cartCountEl.textContent = "0";
      cartCountEl.style.display = "none";

      // Reset summary values
      document.getElementById("mrpTotal").textContent = "0.00";
      document.getElementById("offerTotal").textContent = "0.00";
      document.getElementById("youSaved").textContent = "0.00";

      // Clear local cart
      localStorage.removeItem("cart");
      return;
    }

    const productPromises = cartDocs.map(docSnap => {
      const cartItem = docSnap.data();
      return getDoc(doc(db, `products/${cartItem.productId}`));
    });

    const productSnaps = await Promise.all(productPromises);

    cartItemsContainer.innerHTML = "";
    let mrpTotal = 0;
    let offerTotal = 0;

    cartDocs.forEach((cartDoc, i) => {
      const cartData = cartDoc.data();
      const cartId = cartDoc.id;
      const productSnap = productSnaps[i];

      if (!productSnap.exists()) return;

      const product = productSnap.data();
      const qty = cartData.qty;

      const mrp = product.mrp;
      const offerPrice = product.offerPrice;

      mrpTotal += mrp * qty;
      offerTotal += offerPrice * qty;

      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <div class="cart-product">
          <img src="${cartData.image}" alt="${cartData.title}" class="cart-img" width="80">
          <div class="cart-details">
            <span><strong>${cartData.title}</strong></span>
            <span>MRP: ₹${mrp}</span>
            <span>Offer Price: ₹${offerPrice}</span>
            <span>Available: ${product.quantity}</span>
            <div class="cart-qty-controls">
              <button class="qty-btn" data-action="decrease" data-id="${cartId}">−</button>
              <span>${qty}</span>
              <button class="qty-btn" data-action="increase" data-id="${cartId}" ${qty >= product.quantity ? "disabled" : ""}>+</button>
              <button class="delete-btn" data-id="${cartId}" style="margin-left: 10px; color: red;">🗑️</button>
            </div>
            <span>Item Total: ₹${(offerPrice * qty).toFixed(2)}</span>
          </div>
        </div>
      `;
      cartItemsContainer.appendChild(div);
    });

    const youSaved = mrpTotal - offerTotal;

    totalEl.textContent = offerTotal.toFixed(2); // Grand Total
    document.getElementById("mrpTotal").textContent = mrpTotal.toFixed(2);
    document.getElementById("offerTotal").textContent = offerTotal.toFixed(2);
    document.getElementById("youSaved").textContent = youSaved.toFixed(2);
    cartCountEl.textContent = cartDocs.length;
    cartCountEl.style.display = "inline-block";

    // Update localStorage with latest cart
    await syncCartToLocalStorage();

    // Attach quantity & delete buttons
    document.querySelectorAll(".qty-btn").forEach((btn) => {
      btn.addEventListener("click", handleQtyChange);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", handleDeleteItem);
    });

  } catch (err) {
    console.error("Error loading cart:", err);
  }
}

async function handleQtyChange(e) {
  const button = e.currentTarget;
  const cartId = button.dataset.id;
  const action = button.dataset.action;

  button.disabled = true;

  try {
    const cartItemRef = doc(db, `users/${userId}/cart/${cartId}`);
    const cartSnap = await getDoc(cartItemRef);
    if (!cartSnap.exists()) return;

    const cartData = cartSnap.data();
    const productSnap = await getDoc(doc(db, `products/${cartData.productId}`));
    if (!productSnap.exists()) return;

    const product = productSnap.data();
    let qty = cartData.qty;

    if (action === "increase" && qty < product.quantity) {
      qty++;
    } else if (action === "decrease") {
      if (qty > 1) {
        qty--;
      } else {
        await deleteDoc(cartItemRef);
        await loadCart();
        return;
      }
    }

    await updateDoc(cartItemRef, { qty });
    await loadCart();
  } catch (err) {
    console.error("Failed to update quantity:", err);
  } finally {
    button.disabled = false;
  }
}

async function handleDeleteItem(e) {
  const cartId = e.currentTarget.dataset.id;
  const confirmed = confirm("Are you sure you want to remove this item?");
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, `users/${userId}/cart/${cartId}`));
    await loadCart();
  } catch (err) {
    console.error("Error deleting cart item:", err);
  }
}

// Checkout button
document.getElementById("checkoutBtn").addEventListener("click", () => {
  const popup = document.getElementById("popup");
  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
    window.location.href = "/checkout.html";
  }, 1000);
});

// Load the cart on page load
loadCart();
