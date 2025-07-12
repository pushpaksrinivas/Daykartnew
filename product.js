import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

if (!productId) {
  alert("Missing product ID in URL.");
  throw new Error("Product ID is required.");
}

// Get or create user ID
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = `guest-${crypto.randomUUID()}`;
  localStorage.setItem("userId", userId);
}

// Firestore references
const productRef = doc(db, `products/${productId}`);
const cartRef = collection(db, `users/${userId}/cart`);

// DOM elements
const productName = document.getElementById("product-name");
const offerPrice = document.getElementById("offer-price");
const mrp = document.getElementById("mrp");
const discount = document.getElementById("discount");
const availableQty = document.getElementById("available-qty");
const productDescription = document.getElementById("product-description");
const quantityInput = document.querySelector(".purchase-info input");
const addToCartBtn = document.getElementById("add-to-cart");
const buyNowBtn = document.getElementById("buy-now");

async function loadProduct() {
  try {
    const snap = await getDoc(productRef);
    if (!snap.exists()) {
      productName.textContent = "Product not found";
      return;
    }

    const product = snap.data();

    // Set product details
    productName.textContent = product.title || "Unnamed Product";
offerPrice.textContent = product.offerPrice;
mrp.textContent = product.mrp;
productDescription.textContent = product.description || "No description available";
availableQty.textContent = product.quantity;

const discountPercent = product.discountPercent !== undefined
  ? product.discountPercent
  : Math.round(((product.mrp - product.offerPrice) / product.mrp) * 100);
discount.textContent = `${discountPercent}`;

    // Image handling
    const images = Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.image || "fallback.jpg"];

    const showcase = document.querySelector(".img-showcase");
    const selectors = document.querySelector(".img-select");

    showcase.innerHTML = images.map(img => `<img src="${img}" alt="product-img">`).join("");
    selectors.innerHTML = images.map((img, i) => `
      <div class="img-item">
        <a href="#" data-id="${i + 1}">
          <img src="${img}" alt="product-img">
        </a>
      </div>
    `).join("");

    document.querySelectorAll(".img-item a").forEach((btn, i) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showcase.style.transform = `translateX(-${100 * i}%)`;
      });
    });
  } catch (error) {
    console.error("Error loading product:", error);
  }
}

addToCartBtn.addEventListener("click", async () => {
  const qty = parseInt(quantityInput.value);
  if (qty <= 0) {
    return alert("Please enter a valid quantity");
  }
  if (qty > product.quantity) {
  return alert("Not enough stock available");
}

  try {
    const snap = await getDoc(productRef);
    if (!snap.exists()) return;

    const product = snap.data();
    if (qty > product.stock) {
      return alert("Not enough stock available");
    }

    const cartSnapshot = await getDocs(cartRef);
    let existing = null;

    cartSnapshot.forEach(docSnap => {
      const item = docSnap.data();
      if (item.productId === productId) {
        existing = { ...item, id: docSnap.id };
      }
    });

    if (existing) {
      const newQty = Math.min(existing.qty + qty, product.stock);
      const existingRef = doc(db, `users/${userId}/cart/${existing.id}`);
      await updateDoc(existingRef, { qty: newQty });
    } else {
      await addDoc(cartRef, {
        productId,
        qty,
        addedAt: Date.now()
      });
    }

    alert("Item added to cart!");
    updateCartBadge();
  } catch (error) {
    console.error("Error adding to cart:", error);
  }
});

buyNowBtn.addEventListener("click", () => {
  alert("Redirecting to checkout...");
  // Here you could redirect: window.location.href = "/checkout.html?id=" + productId;
});

async function updateCartBadge() {
  try {
    const cartSnapshot = await getDocs(cartRef);
    let count = 0;
    cartSnapshot.forEach(doc => {
      count += doc.data().qty || 1;
    });

    const cartCountEl = document.querySelector(".bx-shopping-bag");
    if (cartCountEl) {
      cartCountEl.setAttribute("data-count", count);
    }
  } catch (error) {
    console.error("Error updating cart badge:", error);
  }
}

// Debugging Logs (optional)
console.log("Product ID:", productId);
console.log("User ID:", userId);

loadProduct();
updateCartBadge();
