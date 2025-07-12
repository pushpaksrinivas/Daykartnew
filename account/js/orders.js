// js/orders.js
import { auth, db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const container = document.getElementById("ordersContainer");

function formatDate(timestamp) {
  const date = timestamp.toDate();
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", user.uid)
      );
      const ordersSnap = await getDocs(ordersQuery);

      if (ordersSnap.empty) {
        container.innerHTML = `<p>No orders till now.</p>`;
        return;
      }

      container.innerHTML = "";
      ordersSnap.forEach(docSnap => {
        const order = docSnap.data();

        const card = document.createElement("div");
        card.className = "order-card";

        const itemListHTML = order.items.map(item => `
          <div class="item-block">
            <img src="${item.image}" alt="${item.title}" width="80" />
            <p><strong>${item.title}</strong><br>Qty: ${item.qty} | Price: ₹${item.offerPrice}</p>
          </div>
        `).join("");

        card.innerHTML = `
          <h3>Order ID: ${order.orderId || docSnap.id}</h3>
          <p><strong>Name:</strong> ${order.name}</p>
          <p><strong>Email:</strong> ${order.email}</p>
          <p><strong>Phone:</strong> ${order.phone}</p>
          <div class="items-container">${itemListHTML}</div>
          <p><strong>Subtotal:</strong> ₹${order.subtotal}</p>
          <p><strong>Shipping:</strong> ₹${order.shipping}</p>
          <p><strong>Discount:</strong> ₹${order.discount || 0}</p>
          <p><strong>Total Paid:</strong> ₹${order.total}</p>
          <p><strong>Coupon:</strong> ${order.coupon || "N/A"}</p>
          <p><strong>Payment:</strong> ${order.paymentMethod}</p>
          <p><strong>Date:</strong> ${formatDate(order.timestamp)}</p>
        `;
        container.appendChild(card);
      });
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      container.innerHTML = `<p>Something went wrong. Try again later.</p>`;
    }
  } else {
    window.location.href = "login.html";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
});