-- ============================================================
-- NoCap — Complete Database Schema
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS nocap;

USE nocap;

-- ============================================================
-- DROP EXISTING TABLES
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS riders;
DROP TABLE IF EXISTS admin_actions;
DROP TABLE IF EXISTS hygiene_checks;
DROP TABLE IF EXISTS inspections;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS review_flags;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(100) UNIQUE NOT NULL,

    password VARCHAR(255) NOT NULL,

    phone VARCHAR(20),

    address VARCHAR(255),

    role ENUM(
        'CUSTOMER',
        'RESTAURANT_OWNER',
        'ADMIN',
        'RIDER'
    ) NOT NULL,

    status VARCHAR(50) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. RESTAURANTS
-- ============================================================

CREATE TABLE restaurants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    owner_id BIGINT NOT NULL,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(100),

    phone VARCHAR(20),

    address VARCHAR(255),

    cuisine VARCHAR(100),

    rating DECIMAL(3,2) DEFAULT 0.00,

    hygiene_score INT DEFAULT 0,

    prep_time INT DEFAULT 30,

    delivery_fee DECIMAL(10,2) DEFAULT 0.00,

    status VARCHAR(50) DEFAULT 'PENDING',

    latitude VARCHAR(50),

    longitude VARCHAR(50),

    icon VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_restaurant_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
);


-- ============================================================
-- 3. MENU ITEMS
-- ============================================================

CREATE TABLE menu_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    restaurant_id BIGINT NOT NULL,

    name VARCHAR(100) NOT NULL,

    description TEXT,

    price DECIMAL(10,2) NOT NULL,

    category VARCHAR(50),

    available BOOLEAN DEFAULT TRUE,

    icon VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_menu_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
);


-- ============================================================
-- 4. ORDERS
-- ============================================================

CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    customer_id BIGINT NOT NULL,

    restaurant_id BIGINT NOT NULL,

    subtotal DECIMAL(10,2) DEFAULT 0.00,

    delivery_fee DECIMAL(10,2) DEFAULT 0.00,

    total DECIMAL(10,2) DEFAULT 0.00,

    payment_method VARCHAR(50) DEFAULT 'COD',

    address VARCHAR(255),

    status VARCHAR(50) DEFAULT 'PLACED',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_customer
        FOREIGN KEY (customer_id)
        REFERENCES users(id),

    CONSTRAINT fk_order_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
);


-- ============================================================
-- 5. ORDER ITEMS
-- ============================================================

CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    order_id BIGINT NOT NULL,

    menu_item_id BIGINT,

    name VARCHAR(100),

    price DECIMAL(10,2),

    quantity INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_item_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id),

    CONSTRAINT fk_order_item_menu
        FOREIGN KEY (menu_item_id)
        REFERENCES menu_items(id)
);


-- ============================================================
-- 6. REVIEWS
-- ============================================================

CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    order_id BIGINT NOT NULL,

    customer_id BIGINT NOT NULL,

    restaurant_id BIGINT NOT NULL,

    rating INT,

    comment TEXT,

    status VARCHAR(50) DEFAULT 'VISIBLE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_review_rating
        CHECK (rating >= 1 AND rating <= 5),

    CONSTRAINT fk_review_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id),

    CONSTRAINT fk_review_customer
        FOREIGN KEY (customer_id)
        REFERENCES users(id),

    CONSTRAINT fk_review_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
);


-- ============================================================
-- 7. REVIEW FLAGS
-- ============================================================

CREATE TABLE review_flags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    review_id BIGINT NOT NULL,

    confidence INT DEFAULT 0,

    signals TEXT,

    decision VARCHAR(50) DEFAULT 'PENDING',

    decided_by BIGINT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_flag_review
        FOREIGN KEY (review_id)
        REFERENCES reviews(id),

    CONSTRAINT fk_review_flag_admin
        FOREIGN KEY (decided_by)
        REFERENCES users(id)
);


-- ============================================================
-- 8. HYGIENE CHECKS
-- ============================================================


-- ============================================================
-- 9. INSPECTIONS
-- ============================================================

