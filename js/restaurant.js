/* ============================================================
   restaurant.js — screens 10 to 14 (restaurant owner)
   Backend equivalent: Part 3 (verification), Part 4 (menu/orders),
                       Part 5 (hygiene)
   ============================================================ */

function myRestaurantId() {
  const u = currentUser();
  return u ? u.restaurantId : null;
}

async function myRestaurant() {
  const id = myRestaurantId();
  if (USE_MOCK) return withOverrides(copy(MOCK.restaurants)).find(r => r.id === id);
  return apiGet("/restaurant/profile");
}

async function myOrders() {
  const id = myRestaurantId();
  if (USE_MOCK) {
    const seeded = MOCK.orders.filter(o => o.restaurantId === id);
    const placed = store.get("myOrders", []).filter(o => o.restaurantId === id);
    const changes = store.get("orderStatus", {});
    return copy([...placed, ...seeded]).map(o => {
      if (changes[o.id]) o.status = changes[o.id];
      return o;
    });
  }
  return apiGet("/restaurant/orders");
}

async function myMenu() {
  const id = myRestaurantId();
  if (USE_MOCK) {
    const base = copy(MOCK.menuItems.filter(m => m.restaurantId === id));
    const added = store.get("newMenuItems", []).filter(m => m.restaurantId === id);
    const flips = store.get("menuAvailability", {});
    return [...base, ...added].map(m => {
      if (flips[m.id] !== undefined) m.available = flips[m.id];
      return m;
    });
  }
  return apiGet("/restaurant/menu");
}

async function myChecks() {
  const id = myRestaurantId();
  if (USE_MOCK) {
    const base = copy(MOCK.hygieneChecks.filter(h => h.restaurantId === id));
    const added = store.get("newChecks", []).filter(h => h.restaurantId === id);
    return [...added, ...base];
  }
  return apiGet("/restaurant/hygiene");
}

/* ---------- screen 10: dashboard ---------- */

async function loadOwnerDashboard() {
  const r = await myRestaurant();
  const orders = await myOrders();
  const checks = await myChecks();

  document.querySelector("#restName").textContent = r.name;
  document.querySelector("#score").textContent = r.hygieneScore;
  document.querySelector("#scoreBar").style.width = r.hygieneScore + "%";

  const statusBadge = document.querySelector("#statusBadge");
  if (r.status === "APPROVED") {
    statusBadge.className = "badge b-green";
    statusBadge.innerHTML = "&#9989; VERIFIED";
    document.querySelector("#statusNote").textContent = "Live on NoCap";
  } else if (r.status === "PENDING") {
    statusBadge.className = "badge b-gold";
    statusBadge.innerHTML = "PENDING";
    document.querySelector("#statusNote").textContent = "Not visible to customers yet";
  } else {
    statusBadge.className = "badge b-red";
    statusBadge.innerHTML = r.status;
    document.querySelector("#statusNote").textContent = "Removed from customer app";
  }

  const active = orders.filter(o => ["PLACED", "ACCEPTED", "PREPARING"].indexOf(o.status) >= 0);
  const done = orders.filter(o => o.status === "DELIVERED");

  document.querySelector("#ordersToday").textContent = orders.length;
  document.querySelector("#salesToday").textContent = tk(done.reduce((s, o) => s + o.total, 0));
  document.querySelector("#pendingOrders").textContent = active.length;
  document.querySelector("#rating").textContent = r.rating + "\u2605";

  // pending hygiene check = requested but never uploaded
  const pendingCheck = checks.find(c => !c.uploadedAt);
  document.querySelector("#hygieneAlert").classList.toggle("hide", !pendingCheck);
  document.querySelector("#orderAlert").classList.toggle("hide", active.length === 0);
  if (active.length) {
    document.querySelector("#orderAlertText").textContent =
      active.length + (active.length === 1 ? " order" : " orders") + " need your attention";
  }

  document.querySelector("#menuCount").textContent = (await myMenu()).length + " items";
}

/* ---------- screen 11: verification status ---------- */

