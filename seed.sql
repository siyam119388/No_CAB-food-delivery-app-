-- ============================================================
--  NoCap — Seed / test data
--  Part 1
--  Run after schema.sql: mysql -u root -p < seed.sql
--
--  EVERY account below uses the password: nocap123
--  (stored as a BCrypt hash — matches BCryptPasswordEncoder in Java)
-- ============================================================

USE nocap;

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
-- id 1        : admin
-- id 2, 3, 4  : restaurant owners
-- id 5, 6, 7  : customers
-- ------------------------------------------------------------

INSERT INTO users
(name, email, password, phone, address, role, created_at)
VALUES
('System Admin',
 'admin@nocap.com.bd',
 '$2b$10$41GQgurOAEUFOqHS4QL4IuBx//8k4bQ6.wORTrkfDeN4FQJ3EwR2m',
 '+8801700000001',
 'Gulshan 1, Dhaka',
 'ADMIN',
 '2026-01-10 09:00:00'),

('Kamrul Hasan',
 'kamrul@palazzio.com',
 '$2b$10$41GQgurOAEUFOqHS4QL4IuBx//8k4bQ6.wORTrkfDeN4FQJ3EwR2m',
 '+8801700000002',
 'Gulshan 1, Dhaka',
 'RESTAURANT_OWNER',
 '2026-02-05 11:20:00'),

('Farhana Akter',
 'farhana@bbites.com',
 '$2b$10$41GQgurOAEUFOqHS4QL4IuBx//8k4bQ6.wORTrkfDeN4FQJ3EwR2m',
 '+8801700000003',
 'Banani, Dhaka',
 'RESTAURANT_OWNER',
 '2026-02-18 15:40:00'),

('Tanvir Rahman',
 'tanvir@bking.com',
 '$2b$10$41GQgurOAEUFOqHS4QL4IuBx//8k4bQ6.wORTrkfDeN4FQJ3EwR2m',
 '+8801700000004',
 'Mirpur 10, Dhaka',
 'RESTAURANT_OWNER',
 '2026-08-10 10:15:00'),

('Md Ashikur Rahman Siyam',
 'ashikur@gmail.com',
 '$2b$10$41GQgurOAEUFOqHS4QL4IuBx//8k4bQ6.wORTrkfDeN4FQJ3EwR2m',
 '+8801700000005',
 'Flat 5B, House 10, Road 11, Gulshan 2, Dhaka',
 'CUSTOMER',
 '2026-03-01 18:30:00'),

('Sarah Ahmed',
 'sarah@gmail.com',
 '$2b$10$41GQgurOAEUFOqHS4QL4IuBx//8k4bQ6.wORTrkfDeN4FQJ3EwR2m',
 '+8801700000006',
 'Road 7, Dhanmondi, Dhaka',
 'CUSTOMER',
 '2026-04-22 12:05:00'),

('user2847',
 'user2847@mail.com',
 '$2b$10$41GQgurOAEUFOqHS4QL4IuBx//8k4bQ6.wORTrkfDeN4FQJ3EwR2m',
 '+8801700000007',
 'Uttara, Dhaka',
 'CUSTOMER',
 '2026-08-13 07:30:00');


-- ------------------------------------------------------------
-- RESTAURANTS
--   1, 2 : APPROVED -> visible to customers
--   3    : PENDING  -> use this to test Part 3 verification
-- ------------------------------------------------------------

INSERT INTO restaurants
(owner_id, name, address, cuisine, delivery_fee, status, hygiene_score, rating, created_at)
VALUES
(2,
 'Pizza Palazzio',
 'Road 11, Gulshan 1, Dhaka',
 'Italian',
 50.00,
 'APPROVED',
 98,
 4.80,
 '2026-02-05 11:30:00'),

(3,
 'Biryani Bites',
 'Kemal Ataturk Ave, Banani, Dhaka',
 'Indian',
 40.00,
 'APPROVED',
 94,
 4.60,
 '2026-02-18 16:00:00'),

(4,
 'Biryani King',
 'Mirpur 10 Circle, Dhaka',
 'Indian',
 45.00,
 'PENDING',
 0,
 0.00,
 '2026-08-10 10:30:00');


-- ------------------------------------------------------------
-- DOCUMENTS
-- Verification stage 1
-- ------------------------------------------------------------

INSERT INTO documents
(restaurant_id, type, file_path, status, uploaded_at)
VALUES
(1,
 'TRADE_LICENCE',
 'uploads/docs/palazzio_licence.pdf',
 'APPROVED',
 '2026-02-05 12:00:00'),

(1,
 'CHEF_CERT',
 'uploads/docs/palazzio_chef.pdf',
 'APPROVED',
 '2026-02-05 12:02:00'),

(1,
 'OWNER_NID',
 'uploads/docs/palazzio_nid.jpg',
 'APPROVED',
 '2026-02-05 12:04:00'),

(2,
 'TRADE_LICENCE',
 'uploads/docs/bbites_licence.pdf',
 'APPROVED',
 '2026-02-18 16:20:00'),

