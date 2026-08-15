/* ============================================================
   customer.js — screens 03 to 08
   Backend equivalent: Part 4 (ordering) + Part 6 (reviews)
   ============================================================ */

/* ---------- data access (mock or API) ---------- */

async function getRestaurants() {
  if (USE_MOCK) return withOverrides(copy(MOCK.restaurants)).filter(r => r.status === "APPROVED");
  return apiGet("/customer/restaurants");
}

async function getRestaurant(id) {
  if (USE_MOCK) return withOverrides(copy(MOCK.restaurants)).find(r => r.id === +id);
  return apiGet("/customer/restaurants/" + id);
}

async function getMenu(restaurantId) {
  if (USE_MOCK) return copy(MOCK.menuItems.filter(m => m.restaurantId === +restaurantId));
  return apiGet("/customer/restaurants/" + restaurantId + "/menu");
}

async function getMyOrders() {
  const u = currentUser();
  if (USE_MOCK) {
    const mine = MOCK.orders.filter(o => o.customerId === u.id);
    const extra = store.get("myOrders", []);
    return copy([...extra, ...mine]);
  }
  return apiGet("/customer/orders");
}

async function getOrder(id) {
  const all = await getMyOrders();
  return all.find(o => o.id === +id);
}

/* ---------- cart (localStorage) ---------- */

const cart = {
  all:   ()  => store.get("cart", { restaurantId: null, items: [] }),
  save:  (c) => store.set("cart", c),
  count: ()  => cart.all().items.reduce((s, i) => s + i.qty, 0),
  total: ()  => cart.all().items.reduce((s, i) => s + i.price * i.qty, 0),

  add(item, restaurantId) {
    const c = cart.all();
    // one restaurant at a time — switching clears the old cart
    if (c.restaurantId && c.restaurantId !== restaurantId) {
      if (!confirm("Your cart has items from another restaurant. Clear it?")) return false;
      c.items = [];
    }
    c.restaurantId = restaurantId;
    const found = c.items.find(i => i.id === item.id);
    if (found) found.qty++;
    else c.items.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
    cart.save(c);
    return true;
  },

  change(itemId, delta) {
    const c = cart.all();
    const it = c.items.find(i => i.id === itemId);
    if (!it) return;
    it.qty += delta;
    if (it.qty <= 0) c.items = c.items.filter(i => i.id !== itemId);
    if (!c.items.length) c.restaurantId = null;
    cart.save(c);
  },

  clear: () => store.del("cart")
};

/* ---------- screen 03: home ---------- */

async function loadHome() {
  paintUser();
  const list = await getRestaurants();
  const box = document.querySelector("#restaurantList");

  const render = (filter, cuisine) => {
    const shown = list.filter(r =>
      r.name.toLowerCase().includes((filter || "").toLowerCase()) &&
      (!cuisine || cuisine === "All" || r.cuisine === cuisine));

    if (!shown.length) { box.innerHTML = '<div class="empty">No restaurants found</div>'; return; }

    box.innerHTML = shown.map(r => {
      const safe = r.hygieneScore >= 85;
      return '<a class="card ' + (safe ? "card-green" : "card-accent") + ' rest-card" href="restaurant.html?id=' + r.id + '">' +
        '<div class="flexrow"><div class="thumb">' + r.icon + '</div><div style="flex:1">' +
        '<div class="row"><span class="name">' + r.name + '</span>' +
        '<span class="gold" style="font-size:12px;font-weight:700">' + r.rating + ' &#9733;</span></div>' +
        '<div class="sub">' + r.cuisine + ' &bull; ' + r.prepTime + ' min &bull; ' + tk(r.deliveryFee) + ' delivery</div>' +
        '<div style="margin-top:6px"><span class="badge ' + (safe ? "b-green" : "b-gold") + '">' +
        (safe ? "&#9989; HYGIENE " : "&#9888; HYGIENE ") + r.hygieneScore + '</span></div>' +
        '</div></div></a>';
    }).join("");
  };

  render();

  document.querySelector("#search").addEventListener("input", e =>
    render(e.target.value, document.querySelector(".chip.on").dataset.cuisine));

  $$(".chip").forEach(chip => chip.addEventListener("click", () => {
    $$(".chip").forEach(c => c.classList.remove("on"));
    chip.classList.add("on");
    render(document.querySelector("#search").value, chip.dataset.cuisine);
  }));
}

