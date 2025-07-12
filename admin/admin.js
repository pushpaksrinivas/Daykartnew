import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("productForm");
const status = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const mrp = parseFloat(document.getElementById("mrp").value);
  const offerPrice = parseFloat(document.getElementById("offerPrice").value);
  const quantity = parseInt(document.getElementById("quantity").value);
  const category = document.getElementById("category").value.trim();
  const imageInput = document.getElementById("images").value.trim();

  if (!title || !description || !mrp || !offerPrice || !quantity || !category || !imageInput) {
    return alert("Please fill all fields.");
  }

  const images = imageInput.split(",").map(url => url.trim()).filter(url => url);
  const discountPercent = Math.round(((mrp - offerPrice) / mrp) * 100);

  const newProduct = {
    title,
    description,
    mrp,
    offerPrice,
    quantity,
    stock: quantity,
    images,
    discountPercent,
    category,
    createdAt: Date.now()
  };

  try {
    const docRef = await addDoc(collection(db, "products"), newProduct);

    // Optional: Save productId inside the document
    await updateDoc(docRef, { productId: docRef.id });

    status.innerHTML = `✅ Product added!<br>Product ID: <strong>${docRef.id}</strong>`;
    form.reset();
  } catch (err) {
    console.error("Error adding product:", err);
    status.textContent = "❌ Error adding product!";
    status.style.color = "red";
  }
});