async function loadVerification() {
  const r = await myRestaurant();
  const docs = USE_MOCK ? MOCK.documents.filter(d => d.restaurantId === r.id)
                        : await apiGet("/restaurant/verification");
  const insp = USE_MOCK ? MOCK.inspections.find(i => i.restaurantId === r.id)
                        : await apiGet("/restaurant/inspection");

  const docsDone = docs.length >= 3 && docs.every(d => d.status === "APPROVED");
  const inspDone = !!insp;
  const approved = r.status === "APPROVED";

  const stagesDone = [docsDone, docsDone, inspDone, approved].filter(Boolean).length;
  const pct = Math.round(stagesDone / 4 * 100);

  document.querySelector("#pct").textContent = pct + "%";
  document.querySelector("#pctBar").style.width = pct + "%";
  document.querySelector("#stageText").textContent =
    stagesDone + " of 4 stages complete" + (approved ? "" : " \u2014 not visible to customers yet");

  const stage = (n, done, current, title, detail) => {
    const cls = done ? "dot-on" : current ? "dot-cur" : "dot-off";
    const mark = done ? "&#10003;" : n;
    return '<div class="step"><div class="dot ' + cls + '">' + mark + '</div>' +
           '<div style="flex:1"><div class="name' + (current ? " blue" : "") + '">' + title + '</div>' +
           '<div class="small">' + detail + '</div></div></div>';
  };

  document.querySelector("#stages").innerHTML =
    stage(1, docsDone, !docsDone, "1. Documents Uploaded",
          docs.map(d => d.type.replace(/_/g, " ") + " &#10003;").join(" &bull; ") || "Nothing uploaded yet") +
    stage(2, docsDone, false, "2. Owner Verified",
          "Phone OTP confirmed &bull; NID matched") +
    stage(3, inspDone, docsDone && !inspDone, "3. Kitchen Inspection",
          insp ? 'Score <span class="green">' + insp.totalScore + '/100</span> &bull; ' +
                 "Cleanliness " + insp.cleanliness + "/25 &bull; Storage " + insp.storage +
                 "/25 &bull; Staff " + insp.staffHygiene + "/25 &bull; Waste " + insp.wasteControl + "/25"
               : "Waiting for a field officer visit") +
    stage(4, approved, inspDone && !approved, "4. Admin Approval",
          approved ? "Approved &mdash; you are live" : "Usually decided within 24 hours");

  document.querySelector("#noteBox").classList.toggle("hide", !insp || !insp.officerNote);
  if (insp && insp.officerNote) document.querySelector("#officerNote").textContent = insp.officerNote;

  document.querySelector("#docList").innerHTML = docs.map(d =>
    '<div class="li"><span>&#128196; ' + d.type.replace(/_/g, " ") + '</span>' +
    '<span class="badge ' + (d.status === "APPROVED" ? "b-green" : "b-gold") + '">' + d.status + '</span></div>'
  ).join("") || '<div class="empty">No documents uploaded</div>';
}

/* ---------- screen 12: manage menu ---------- */

