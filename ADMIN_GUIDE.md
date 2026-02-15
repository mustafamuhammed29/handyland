# 🛡️ HandyLand Admin Panel Guide

Welcome to the HandyLand Admin Panel! This guide will help you manage your store, products, orders, and more.

## 🔑 Accessing the Admin Panel

1. **URL**: Navigate to your admin URL (e.g., `https://admin.handyland.com` or `http://localhost:5173/admin` in development).
2. **Login**: Enter your admin email and password.
   - **Default Email**: `admin@handyland.com`
   - **Default Password**: `admin123` (Please change this immediately after first login!)

> **Note**: If you forget your password, please contact the technical support team to perform a database reset or use the "Forgot Password" feature if configured.

---

## 📊 Dashboard Overview

Once logged in, you will see the **Dashboard**. This is your command center.

**Key Metrics:**

- **Total Revenue**: Sum of all paid orders (excluding cancelled).
- **Total Orders**: Count of all orders.
- **Active Products**: Number of products currently listed.
- **Recent Activity**: Quickly view the latest orders and new user registrations.

**Sidebar Navigation:**

- **Dashboard**: Return to the main view.
- **Products**: Manage your inventory.
- **Orders**: View and process customer orders.
- **Users**: View registered customers.
- **Settings**: Specific store configurations.

---

## 🛍️ Product Management

Go to the **Products** tab to manage your catalog.

### Viewing Products

- Use the **Search Bar** to find products by name or SKU.
- **Filter** by category or stock status (In Stock / Out of Stock).

### Adding a New Product

1. Click the **"+ Add Product"** button.
2. Fill in the details:
   - **Name**: The product title displayed to customers.
   - **Description**: Detailed info about the product.
   - **Price**: Selling price (in €).
   - **Category**: Select from the dropdown (e.g., Accessories, Parts).
   - **Stock**: Quantity available.
   - **Images**: Upload high-quality images.
3. Click **Save Product**.

### Editing/Deleting

- Click the **Edit (Pencil)** icon next to a product to update details (price, stock, etc.).
- Click the **Delete (Trash)** icon to remove a product. *Warning: This cannot be undone!*

---

## 📦 Order Management

Go to the **Orders** tab to handle customer purchases.

### Order Status Flow

1. **Pending**: New order received (unpaid or awaiting processing).
2. **Processing**: Payment confirmed, actively preparing the package.
3. **Shipped**: Package handed to carrier. *Add tracking number here.*
4. **Delivered**: Customer received the package.
5. **Cancelled**: Order stopped and refunded (if applicable).

### Processing an Order

1. Click on an **Order ID** to view details.
2. Review the **Items** and **Shipping Address**.
3. To update status:
   - Select the new status (e.g., **Shipped**) from the dropdown.
   - (Optional) Enter the **Tracking Number**.
   - Click **Update Status**.
   - The customer will automatically realize an email notification.

### Printing Invoices

- Inside the order details, click **"Print Invoice"** to generate a professional PDF invoice for the package.

---

## 👥 User Management

Go to the **Users** tab to view your customer base.

- View customer details (Email, Join Date).
- Check order history for specific users.

---

## 🔒 Security Best Practices

- **Password**: Update your admin password regularly.
- **Logout**: Always click **Logout** when you are finished, especially on shared computers.
- **Access**: Do not share admin credentials. Create separate admin accounts if multiple people need access.

---

## 🆘 Support

If you encounter technical issues (e.g., server errors, login failures), please contact the development team immediately with:

1. A screenshot of the error.
2. What you were trying to do when it happened.

**Technical Contact**: <tech@handyland.com>
