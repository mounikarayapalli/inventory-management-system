# Calibo AI Academy — Stock & Inventory Management Application

An enterprise-grade internal inventory management platform developed for **Calibo AI Academy** to track stationery, hardware, and educational supplies across academy hubs (Vijayawada, Vizag, and Guntur).

Built with an emphasis on **mathematical precision, audit traceability, strict derived stock calculations, and role-based operational security**.

---

## 🚀 Key Features & Architectural Highlights

1. **Derived Stock Principle**: Available stock is never manually altered or stored as a raw writable figure. It is strictly derived in real-time from the immutable ledger of recorded transactions:
   $$\text{Available Stock} = \sum \text{Opening} + \sum \text{Inward} - \sum \text{Outward} + \sum \text{Return} \pm \sum \text{Adjustments}$$
2. **Perpetual Moving-Average Weighted Average Costing (WAC)**: Automatically recalculates inventory unit valuation upon every Inward procurement with exact `Decimal` precision and `ROUND_HALF_UP` quantization:
   $$\text{New WAC} = \frac{(\text{Current Qty} \times \text{Current WAC}) + (\text{Inward Qty} \times \text{Inward Unit Cost})}{\text{Current Qty} + \text{Inward Qty}}$$
3. **Traceable Material Movements**: Every single inward, outward dispatch, return, and stock adjustment creates a corresponding immutable `StockMovement` audit ledger entry with user attribution, timestamp, and source reference.
4. **Distribution Breakdown Architecture**: Detailed allocation to students, labs, or cohorts is tied to a parent Outward dispatch. Stock deduction occurs at dispatch; distribution records track recipients and batches without double-deducting stock.
5. **Role-Based Access Control (RBAC)**: Enforced via secure JWT tokens with bcrypt/argon2 hashing across frontend UI routes and backend API endpoints.
6. **Live Operational Dashboard**: Real-time KPI cards for total items, total units, aggregate stock valuation, today's inward/outward counts, low stock alerts, and recent transaction feeds.
7. **Comprehensive Audit Reports & Export**: Detailed stock status, movement logs, inward receipts, outward dispatches, and WAC valuation with live filtering and RFC 4180-compliant CSV export.

---

## 👥 User Roles & Access Matrix

Per the **Project Brief & Development Guidelines**, the system supports two operational roles:

| Feature / Module | Admin (4 Users) | Stock Manager (6 Users) |
| :--- | :---: | :---: |
| **System Dashboard & KPIs** | Full View | Full View |
| **Item Master (Stationery & Hardware)** | Create, View, Edit | View Only |
| **Category Master** | Create, View, Edit | View Only |
| **Location / Hub Master** | Create, View, Edit | View Only |
| **Supplier Master** | Create, View, Edit | View Only |
| **User Management** | Full Control (Create, Update, Roles) | No Access |
| **Opening Stock Initialization** | Yes | Yes |
| **Inward Procurement Intake** | Yes | Yes |
| **Outward Dispatches** | Yes | Yes |
| **Internal Distribution Allocation** | Yes | Yes |
| **Return Transactions** | Yes | Yes |
| **Stock Adjustments & Discard Write-Offs** | Full Access | View Only |
| **Audit Reports & CSV Export** | Full Access | Full Access |

---

## 🔐 Seeded Accounts & Credentials

The database comes pre-seeded with 4 Admin accounts and 6 Stock Manager accounts:

### Admin Users (Full Access)
| Username | Email | Default Password | Role |
| :--- | :--- | :--- | :--- |
| `admin` | `admin@calibo.com` | `admin123` | `admin` |
| `admin1` | `admin1@calibo.com` | `admin123` | `admin` |
| `admin2` | `admin2@calibo.com` | `admin123` | `admin` |
| `admin3` | `admin3@calibo.com` | `admin123` | `admin` |

### Stock Manager Users (Inventory Operations)
| Username | Email | Default Password | Role |
| :--- | :--- | :--- | :--- |
| `manager` | `manager@calibo.com` | `manager123` | `stock manager` |
| `manager1` | `manager1@calibo.com` | `manager123` | `stock manager` |
| `manager2` | `manager2@calibo.com` | `manager123` | `stock manager` |
| `manager3` | `manager3@calibo.com` | `manager123` | `stock manager` |
| `manager4` | `manager4@calibo.com` | `manager123` | `stock manager` |
| `manager5` | `manager5@calibo.com` | `manager123` | `stock manager` |

---

## 🛠️ Technology Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic V2, Uvicorn
- **Database**: SQLite (Development/Test) / PostgreSQL (Production ready)
- **Frontend**: React 18, Vite, React Router v6, Lucide Icons, Axios
- **Authentication**: JWT (JSON Web Tokens) with Argon2/Bcrypt password hashing
- **Testing**: Pytest, FastAPI TestClient, Unittest

---

## 📦 Project Structure

```text
Calibo Inventory App/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py                    # Role validation & auth dependencies
│   │   │   └── v1/
│   │   │       ├── api.py                 # API router assembly
│   │   │       └── endpoints/             # Auth, Items, Transactions, Reports, Users, etc.
│   │   ├── core/                          # Security, JWT config, exceptions
│   │   ├── db/                            # Session, Base, seed scripts
│   │   ├── models/                        # SQLAlchemy ORM entity models
│   │   ├── schemas/                       # Pydantic schemas & DTOs
│   │   └── services/                      # Business logic, Stock derivation, WAC math
│   ├── tests/                             # 65+ Automated Pytest test suites
│   ├── .env                               # Backend environment configuration
│   └── requirements.txt                   # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                           # Axios API client modules
│   │   ├── components/                    # Reusable UI, Layout, Form Modals, Tables
│   │   ├── context/                       # AuthContext, RoleContext
│   │   ├── pages/                         # Dashboard, Masters, Transactions, Reports, Users
│   │   ├── routes/                        # Protected routes with RBAC enforcement
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Setup & Local Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed project data (4 Admins, 6 Managers, Academy Stationery items, Warehouses)
python -m app.db.seed_project_brief

# Start FastAPI backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir app
```

### 2. Frontend Setup
```bash
cd frontend

# Install node modules
npm install

# Start Vite development server
npm run dev
```

The application will be accessible at:
- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Interactive Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🧪 Testing & Verification

### Running Automated Test Suite
The repository includes comprehensive automated tests covering authentication, RBAC boundaries, stock calculations, moving-average WAC, and edge cases:
```bash
cd backend
python -m pytest
```
*Expected output: `65 passed`.*

### Running Mandatory End-to-End Flow
To verify the complete 10-step lifecycle from the Project Brief on a live instance:
```bash
cd backend
python tests/verify_mandatory_flow.py
```

---

## 📄 License
Internal proprietary application developed for **Calibo AI Academy**.