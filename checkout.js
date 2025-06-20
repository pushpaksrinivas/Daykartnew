let cartItems = JSON.parse(localStorage.getItem("cart")) || [];
let discount = 0;
let offerTotal = 0;
let mrpTotal = 0;
let shipping = 0;

// DOM elements
const orderSummary = document.getElementById("orderSummary");
const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");
const subtotalRow = document.getElementById("subtotalRow");
const couponMsg = document.getElementById("couponMessage");
const applyCouponBtn = document.getElementById("applyCoupon");
const couponInput = document.getElementById("couponCode");

// Render cart items
function renderCartItems() {
  document.querySelectorAll(".order-row.dynamic").forEach(row => row.remove());
  offerTotal = 0;
  mrpTotal = 0;

  cartItems.forEach(item => {
    const qty = item.qty || 1;
    const offerPrice = item.offerPrice || 0;
    const mrp = item.mrp || offerPrice;
    const itemTotal = offerPrice * qty;
    const itemMrpTotal = mrp * qty;

    offerTotal += itemTotal;
    mrpTotal += itemMrpTotal;

    const row = document.createElement("div");
    row.className = "order-row dynamic";
    row.innerHTML = `
      <span>${item.title} × ${qty}</span>
      <span>₹${itemTotal.toFixed(2)}</span>
    `;
    orderSummary.insertBefore(row, subtotalRow);
  });

  updateTotals();
}

// Calculate and update totals
function updateTotals() {
  const youSaved = mrpTotal - offerTotal;

  // Determine shipping cost (default logic, will be overridden on order place)
  shipping = 0;
  if (offerTotal < 499) shipping = 59;
  else if (offerTotal < 1499) shipping = 99;

  // Create or update shipping row
  let shippingRow = document.getElementById("shippingRow");
  if (!shippingRow) {
    shippingRow = document.createElement("div");
    shippingRow.className = "order-row";
    shippingRow.id = "shippingRow";
    shippingRow.innerHTML = `<span>Shipping</span><span id="shippingFee">₹${shipping}</span>`;
    orderSummary.insertBefore(shippingRow, document.getElementById("youSavedRow")?.nextSibling || subtotalRow.nextSibling);
  } else {
    document.getElementById("shippingFee").textContent = `₹${shipping}`;
  }

  subtotalEl.textContent = `₹${offerTotal.toFixed(2)}`;
  totalEl.textContent = `₹${Math.max(offerTotal - discount + shipping, 0).toFixed(2)}`;

  let savedRow = document.getElementById("youSavedRow");
  if (!savedRow) {
    savedRow = document.createElement("div");
    savedRow.className = "order-row";
    savedRow.id = "youSavedRow";
    savedRow.innerHTML = `<span>You Saved</span><span id="youSaved">₹${youSaved.toFixed(2)}</span>`;
    orderSummary.insertBefore(savedRow, subtotalRow.nextSibling);
  } else {
    document.getElementById("youSaved").textContent = `₹${youSaved.toFixed(2)}`;
  }
}

// Apply coupon
applyCouponBtn.addEventListener("click", () => {
  const code = couponInput.value.trim().toUpperCase();
  discount = 0;

  if (code === "NDAY10" && offerTotal >= 1999) {
    const randomPercent = (Math.random() * (8.5 - 5) + 5).toFixed(2);
    discount = Math.floor(offerTotal * randomPercent / 100);
    couponMsg.textContent = `NDAY10 applied! You got ${randomPercent}% off. You saved ₹${discount}`;
    couponMsg.style.color = "green";
  } else if (code === "ODAY5" && offerTotal >= 499) {
    const randomPercent = (Math.random() * (4.5 - 0.8) + 0.8).toFixed(2);
    discount = Math.floor(offerTotal * randomPercent / 100);
    couponMsg.textContent = `ODAY5 applied! You got ${randomPercent}% off. You saved ₹${discount}`;
    couponMsg.style.color = "green";
  } else {
    couponMsg.textContent = "Invalid or ineligible coupon.";
    couponMsg.style.color = "red";
    updateTotals();
    return;
  }

  updateTotals();
});

// Toggle coupon input
document.getElementById("toggleCoupon").addEventListener("click", () => {
  document.getElementById("couponForm").classList.toggle("hidden");
});

// Initial call
renderCartItems();