async function loadOwnerMenu() {
  const items = await myMenu();
  const box = document.querySelector("#menuList");

  const categories = [];
  items.forEach(i => { if (categories.indexOf(i.category) < 0) categories.push(i.category); });

  document.querySelector("#catTabs").innerHTML = categories.map((c, i) =>
    '<div class="tab ' + (i === 0 ? "on" : "") + '" data-cat="' + c + '">' + c +
    ' (' + items.filter(x => x.category === c).length + ')</div>').join("");

  const render = (cat) => {
    box.innerHTML = items.filter(i => i.category === cat).map(i =>
      '<div class="card ' + (i.available ? "card-green" : "card-red") + '">' +
      '<div class="flexrow"><div class="thumb">' + i.icon + '</div><div style="flex:1">' +
      '<div class="row"><span class="name">' + i.name + '</span>' +
      '<span class="green" style="font-weight:700;font-size:13px">' + tk(i.price) + '</span></div>' +
      '<div class="sub">' + i.description + '</div>' +
      '<div class="row" style="margin-top:6px">' +
      '<span class="badge ' + (i.available ? "b-green" : "b-red") + '">' +
      (i.available ? "AVAILABLE" : "OUT OF STOCK") + '</span>' +
      '<button class="badge b-gold" data-flip="' + i.id + '">' +
      (i.available ? "Mark out of stock" : "Mark available") + '</button>' +
      '</div></div></div></div>').join("");

    $$("[data-flip]").forEach(b => b.onclick = () => {
      const id = +b.dataset.flip;
      const item = items.find(x => x.id === id);
      item.available = !item.available;
      const flips = store.get("menuAvailability", {});
      flips[id] = item.available;
      store.set("menuAvailability", flips);
      render(cat);
    });
  };

  render(categories[0]);

  $$("#catTabs .tab").forEach(tab => tab.onclick = () => {
    $$("#catTabs .tab").forEach(t => t.classList.remove("on"));
    tab.classList.add("on");
    render(tab.dataset.cat);
  });

  document.querySelector("#addBtn").onclick = () =>
    document.querySelector("#addForm").classList.toggle("hide");

  document.querySelector("#saveItem").onclick = () => {
    const name = document.querySelector("#itemName").value.trim();
    const price = +document.querySelector("#itemPrice").value;
    const cat = document.querySelector("#itemCat").value.trim() || "Others";
    const desc = document.querySelector("#itemDesc").value.trim();
    const err = document.querySelector("#itemErr");

    if (!name || !price) { err.textContent = "Name and price are required."; return; }

    const item = {
      id: Date.now(), restaurantId: myRestaurantId(), name: name, description: desc,
      price: price, category: cat, available: true, icon: "\u{1F374}"
    };
    const added = store.get("newMenuItems", []);
    added.push(item);
    store.set("newMenuItems", added);
    location.reload();
  };
}

/* ---------- screen 13: manage orders ---------- */

const NEXT_STATUS = {
  PLACED: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED"
};
const NEXT_LABEL = {
  PLACED: "Accept Order",
  ACCEPTED: "Start Preparing",
  PREPARING: "Mark Ready for Pickup",
  OUT_FOR_DELIVERY: "Mark Delivered"
};

async function loadOwnerOrders() {
  const orders = await myOrders();

  const groups = {
    New: orders.filter(o => o.status === "PLACED"),
    Active: orders.filter(o => ["ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY"].indexOf(o.status) >= 0),
    Completed: orders.filter(o => ["DELIVERED", "CANCELLED"].indexOf(o.status) >= 0)
  };

  document.querySelector("#tabs").innerHTML = Object.keys(groups).map((k, i) =>
    '<div class="tab ' + (i === 0 ? "on" : "") + '" data-g="' + k + '">' + k +
    ' (' + groups[k].length + ')</div>').join("");

  const render = (g) => {
    const list = groups[g];
    if (!list.length) {
      document.querySelector("#orderList").innerHTML = '<div class="empty">Nothing here</div>';
      return;
    }

    document.querySelector("#orderList").innerHTML = list.map(o => {
      const tone = o.status === "PLACED" ? "card-blue"
                 : o.status === "DELIVERED" ? "card-green"
                 : o.status === "CANCELLED" ? "card-red" : "card-accent";
      const itemLine = o.items.map(i => i.qty + "\u00d7 " + i.name).join(" \u2022 ");
      const next = NEXT_STATUS[o.status];

      return '<div class="card ' + tone + '">' +
        '<div class="row"><div><div class="name">#NC' + o.id + '</div>' +
        '<div class="sub">' + tk(o.total) + ' &bull; ' +
        (o.paymentMethod === "COD" ? "Cash on Delivery" : "bKash") + ' &bull; ' + o.createdAt + '</div></div>' +
        '<span class="badge ' + (o.status === "PLACED" ? "b-blue" :
                                 o.status === "DELIVERED" ? "b-green" :
                                 o.status === "CANCELLED" ? "b-red" : "b-gold") + '">' +
        o.status.replace(/_/g, " ") + '</span></div>' +
        '<div class="small" style="margin-top:7px">' + itemLine + '</div>' +
        (next
          ? '<div class="btnrow">' +
            (o.status === "PLACED" ? '<button class="btn-out btn-sm" data-cancel="' + o.id + '">Reject</button>' : '') +
            '<button class="btn btn-sm" data-next="' + o.id + '">' + NEXT_LABEL[o.status] + '</button></div>'
          : '') +
        '</div>';
    }).join("");

    $$("[data-next]").forEach(b => b.onclick = () => {
      const o = orders.find(x => x.id === +b.dataset.next);
      setOrderStatus(o.id, NEXT_STATUS[o.status]);
    });
    $$("[data-cancel]").forEach(b => b.onclick = () => setOrderStatus(+b.dataset.cancel, "CANCELLED"));
  };

  render("New");

  $$("#tabs .tab").forEach(t => t.onclick = () => {
    $$("#tabs .tab").forEach(x => x.classList.remove("on"));
    t.classList.add("on");
    render(t.dataset.g);
  });
}

