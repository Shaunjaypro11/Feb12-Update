/* =========================================================
   LOADER
========================================================= */
const MAX_QTY = 99;
const loader = document.getElementById("loader");

/* =========================================================
   HELPERS
========================================================= */
function getLoggedInUser() {
  return localStorage.getItem("loggedInUser");
}

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || {};
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

/* =========================================================
   MOBILE MENU
========================================================= */
const menuBtn = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
}

/* =========================================================
   ACTIVE LINK
========================================================= */
let currentPage = location.pathname.split("/").pop();
if (!currentPage) currentPage = "index.html";

document.querySelectorAll(".nav-links a").forEach(link => {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active-link");
  }
});

/* =========================================================
   PAGE ENTER
========================================================= */
window.addEventListener("load", () => {
  document.body.classList.add("page-loaded");
  document.body.classList.remove("page-exit");

  if (loader) {
    setTimeout(() => loader.classList.add("hide"), 300);
  }
  updateCartCount();

});

/* =========================================================
   PAGE EXIT (SAFE + EXTERNAL LINKS ALLOWED)
========================================================= */
document.addEventListener("click", (e) => {
  if (e.target.closest("#cartModal")) return;
  if (e.target.closest(".auth-modal")) return;
  if (e.target.closest("form")) return;
  const link = e.target.closest("a[href]");
  if (!link) return;

  const href = link.getAttribute("href");

  if (
    !href ||
    href.startsWith("#") ||
    link.target === "_blank" ||
    link.hasAttribute("download") ||
    /^https?:\/\//i.test(href)
  ) return;

  e.preventDefault();
  if (loader) loader.classList.remove("hide");
  document.body.classList.add("page-exit");

  setTimeout(() => {
    window.location.href = href;
  }, 400);
});

/* =========================================================
   SIGNUP
========================================================= */
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!username || !password) {
      showPopup("warn", "Please fill all fields", "Warning");
      return;
    }

    const users = getUsers();

    if (users[username]) {
      showPopup("error", "Username already exists ❌", "Signup Failed");
      return;
    }

    users[username] = password;
    saveUsers(users);

    showPopup("success", "Account created! Please login ✅", "Success");
    window.location.href = "#loginModal";
  });
}

/* =========================================================
   LOGIN
========================================================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const users = getUsers();

    if (!users[username]) {
      showPopup("error", "Account does not exist ❌", "Login Failed");
      return;
    }

    if (users[username] !== password) {
      showPopup("error", "Incorrect password ❌", "Login Failed");
      return;
    }

    localStorage.setItem("loggedInUser", username);

    const redirect =
      localStorage.getItem("redirectAfterLogin") || "shop.html";
    localStorage.removeItem("redirectAfterLogin");

    window.location.href = redirect;
  });
}

/* =========================================================
   USER PROFILE
========================================================= */
const userProfile = document.getElementById("userProfile");

if (userProfile) {
  const user = getLoggedInUser();

  if (user) {
    userProfile.innerHTML = `
      <span>👤 ${user}</span>
      <button id="logoutBtn">Logout</button>
    `;

    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      location.reload();
    });
  } else {
    userProfile.innerHTML = `<span>👥 Guest</span>`;
  }
}

/* =========================================================
   CART STORAGE
========================================================= */
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================================================
   REQUIRE LOGIN
========================================================= */
function requireLogin() {
  localStorage.setItem("redirectAfterLogin", "shop.html");
  window.location.href = "index.html#loginModal";
}

/* =========================================================
   CART ACTIONS
========================================================= */
function addToCart(name, price, quantity = 1) {
  if (!getLoggedInUser()) {
    showPopup("error", "Please login to add items 🔐", "Login Required");
    setTimeout(requireLogin, 800);
    return;
  }

  quantity = Math.min(Math.max(quantity, 1), MAX_QTY);

  const cart = getCart();
  const item = cart.find(i => i.name === name);

  if (item) {
    item.quantity = Math.min(item.quantity + quantity, MAX_QTY);
  } else {
    cart.push({ name, price, quantity });
  }
 

  saveCart(cart);
  closeCart();   // add this
  showPopup("success", `${name} x${quantity} added to cart 🛒`, "Added");
  updateCartCount();

}

function updateCartCount() {
  const cart = getCart();
  const countEl = document.getElementById("cartCount");

  if (!countEl) return;

  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (totalQty > 0) {
    countEl.textContent = totalQty;
    countEl.style.display = "inline-block";
  } else {
    countEl.style.display = "none";
  }
}


