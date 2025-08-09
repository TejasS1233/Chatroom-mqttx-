require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const mqtt = require("mqtt");
const cors = require("cors");
const Message = require("./models/message");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME, // database name from env
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Connect to MQTT broker
const client = mqtt.connect(process.env.MQTT_BROKER);

client.on("connect", () => {
  console.log("✅ Connected to MQTT broker");
  client.subscribe("chat/#"); // listen to all chat rooms
});

client.on("message", async (topic, message) => {
  try {
    const msg = JSON.parse(message.toString());
    const newMessage = new Message(msg);
    await newMessage.save();
    console.log("💾 Saved message:", msg);
  } catch (err) {
    console.error("❌ Failed to save message", err);
  }
});

// API: Get messages by room
app.get("/messages/:room", async (req, res) => {
  const msgs = await Message.find({ room: req.params.room })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(msgs);
});

app.listen(process.env.PORT, () =>
  console.log(`🚀 Server running on port ${process.env.PORT}`)
);