function setOrderStatus(orderId, status) {
  if (USE_MOCK) {
    const changes = store.get("orderStatus", {});
    changes[orderId] = status;
    store.set("orderStatus", changes);
    location.reload();
  } else {
    apiPut("/restaurant/orders/" + orderId + "/status", { status: status }).then(() => location.reload());
  }
}

/* ---------- screen 14: hygiene uploads ---------- */

async function loadHygiene() {
  const checks = await myChecks();
  const pending = checks.find(c => !c.uploadedAt);

  document.querySelector("#pendingBox").classList.toggle("hide", !pending);
  document.querySelector("#uploadBox").classList.toggle("hide", !pending);
  document.querySelector("#noPending").classList.toggle("hide", !!pending);

  const done = checks.filter(c => c.uploadedAt);
  document.querySelector("#history").innerHTML = done.map(c =>
    '<div class="li"><span class="sub">' + c.requestedAt + '</span>' +
    '<span class="badge ' + (c.passed ? "b-green" : "b-red") + '">' +
    (c.passed ? "PASS &bull; " + c.score : "FAIL &bull; " + c.score) + '</span></div>'
  ).join("") || '<div class="empty">No checks yet</div>';

  // 3 consecutive fails = auto suspension (the rule enforced in Part 5)
  const recent = checks.slice(0, 3);
  const fails = recent.filter(c => !c.passed).length;
  const warn = document.querySelector("#failWarn");
  if (fails >= 3) {
    warn.className = "card card-red";
    warn.innerHTML = '<div class="small"><span class="red">&#9888; Suspended.</span> ' +
      'Three consecutive failed checks. Contact admin to appeal within 48 hours.</div>';
  } else if (fails === 2) {
    warn.className = "card card-red";
    warn.innerHTML = '<div class="small"><span class="red">&#9888; Warning:</span> ' +
      '2 consecutive fails. One more will suspend your restaurant automatically.</div>';
  } else {
    warn.className = "card card-green";
    warn.innerHTML = '<div class="small"><span class="green">&#9989; Rule:</span> ' +
      '3 consecutive failed checks automatically suspend your restaurant. ' +
      'A missed 15-minute deadline counts as a fail.</div>';
  }

  if (pending) {
    document.querySelector("#uploadBtn").onclick = () => {
      // A real upload happens in Part 5; here we simulate the AI score.
      const score = 70 + Math.floor(Math.random() * 30);
      const rec = {
        id: Date.now(), restaurantId: myRestaurantId(),
        requestedAt: pending.requestedAt,
        uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        score: score, passed: score >= 75
      };
      const added = store.get("newChecks", []);
      added.unshift(rec);
      store.set("newChecks", added);
      alert("Photo submitted.\nAI hygiene score: " + score + "/100 \u2014 " + (score >= 75 ? "PASS" : "FAIL"));
      location.reload();
    };
  }
}
