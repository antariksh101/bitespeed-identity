const db = require("../db");

// Helper for SELECT queries
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper for INSERT / UPDATE
function execute(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function identifyContact(email, phoneNumber) {

  // Find direct matches
  const matched = await query(
    `SELECT * FROM Contact WHERE email = ? OR phoneNumber = ?`,
    [email, phoneNumber]
  );

  // If no matches → create new primary
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

  // Get true primary IDs involved
  let primaryIds = new Set();

  for (const contact of matched) {
    if (contact.linkPrecedence === "primary") {
      primaryIds.add(contact.id);
    } else {
      primaryIds.add(contact.linkedId);
    }
  }

  const primaryIdArray = [...primaryIds];
  const placeholders = primaryIdArray.map(() => "?").join(",");

  // Fetch ALL contacts linked to those primaries
  const allContacts = await query(
    `SELECT * FROM Contact
     WHERE id IN (${placeholders})
     OR linkedId IN (${placeholders})`,
    [...primaryIdArray, ...primaryIdArray]
  );

  // Find oldest primary
  const primaries = allContacts
    .filter(c => c.linkPrecedence === "primary")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const primary = primaries[0];

  // Convert extra primaries into secondary
  for (let i = 1; i < primaries.length; i++) {
    await execute(
      `UPDATE Contact
       SET linkPrecedence='secondary',
           linkedId=?,
           updatedAt=CURRENT_TIMESTAMP
       WHERE id=?`,
      [primary.id, primaries[i].id]
    );
  }

  // Refresh contacts after possible merge
  const refreshedContacts = await query(
    `SELECT * FROM Contact
     WHERE id=? OR linkedId=?`,
    [primary.id, primary.id]
  );

  const emails = [...new Set(refreshedContacts.map(c => c.email).filter(Boolean))];
  const phones = [...new Set(refreshedContacts.map(c => c.phoneNumber).filter(Boolean))];

  const isNewEmail = email && !emails.includes(email);
  const isNewPhone = phoneNumber && !phones.includes(phoneNumber);

  // If new info → create secondary
  if (isNewEmail || isNewPhone) {
    const result = await execute(
      `INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence)
       VALUES (?, ?, ?, 'secondary')`,
      [email, phoneNumber, primary.id]
    );

    refreshedContacts.push({
      id: result.lastID,
      email,
      phoneNumber,
      linkPrecedence: "secondary"
    });
  }

  // Final consolidated response
  const finalContacts = await query(
    `SELECT * FROM Contact
     WHERE id=? OR linkedId=?`,
    [primary.id, primary.id]
  );

  const finalEmails = [...new Set(finalContacts.map(c => c.email).filter(Boolean))];
  const finalPhones = [...new Set(finalContacts.map(c => c.phoneNumber).filter(Boolean))];

  const secondaryIds = finalContacts
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