CREATE TABLE inspections (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    restaurant_id BIGINT NOT NULL,

    cleanliness INT NOT NULL,

    storage INT NOT NULL,

    staff_hygiene INT NOT NULL,

    waste_control INT NOT NULL,

    total_score INT NOT NULL,

    officer_name VARCHAR(100),

    officer_note TEXT,

    inspected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_cleanliness
        CHECK (cleanliness BETWEEN 0 AND 25),

    CONSTRAINT chk_storage
        CHECK (storage BETWEEN 0 AND 25),

    CONSTRAINT chk_staff_hygiene
        CHECK (staff_hygiene BETWEEN 0 AND 25),

    CONSTRAINT chk_waste_control
        CHECK (waste_control BETWEEN 0 AND 25),

    CONSTRAINT chk_total_score
        CHECK (total_score BETWEEN 0 AND 100),

    CONSTRAINT fk_inspection_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
);


-- ============================================================
-- 10. DOCUMENTS
-- ============================================================

CREATE TABLE documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    restaurant_id BIGINT NOT NULL,

    type ENUM(
        'TRADE_LICENCE',
        'CHEF_CERT',
        'OWNER_NID'
    ) NOT NULL,

    file_path VARCHAR(500) NOT NULL,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) DEFAULT 'PENDING',

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_document_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
);


-- ============================================================
-- 11. ADMIN ACTIONS
-- ============================================================

CREATE TABLE admin_actions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    admin_id BIGINT NOT NULL,

    action VARCHAR(100) NOT NULL,

    target_type VARCHAR(100),

    target_id BIGINT,

    note TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_admin_action_admin
        FOREIGN KEY (admin_id)
        REFERENCES users(id)
);


-- ============================================================
-- 12. RIDERS
-- ============================================================

CREATE TABLE riders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    user_id BIGINT NOT NULL UNIQUE,

    is_online BOOLEAN DEFAULT FALSE,

    rating DECIMAL(3,2) DEFAULT 0.00,

    total_deliveries INT DEFAULT 0,

    total_earnings DECIMAL(10,2) DEFAULT 0.00,

    status VARCHAR(50) DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_rider_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);


-- ============================================================
-- 13. DELIVERIES
-- ============================================================

CREATE TABLE deliveries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    order_id BIGINT NOT NULL,

    rider_id BIGINT NULL,

    distance_km DECIMAL(10,2),

    delivery_fee DECIMAL(10,2),

    status VARCHAR(50) DEFAULT 'ASSIGNED',

    pickup_time TIMESTAMP NULL,

    delivery_time TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_delivery_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id),

    CONSTRAINT fk_delivery_rider
        FOREIGN KEY (rider_id)
        REFERENCES riders(id)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_user_email
    ON users(email);

CREATE INDEX idx_user_role
    ON users(role);

CREATE INDEX idx_restaurant_owner
    ON restaurants(owner_id);

CREATE INDEX idx_restaurant_status
    ON restaurants(status);

CREATE INDEX idx_menu_restaurant
    ON menu_items(restaurant_id);

CREATE INDEX idx_order_customer
    ON orders(customer_id);

CREATE INDEX idx_order_restaurant
    ON orders(restaurant_id);

CREATE INDEX idx_order_status
    ON orders(status);

CREATE INDEX idx_review_restaurant
    ON reviews(restaurant_id);

CREATE INDEX idx_review_customer
    ON reviews(customer_id);

CREATE INDEX idx_hygiene_restaurant
    ON hygiene_checks(restaurant_id);

CREATE INDEX idx_inspection_restaurant
    ON inspections(restaurant_id);

CREATE INDEX idx_document_restaurant
    ON documents(restaurant_id);

CREATE INDEX idx_review_flag_review
    ON review_flags(review_id);

CREATE INDEX idx_delivery_order
    ON deliveries(order_id);

CREATE INDEX idx_delivery_rider
    ON deliveries(rider_id);

CREATE INDEX idx_delivery_status
    ON deliveries(status);


-- ============================================================
-- FINAL CHECK
-- ============================================================

SELECT 'NoCap database schema created successfully.' AS status;

SHOW TABLES;