/* ---------- screen 04: restaurant details + menu ---------- */

async function loadRestaurant() {
  const id = qs("id") || 1;
  const r = await getRestaurant(id);
  if (!r) { document.querySelector("#menuList").innerHTML = '<div class="empty">Restaurant not found</div>'; return; }
  const items = await getMenu(id);

  document.querySelector("#restName").innerHTML = r.name;
  document.querySelector("#restSub").innerHTML = r.cuisine + " &bull; " + r.address + " &bull; " + r.prepTime + " min";
  document.querySelector("#score").textContent = r.hygieneScore;
  document.querySelector("#scoreBar").style.width = r.hygieneScore + "%";
  document.querySelector("#ratingLine").innerHTML = "&#9733; " + r.rating + " &bull; verified partner";

  const categories = [];
  items.forEach(i => { if (categories.indexOf(i.category) < 0) categories.push(i.category); });

  document.querySelector("#catTabs").innerHTML = categories
    .map((c, i) => '<div class="tab ' + (i === 0 ? "on" : "") + '" data-cat="' + c + '">' + c + '</div>').join("");

  const render = (cat) => {
    document.querySelector("#menuList").innerHTML = items.filter(i => i.category === cat).map(i =>
      '<div class="card ' + (i.available ? "card-accent" : "card-red") + '">' +
      '<div class="flexrow"><div class="thumb">' + i.icon + '</div><div style="flex:1">' +
      '<div class="row"><span class="name">' + i.name + '</span>' +
      '<span class="green" style="font-weight:700;font-size:13px">' + tk(i.price) + '</span></div>' +
      '<div class="sub">' + i.description + '</div>' +
      '<div class="row" style="margin-top:6px">' +
      (i.available
        ? '<span class="small green">In stock</span><button class="badge b-gold" data-add="' + i.id + '">+ ADD</button>'
        : '<span class="badge b-red">OUT OF STOCK</span>') +
      '</div></div></div></div>').join("");

    $$("[data-add]").forEach(btn => btn.addEventListener("click", () => {
      const item = items.find(i => i.id === +btn.dataset.add);
      if (cart.add(item, r.id)) paintCartBar();
    }));
  };

  render(categories[0]);

  $$("#catTabs .tab").forEach(tab => tab.addEventListener("click", () => {
    $$("#catTabs .tab").forEach(t => t.classList.remove("on"));
    tab.classList.add("on");
    render(tab.dataset.cat);
  }));

  paintCartBar();
}

function paintCartBar() {
  const bar = document.querySelector("#cartBar");
  if (!bar) return;
  const n = cart.count();
  bar.classList.toggle("hide", n === 0);
  if (n) {
    document.querySelector("#cartCount").textContent = n + (n === 1 ? " item" : " items") + " in cart";
    document.querySelector("#cartTotal").textContent = tk(cart.total());
  }
}

/* ---------- screen 05: cart + checkout ---------- */

