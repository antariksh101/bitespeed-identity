const identifyContact = require("../services/identityService");

exports.identify = async (req, res) => {
  try {
    const { email = null, phoneNumber = null } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: "Either email or phoneNumber must be provided"
      });
    }

    const result = await identifyContact(email, phoneNumber);

    return res.status(200).json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};