/* =========================================================
   PRODUCT DATA
========================================================= */
function getProductData(btn) {
  const card = btn.closest(".product-card");
  if (!card) return null;

  const title = card.querySelector(".product-title")?.innerText.trim();
  const price = Number(
    card.querySelector(".price")?.innerText.replace(/[₱,]/g, "")
  );

  if (!title || isNaN(price)) return null;
  return { name: title, price };
}
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("plus") || e.target.classList.contains("minus")) {
    const box = e.target.closest(".quantity-box");
    const input = box?.querySelector(".qty-input");
    if (!input) return;

    let value = Number(input.value) || 1;

    if (e.target.classList.contains("plus") && value < MAX_QTY) {
      input.value = value + 1;
    }

    if (e.target.classList.contains("minus") && value > 1) {
      input.value = value - 1;
    }
  }
});


/* =========================================================
   BUY NOW
========================================================= */
function buyNow(name, price, quantity = 1) {
  if (!getLoggedInUser()) {
    showPopup("error", "Please login to continue 🔐", "Login Required");
    setTimeout(requireLogin, 800);
    return;
  }

  const total = price * quantity;
  const summary = `${name} x${quantity}`;

  showConfirm(
  `
  <strong>Confirm Purchase</strong><br><br>
  ${summary}<br><br>
  <strong>Total: ₱${total}</strong>
  `,
  (paymentMethod) => {
    showReceipt(paymentMethod, summary, total);

    // optional cleanup
    document.querySelectorAll(".qty-input").forEach(i => i.value = 1);
  }
);

}

/* =========================================================
   PRODUCT BUTTONS
========================================================= */
document.querySelectorAll(".add-cart-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".product-card");
    const product = getProductData(btn);
    if (!product) return;

    const qtyInput = card.querySelector(".qty-input");
    const quantity =
  qtyInput && Number(qtyInput.value) > 0
    ? Number(qtyInput.value)
    : 1;

    addToCart(product.name, product.price, quantity);
  });
});
document.querySelectorAll(".buy-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".product-card");
    const product = getProductData(btn);
    if (!product) return;

    const qtyInput = card.querySelector(".qty-input");
    const quantity =
  qtyInput && Number(qtyInput.value) > 0
    ? Number(qtyInput.value)
    : 1;

    buyNow(product.name, product.price, quantity);
  });
});

