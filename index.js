const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

const corsConfig = {
  origin: "*",
  credential: true,
  optionSuccessStatus: 200,
};

// middlewares
app.use(cors());
app.options("", cors(corsConfig));
app.use(express.json());

// basic setup
app.get("/", (req, res) => {
  res.send("House-Hunter Server is running");
});

app.listen(port, () => {
  console.log(`House-Hunter Server is running on port: ${port}`);
});