(2,
 'CHEF_CERT',
 'uploads/docs/bbites_chef.pdf',
 'APPROVED',
 '2026-02-18 16:22:00'),

(2,
 'OWNER_NID',
 'uploads/docs/bbites_nid.jpg',
 'APPROVED',
 '2026-02-18 16:24:00'),

-- Biryani King has uploaded everything,
-- still waiting on final approval
(3,
 'TRADE_LICENCE',
 'uploads/docs/bking_licence.pdf',
 'APPROVED',
 '2026-08-10 11:00:00'),

(3,
 'CHEF_CERT',
 'uploads/docs/bking_chef.pdf',
 'APPROVED',
 '2026-08-10 11:02:00'),

(3,
 'OWNER_NID',
 'uploads/docs/bking_nid.jpg',
 'APPROVED',
 '2026-08-10 11:05:00');


-- ------------------------------------------------------------
-- INSPECTIONS
-- Verification stage 3
-- Four categories x maximum 25
-- ------------------------------------------------------------

INSERT INTO inspections
(
    restaurant_id,
    cleanliness,
    storage,
    staff_hygiene,
    waste_control,
    total_score,
    officer_name,
    officer_note,
    inspected_at
)
VALUES
(1,
 25,
 24,
 24,
 25,
 98,
 'Nabil Rahman',
 'Excellent condition. Cold storage logs maintained properly.',
 '2026-02-08 14:00:00'),

(2,
 24,
 23,
 23,
 24,
 94,
 'Nabil Rahman',
 'Good overall. Advised covering the prep counter overnight.',
 '2026-02-20 15:30:00'),

-- Corrected:
-- 24 + 23 + 21 + 25 = 93
(3,
 24,
 23,
 21,
 25,
 93,
 'Nabil Rahman',
 'Gloves not worn consistently at the grill station. Correction due in 14 days; re-check on 26 Aug.',
 '2026-08-12 13:15:00');


-- ------------------------------------------------------------
-- HYGIENE CHECKS
-- Random photo checks after approval
--
-- Pizza Palazzio : all passing
--
-- Biryani Bites  : 2 consecutive fails
--                  1 more triggers auto suspension
-- ------------------------------------------------------------

INSERT INTO hygiene_checks
(
    restaurant_id,
    requested_at,
    uploaded_at,
    photo_path,
    score,
    passed
)
VALUES
(1,
 '2026-08-12 13:00:00',
 '2026-08-12 13:08:00',
 'uploads/hygiene/p1.jpg',
 99,
 TRUE),

(1,
 '2026-08-12 19:30:00',
 '2026-08-12 19:36:00',
 'uploads/hygiene/p2.jpg',
 97,
 TRUE),

(1,
 '2026-08-13 10:15:00',
 '2026-08-13 10:21:00',
 'uploads/hygiene/p3.jpg',
 96,
 TRUE),

(1,
 '2026-08-13 14:30:00',
 '2026-08-13 14:38:00',
 'uploads/hygiene/p4.jpg',
 98,
 TRUE),

(2,
 '2026-08-12 12:00:00',
 '2026-08-12 12:09:00',
 'uploads/hygiene/b1.jpg',
 91,
 TRUE),

(2,
 '2026-08-13 11:00:00',
 '2026-08-13 11:12:00',
 'uploads/hygiene/b2.jpg',
 68,
 FALSE),

(2,
 '2026-08-13 16:00:00',
 NULL,
 NULL,
 0,
 FALSE);

-- Second failed check:
-- no upload within 15 minutes = automatic fail


-- ------------------------------------------------------------
-- MENU ITEMS
-- ------------------------------------------------------------

INSERT INTO menu_items
(restaurant_id, name, description, price, category, available)
VALUES
(1,
 'Margherita Pizza',
 'Fresh mozzarella, basil, San Marzano tomato',
 399.00,
 'Pizzas',
 TRUE),

(1,
 'Pepperoni Pizza',
 'Double pepperoni with extra cheese',
 499.00,
 'Pizzas',
 TRUE),

(1,
 'Veggie Supreme',
 'Bell pepper, olives, mushroom, corn',
 449.00,
 'Pizzas',
 FALSE),

(1,
 'Garlic Bread',
 'Crispy, herb butter, side dip',
 199.00,
 'Sides',
 TRUE),

(1,
 'Coca Cola 500ml',
 'Chilled',
 60.00,
 'Drinks',
 TRUE),

(2,
 'Kacchi Biryani',
 'Mutton kacchi with aromatic basmati',
 320.00,
 'Biryani',
 TRUE),

(2,
 'Chicken Biryani',
 'Chicken roast with basmati and potato',
 260.00,
 'Biryani',
 TRUE),

(2,
 'Beef Tehari',
 'Traditional Dhaka style tehari',
 240.00,
 'Biryani',
 TRUE),

(2,
 'Borhani 300ml',
 'Spiced yoghurt drink',
 70.00,
 'Drinks',
 TRUE);


