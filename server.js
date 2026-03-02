const express = require("express");
const identifyRoute = require("./routes/identifyRoute");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bitespeed Identity Service is running 🚀");
});

app.use("/", identifyRoute);

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});