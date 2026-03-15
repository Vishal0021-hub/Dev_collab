require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = 5000;

const ConnectDB = require("./config/db")
ConnectDB();

const authRoutes= require("./routes/authRoutes");
app.use("/api/auth",authRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});