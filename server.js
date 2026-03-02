const express = require("express");
const identifyRoute = require("./routes/identifyRoute");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bitespeed Identity Service is running 🚀");
});

app.use("/", identifyRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});