async function loadCheckout() {
  const u = currentUser();
  const c = cart.all();

  if (!c.items.length) {
    document.querySelector("#checkoutBody").innerHTML =
      '<div class="empty">Your cart is empty.<br><br><a class="gold" href="home.html">Browse restaurants</a></div>';
    return;
  }

  const r = await getRestaurant(c.restaurantId);
  document.querySelector("#checkoutSub").innerHTML = r.name + " &bull; " + c.items.length + " items";
  document.querySelector("#addressText").textContent = u.address || "Add a delivery address";

  const paint = () => {
    const cur = cart.all();
    if (!cur.items.length) { location.reload(); return; }

    document.querySelector("#cartItems").innerHTML = cur.items.map(i =>
      '<div class="card card-accent"><div class="row">' +
      '<div><div class="name">' + i.name + '</div><div class="sub">' + tk(i.price) + ' &times; ' + i.qty + '</div></div>' +
      '<div><button class="qty-btn" data-minus="' + i.id + '">&minus;</button>' +
      '<span style="font-size:12px;font-weight:700;padding:0 6px">' + i.qty + '</span>' +
      '<button class="qty-btn" data-plus="' + i.id + '">+</button></div>' +
      '</div></div>').join("");

    const sub = cart.total();
    document.querySelector("#subTotal").textContent = tk(sub);
    document.querySelector("#delFee").textContent = tk(r.deliveryFee);
    document.querySelector("#grandTotal").textContent = tk(sub + r.deliveryFee);
    document.querySelector("#payBtn").textContent = "Place Order  \u2022  " + tk(sub + r.deliveryFee);

    $$("[data-minus]").forEach(b => b.onclick = () => { cart.change(+b.dataset.minus, -1); paint(); });
    $$("[data-plus]").forEach(b => b.onclick = () => { cart.change(+b.dataset.plus, 1); paint(); });
  };

  paint();

  $$(".js-pay").forEach(el => el.addEventListener("click", () => {
    $$(".js-pay").forEach(x => {
      x.classList.remove("card-green");
      x.querySelector(".js-tick").innerHTML = "Select";
    });
    el.classList.add("card-green");
    el.querySelector(".js-tick").innerHTML = "&#10003;";
  }));

  document.querySelector("#payBtn").addEventListener("click", async () => {
    const cur = cart.all();
    const picked = document.querySelector(".js-pay.card-green");
    const order = {
      id: Date.now() % 100000,
      customerId: u.id,
      restaurantId: r.id,
      subtotal: cart.total(),
      deliveryFee: r.deliveryFee,
      total: cart.total() + r.deliveryFee,
      paymentMethod: picked ? picked.dataset.method : "COD",
      status: "PLACED",
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      items: cur.items.map(i => ({ name: i.name, qty: i.qty, price: i.price }))
    };

    if (USE_MOCK) {
      const mine = store.get("myOrders", []);
      mine.unshift(order);
      store.set("myOrders", mine);
    } else {
      await apiPost("/customer/orders", order);
    }

    cart.clear();
    location.href = "tracking.html?id=" + order.id;
  });
}

/* ---------- screen 06: tracking ---------- */

