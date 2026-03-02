const db = require("../db");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function execute(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function identifyContact(email, phoneNumber) {

  // Find matching contacts
  const matched = await query(
    `SELECT * FROM Contact WHERE email = ? OR phoneNumber = ?`,
    [email, phoneNumber]
  );

  // If none → create primary
  if (matched.length === 0) {
    const result = await execute(
      `INSERT INTO Contact (email, phoneNumber, linkPrecedence)
       VALUES (?, ?, 'primary')`,
      [email, phoneNumber]
    );

    return {
      contact: {
        primaryContatctId: result.lastID,
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: [],
      }
    };
  }

  // Collect related contacts
  const ids = matched.map(c => c.id);
  const linkedIds = matched.map(c => c.linkedId).filter(Boolean);

  const placeholders = [...ids, ...linkedIds].map(() => "?").join(",");

  const allContacts = await query(
    `SELECT * FROM Contact
     WHERE id IN (${placeholders})
     OR linkedId IN (${placeholders})`,
    [...ids, ...linkedIds, ...ids, ...linkedIds]
  );

  // Find oldest primary
  const primaries = allContacts
    .filter(c => c.linkPrecedence === "primary")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const primary = primaries[0];

  // Convert extra primaries to secondary
  for (let i = 1; i < primaries.length; i++) {
    await execute(
      `UPDATE Contact
       SET linkPrecedence='secondary', linkedId=?
       WHERE id=?`,
      [primary.id, primaries[i].id]
    );
  }

  // Prepare unique data
  const emails = [...new Set(allContacts.map(c => c.email).filter(Boolean))];
  const phones = [...new Set(allContacts.map(c => c.phoneNumber).filter(Boolean))];

  const isNewEmail = email && !emails.includes(email);
  const isNewPhone = phoneNumber && !phones.includes(phoneNumber);

  // Create secondary if new info
  if (isNewEmail || isNewPhone) {
    const result = await execute(
      `INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence)
       VALUES (?, ?, ?, 'secondary')`,
      [email, phoneNumber, primary.id]
    );

    allContacts.push({
      id: result.lastID,
      email,
      phoneNumber,
      linkPrecedence: "secondary"
    });
  }

  const finalEmails = [...new Set(allContacts.map(c => c.email).filter(Boolean))];
  const finalPhones = [...new Set(allContacts.map(c => c.phoneNumber).filter(Boolean))];

  const secondaryIds = allContacts
    .filter(c => c.linkPrecedence === "secondary")
    .map(c => c.id);

  return {
    contact: {
      primaryContatctId: primary.id,
      emails: finalEmails,
      phoneNumbers: finalPhones,
      secondaryContactIds: secondaryIds
    }
  };
}

module.exports = identifyContact;