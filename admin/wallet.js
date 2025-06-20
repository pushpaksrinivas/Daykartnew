import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const totalEarningsEl = document.getElementById("total-earnings");
const ordersTable = document.getElementById("orders-table");

// Require admin login to view dashboard
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login as an admin to view this page.");
    return window.location.href = "../account/login.html";
  }

  const userDoc = await getDocs(collection(db, "users"));
  const isAdmin = userDoc.docs.find(doc => doc.id === user.uid && doc.data().isAdmin);

  if (!isAdmin) {
    alert("Access denied. You are not an admin.");
    return window.location.href = "/";
  }

  loadEarnings();
});

async function loadEarnings() {
  try {
    const ordersSnap = await getDocs(collection(db, "orders"));
    let total = 0;
    const rows = [];

    ordersSnap.forEach(doc => {
      const order = doc.data();
      if (order.status === "success") {
        total += order.totalAmount;

        const date = new Date(order.timestamp || Date.now()).toLocaleDateString();

        rows.push(`
          <tr>
            <td>${order.userId}</td>
            <td>₹${order.totalAmount}</td>
            <td>${order.status}</td>
            <td>${date}</td>
          </tr>
        `);
      }
    });

    totalEarningsEl.textContent = `₹${total}`;
    ordersTable.innerHTML = rows.join("");
  } catch (err) {
    console.error("Error loading earnings:", err);
    totalEarningsEl.textContent = "Error loading";
  }
}
