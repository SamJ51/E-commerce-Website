-- Create enum types for orders table


-- ======================================


CREATE TYPE order_status_enum AS ENUM ('Pending', 'Processed', 'Shipped', 'Delivered', 'Cancelled');


CREATE TYPE payment_status_enum AS ENUM ('Pending', 'Paid', 'Declined', 'Refunded');




-- ======================================


-- Create trigger function to update modified timestamp


-- ======================================


CREATE OR REPLACE FUNCTION update_modified_column()


RETURNS TRIGGER AS $$


BEGIN


  NEW.updated_at = CURRENT_TIMESTAMP;


  RETURN NEW;


END;


$$ LANGUAGE plpgsql;




-- ======================================


-- Create sequences for auto-incrementing columns


-- ======================================


CREATE SEQUENCE addresses_address_id_seq;


CREATE SEQUENCE cart_cart_id_seq;


CREATE SEQUENCE cart_items_cart_item_id_seq;


CREATE SEQUENCE categories_category_id_seq;


CREATE SEQUENCE order_items_order_item_id_seq;


CREATE SEQUENCE orders_order_id_seq;


CREATE SEQUENCE products_product_id_seq;


CREATE SEQUENCE roles_role_id_seq;


CREATE SEQUENCE tags_tag_id_seq;


CREATE SEQUENCE users_user_id_seq;




-- ======================================


-- Create tables in dependency order


-- ======================================




-- 1. roles table (no dependencies)


CREATE TABLE roles (


  role_id    integer NOT NULL DEFAULT nextval('roles_role_id_seq'::regclass),


  role_name text NOT NULL,


  PRIMARY KEY (role_id)


);

-- Insert default roles
INSERT INTO roles (role_name) VALUES ('admin'); -- role_id 1
INSERT INTO roles (role_name) VALUES ('user');  -- role_id 2



-- 2. users table (depends on roles)


CREATE TABLE users (


  user_id       integer NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),


  username      text NOT NULL,


  email         text NOT NULL,


  password_hash text NOT NULL,


  role_id       integer NOT NULL,


  created_at    timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,


  updated_at    timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,


  PRIMARY KEY (user_id),


  UNIQUE (email),


  UNIQUE (username)


);


ALTER TABLE users


  ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(role_id);




-- 3. addresses table (depends on users)


CREATE TABLE addresses (


  address_id  integer NOT NULL DEFAULT nextval('addresses_address_id_seq'::regclass),


  user_id     integer NOT NULL,


  street      text NOT NULL,


  city        text NOT NULL,


  state       text NOT NULL,


  zip_code    text NOT NULL,


  country     text NOT NULL,


  is_billing  boolean NOT NULL,


  is_shipping boolean NOT NULL,


  PRIMARY KEY (address_id)


);


CREATE INDEX idx_addresses_user_id ON addresses(user_id);


ALTER TABLE addresses


  ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id);




-- 4. cart table (depends on users)


CREATE TABLE cart (


  cart_id    integer NOT NULL DEFAULT nextval('cart_cart_id_seq'::regclass),


  user_id    integer NOT NULL,


  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,


  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,


  PRIMARY KEY (cart_id)


);


CREATE INDEX idx_cart_user_id ON cart(user_id);


ALTER TABLE cart


  ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id);




-- 5. products table (no dependencies; referenced by others)


CREATE TABLE products (


  product_id     integer NOT NULL DEFAULT nextval('products_product_id_seq'::regclass),


  name           text NOT NULL,


  description    text,


  price          numeric(10,2) NOT NULL,


  stock          integer NOT NULL,


  main_image_url text,


  created_at     timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,


  updated_at     timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,


  PRIMARY KEY (product_id)


);


CREATE INDEX idx_products_name ON products(name);




-- 6. categories table (no dependencies)


CREATE TABLE categories (


  category_id   integer NOT NULL DEFAULT nextval('categories_category_id_seq'::regclass),


  category_name text NOT NULL,


  PRIMARY KEY (category_id)


);




-- 7. tags table (no dependencies)


CREATE TABLE tags (


  tag_id   integer NOT NULL DEFAULT nextval('tags_tag_id_seq'::regclass),


  tag_name text NOT NULL,


  PRIMARY KEY (tag_id)


);




-- 8. product_categories (many-to-many between products and categories)


CREATE TABLE product_categories (


  product_id  integer NOT NULL,


  category_id integer NOT NULL,


  PRIMARY KEY (product_id, category_id)


);


