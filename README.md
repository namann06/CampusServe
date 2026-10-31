# Closed-Loop Hyperlocal Community Service Platform (CampusServe / SocietyConnect)

A decoupled client-server full-stack web application adapted for Indian gated communities, housing societies (RWA), and university campus enclaves (e.g. Shantiniketan Heights, IIT / NIT / KIIT Campuses). It enforces strict tenant isolation, role-based access control, Indian Rupee (₹) pricing, and a physical arrival 4-digit OTP handshake handover to eliminate service fraud and disputes.

---

## 🏗 Tech Stack

- **Frontend:** React 19 (Vite), Tailwind CSS v4, Axios, React Router DOM v7, Lucide Icons
- **Backend:** Java 21+ / Spring Boot 3.3.5 (Spring Web, Spring Security, Spring Data JPA, Lombok, Jakarta Validation)
- **Database:** MySQL 8.x
- **Authentication:** Stateless JWT (HMAC-SHA256) with Role-Based Access Control (RBAC)
- **Currency:** Indian Rupees (₹ / INR)

---

## 🚀 Quick Start Guide

### 1. Database Setup (MySQL)
Ensure MySQL 8.x is running on `localhost:3306`.
```sql
CREATE DATABASE IF NOT EXISTS community_service_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Configure your credentials in `backend/src/main/resources/application.properties` (configured for `root` / `namanvasu`).

### 2. Start Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
The backend starts on `http://localhost:8080`.
On first launch, `DataInitializer.java` automatically seeds:
- Community: **Shantiniketan Heights & Campus Residency** (Passcode: `CAMPUS2026`)
- 4 Default Indian Personas (Admin Vikram, Resident Priya, Facility Provider Ramesh, Peer Tutor Aarav)
- Default Services (Electrical, Plumbing, Peer Tutoring, Cleaning in ₹)
- Initial bookings and reviews

### 3. Start Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

---

## 👥 Seed Credentials & Quick Testing Personas

All seeded accounts use password: `password123`

| Persona | Email | Password | Role | Description & Flat / Quarter |
| :--- | :--- | :--- | :--- | :--- |
| **Resident** | `resident@test.com` | `password123` | `ROLE_RESIDENT` | **Priya Sharma** · Flat Tower B-402 (Books services, views secret start OTP, writes reviews) |
| **Facility Provider** | `provider@test.com` | `password123` | `ROLE_PROVIDER` | **Ramesh Kumar** · Staff Quarter 12 (Electrician & Plumber, inputs OTP at door, completes jobs) |
| **Peer Tutor** | `peer@test.com` | `password123` | `ROLE_RESIDENT` (`isPeerProvider: true`) | **Aarav Verma** · Wing A-102 (B.Tech student with DSA/Java P2P skill listing) |
| **Admin** | `admin@test.com` | `password123` | `ROLE_ADMIN` | **Vikramaditya Singhania** · Clubhouse Office-01 (Estate Manager, audits logs, overrides disputes) |

> 💡 **Demo Quick-Role Switcher:** At the very top of every screen in the UI, use the **Quick Test Persona** bar to switch between Priya (Resident), Ramesh (Provider), Aarav (Peer Tutor), and Vikram (Admin) with a single click.

---

## 🔒 Security Policies & Hardening (Vibe-Coding Safeguards)

1. **Stateless JWT Security:** Requests sign HMAC-SHA256 tokens with a 24-hour expiration. Missing or expired tokens return `401 Unauthorized`.
2. **Strict Tenant Isolation:** All service catalog and booking queries are constrained by `community_id` derived directly from authenticated JWT session context.
3. **BOLA / IDOR Ownership Verification:** Backend queries enforce that `authenticatedUserId == residentId` OR `authenticatedUserId == providerId` before allowing any status transition, review submission, or cancellation.
4. **Physical OTP Handshake Verification:**
   - On booking, the backend auto-generates a cryptographically random 4-digit numeric OTP (`1000–9999`).
   - The resident sees the OTP in their portal.
   - The provider arrives physically at the flat/hostel room, obtains the OTP from the resident, and submits it to `PATCH /api/bookings/{id}/verify-start`.
   - On match, the booking moves from `ACCEPTED` to `IN_PROGRESS`.
5. **Brute-Force OTP Lockout Mitigation:**
   - OTP verification attempts are strictly limited to **5 attempts per booking**.
   - If 5 incorrect attempts occur, the booking is locked (`423 Locked`) pending administrator dispute review.
6. **Credential Protection:** Passwords hashed with `BCryptPasswordEncoder` (strength 10).
7. **Strict Gated Community Passcode:** Registration requires a valid `communityPasscode` (`CAMPUS2026`). Unmatched passcodes are rejected with `403 Forbidden`.

---

## 📡 REST API Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Validates community passcode, hashes password, returns JWT token.
- `POST /api/auth/login` — Validates email/password, returns JWT token and user profile.
- `GET /api/auth/me` — Returns authenticated user profile.

### Services (`/api/services`)
- `GET /api/services?category={category}` — Fetch active services for user's community.
- `GET /api/services/my-services` — Fetch services created by current provider / peer provider.
- `POST /api/services` — Create a new service (Provider or Peer Provider only).
- `PATCH /api/services/{id}/toggle-availability` — Toggle service availability (Owner only).

### Bookings (`/api/bookings`)
- `POST /api/bookings` — Create a booking; generates 4-digit verification OTP (`REQUESTED`).
- `GET /api/bookings/my-bookings` — Returns bookings where user is resident or provider.
- `PATCH /api/bookings/{id}/accept` — Provider accepts request (`REQUESTED -> ACCEPTED`).
- `PATCH /api/bookings/{id}/verify-start` — Provider inputs OTP (`ACCEPTED -> IN_PROGRESS`).
- `PATCH /api/bookings/{id}/complete` — Provider completes job (`IN_PROGRESS -> COMPLETED`).
- `POST /api/bookings/{id}/reviews` — Resident submits rating (1–5) and feedback.

### Admin Governance (`/api/admin`)
- `GET /api/admin/stats` — Total bookings, active providers, completed services count.
- `GET /api/admin/bookings` — Full audit log of all bookings in community enclave.
- `PATCH /api/admin/bookings/{id}/override` — Force update status (`CANCELLED` or `COMPLETED`) and reset OTP lockout.
- `GET /api/admin/users` — Directory of registered community members.