-- ------------------------------------------------------------
-- ORDERS
--
-- 1, 2, 3 : DELIVERED -> customer can review
-- 4       : PREPARING -> use for tracking screen
-- 5       : CANCELLED -> review must be BLOCKED
-- 6       : DELIVERED -> not yet reviewed
-- ------------------------------------------------------------

INSERT INTO orders
(
    customer_id,
    restaurant_id,
    subtotal,
    delivery_fee,
    total,
    payment_method,
    address,
    status,
    created_at
)
VALUES
(5,
 1,
 898.00,
 50.00,
 948.00,
 'COD',
 'Flat 5B, House 10, Road 11, Gulshan 2, Dhaka',
 'DELIVERED',
 '2026-08-11 20:42:00'),

(5,
 2,
 580.00,
 40.00,
 620.00,
 'BKASH',
 'Flat 5B, House 10, Road 11, Gulshan 2, Dhaka',
 'DELIVERED',
 '2026-08-08 13:10:00'),

(6,
 1,
 399.00,
 50.00,
 449.00,
 'COD',
 'Road 7, Dhanmondi, Dhaka',
 'DELIVERED',
 '2026-08-09 19:25:00'),

(5,
 1,
 499.00,
 50.00,
 549.00,
 'COD',
 'Flat 5B, House 10, Road 11, Gulshan 2, Dhaka',
 'PREPARING',
 '2026-08-13 20:42:00'),

(5,
 2,
 260.00,
 40.00,
 300.00,
 'COD',
 'Flat 5B, House 10, Road 11, Gulshan 2, Dhaka',
 'CANCELLED',
 '2026-07-30 18:00:00'),

(5,
 2,
 240.00,
 40.00,
 280.00,
 'COD',
 'Flat 5B, House 10, Road 11, Gulshan 2, Dhaka',
 'DELIVERED',
 '2026-08-12 12:15:00');

-- order 5 is cancelled -> reviewing it must be blocked
-- order 6 is delivered but not yet reviewed -> review button appears


-- ------------------------------------------------------------
-- ORDER ITEMS
-- ------------------------------------------------------------

INSERT INTO order_items
(order_id, menu_item_id, quantity, price)
VALUES
(1, 1, 1, 399.00),
(1, 2, 1, 499.00),

(2, 6, 1, 320.00),
(2, 7, 1, 260.00),

(3, 1, 1, 399.00),

(4, 2, 1, 499.00),

(5, 7, 1, 260.00),

(6, 8, 1, 240.00);


-- ------------------------------------------------------------
-- REVIEWS
-- Each review is linked to a delivered order
-- ------------------------------------------------------------

INSERT INTO reviews
(
    order_id,
    customer_id,
    restaurant_id,
    rating,
    comment,
    status,
    created_at
)
VALUES
(1,
 5,
 1,
 5,
 'Crust was perfectly thin and the cheese was still stretchy on arrival. Delivered five minutes early.',
 'VISIBLE',
 '2026-08-11 21:30:00'),

(2,
 5,
 2,
 4,
 'Kacchi had good flavour but the meat was slightly dry. Borhani was excellent though.',
 'VISIBLE',
 '2026-08-08 14:20:00'),

(3,
 6,
 1,
 5,
 'Best pizza ever!',
 'HIDDEN',
 '2026-08-13 08:05:00');

-- order 3 review is short and generic
-- flagged below for testing Part 6


-- ------------------------------------------------------------
-- REVIEW FLAGS
-- Fake review detection output
--
-- Weights:
-- no/undelivered order 40
-- short comment 25
-- duplicate text 20
-- new account 15
-- ------------------------------------------------------------

INSERT INTO review_flags
(
    review_id,
    confidence,
    signals,
    decision,
    decided_by,
    created_at
)
VALUES
(3,
 75,
 'SHORT_COMMENT(25),DUPLICATE_TEXT(20),NEW_ACCOUNT(15),GENERIC_PHRASE(15)',
 'PENDING',
 NULL,
 '2026-08-13 08:05:10');


-- ------------------------------------------------------------
-- ADMIN ACTIONS
-- Audit log
--
-- IMPORTANT:
-- 'RESTAURANT' here is target_type.
-- It is NOT the user role.
-- Do NOT change it to RESTAURANT_OWNER.
-- ------------------------------------------------------------

INSERT INTO admin_actions
(
    admin_id,
    action,
    target_type,
    target_id,
    note,
    created_at
)
VALUES
(1,
 'APPROVE_RESTAURANT',
 'RESTAURANT',
 1,
 'All documents verified, inspection score 98',
 '2026-02-09 10:00:00'),

(1,
 'APPROVE_RESTAURANT',
 'RESTAURANT',
 2,
 'All documents verified, inspection score 94',
 '2026-02-21 11:15:00');


-- ------------------------------------------------------------
-- VERIFICATION
-- ------------------------------------------------------------

SELECT 'Seed data loaded.' AS status;

SELECT
    role,
    COUNT(*) AS total
FROM users
GROUP BY role;

SELECT
    name,
    status,
    hygiene_score
FROM restaurants;