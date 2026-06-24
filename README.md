# 📦 Carton Calculator

A professional, browser-based carton planning tool for warehouse and dispatch teams. Enter shipment item dimensions, pick a box category, and the app allocates the right cartons — showing total boxes, gross weight, volume weight, and carton tare in one clean output.

Built with **pure Python** (no framework), **SQLite**, and **vanilla JS** — zero external dependencies beyond `openpyxl`.

---

## ✨ Features

- **Carton allocation engine** — picks the largest carton first, fills with the smallest suitable box for leftover volume
- **Excel upload** — import item sheets directly; download a pre-formatted template
- **Saved calculations** — exportable history with per-user access control
- **Admin panel** — upload/replace the carton master, reset user passwords
- **Multi-user login** — session-based auth with role separation (admin / user)
- **No internet required** — fully self-contained, runs locally or on any server

---

## 🗂️ Project Structure

```
carton-calculator-app/
├── server.py                  # Python HTTP server + all API logic
├── requirements.txt           # Only dependency: openpyxl
├── run-windows.bat            # One-click launcher for Windows
├── run-mac-linux.sh           # One-click launcher for macOS/Linux
├── data/
│   └── app.db                 # SQLite database (auto-created on first run)
└── static/
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## 🚀 Running Locally

**Requirements:** Python 3.11 or newer

### Windows
Double-click `run-windows.bat` — it installs dependencies and opens the app automatically.

### macOS / Linux
```bash
chmod +x run-mac-linux.sh
./run-mac-linux.sh
```

### Manual (any OS)
```bash
pip install -r requirements.txt
python server.py
```

Then open: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## ☁️ Deploying for Free (Render)

Render is the easiest free hosting option for this app. The server already reads the `PORT` environment variable, so no code changes are needed.

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) and sign up with GitHub
3. Click **New → Web Service** and connect this repo
4. Set the following:

   | Setting | Value |
   |---|---|
   | **Environment** | Python 3 |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `python server.py` |

5. Click **Deploy** — your app will be live at `https://yourapp.onrender.com`

> ⚠️ Render's free tier spins down after 15 minutes of inactivity. The first request after idle takes ~30 seconds to wake up. Upgrade to a paid plan to keep it always-on.

---

## 👤 Default Users

All accounts start with the password below. **Change it immediately after first login.**

```
Password: ChangeMe123!
```

| Username | Role |
|---|---|
| admin | Admin |
| priyanka | User |
| vandana | User |
| kalpna | User |
| poonam | User |
| meghna | User |
| sumit | User |
| jisha | User |
| larissa | User |

The `admin` account can upload carton masters, reset any user's password, and view all saved calculations.

---

## 📋 Box Categories

| Category | Usable Volume |
|---|---|
| Direct Outer | 90% |
| Thermocol Box | 90% |
| Temperature Thermocol Box | 70% |
| Validated Cold Chain Box | 90% |

---

## 📥 Excel Upload Formats

### Item Upload (for calculations)

| Column | Required | Notes |
|---|---|---|
| Item Name | Yes | |
| Length | Yes | mm |
| Breadth | Yes | mm |
| Height | Yes | mm |
| Quantity | Yes | |
| Weight per Unit (g) | No | If blank, gross weight is skipped |

### Carton Master Upload (Admin only)

| Column | Notes |
|---|---|
| Code | Unique carton identifier |
| Category | Must match a valid category name |
| Length | mm |
| Breadth | mm |
| Height | mm |
| Volume | mm³ |
| Tare Weight | Grams |

Download the templates directly from the app (Calculator → "Download Item Template", Admin → "Carton Template").

---

## 🧮 Calculation Logic

1. Filters cartons by the selected category
2. Applies the category's usable volume percentage
3. Sorts by volume descending — fills largest carton first
4. Uses the smallest suitable carton for any remaining volume
5. **Volume weight** = Total carton volume ÷ 6000
6. **Gross weight** = Sum of (item weight × quantity) + carton tare weight

If any item is missing a weight, gross weight is not calculated and a warning is shown.

---

## 🗃️ Data & Reset

All data is stored in `data/app.db` (SQLite). 

To start completely fresh — delete this file and restart the server. The database and default users are recreated automatically.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+ — `http.server.ThreadingHTTPServer` |
| Database | SQLite via `sqlite3` (stdlib) |
| Excel I/O | `openpyxl` |
| Frontend | Vanilla HTML, CSS, JavaScript — no frameworks |
| Auth | Secure session tokens, bcrypt-style password hashing |

---

## 📄 License

Internal use — Century Inks Private Limited.
