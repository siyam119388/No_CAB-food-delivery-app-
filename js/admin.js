/* ============================================================
   admin.js — screens 16 to 20
   Backend equivalent: Part 3 (verification), Part 5 (hygiene),
                       Part 6 (review moderation)
   ============================================================ */

/* ---------- data access ---------- */

async function allRestaurants() {
  if (USE_MOCK) return withOverrides(copy(MOCK.restaurants));/
  return apiGet("/admin/restaurants");
}

async function allFlags() {
  if (USE_MOCK) {
    const base = copy(MOCK.reviewFlags);
    const decisions = store.get("flagDecisions", {});
    return base.map(f => {
      if (decisions[f.id]) f.decision = decisions[f.id];
      return f;
    });
  }
  return apiGet("/admin/reviews/flagged");
}

function setRestaurantStatus(id, status) {
  if (USE_MOCK) {
    const changes = store.get("restStatus", {});
    changes[id] = status;
    store.set("restStatus", changes);

    // On approval the hygiene score becomes the inspection score.
    // In Part 3 this happens inside VerificationService.approve().
    if (status === "APPROVED") {
      const insp = MOCK.inspections.find(i => i.restaurantId === id);
      if (insp) {
        const scores = store.get("restScore", {});
        scores[id] = insp.totalScore;
        store.set("restScore", scores);
      }
    }
    location.reload();
  } else {
    apiPost("/admin/restaurants/" + id + "/status", { status: status }).then(() => location.reload());
  }
}

/* ---------- screen 16: admin dashboard ---------- */

async function loadAdminDashboard() {
  const rests = await allRestaurants();
  const flags = await allFlags();

  const approved = rests.filter(r => r.status === "APPROVED");
  const pending = rests.filter(r => r.status === "PENDING");
  const customers = MOCK.users.filter(u => u.role === "CUSTOMER").length;
  const orders = MOCK.orders.length + store.get("myOrders", []).length;

  document.querySelector("#customerCount").textContent = customers;
  document.querySelector("#verifiedCount").textContent = approved.length;
  document.querySelector("#orderCount").textContent = orders;
  document.querySelector("#pendingCount").textContent = pending.length;

  const avg = approved.length
    ? Math.round(approved.reduce((s, r) => s + r.hygieneScore, 0) / approved.length * 10) / 10
    : 0;
  document.querySelector("#avgScore").textContent = avg + " / 100";
  document.querySelector("#atRisk").textContent = approved.filter(r => r.hygieneScore < 75).length;
  document.querySelector("#suspended").textContent = rests.filter(r => r.status === "SUSPENDED").length;

  const openFlags = flags.filter(f => f.decision === "PENDING");
  document.querySelector("#flagCount").textContent = openFlags.length;

  document.querySelector("#pendingAlert").classList.toggle("hide", !pending.length);
  document.querySelector("#pendingAlertText").textContent =
    pending.length + " restaurant" + (pending.length === 1 ? "" : "s") + " waiting for approval";

  document.querySelector("#flagAlert").classList.toggle("hide", !openFlags.length);
  document.querySelector("#flagAlertText").textContent =
    openFlags.length + " review" + (openFlags.length === 1 ? "" : "s") + " waiting for moderation";

  // any restaurant with 2+ recent fails
  const risky = approved.filter(r => {
    const checks = MOCK.hygieneChecks.filter(h => h.restaurantId === r.id).slice(0, 3);
    return checks.filter(c => !c.passed).length >= 2;
  });
  document.querySelector("#hygieneAlert").classList.toggle("hide", !risky.length);
  if (risky.length) {
    document.querySelector("#hygieneAlertText").textContent =
      risky.map(r => r.name).join(", ") + " \u2014 consecutive failed checks";
  }
}

/* ---------- screen 17: verification queue ---------- */