/* =========================================================
   CART MODAL
========================================================= */
function viewCart() {
  const cart = getCart();
  const modal = document.getElementById("cartModal");
  const items = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!modal || !items || !totalEl) return;

  items.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    items.innerHTML = "<p>Your cart is empty 🛒</p>";
    totalEl.textContent = "";
    modal.classList.add("show");
     updateCartCount(); 
    return;
  }

  cart.forEach((item, i) => {
    total += item.price * item.quantity;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
  <span>${item.name}</span>

  <div class="cart-qty">
    <button class="cart-minus">−</button>
    <span class="cart-qty-value">${item.quantity}</span>
    <button class="cart-plus">+</button>
  </div>

  <span>₱${item.price * item.quantity}</span>
  <button class="cart-remove">❌</button>
`;
  div.querySelector(".cart-plus").onclick = () => {
  if (item.quantity < MAX_QTY) {
    item.quantity++;
    saveCart(cart);
    viewCart();

  }


};


div.querySelector(".cart-minus").onclick = () => {
  if (item.quantity > 1) {
    item.quantity--;
  } else {
    cart.splice(i, 1);
  }
  saveCart(cart);
  viewCart();

};


div.querySelector(".cart-remove").onclick = () => {
  cart.splice(i, 1);
  saveCart(cart);
  viewCart();

};


    items.appendChild(div);
  });

  totalEl.textContent = `Total: ₱${total}`;
  modal.classList.add("show");
  updateCartCount();   // ✅ ADD THIS HERE
}

function closeCart() {
  document.getElementById("cartModal")?.classList.remove("show");
}

/* =========================================================
   CHECKOUT
========================================================= */
function checkout() {
  if (!getLoggedInUser()) {
    showPopup("error", "Please login to checkout 🔐", "Checkout");
    setTimeout(requireLogin, 800);
    return;
  }

  const cart = getCart();

  if (cart.length === 0) {
    showPopup("warn", "Your cart is empty 🛒", "Checkout");
    return;
  }

  const summary = cart
    .map(item => `${item.name} x${item.quantity}`)
    .join("<br>");

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  showConfirm(
    `
    <strong>Order Summary</strong><br><br>
    ${summary}<br><br>
    <strong>Total: ₱${total}</strong>
    `,
    (paymentMethod) => {
      localStorage.removeItem("cart");
      updateCartCount();   // ✅ PUT BACK
      closeCart();
      showReceipt(paymentMethod, summary, total);
    }
  );
}

/* =========================================================
   ESC CLOSE CART
========================================================= */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

/* =========================================================
   UI POPUPS
========================================================= */
function showPopup(type, message, title = "Notice") {
  const popup = document.getElementById("uiPopup");
  if (!popup) return;

  document.getElementById("popupTitle").innerText = title;
  document.getElementById("popupMessage").innerText = message;

  popup.className = "ui-popup show " + type;

  setTimeout(() => popup.classList.remove("show"), 2000);
}

let confirmCallback = null;

function showConfirm(message, onYes) {
  const popup = document.getElementById("confirmPopup");
  const msg = document.getElementById("confirmMessage");

  if (msg) msg.innerHTML = message;

  confirmCallback = onYes;
  popup.classList.add("show");

  scrollToCenter(); // 👈 ADD THIS
}

document.getElementById("confirmYes")?.addEventListener("click", () => {
  const method =
    document.querySelector('input[name="payment"]:checked')?.value || "COD";

  document.getElementById("confirmPopup").classList.remove("show");

  if (confirmCallback) {
  confirmCallback(method);
  confirmCallback = null;
}

});

document.getElementById("confirmNo")?.addEventListener("click", () => {
  document.getElementById("confirmPopup").classList.remove("show");
});




/* =========================================================
   FAQ TOGGLE
========================================================= */
document.querySelectorAll(".faq-item").forEach(item => {
  item.addEventListener("click", () => {
    const answer = item.querySelector(".faq-answer");
    if (!answer) return;

    answer.style.maxHeight
      ? (answer.style.maxHeight = null)
      : (answer.style.maxHeight = answer.scrollHeight + "px");
  });
});

/* ============================= */
/* FORMSPREE AJAX SUBMIT (NO POPUP) */
/* ============================= */
const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // 🚫 stop Formspree popup

    const formData = new FormData(contactForm);

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (response.ok) {
        contactForm.reset();
        showPopup("success", "Message sent successfully 📩", "Thank You");
      } else {
        showPopup("error", "Failed to send message ❌", "Error");
      }
    } catch (err) {
      showPopup("error", "Network error. Try again later.", "Error");
    }
  });
}

function closePopup() {
  document.getElementById("uiPopup")?.classList.remove("show");
}


document.addEventListener("input", (e) => {
  if (!e.target.classList.contains("qty-input")) return;

  let value = Number(e.target.value) || 1;

  if (value < 1) value = 1;
  if (value > MAX_QTY) value = MAX_QTY;

  e.target.value = value;
});

function showReceipt(paymentMethod, summary, total) {
  const now = new Date();
  const time = now.toLocaleString();

  document.getElementById("receiptItems").innerHTML =
    `<strong>Items:</strong><br>${summary}`;

  document.getElementById("receiptPayment").innerHTML =
    `<strong>Payment:</strong> ${paymentMethod}`;

  document.getElementById("receiptTotal").innerHTML =
    `Total: ₱${total}`;

  document.getElementById("receiptTime").innerText =
    `🕒 ${time}`;

  const icon = {
    COD: "🚚",
    GCash: "📱",
    Maya: "💳"
  };

  document.getElementById("paymentIcon").innerText =
    icon[paymentMethod] || "💰";

  document.getElementById("receiptPopup").classList.add("show");

  scrollToCenter(); // 👈 ADD THIS
}

function closeReceipt() {
  const receipt = document.getElementById("receiptPopup");
  if (!receipt) return;

  receipt.classList.remove("show");

  // safety reset (prevents stuck overlay)

  // optional: reset receipt content
  document.getElementById("receiptItems").innerHTML = "";
  document.getElementById("receiptPayment").innerHTML = "";
  document.getElementById("receiptTotal").innerHTML = "";
}

function scrollToCenter() {
  window.scrollTo({
    top: window.scrollY,
    behavior: "instant"
  });
}
