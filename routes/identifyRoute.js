const express = require("express");
const { identify } = require("../controllers/identifyController");

const router = express.Router();

router.post("/identify", identify);

module.exports = router;