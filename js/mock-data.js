/* ============================================================
   mock-data.js
   Mirrors database/seed.sql so the frontend runs with no backend.
   When your API is ready, set USE_MOCK = false in api.js and
   delete nothing — this file just stops being used.
   ============================================================ */

const MOCK = {

  users: [
    { id:1, name:"System Admin",  email:"admin@nocap.com.bd",  password:"nocap123", role:"ADMIN" },
    { id:2, name:"Kamrul Hasan",  email:"kamrul@palazzio.com", password:"nocap123", role:"RESTAURANT_OWNER", restaurantId:1 },
    { id:3, name:"Farhana Akter", email:"farhana@bbites.com",  password:"nocap123", role:"RESTAURANT_OWNER", restaurantId:2 },
    { id:4, name:"Tanvir Rahman", email:"tanvir@bking.com",    password:"nocap123", role:"RESTAURANT_OWNER", restaurantId:3 },
    { id:5, name:"Md Ashikur Rahman Siyam", email:"ashikur@gmail.com", password:"nocap123", role:"CUSTOMER",
      phone:"+8801700000005", address:"Flat 5B, House 10, Road 11, Gulshan 2, Dhaka", createdAt:"2026-03-01" },
    { id:6, name:"Sarah Ahmed",   email:"sarah@gmail.com",     password:"nocap123", role:"CUSTOMER",
      phone:"+8801700000006", address:"Road 7, Dhanmondi, Dhaka", createdAt:"2026-04-22" },
    { id:7, name:"user2847",      email:"user2847@mail.com",   password:"nocap123", role:"CUSTOMER",
      phone:"+8801700000007", address:"Uttara, Dhaka", createdAt:"2026-08-13" }
  ],

  restaurants: [
    { id:1, ownerId:2, name:"Pizza Palazzio", address:"Road 11, Gulshan 1, Dhaka", cuisine:"Italian",
      deliveryFee:50, status:"APPROVED", hygieneScore:98, rating:4.8, icon:"\u{1F355}", prepTime:30 },
    { id:2, ownerId:3, name:"Biryani Bites",  address:"Kemal Ataturk Ave, Banani, Dhaka", cuisine:"Indian",
      deliveryFee:40, status:"APPROVED", hygieneScore:94, rating:4.6, icon:"\u{1F35B}", prepTime:25 },
    { id:3, ownerId:4, name:"Biryani King",   address:"Mirpur 10 Circle, Dhaka", cuisine:"Indian",
      deliveryFee:45, status:"PENDING",  hygieneScore:0,  rating:0,   icon:"\u{1F357}", prepTime:35 }
  ],

  documents: [
    { id:1, restaurantId:1, type:"TRADE_LICENCE", status:"APPROVED" },
    { id:2, restaurantId:1, type:"CHEF_CERT",     status:"APPROVED" },
    { id:3, restaurantId:1, type:"OWNER_NID",     status:"APPROVED" },
    { id:4, restaurantId:2, type:"TRADE_LICENCE", status:"APPROVED" },
    { id:5, restaurantId:2, type:"CHEF_CERT",     status:"APPROVED" },
    { id:6, restaurantId:2, type:"OWNER_NID",     status:"APPROVED" },
    { id:7, restaurantId:3, type:"TRADE_LICENCE", status:"APPROVED" },
    { id:8, restaurantId:3, type:"CHEF_CERT",     status:"APPROVED" },
    { id:9, restaurantId:3, type:"OWNER_NID",     status:"APPROVED" }
  ],

  inspections: [
    { restaurantId:1, cleanliness:25, storage:24, staffHygiene:24, wasteControl:25, totalScore:98,
      officerName:"Nabil Rahman", officerNote:"Excellent condition. Cold storage logs maintained properly." },
    { restaurantId:2, cleanliness:24, storage:23, staffHygiene:23, wasteControl:24, totalScore:94,
      officerName:"Nabil Rahman", officerNote:"Good overall. Advised covering the prep counter overnight." },
    { restaurantId:3, cleanliness:24, storage:23, staffHygiene:21, wasteControl:26, totalScore:94,
      officerName:"Nabil Rahman", officerNote:"Gloves not worn consistently at the grill station. Correction due in 14 days." }
  ],

  hygieneChecks: [
    { id:1, restaurantId:1, requestedAt:"2026-08-13 14:30", uploadedAt:"2026-08-13 14:38", score:98, passed:true },
    { id:2, restaurantId:1, requestedAt:"2026-08-13 10:15", uploadedAt:"2026-08-13 10:21", score:96, passed:true },
    { id:3, restaurantId:1, requestedAt:"2026-08-12 19:30", uploadedAt:"2026-08-12 19:36", score:97, passed:true },
    { id:4, restaurantId:2, requestedAt:"2026-08-13 16:00", uploadedAt:null, score:0,  passed:false },
    { id:5, restaurantId:2, requestedAt:"2026-08-13 11:00", uploadedAt:"2026-08-13 11:12", score:68, passed:false },
    { id:6, restaurantId:2, requestedAt:"2026-08-12 12:00", uploadedAt:"2026-08-12 12:09", score:91, passed:true }
  ],

  menuItems: [
    { id:1, restaurantId:1, name:"Margherita Pizza", description:"Fresh mozzarella, basil, San Marzano tomato", price:399, category:"Pizzas", available:true,  icon:"\u{1F355}" },
    { id:2, restaurantId:1, name:"Pepperoni Pizza",  description:"Double pepperoni with extra cheese",          price:499, category:"Pizzas", available:true,  icon:"\u{1F355}" },
    { id:3, restaurantId:1, name:"Veggie Supreme",   description:"Bell pepper, olives, mushroom, corn",         price:449, category:"Pizzas", available:false, icon:"\u{1F952}" },
    { id:4, restaurantId:1, name:"Garlic Bread",     description:"Crispy, herb butter, side dip",               price:199, category:"Sides",  available:true,  icon:"\u{1F956}" },
    { id:5, restaurantId:1, name:"Coca Cola 500ml",  description:"Chilled",                                      price:60,  category:"Drinks", available:true,  icon:"\u{1F964}" },
    { id:6, restaurantId:2, name:"Kacchi Biryani",   description:"Mutton kacchi with aromatic basmati",          price:320, category:"Biryani",available:true,  icon:"\u{1F35B}" },
    { id:7, restaurantId:2, name:"Chicken Biryani",  description:"Chicken roast with basmati and potato",        price:260, category:"Biryani",available:true,  icon:"\u{1F357}" },
    { id:8, restaurantId:2, name:"Beef Tehari",      description:"Traditional Dhaka style tehari",               price:240, category:"Biryani",available:true,  icon:"\u{1F372}" },
    { id:9, restaurantId:2, name:"Borhani 300ml",    description:"Spiced yoghurt drink",                          price:70,  category:"Drinks", available:true,  icon:"\u{1F95B}" }
  ],

  orders: [
    { id:1, customerId:5, restaurantId:1, subtotal:898, deliveryFee:50, total:948, paymentMethod:"COD",
      status:"DELIVERED", createdAt:"2026-08-11 20:42", items:[{name:"Margherita Pizza",qty:1,price:399},{name:"Pepperoni Pizza",qty:1,price:499}] },
    { id:2, customerId:5, restaurantId:2, subtotal:580, deliveryFee:40, total:620, paymentMethod:"BKASH",
      status:"DELIVERED", createdAt:"2026-08-08 13:10", items:[{name:"Kacchi Biryani",qty:1,price:320},{name:"Chicken Biryani",qty:1,price:260}] },
    { id:3, customerId:6, restaurantId:1, subtotal:399, deliveryFee:50, total:449, paymentMethod:"COD",
      status:"DELIVERED", createdAt:"2026-08-09 19:25", items:[{name:"Margherita Pizza",qty:1,price:399}] },
    { id:4, customerId:5, restaurantId:1, subtotal:499, deliveryFee:50, total:549, paymentMethod:"COD",
      status:"PREPARING", createdAt:"2026-08-13 20:42", items:[{name:"Pepperoni Pizza",qty:1,price:499}] },
    { id:5, customerId:5, restaurantId:2, subtotal:260, deliveryFee:40, total:300, paymentMethod:"COD",
      status:"CANCELLED", createdAt:"2026-07-30 18:00", items:[{name:"Chicken Biryani",qty:1,price:260}] },
    { id:6, customerId:5, restaurantId:2, subtotal:240, deliveryFee:40, total:280, paymentMethod:"COD",
      status:"DELIVERED", createdAt:"2026-08-12 12:15", items:[{name:"Beef Tehari",qty:1,price:240}] }
  ],

  reviews: [
    { id:1, orderId:1, customerId:5, restaurantId:1, rating:5, status:"VISIBLE", createdAt:"2026-08-11",
      comment:"Crust was perfectly thin and the cheese was still stretchy on arrival. Delivered five minutes early." },
    { id:2, orderId:2, customerId:5, restaurantId:2, rating:4, status:"VISIBLE", createdAt:"2026-08-08",
      comment:"Kacchi had good flavour but the meat was slightly dry. Borhani was excellent though." },
    { id:3, orderId:3, customerId:6, restaurantId:1, rating:5, status:"HIDDEN", createdAt:"2026-08-13",
      comment:"Best pizza ever!" }
  ],

  reviewFlags: [
    { id:1, reviewId:3, confidence:75, decision:"PENDING",
      signals:["Comment shorter than 20 characters (25)",
               "Duplicate of another review text (20)",
               "Account created less than 24 hours ago (15)",
               "Generic phrase with no specifics (15)"] }
  ]
};
