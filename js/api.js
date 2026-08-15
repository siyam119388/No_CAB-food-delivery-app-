/* ============================================================
   api.js — the only place that talks to the server.

   USE_MOCK = true   -> everything runs from mock-data.js in the
                        browser. No backend needed. Use this to
                        demo and test the screens.
   USE_MOCK = false  -> real calls to the Spring Boot API.
                        Switch this after Parts 2-6 are built.
   ============================================================ */

const USE_MOCK = true;
const BASE_URL = "http://localhost:8080/api";

/* ---------- real API helpers (used when USE_MOCK = false) ---------- */

async function apiGet(path) {
  const res = await fetch(BASE_URL + path);
  if (!res.ok) throw new Error("GET " + path + " failed");
  return res.json();
}

async function apiPost(path, data) {
  const res = await fetch(BASE_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("POST " + path + " failed");
  return res.json();
}

async function apiPut(path, data) {
  const res = await fetch(BASE_URL + path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("PUT " + path + " failed");
  return res.json();
}

/* ---------- tiny helpers used by every page ---------- */

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/** Bangladeshi Taka formatting. */
const tk = (n) => "\u09F3" + Number(n).toLocaleString("en-US");

/** Read ?id=3 from the address bar. */
const qs = (key) => new URLSearchParams(location.search).get(key);

/** Save / read data that survives page navigation. */
const store = {
  get:  (k, fallback) => { try { return JSON.parse(localStorage.getItem("nocap_" + k)) ?? fallback; }
                           catch (e) { return fallback; } },
  set:  (k, v) => localStorage.setItem("nocap_" + k, JSON.stringify(v)),
  del:  (k)    => localStorage.removeItem("nocap_" + k)
};

/** Deep copy so pages never mutate MOCK by accident. */
const copy = (x) => JSON.parse(JSON.stringify(x));

/**
 * Mock mode only.
 * The admin can change a restaurant's status and score at runtime.
 * Those changes live in localStorage, and every role must see them --
 * otherwise approving a restaurant as admin would not make it appear
 * on the customer's home screen. One helper keeps all three in sync.
 * With a real backend this is just the database doing its job.
 */
function withOverrides(restaurants) {
  const status = store.get("restStatus", {});
  const score  = store.get("restScore", {});
  return restaurants.map(r => {
    if (status[r.id]) r.status = status[r.id];
    if (score[r.id] !== undefined) r.hygieneScore = score[r.id];
    return r;
  });
}
