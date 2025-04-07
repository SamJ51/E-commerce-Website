# E-commerce Web Application

I built this project for the purpose of better understanding full stack development.

## Tech Stack

- Frontend: **React.js**
- Backend: **Node.js**, **Express.js**
- Backend Testing: **Jest**
- Database: **PostgreSQL**
- Payment: **Stripe**
- Containerisation: **Docker**
- Reverse Proxy: **Nginx**

## Infrastructure / Deployment
- DNS Management: **Amazon Route 53**
- Server: **AWS Lightsail**

## Features

### Frontend (React.js)

- User Authentication
- Home Page
- Product Management
- Cart Management
- Payment Handling (Stripe Checkout)
- Profile Page

### Backend (Node.js + Express.js)

- Authentication APIs
- User Profile API
- Product CRUD APIs
- Cart APIs
- Order APIs
- Stripe Payment Integration

### API

#### Base URL

**`http://localhost:5000/api`**

#### Available Routes

##### Authentication

- POST /auth/register
- POST /auth/login

##### User Profile

- GET /user/profile

##### Products

- GET /products
- GET /products/:productId
- POST /products/admin

##### Cart

- GET /cart
- POST /cart/items
- PATCH /cart/items/:id
- DELETE /cart/items/:id

##### Orders

- POST /orders
- GET /orders

##### Payments

- POST /stripe

### Project Structure

**Backend/**
- **config/**
  - `db.js`

- **middlewares/**
  - `authMiddleware.js`

- **models/**
  - `User.js`

- **routes/**
  - **address/**
    - `address.js`
    
  - **authorisation/**
    - `login.js`
    - `register.js`
    
  - **cart/**
    - `cart.js`
    
  - **order/**
    - `order.js`
    - `payment.js`
    
  - **product/**
    - `getProductDetails.js`
    - `getProducts.js`
    - `productAdmin.js`
    
  - **user/**
    - `profile.js`

- `index.js`
- `test.js`
- `Dockerfile`
- `package.json`
- `package-lock.json`

**Docker/**
- `.env`
- `docker-compose.yml`
- `nginx.conf`
- `schema.sql`

**Frontend**
- **src/**
  - **components/**
    - `NavBar.js`
    - `Payment.js`
  - **pages/**
    - `CardRowStlye.css`
    - `CardContext.js`
    - `CartManagementPage.js`
    - `CheckoutForm.js`
    - `CreateProductPage.js`
    - `HomePage.js`
    - `LoginPage.js`
    - `ProductDetailsPage.js`
    - `ProfilePage.js`
    - `RegisterPage.js`
    - `UpdateProductPage.js`
    - `ViewProductsPage.js`
  - `App.css`
  - `App.js`
- `dockerfile`
- `package.json`
- `package-lock.json`
- `README.md`