async function loadQueue() {
  const rests = await allRestaurants();

  const groups = {
    Pending: rests.filter(r => r.status === "PENDING"),
    Approved: rests.filter(r => r.status === "APPROVED"),
    Rejected: rests.filter(r => ["REJECTED", "SUSPENDED"].indexOf(r.status) >= 0)
  };

  document.querySelector("#tabs").innerHTML = Object.keys(groups).map((k, i) =>
    '<div class="tab ' + (i === 0 ? "on" : "") + '" data-g="' + k + '">' + k +
    ' (' + groups[k].length + ')</div>').join("");

  const render = (g) => {
    const list = groups[g];
    if (!list.length) {
      document.querySelector("#queue").innerHTML = '<div class="empty">Nothing here</div>';
      return;
    }

    document.querySelector("#queue").innerHTML = list.map(r => {
      const docs = MOCK.documents.filter(d => d.restaurantId === r.id);
      const insp = MOCK.inspections.find(i => i.restaurantId === r.id);
      const stages = [docs.length >= 3, docs.length >= 3, !!insp, r.status === "APPROVED"]
                     .filter(Boolean).length;
      const pct = Math.round(stages / 4 * 100);

      const tone = r.status === "APPROVED" ? "card-green"
                 : r.status === "PENDING" ? "card-blue" : "card-red";
      const badge = r.status === "APPROVED" ? "b-green"
                  : r.status === "PENDING" ? "b-blue" : "b-red";

      return '<div class="card ' + tone + '">' +
        '<div class="row"><div><div class="name">' + r.name + '</div>' +
        '<div class="sub">' + r.address + '</div></div>' +
        '<span class="badge ' + badge + '">' + r.status + '</span></div>' +
        '<div class="bar"><div class="fill" style="width:' + pct + '%"></div></div>' +
        '<div class="small">Stage ' + stages + ' of 4' +
        (insp ? ' &bull; inspection score ' + insp.totalScore + '/100' : ' &bull; not inspected yet') + '</div>' +
        '<div class="btnrow"><a class="btn-out btn-sm" href="verify-detail.html?id=' + r.id + '">View Detail</a>' +
        (r.status === "PENDING"
          ? '<button class="btn btn-sm" data-approve="' + r.id + '">Approve</button>'
          : r.status === "SUSPENDED"
            ? '<button class="btn btn-sm" data-approve="' + r.id + '">Reinstate</button>'
            : '') +
        '</div></div>';
    }).join("");

    $$("[data-approve]").forEach(b => b.onclick = () => setRestaurantStatus(+b.dataset.approve, "APPROVED"));
  };

  render("Pending");

  $$("#tabs .tab").forEach(t => t.onclick = () => {
    $$("#tabs .tab").forEach(x => x.classList.remove("on"));
    t.classList.add("on");
    render(t.dataset.g);
  });
}

/* ---------- screen 18: verification detail ---------- */

async function loadVerifyDetail() {
  const id = +(qs("id") || 3);
  const rests = await allRestaurants();
  const r = rests.find(x => x.id === id);
  if (!r) { document.querySelector("#stages").innerHTML = '<div class="empty">Not found</div>'; return; }

  const docs = MOCK.documents.filter(d => d.restaurantId === id);
  const insp = MOCK.inspections.find(i => i.restaurantId === id);

  const docsDone = docs.length >= 3;
  const inspDone = !!insp;
  const approved = r.status === "APPROVED";
  const stagesDone = [docsDone, docsDone, inspDone, approved].filter(Boolean).length;
  const pct = Math.round(stagesDone / 4 * 100);

  document.querySelector("#title").textContent = "Verify: " + r.name;
  document.querySelector("#sub").textContent = r.cuisine + " \u2022 " + r.address;
  document.querySelector("#pct").textContent = pct + "%";
  document.querySelector("#pctBar").style.width = pct + "%";
  document.querySelector("#stageText").textContent = stagesDone + " of 4 stages complete";

  const stage = (n, done, current, title, detail) =>
    '<div class="step"><div class="dot ' + (done ? "dot-on" : current ? "dot-cur" : "dot-off") + '">' +
    (done ? "&#10003;" : n) + '</div><div style="flex:1">' +
    '<div class="name' + (current ? " blue" : "") + '">' + title + '</div>' +
    '<div class="small">' + detail + '</div></div></div>';

  document.querySelector("#stages").innerHTML =
    stage(1, docsDone, !docsDone, "1. Document Verification",
          docs.map(d => d.type.replace(/_/g, " ") + " &#10003;").join(" &bull; ") || "Nothing uploaded") +
    stage(2, docsDone, false, "2. Owner Identity Check",
          "Phone OTP verified &bull; NID face-match passed") +
    stage(3, inspDone, docsDone && !inspDone, "3. Kitchen Inspection",
          insp
            ? 'Score <span class="green">' + insp.totalScore + '/100</span><div class="bar">' +
              '<div class="fill" style="width:' + insp.totalScore + '%"></div></div>' +
              "Cleanliness " + insp.cleanliness + "/25 &bull; Storage " + insp.storage +
              "/25 &bull; Staff hygiene " + insp.staffHygiene + "/25 &bull; Waste " + insp.wasteControl + "/25" +
              "<br>Officer: " + insp.officerName
            : "Not inspected yet") +
    stage(4, approved, inspDone && !approved, "4. Final Admin Approval",
          approved ? "Approved and live" : "Your decision \u2014 SLA 24 hours");

  document.querySelector("#noteBox").classList.toggle("hide", !insp || !insp.officerNote);
  if (insp && insp.officerNote) document.querySelector("#officerNote").textContent = insp.officerNote;

  const actions = document.querySelector("#actions");
  if (approved) {
    actions.innerHTML = '<div class="card card-green"><div class="small">' +
      '<span class="green">&#9989; Approved.</span> This restaurant is live and in the hygiene photo cycle.</div></div>' +
      '<button class="btn-red" data-suspend="' + r.id + '">Suspend Restaurant</button>';
  } else {
    actions.innerHTML = '<div class="btnrow">' +
      '<button class="btn-out btn-sm" style="padding:12px" data-reject="' + r.id + '">Reject</button>' +
      '<button class="btn btn-sm" style="padding:12px" data-approve="' + r.id + '">Approve &amp; Publish</button></div>';
  }

  $$("[data-approve]").forEach(b => b.onclick = () => setRestaurantStatus(+b.dataset.approve, "APPROVED"));
  $$("[data-reject]").forEach(b => b.onclick = () => setRestaurantStatus(+b.dataset.reject, "REJECTED"));
  $$("[data-suspend]").forEach(b => b.onclick = () => setRestaurantStatus(+b.dataset.suspend, "SUSPENDED"));
}

