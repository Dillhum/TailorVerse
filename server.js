const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
app.use(cors());
app.use(express.json());
console.log("🔥 THIS SERVER.JS IS RUNNING");

// 🔑 Apni Stripe Secret Key yahan lagao
require("dotenv").config();   // .env file load karega

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;

    // ❌ Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // ✅ 1. Customer create
    const customer = await stripe.customers.create();

    // ✅ 2. Ephemeral Key create (PaymentSheet ke liye zaroori)
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2023-10-16" }
    );

    // ✅ 3. Payment Intent create
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // PKR/USD ke liye multiply
      currency: "usd", // ya "pkr"
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // ✅ 4. IMPORTANT RESPONSE (frontend ko ye sab chahiye)
    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });

  } catch (error) {
    console.log("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🚀 Server start
app.listen(5000, () => {
  console.log("🔥 NEW SERVER RUNNING ON 5000");
});