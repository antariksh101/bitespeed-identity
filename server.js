const express = require("express");
const identifyRoute = require("./routes/identifyRoute");

const app = express();
app.use(express.json());

app.use("/", identifyRoute);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});