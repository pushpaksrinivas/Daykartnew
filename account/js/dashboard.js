import { auth, db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        document.getElementById("userDetails").textContent = "User data not found.";
        return;
      }

      const data = docSnap.data();
      const address = data.address || {};

      // Fill in user details
      document.getElementById("name").textContent = data.name || "";
      document.getElementById("phone").textContent = data.phone || "";
      document.getElementById("email").textContent = data.email || "";
      document.getElementById("regno").textContent = data.regno || "";
      document.getElementById("collegeName").textContent = data.collegeName || "";
      document.getElementById("referral").textContent = data.referralCode || "";

      // Address fields
      document.getElementById("line1").textContent = address.line1 || "";
      document.getElementById("line2").textContent = address.line2 || "";
      document.getElementById("street").textContent = address.street || "";
      document.getElementById("city").textContent = address.city || "";
      document.getElementById("dist").textContent = address.dist || "";
      document.getElementById("state").textContent = address.state || "";
      document.getElementById("pincode").textContent = address.pincode || "";

      // Referral balance
      const balance = data.referralBalance || 0;
      document.getElementById("referralBalance").textContent = `₹${balance}`;

      // Who referred this user?
      if (data.referredBy) {
        const q = query(
          collection(db, "users"),
          where("referralCode", "==", data.referredBy)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const referrerData = snapshot.docs[0].data();
          const referrerName = referrerData.name || "Unknown";
          document.getElementById("referralCreditedBy").textContent =
            `Referred by: ${referrerName}`;
        } else {
          document.getElementById("referralCreditedBy").textContent =
            "Referred by: Unknown";
        }
      } else {
        document.getElementById("referralCreditedBy").textContent =
          "Not referred by anyone.";
      }

      // Show popup if profile is incomplete
      if (!data.name || !data.phone || !data.regno) {
        showPopup();
      }

      // 🔽 Load referral earnings subcollection
      const earningsRef = collection(db, `users/${user.uid}/referralEarnings`);
      const earningsSnap = await getDocs(earningsRef);

      console.log("Referral earnings count:", earningsSnap.size);

      let earningsHtml = "<ul>";
      if (earningsSnap.empty) {
        earningsHtml += "<li>No referral earnings yet.</li>";
      } else {
        earningsSnap.forEach((doc) => {
          const earning = doc.data();
          const date = earning.timestamp?.toDate?.().toLocaleDateString() || "";

          earningsHtml += `
            <li>
              ₹${earning.amountCredited} from ${earning.referredUserName} (${earning.referredUserEmail})
              ${date ? `<br><small>Credited on: ${date}</small>` : ""}
            </li>`;
        });
      }
      earningsHtml += "</ul>";

      document.getElementById("referralEarningsList").innerHTML = earningsHtml;

    } catch (error) {
      console.error("Error loading user data:", error);
      document.getElementById("userDetails").textContent = "An error occurred while loading your data.";
    }
  });
});

function showPopup() {
  const popup = document.createElement("div");
  popup.className = "popup-overlay";
  popup.innerHTML = `
    <div class="popup-box">
      <h2>Complete Your Profile</h2>
      <p>Please fill in your account details to continue using your dashboard features.</p>
      <a href="account.html"><button>Go to Account Page</button></a>
    </div>
  `;
  document.body.appendChild(popup);
}

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
});
