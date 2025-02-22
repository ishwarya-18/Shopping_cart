require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
const bodyParser = require("body-parser");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Test Database Connection
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });

// Homepage Route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post(
    "/checkout",
    [
      body("paymentMethod").isIn(["card", "upi", "cod"]).withMessage("Invalid payment method"),
      body("sessionId").notEmpty().withMessage("Session ID is required"),
      body("totalAmount").isFloat({ gt: 0 }).withMessage("Total amount must be positive"),
      body("items").isArray().withMessage("Items must be an array"),
      body("shippingDetails.name").notEmpty().withMessage("Shipping name is required"),
      body("shippingDetails.address").notEmpty().withMessage("Shipping address is required"),
      body("shippingDetails.zip").notEmpty().withMessage("ZIP Code is required"),
      body("shippingDetails.email").isEmail().withMessage("Valid email is required"), // ✅ Add email validation
      body("shippingDetails.phone").notEmpty().withMessage("Phone number is required"), // ✅ Add phone validation
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const { sessionId, paymentMethod, totalAmount, items, shippingDetails } = req.body;
  
        const query = `
          INSERT INTO orders (session_id, payment_method, total_amount, items, shipping_details) 
          VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
  
        const result = await pool.query(query, [
          sessionId,
          paymentMethod,
          parseFloat(totalAmount),
          JSON.stringify(items),
          JSON.stringify(shippingDetails),
        ]);
  
        res.json({ message: "Order placed successfully!", order: result.rows[0] });
  
      } catch (err) {
        console.error("❌ Order Processing Error:", err);
        res.status(500).json({ error: "Failed to process order", details: err.message });
      }
    }
  );  

// Get All Orders
app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
