import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  query,
  where,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
 import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// User ID setup
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = `guest-${crypto.randomUUID()}`;
  localStorage.setItem("userId", userId);
}

// Load Products
async function loadProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    const productList = document.getElementById("productList");
    let html = "";

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const discount = Math.round(((data.mrp - data.offerPrice) / data.mrp) * 100);
      const imageUrl = Array.isArray(data.images) ? data.images[0] : (data.images || "default.jpg");

      html += `
        <article class="product">
          <img src="${imageUrl}" alt="${data.title}" class="product-img">
          <span class="product-name">${data.title}</span>
          <span class="product-price">
            ₹${data.offerPrice}
            <span style="text-decoration:line-through; font-size: 0.8em;">₹${data.mrp}</span>
            <span style="color: green;">(${discount}% OFF)</span>
          </span>
          <span class="product-stock">Available: ${data.quantity}</span>
          <a href="A001.html?id=${data.productId}" class="button-light">
            View <i class="bx bx-right-arrow-alt button-icon"></i>
          </a>
          <button class="button-light add-to-cart" data-id="${docSnap.id}" style="margin-top: 10px;">
            Add to Cart <i class="bx bx-cart button-icon"></i>
          </button>
        </article>
      `;
    });

    productList.innerHTML = html;

    // Add to cart handlers
    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', async (e) => {
        const productId = e.currentTarget.dataset.id;
        await addToCart(productId);
      });
    });

    updateCartBadge();

  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

async function addToCart(productId) {
  try {
    const cartRef = collection(db, `users/${userId}/cart`);
    const existingQuery = query(cartRef, where("productId", "==", productId));
    const existingSnapshot = await getDocs(existingQuery);

    const productDoc = await getDoc(doc(db, "products", productId));
    if (!productDoc.exists()) {
      alert("This product no longer exists.");
      return;
    }

    const product = productDoc.data();
    if (product.quantity <= 0) {
      alert("This product is out of stock.");
      return;
    }

    if (!existingSnapshot.empty) {
      const cartDocRef = existingSnapshot.docs[0].ref;
      const current = existingSnapshot.docs[0].data();

      if (current.qty < product.quantity) {
        await updateDoc(cartDocRef, { qty: current.qty + 1 });
      } else {
        alert("You’ve reached the max stock available.");
      }
    } else {
      await addDoc(cartRef, {
        productId,
        title: product.title,
        price: product.offerPrice,
        qty: 1,
        image: Array.isArray(product.images) ? product.images[0] : (product.images || "default.jpg"),
        stock: product.quantity,
        userId
      });
    }

    updateCartBadge();
  } catch (err) {
    console.error("Error adding to cart:", err);
  }
}

async function updateCartBadge() {
  try {
    const cartRef = collection(db, `users/${userId}/cart`);
    const snapshot = await getDocs(cartRef);
    const count = snapshot.size;
    const badge = document.getElementById('cart-count');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-block" : "none";
    }
  } catch (err) {
    console.error("Failed to update cart badge:", err);
  }
}

loadProducts();