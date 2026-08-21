/* ============================================================
   auth.js — login, signup, logout, role redirect.
   Backend equivalent: Part 2 (AuthService + AuthController)
   ============================================================ */

const HOME_FOR = {
  CUSTOMER:         "home.html",
  RESTAURANT_OWNER: "restaurant/dashboard.html",
  ADMIN:            "admin/dashboard.html"
};

/** Currently signed-in user, or null. */
function currentUser() {
  return store.get("user", null);//
}

/** Put at the top of every protected page. */
function requireRole(role, loginPage) {
  const u = currentUser();
  if (!u || u.role !== role) {
    location.href = loginPage || "index.html";
    return null;
  }
  return u;
}

async function login(email, password, expectedRole) {
  let user;

  if (USE_MOCK) {
    user = MOCK.users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error("Wrong email or password");
  } else {
    user = await apiPost("/auth/login", { email, password });
  }

  if (expectedRole && user.role !== expectedRole) {
    throw new Error("This account is not a " + expectedRole.toLowerCase().replace("_", " "));
  }

  store.set("user", user);
  return user;
}

async function signup(data) {
  if (USE_MOCK) {
    if (MOCK.users.some(u => u.email === data.email)) throw new Error("Email already registered");
    const user = { id: Date.now(), role: "CUSTOMER", createdAt: new Date().toISOString().slice(0,10), ...data };
    MOCK.users.push(user);
    store.set("user", user);
    return user;
  }
  return apiPost("/auth/signup", data);
}

async function registerRestaurant(data) {
  if (USE_MOCK) {
    const rid = MOCK.restaurants.length + 1;
    MOCK.restaurants.push({
      id: rid, ownerId: Date.now(), name: data.restaurantName, address: data.address,
      cuisine: data.cuisine, deliveryFee: 50, status: "PENDING",
      hygieneScore: 0, rating: 0, icon: "\u{1F37D}", prepTime: 30
    });
    const user = { id: Date.now(), name: data.ownerName, email: data.email,
                   password: data.password, role: "RESTAURANT_OWNER", restaurantId: rid };
    MOCK.users.push(user);
    store.set("user", user);
    return user;
  }
  return apiPost("/auth/restaurant/register", data);
}

function logout(to) {
  store.del("user");
  store.del("cart");
  location.href = to || "index.html";
}

/** First name, skipping Bengali honorifics like Md / Mst. */
function firstName(full) {
  const skip = ["md", "md.", "mohammad", "muhammad", "mst", "mst.", "mrs", "mr"];
  const parts = (full || "").split(" ").filter(w => skip.indexOf(w.toLowerCase()) < 0);
  return parts[0] || full;
}

/** Fill any element with class .js-username. */
function paintUser() {
  const u = currentUser();
  if (!u) return;
  $$(".js-username").forEach(el => el.textContent = u.name);
  $$(".js-useremail").forEach(el => el.textContent = u.email || "");
  $$(".js-userphone").forEach(el => el.textContent = u.phone || "-");
  $$(".js-useraddress").forEach(el => el.textContent = u.address || "-");
}
