// DOM Elements
const couponInput = document.getElementById("couponInput");
const applyBtn = document.getElementById("applyCouponBtn");
const couponMessage = document.getElementById("couponMessage");
const couponSavedEl = document.getElementById("couponSaved");
const grandTotalEl = document.getElementById("grandTotal");

// Prices (should be set globally or passed in from your cart)
let offerTotal = 0; // This should be set from the cart summary
let shipping = 0;   // Set from cart logic
let couponApplied = false;
let couponDiscount = 0;
let appliedCouponCode = null;

// Optional: If needed globally for order placing
window.getAppliedCouponDetails = () => ({
  couponDiscount,
  appliedCouponCode
});

function isBeforeJuly15() {
  const today = new Date();
  const deadline = new Date("2025-07-15T23:59:59");
  return today <= deadline;
}

function updateFinal() {
  const finalTotal = offerTotal + shipping - couponDiscount;
  grandTotalEl.textContent = finalTotal.toFixed(2);
  couponSavedEl.textContent = couponDiscount.toFixed(2);
}

applyBtn.addEventListener("click", () => {
  const code = couponInput.value.trim().toUpperCase();
  couponMessage.textContent = "";
  couponDiscount = 0;

  if (couponApplied) {
    couponMessage.textContent = "❌ Coupon already applied.";
    return;
  }

  offerTotal = window.offerTotal || 0; // fetch updated value
if (offerTotal <= 0) {
  couponMessage.textContent = "❌ Invalid or empty cart.";
  return;
}


  if (code === "NDAY10" && offerTotal >= 1999 && isBeforeJuly15()) {
    const percent = +(Math.random() * (8.5 - 5.0) + 5.0).toFixed(2);
    couponDiscount = +(offerTotal * percent / 100).toFixed(2);
    couponMessage.textContent = `🎉 ${percent}% off applied! You saved ₹${couponDiscount}`;
    couponApplied = true;
    appliedCouponCode = code;
  } else if (code === "ODAY5" && offerTotal >= 499) {
    const percent = +(Math.random() * (5.0 - 0.8) + 0.8).toFixed(2);
    couponDiscount = +(offerTotal * percent / 100).toFixed(2);
    couponMessage.textContent = `🎉 ${percent}% off applied! You saved ₹${couponDiscount}`;
    couponApplied = true;
    appliedCouponCode = code;
  } else {
    couponMessage.textContent = "❌ Invalid coupon or not eligible.";
    return;
  }

  updateFinal();
});