/* ---------- screen 19: hygiene monitoring ---------- */

async function loadAdminHygiene() {
  const rests = (await allRestaurants()).filter(r => r.status !== "PENDING");
  const live = rests.filter(r => r.status === "APPROVED");

  const avg = live.length
    ? Math.round(live.reduce((s, r) => s + r.hygieneScore, 0) / live.length * 10) / 10
    : 0;

  document.querySelector("#avg").textContent = avg;
  document.querySelector("#avgBar").style.width = avg + "%";
  document.querySelector("#tracked").textContent = live.length + " TRACKED";
  document.querySelector("#safe").textContent = live.filter(r => r.hygieneScore >= 85).length;
  document.querySelector("#risk").textContent = live.filter(r => r.hygieneScore < 75).length;

  document.querySelector("#scores").innerHTML = rests.map(r => {
    const colour = r.hygieneScore >= 85 ? "green" : r.hygieneScore >= 75 ? "gold" : "red";
    const fill = r.hygieneScore < 75
      ? 'style="width:' + r.hygieneScore + '%;background:linear-gradient(90deg,#D4A574,#ff4757)"'
      : 'style="width:' + r.hygieneScore + '%"';
    return '<div class="row" style="margin-bottom:9px">' +
      '<span class="small" style="width:96px">' + r.name + '</span>' +
      '<div class="bar" style="flex:1;margin:0 9px"><div class="fill" ' + fill + '></div></div>' +
      '<span class="' + colour + '" style="font-size:11px;font-weight:700">' + r.hygieneScore + '</span></div>';
  }).join("");

  // restaurants close to auto suspension
  const risky = live.map(r => {
    const checks = MOCK.hygieneChecks.filter(h => h.restaurantId === r.id).slice(0, 3);
    return { r: r, fails: checks.filter(c => !c.passed).length };
  }).filter(x => x.fails >= 2);

  document.querySelector("#riskBox").innerHTML = risky.length
    ? risky.map(x =>
        '<div class="card card-red"><div class="row"><div>' +
        '<div class="name red">' + x.r.name + '</div>' +
        '<div class="sub">' + x.fails + ' consecutive failed photo checks</div></div>' +
        '<span class="badge b-red">' + (3 - x.fails) + ' FROM SUSPENSION</span></div>' +
        '<div class="btnrow"><button class="btn-red btn-sm" data-suspend="' + x.r.id + '">Suspend Now</button></div>' +
        '</div>').join("")
    : '<div class="card card-green"><div class="small"><span class="green">&#9989;</span> ' +
      'No restaurant is close to suspension right now.</div></div>';

  $$("[data-suspend]").forEach(b => b.onclick = () => setRestaurantStatus(+b.dataset.suspend, "SUSPENDED"));
}