CREATE INDEX idx_product_categories_category_id ON product_categories(category_id);


CREATE INDEX idx_product_categories_product_id ON product_categories(product_id);


ALTER TABLE product_categories


  ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(product_id);


ALTER TABLE product_categories

  ADD CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(category_id);


-- 9. product_tags (many-to-many between products and tags)


CREATE TABLE product_tags (


  product_id integer NOT NULL,


  tag_id     integer NOT NULL,


  PRIMARY KEY (product_id, tag_id)


);


CREATE INDEX idx_product_tags_product_id ON product_tags(product_id);


CREATE INDEX idx_product_tags_tag_id ON product_tags(tag_id);


ALTER TABLE product_tags


  ADD CONSTRAINT product_tags_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(product_id);


ALTER TABLE product_tags

  ADD CONSTRAINT product_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(tag_id);


-- 10. orders table (depends on users)

CREATE TABLE orders (

    order_id        integer NOT NULL DEFAULT nextval('orders_order_id_seq'::regclass),

    user_id         integer NOT NULL,

    order_date      timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

    total_amount    numeric(10, 2) NOT NULL,

    shipping_address_id integer NOT NULL,

    billing_address_id  integer NOT NULL,

    order_status    order_status_enum NOT NULL DEFAULT 'Pending',

    payment_status  payment_status_enum NOT NULL DEFAULT 'Pending',    

    PRIMARY KEY (order_id)

);

CREATE INDEX idx_orders_user_id ON orders(user_id);

ALTER TABLE orders

    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE orders

  ADD CONSTRAINT orders_shipping_address_id_fkey FOREIGN KEY (shipping_address_id) REFERENCES addresses(address_id);

ALTER TABLE orders

  ADD CONSTRAINT orders_billing_address_id_fkey FOREIGN KEY (billing_address_id) REFERENCES addresses(address_id);


-- 11. order_items table (depends on orders and products)


CREATE TABLE order_items (

    order_item_id   integer NOT NULL DEFAULT nextval('order_items_order_item_id_seq'::regclass),

    order_id        integer NOT NULL,

    product_id      integer NOT NULL,

    quantity        integer NOT NULL,

    price           numeric(10, 2) NOT NULL,

    PRIMARY KEY (order_item_id)

);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

CREATE INDEX idx_order_items_product_id ON order_items(product_id);

ALTER TABLE order_items

    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(order_id);

ALTER TABLE order_items

    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(product_id);


-- 12. cart_items table (depends on cart and products)

CREATE TABLE cart_items(

    cart_item_id    integer NOT NULL DEFAULT nextval('cart_items_cart_item_id_seq'::regclass),

    cart_id         integer NOT NULL,

    product_id      integer NOT NULL,

    quantity        integer NOT NULL,

    PRIMARY KEY (cart_item_id)

);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

ALTER TABLE cart_items

    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES cart(cart_id);

ALTER TABLE cart_items

    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(product_id);


-- 13. password_resets (depends on users)

CREATE TABLE password_resets (

  reset_token text NOT NULL,

  user_id     integer NOT NULL,

  expires_at  timestamp without time zone NOT NULL,

  PRIMARY KEY (reset_token)

);


CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);


ALTER TABLE password_resets

  ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id);




-- ======================================


-- Create triggers to update "updated_at" on modifications


-- ======================================




-- Trigger on cart table


CREATE TRIGGER update_cart_modtime


BEFORE UPDATE ON cart


FOR EACH ROW


EXECUTE FUNCTION update_modified_column();




-- Trigger on products table


CREATE TRIGGER update_product_modtime


BEFORE UPDATE ON products


FOR EACH ROW


EXECUTE FUNCTION update_modified_column();




-- Trigger on users table


CREATE TRIGGER update_user_modtime


BEFORE UPDATE ON users


FOR EACH ROW


EXECUTE FUNCTION update_modified_column();


-- Trigger on order table

CREATE TRIGGER update_order_modtime

BEFORE UPDATE ON orders

FOR EACH ROW

EXECUTE FUNCTION update_modified_column();


-- Trigger on order_items table

CREATE TRIGGER update_order_item_modtime

BEFORE UPDATE ON order_items

FOR EACH ROW

EXECUTE FUNCTION update_modified_column();


-- Trigger on cart_items table

CREATE TRIGGER update_cart_item_modtime

BEFORE UPDATE ON cart_items

FOR EACH ROW

EXECUTE FUNCTION update_modified_column();