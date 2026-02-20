require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
  res.json({
    status: "AI Control Plane Backend Running",
    timestamp: new Date(),
  });
});

// Example API route
app.get("/api/health", (req, res) => {
  res.json({ message: "System healthy" });
});

// Port config
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
