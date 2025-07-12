import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const productList = document.getElementById('product-list');

async function loadProducts() {
  const querySnapshot = await getDocs(collection(db, 'products'));
  productList.innerHTML = '';

  querySnapshot.forEach((productDoc) => {
    const product = productDoc.data();
    const id = productDoc.id;

    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <h3>${product.title}</h3>
      <p><strong>Category:</strong> ${product.category}</p>
      <p><strong>MRP:</strong> ₹${product.mrp} | <strong>Offer:</strong> ₹${product.offerPrice}</p>
      <p><strong>Quantity:</strong> ${product.quantity}</p>
      <button onclick="editProduct('${id}')">< i class='bxr  bx-pencil'  ></i> Edit</button>
      <button onclick="deleteProduct('${id}')"><i class="bx bx-trash" />Delete</button>
    `;
    productList.appendChild(div);
  });
}

window.editProduct = (id) => {
  location.href = `edit-product.html?id=${id}`;
};

window.deleteProduct = async (id) => {
  if (confirm("Are you sure to delete this product?")) {
    await deleteDoc(doc(db, 'products', id));
    loadProducts();
  }
};

loadProducts();