const STATUS_STEPS = ["PLACED", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
const STATUS_LABEL = {
  PLACED: "Order Placed",
  ACCEPTED: "Accepted by Restaurant",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered"
};

async function loadTracking() {
  const order = await getOrder(qs("id"));
  if (!order) { document.querySelector("#steps").innerHTML = '<div class="empty">Order not found</div>'; return; }

  const r = await getRestaurant(order.restaurantId);
  const at = STATUS_STEPS.indexOf(order.status);

  document.querySelector("#trackTitle").textContent = "Order #NC" + order.id;
  document.querySelector("#trackSub").innerHTML = r.name + " &bull; " + tk(order.total);
  document.querySelector("#orderNo").textContent = "#NC" + order.id;
  document.querySelector("#itemCount").textContent = order.items.reduce((s, i) => s + i.qty, 0);
  document.querySelector("#payMethod").textContent = order.paymentMethod === "COD" ? "Cash on Delivery" : "bKash";

  document.querySelector("#etaBar").style.width = Math.round((at + 1) / 5 * 100) + "%";
  document.querySelector("#eta").textContent =
    order.status === "DELIVERED" ? "Delivered" :
    order.status === "CANCELLED" ? "Cancelled" : Math.max(r.prepTime - at * 7, 5) + " min";

  document.querySelector("#steps").innerHTML = STATUS_STEPS.map((s, i) => {
    const cls = i < at ? "dot-on" : i === at ? "dot-cur" : "dot-off";
    const mark = i < at ? "&#10003;" : (i + 1);
    const nameCls = i === at ? "name blue" : i > at ? "name" : "name";
    const nameStyle = i > at ? ' style="color:#6a6a6a"' : "";
    const sub = i < at ? "Done" : i === at ? "In progress"
              : (s === "DELIVERED" ? "Review unlocks after this" : "\u2014");
    return '<div class="step"><div class="dot ' + cls + '">' + mark + '</div>' +
           '<div><div class="' + nameCls + '"' + nameStyle + '>' + STATUS_LABEL[s] + '</div>' +
           '<div class="sub">' + sub + '</div></div></div>';
  }).join("");
}

/* ---------- screen 07: my orders + write review ---------- */

async function getMyReviews() {
  if (USE_MOCK) return copy(MOCK.reviews).concat(store.get("myReviews", []));
  return apiGet("/customer/reviews");
}

async function loadOrders() {
  const orders = await getMyOrders();
  const reviews = await getMyReviews();
  const box = document.querySelector("#orderList");

  if (!orders.length) { box.innerHTML = '<div class="empty">No orders yet</div>'; return; }

  const rows = [];
  for (const o of orders) {
    const r = await getRestaurant(o.restaurantId);
    const mine = reviews.find(rv => rv.orderId === o.id);
    const delivered = o.status === "DELIVERED";

    let action;
    if (mine) {
      action = '<div class="row" style="margin-top:9px">' +
        '<span class="small gold">Your rating: ' + "\u2605".repeat(mine.rating) + '</span>' +
        '<span class="sub">Reviewed</span></div>' +
        '<div class="small" style="margin-top:6px;font-style:italic">"' + mine.comment + '"</div>';
    } else if (delivered) {
      action = '<div class="btnrow"><button class="btn btn-sm" data-review="' + o.id + '">Write Review</button></div>';
    } else if (o.status === "CANCELLED") {
      action = '<div class="small" style="margin-top:6px">No review allowed &mdash; order was not completed.</div>';
    } else {
      action = '<div class="btnrow"><a class="btn-out btn-sm" href="tracking.html?id=' + o.id + '">Track Order</a></div>';
    }

    const tone = o.status === "CANCELLED" ? "card-red" : delivered ? "card-green" : "card-blue";
    const badge = o.status === "CANCELLED" ? "b-red" : delivered ? "b-green" : "b-blue";

    rows.push('<div class="card ' + tone + '"><div class="row">' +
      '<div><div class="name">' + r.name + '</div>' +
      '<div class="sub">#NC' + o.id + ' &bull; ' + tk(o.total) + ' &bull; ' + o.createdAt + '</div></div>' +
      '<span class="badge ' + badge + '">' + o.status.replace(/_/g, " ") + '</span></div>' + action + '</div>');
  }

  box.innerHTML = rows.join("");
  $$("[data-review]").forEach(b => b.onclick = () => openReview(+b.dataset.review));
}

function openReview(orderId) {
  document.querySelector("#reviewOrderId").value = orderId;
  document.querySelector("#reviewBox").classList.remove("hide");
  document.querySelector("#orderList").classList.add("hide");
  document.querySelector("#reviewIntro").classList.add("hide");
}

function initReviewForm() {
  let rating = 0;

  $$(".star").forEach((s, i) => s.onclick = () => {
    rating = i + 1;
    $$(".star").forEach((x, j) => x.classList.toggle("on", j <= i));
  });

  document.querySelector("#cancelReview").onclick = () => location.reload();

  document.querySelector("#submitReview").onclick = async () => {
    const comment = document.querySelector("#reviewText").value.trim();
    const orderId = +document.querySelector("#reviewOrderId").value;
    const err = document.querySelector("#reviewErr");

    if (!rating) { err.textContent = "Please pick a rating."; return; }
    if (comment.length < 5) { err.textContent = "Please write a short comment."; return; }

    const orders = await getMyOrders();
    const order = orders.find(o => o.id === orderId);

    // The core rule — mirrored on the server in Part 6.
    if (!order || order.status !== "DELIVERED") {
      err.textContent = "You can only review a delivered order.";
      return;
    }

    const review = {
      id: Date.now(), orderId: orderId, customerId: currentUser().id,
      restaurantId: order.restaurantId, rating: rating, comment: comment,
      status: "VISIBLE", createdAt: new Date().toISOString().slice(0, 10)
    };

    if (USE_MOCK) {
      const mine = store.get("myReviews", []);
      mine.push(review);
      store.set("myReviews", mine);
    } else {
      await apiPost("/customer/reviews", review);
    }

    location.reload();
  };
}

/* ---------- screen 08: profile ---------- */

async function loadProfile() {
  paintUser();
  const orders = await getMyOrders();
  const reviews = await getMyReviews();
  const u = currentUser();
  document.querySelector("#orderCount").textContent = orders.length;
  document.querySelector("#reviewCount").textContent = reviews.filter(r => r.customerId === u.id).length;
}
