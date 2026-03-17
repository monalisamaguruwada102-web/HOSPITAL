# 🏥 IHMS - Integrated Hospital Management System

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge&logo=render)](https://hospital-g8fe.onrender.com)
[![Version](https://img.shields.io/badge/Version-1.0.0-emerald?style=for-the-badge)](https://hospital-g8fe.onrender.com)
[![PWA](https://img.shields.io/badge/PWA-Supported-purple?style=for-the-badge)](https://hospital-g8fe.onrender.com)

**IHMS** is a state-of-the-art, full-stack Hospital Information Management System designed to streamline medical workflows, enhance patient care, and provide a premium user experience. Built with a modern dark-themed glassmorphism interface, it offers a robust solution for both patients and healthcare professionals.

---

## ✨ Key Features

### 👤 Patient Portal
*   **Public Dashboard:** Access hospital information and available services.
*   **Easy Booking:** Register and schedule appointments with specific doctors in seconds.
*   **Mobile App (PWA):** Installable on any mobile device for quick access—just look for the "Install App" prompt in your browser.

### ⚕️ Staff & Specialist Modules
*   **Role-Based Access (RBAC):** Tailored interfaces for Administrators, Doctors, Nurses, Pharmacists, and Lab Techs.
*   **Vitals Tracking:** Recorded and monitored patient health metrics (BP, Heart Rate, Temp, etc.).
*   **Doctor's Desk:** Manage appointments, write prescriptions, and record medical notes.
*   **Laboratory Management:** Request tests, set priorities (Routine/Urgent), and manage results.

### 💊 Pharmacy & Inventory
*   **Inventory Control:** Real-time stock tracking with low-stock alerts.
*   **Batch Management:** Track drug batches, quantities, and **expiry dates**.
*   **Dispensing:** Digital prescription fulfillment and dispensing history.

### 📊 Enterprise Features
*   **Billing System:** Automated invoice generation and payment tracking.
*   **Disease Registry:** Centralized tracking of identified medical conditions.
*   **Multi-Branch Support:** Manage multiple hospital branches from a single platform.
*   **Audit Logs:** Complete transparency with detailed system activity logging.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19 (Hooks, Context API), Vite, React Router |
| **Styling** | Custom CSS (Glassmorphism, Premium Dark Theme) |
| **Capabilities** | PWA (Vite PWA Plugin), Mobile Responsive |
| **Backend** | Node.js, Express |
| **Database** | PostgreSQL (Render/Local) with PostgreSQL-SQLite compatibility wrapper |
| **API Client** | Axios |
| **Logging** | Custom Audit Engine |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (Local instance or Render DATABASE_URL)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/monalisamaguruwada102-web/HOSPITAL.git
    cd IMHS
    ```

2.  **Install all dependencies:**
    ```bash
    npm run install-all
    ```

3.  **Environment Setup:**
    Create a `.env` file in the `backend` directory:
    ```env
    DATABASE_URL=your_postgresql_connection_string
    PORT=5000
    ```

4.  **Launch the System:**
    ```bash
    npm start
    ```
    *This runs both the backend (Port 5000) and frontend (Vite) concurrently.*

---

## 📱 User Access Guide

### Patients
1.  Visit the [Public Portal](https://hospital-g8fe.onrender.com).
2.  Navigate to **Book Services**.
3.  Register your account and choose your preferred doctor to schedule an appointment.

### Staff Access
1.  Click the **Hamburger Menu** and select **Staff Access**.
2.  **Default Admin Credentials:**
    - **Username:** `Brenda@IHMS`
    - **Password:** `brenda#$#$`
3.  **Registration:** New staff can click **Register**. Submitted credentials must be verified and approved by an Administrator before login is enabled.

---

## 🌐 Deployment
The application is optimized for deployment on platforms like **Render**. It utilizes a PostgreSQL database and is structured for easy CI/CD integration.

---

## 📄 License
This project is proprietary and built for "Integrated Management Hospital System" (IMHS).

---
Developed with ❤️ for the healthcare community.
