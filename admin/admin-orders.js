import { auth, db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// List of authorized admin user UIDs or emails
const ADMIN_UIDS = ["your-admin-uid-1", "your-admin-uid-2"];
const ADMIN_EMAILS = ["daykart.services@gmail.com"];

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

async function updateOrderStatus(orderId, newStatus) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: newStatus });
    alert("Order status updated.");
    location.reload();
  } catch (err) {
    console.error("Status update failed", err);
    alert("Failed to update order status.");
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user || (!ADMIN_UIDS.includes(user.uid) && !ADMIN_EMAILS.includes(user.email))) {
    alert("Access denied. Admins only.");
    window.location.href = "login.html";
    return;
  }

  try {
    const ordersSnap = await getDocs(collection(db, "orders"));
    if (ordersSnap.empty) {
      container.innerHTML = `<p>No orders found.</p>`;
      return;
    }

    container.innerHTML = "";

    ordersSnap.forEach(docSnap => {
      const order = docSnap.data();

      const card = document.createElement("div");
      card.className = "order-card";

      const itemListHTML = order.items.map(item => `
        <div class="item-block">
          <img src="${item.image}" width="60" />
          <div>
            <strong>${item.title}</strong><br>
            Qty: ${item.qty}, Price: ₹${item.offerPrice}
          </div>
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
        <p><strong>Total:</strong> ₹${order.total}</p>
        <p><strong>Coupon:</strong> ${order.coupon || "N/A"}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Current Status:</strong> ${order.status || "Pending"}</p>
        <p><strong>Date:</strong> ${formatDate(order.timestamp)}</p>

        <div class="status-update">
          <label for="status-${docSnap.id}">Update Status:</label><br>
          <select id="status-${docSnap.id}">
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button onclick="updateOrderStatus('${docSnap.id}', document.getElementById('status-${docSnap.id}').value)">
            Update
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    // Expose the update function globally for inline `onclick`
    window.updateOrderStatus = updateOrderStatus;
  } catch (error) {
    console.error("Failed to load orders:", error);
    container.innerHTML = `<p>Failed to load orders.</p>`;
  }
});
