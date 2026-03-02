# Bitespeed Identity Reconciliation Service

## 📌 Overview

This project implements the Bitespeed backend task to identify and consolidate customer identities across multiple purchases.

The service exposes a `/identify` endpoint that reconciles contacts based on shared `email` or `phoneNumber`.

If multiple contacts are related:

- The oldest contact is marked as **primary**
- Newer linked contacts are marked as **secondary**
- All related contacts are consolidated in the response

---

## 🛠 Tech Stack

- Node.js
- Express.js
- SQLite
- Hosted on Railway

---

## 🗄 Database Schema

```sql
CREATE TABLE Contact (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phoneNumber TEXT,
  email TEXT,
  linkedId INTEGER,
  linkPrecedence TEXT CHECK(linkPrecedence IN ('primary','secondary')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  deletedAt DATETIME
);
```

---

## 🚀 Hosted Endpoint

```
POST https://bitespeed-identity-production-3a4d.up.railway.app
```


---

## 📥 Request Format (JSON)

```
POST /identify
Content-Type: application/json
```

### Example:

```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

---

## 📤 Response Format

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": [
      "lorraine@hillvalley.edu",
      "mcfly@hillvalley.edu"
    ],
    "phoneNumbers": [
      "123456"
    ],
    "secondaryContactIds": [
      23
    ]
  }
}
```

---

## 🧠 Logic Explanation

### 1️⃣ No Existing Contact
If no matching contact exists, a new **primary** contact is created.

### 2️⃣ Matching Contact Found
- All related contacts are fetched.
- The oldest contact is retained as **primary**.
- Any newer primary contacts are converted to **secondary**.
- If new email or phoneNumber is provided, a new secondary contact is created.

### 3️⃣ Primary to Secondary Conversion
If two primary contacts become linked via a new request:
- The oldest remains primary.
- The newer primary becomes secondary.

---

## 🏃 Running Locally

```bash
npm install
node server.js
```

Server runs at:

```
http://bitespeed-identity-production-3a4d.up.railway.app
```

---

## 📬 Testing Example

```bash
curl -X POST http://bitespeed-identity-production-3a4d.up.railway.app
-H "Content-Type: application/json" \
-d '{"email":"mcfly@hillvalley.edu","phoneNumber":"123456"}'
```

---

## 📂 Project Structure

```
bitespeed-identity/
│
├── controllers/
├── services/
├── routes/
├── db.js
├── server.js
└── contacts.db
```

---

## ✅ Submission Checklist

- ✔ Public GitHub repository
- ✔ Multiple meaningful commits
- ✔ Hosted endpoint working
- ✔ JSON request body (not form-data)
- ✔ README includes live endpoint

---

## 👤 Author

Antariksh Kashyap