/* ---------- screen 20: fake review detection ---------- */

async function loadFakeReviews() {
  const flags = await allFlags();
  const pending = flags.filter(f => f.decision === "PENDING");
  const decided = flags.filter(f => f.decision !== "PENDING");

  const allReviews = copy(MOCK.reviews).concat(store.get("myReviews", []));
  const clean = allReviews.filter(r => !flags.some(f => f.reviewId === r.id));

  document.querySelector("#flagged").textContent = pending.length;
  document.querySelector("#authentic").textContent = clean.length;

  const groups = { Flagged: pending, Decided: decided, Authentic: clean };

  document.querySelector("#tabs").innerHTML = Object.keys(groups).map((k, i) =>
    '<div class="tab ' + (i === 0 ? "on" : "") + '" data-g="' + k + '">' + k +
    ' (' + groups[k].length + ')</div>').join("");

  const reviewOf = (id) => allReviews.find(r => r.id === id);
  const userOf = (id) => MOCK.users.find(u => u.id === id);
  const restOf = (id) => MOCK.restaurants.find(r => r.id === id);

  const render = (g) => {
    const box = document.querySelector("#list");

    if (g === "Authentic") {
      box.innerHTML = groups.Authentic.map(r => {
        const u = userOf(r.customerId), rest = restOf(r.restaurantId);
        return '<div class="card card-green">' +
          '<div class="row"><div><div class="name">' + (u ? u.name : "Customer") + '</div>' +
          '<div class="sub">' + (rest ? rest.name : "") + ' &bull; ' + "\u2605".repeat(r.rating) + '</div></div>' +
          '<span class="badge b-green">ORDER #NC' + r.orderId + '</span></div>' +
          '<div class="small" style="margin-top:7px;font-style:italic">"' + r.comment + '"</div></div>';
      }).join("") || '<div class="empty">Nothing here</div>';
      return;
    }

    const list = groups[g];
    if (!list.length) { box.innerHTML = '<div class="empty">Nothing here</div>'; return; }

    box.innerHTML = list.map(f => {
      const r = reviewOf(f.reviewId);
      if (!r) return "";
      const u = userOf(r.customerId), rest = restOf(r.restaurantId);

      const decided = f.decision !== "PENDING";
      return '<div class="card card-red">' +
        '<div class="row"><div><div class="name">' + (u ? u.name : "Unknown user") + '</div>' +
        '<div class="sub">' + (rest ? rest.name : "") + ' &bull; ' + "\u2605".repeat(r.rating) + '</div></div>' +
        '<span class="badge b-red">' + f.confidence + '% FAKE</span></div>' +
        '<div class="small" style="margin:7px 0;font-style:italic">"' + r.comment + '"</div>' +
        '<div class="card" style="margin:0;padding:9px;background:rgba(212,165,116,.07)">' +
        '<div class="small gold" style="font-weight:700;margin-bottom:4px">DETECTION SIGNALS</div>' +
        f.signals.map(s => '<div class="small">&bull; ' + s + '</div>').join("") +
        '</div>' +
        (decided
          ? '<div class="small" style="margin-top:8px">Decision: <span class="' +
            (f.decision === "KEPT" ? "green" : "red") + '">' + f.decision + '</span></div>'
          : '<div class="btnrow"><button class="btn-out btn-sm" data-keep="' + f.id + '">Keep</button>' +
            '<button class="btn-red btn-sm" data-remove="' + f.id + '">Remove</button></div>') +
        '</div>';
    }).join("");

    $$("[data-keep]").forEach(b => b.onclick = () => decideFlag(+b.dataset.keep, "KEPT"));
    $$("[data-remove]").forEach(b => b.onclick = () => decideFlag(+b.dataset.remove, "REMOVED"));
  };

  render("Flagged");

  $$("#tabs .tab").forEach(t => t.onclick = () => {
    $$("#tabs .tab").forEach(x => x.classList.remove("on"));
    t.classList.add("on");
    render(t.dataset.g);
  });
}

function decideFlag(flagId, decision) {
  if (USE_MOCK) {
    const d = store.get("flagDecisions", {});
    d[flagId] = decision;
    store.set("flagDecisions", d);
    location.reload();
  } else {
    apiPost("/admin/reviews/" + flagId + "/decide", { decision: decision }).then(() => location.reload());
  }
}
