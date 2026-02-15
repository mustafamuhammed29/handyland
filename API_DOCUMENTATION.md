# 🔌 HandyLand API Documentation

## Base URL

- **Production:** `https://api.handyland.com`
- **Development:** `http://localhost:5000/api`

## Authentication

Most endpoints require authentication via JWT token.

### Headers

```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Getting a Token

1. Register or login via `/auth/register` or `/auth/login`
2. Extract token from response
3. Include in Authorization header for subsequent requests

### Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### Common HTTP Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **429** - Too Many Requests (rate limited)
- **500** - Internal Server Error

---

## 🔐 Authentication Endpoints

### 1. Register User

`POST /auth/register`

Create a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+491234567890" // Optional
}
```

**Response (201):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2026-02-15T12:00:00.000Z"
  }
}
```

### 2. Login User

`POST /auth/login`

Authenticate and get access token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### 3. Admin Login

`POST /auth/admin/login`

Authenticate as admin user.

**Request Body:**

```json
{
  "email": "admin@handyland.com",
  "password": "admin123"
}
```

### 4. Get Current User

`GET /auth/me`

Get authenticated user's profile.

**Headers:**
`Authorization: Bearer YOUR_TOKEN`

**Response (200):**

```json
{
  "success": true,
  "user": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+491234567890",
    "role": "user",
    "emailVerified": true,
    "createdAt": "2026-02-15T12:00:00.000Z"
  }
}
```

---

## 🛍️ Products Endpoints

### 1. Get All Products

`GET /products`

Get list of products with pagination and filters.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `category`: Filter by category
- `search`: Search in name/description
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `inStock`: Filter in-stock items (true/false)

**Example:**
`GET /products?page=1&limit=20&category=accessories&minPrice=10&maxPrice=100`

**Response (200):**

```json
{
  "success": true,
  "count": 45,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  },
  "products": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "name": "Phone Case",
      "description": "Protective case for iPhone 13",
      "price": 29.99,
      "category": "accessories",
      "stock": 150,
      "images": ["https://..."],
      "rating": 4.5,
      "reviews": 23,
      "createdAt": "2026-02-10T10:00:00.000Z"
    }
  ]
}
```

### 2. Get Single Product

`GET /products/:id`

Get detailed product information.

**URL Parameter:**

- `:id` - Product ID

**Response (200):**

```json
{
  "success": true,
  "product": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "Phone Case",
    "description": "Protective case for iPhone 13...",
    "price": 29.99,
    "category": "accessories",
    "stock": 150,
    "images": ["https://..."],
    "specifications": {
      "material": "Silicone",
      "color": "Black",
      "compatibility": "iPhone 13"
    }
  }
}
```

### 3. Create Product (Admin Only)

`POST /products`

**Headers:**
`Authorization: Bearer ADMIN_TOKEN`

**Request Body:**

```json
{
  "name": "New Phone Case",
  "description": "High-quality protective case",
  "price": 34.99,
  "category": "accessories",
  "stock": 100,
  "images": ["https://..."],
  "specifications": {
    "material": "TPU",
    "color": "Blue"
  }
}
```

---

## 🛒 Orders Endpoints

### 1. Create Order

`POST /orders`

Create a new order.

**Headers:**
`Authorization: Bearer USER_TOKEN`

**Request Body:**

```json
{
  "items": [
    {
      "product": "60d5ec49f1b2c72b8c8e4f1a",
      "quantity": 2,
      "productType": "Product" // 'Product' or 'Accessory'
    }
  ],
  "shippingAddress": {
    "fullName": "John Doe",
    "street": "123 Main St",
    "city": "Mannheim",
    "zipCode": "68161",
    "country": "Germany",
    "phone": "+491234567890"
  },
  "paymentMethod": "Stripe",
  "notes": "Please leave at door"
}
```

**Response (201):**

```json
{
  "success": true,
  "order": {
    "_id": "60d5ec49f1b2c72b8c8e4f1c",
    "user": "60d5ec49f1b2c72b8c8e4f1a",
    "items": [
      {
        "product": "60d5ec49f1b2c72b8c8e4f1a",
        "name": "Phone Case",
        "quantity": 2,
        "price": 29.99,
        "productType": "Product"
      }
    ],
    "totalAmount": 59.98,
    "shippingFee": 5.99,
    "tax": 11.40,
    "shippingAddress": { ... },
    "status": "pending",
    "createdAt": "2026-02-15T14:30:00.000Z"
  }
}
```

### 2. Get My Orders

`GET /orders`

Get authenticated user's orders.

**Query Parameters:**

- `status`: Filter by status
- `page`: Page number
- `limit`: Items per page

### 3. Get Single Order

`GET /orders/:id`

Get order details.

**Response (200):**

```json
{
  "success": true,
  "order": {
    "_id": "60d5ec49f1b2c72b8c8e4f1c",
    "orderNumber": "ORD-26-000123",
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+491234567890"
    },
    "items": [
      {
        "product": "60d5ec49f1b2c72b8c8e4f1a",
        "name": "Phone Case",
        "price": 29.99,
        "quantity": 2,
        "image": "https://..."
      }
    ],
    "shippingAddress": {
       "street": "123 Main St",
       "city": "Mannheim",
       "zipCode": "68161",
       "country": "Germany"
    },
    "totalAmount": 69.97,
    "status": "processing",
    "paymentMethod": "Stripe",
    "isPaid": true,
    "paidAt": "2026-02-15T14:35:00.000Z",
    "createdAt": "2026-02-15T14:30:00.000Z"
  }
}
```

---

## 🔧 Admin Orders Endpoints (Admin Only)

### 1. Get All Orders

`GET /orders/admin/all`

**Query Parameters:**

- `status`: Filter by status
- `page`: Page number
- `limit`: Items per page

### 2. Update Order Status

`PUT /orders/admin/:id/status`

**Request Body:**

```json
{
  "status": "shipped", // pending, processing, shipped, delivered, cancelled
  "trackingNumber": "1Z999AA10123456784", // Optional
  "note": "Package passed to DHL" // Optional
}
```
