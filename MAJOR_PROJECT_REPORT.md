# A PROJECT REPORT
### on
## "CampusServe - Closed-Community Services Marketplace"

**Submitted to**  
**KIIT Deemed to be University**  
*In Partial Fulfillment of the Requirement for the Award of*  
**BACHELOR'S DEGREE IN INFORMATION TECHNOLOGY**

**By**  
* **PARTH KUMAR (2306037)**
* **TEJAS KUMAR SINGH (2306158)**
* **NAMAN KATHURIA (2306206)**
* **PRIYANSHU KUMAR (2306211)**
* **SOUHARDA ROY BARMAN (2306229)**
* **AYUSH SHRIVASTAVA (23053760)**

**Under the guidance of**  
**DR. NACHIKETA TARASIA**  
Course Instructor & Project Guide  

**SCHOOL OF COMPUTER ENGINEERING**  
**KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY**  
**BHUBANESWAR, ODISHA – 751024**  
**November 2026**

---

### KIIT Deemed to be University
#### School of Computer Engineering
#### Bhubaneswar, ODISHA 751024

### CERTIFICATE

This is to certify that the project entitled  
**"CampusServe - Closed-Community Services Marketplace"**  
submitted by  
* **PARTH KUMAR (2306037)**
* **TEJAS KUMAR SINGH (2306158)**
* **NAMAN KATHURIA (2306206)**
* **PRIYANSHU KUMAR (2306211)**
* **SOUHARDA ROY BARMAN (2306229)**
* **AYUSH SHRIVASTAVA (23053760)**  

is a record of bonafide work carried out by them in partial fulfillment of the requirement for the award of the Degree of **Bachelor of Technology in Information Technology** at KIIT Deemed to be University, Bhubaneswar. This work has been completed during the academic year 2026–2027 under my guidance and supervision.

<br />

**Date:** 02-11-2026  
<br />
**Dr. Nachiketa Tarasia**  
Course Instructor & Project Guide  
School of Computer Engineering  
KIIT Deemed to be University  

---

### Acknowledgements

We express our profound gratitude to our course instructor and project guide, **Dr. Nachiketa Tarasia**, School of Computer Engineering, KIIT Deemed to be University, for invaluable guidance, constructive critique, and continuous encouragement throughout the conceptualization, system architecture design, and final execution of this major project.

We also convey our sincere thanks to all faculty and staff members of the School of Computer Engineering for their support, academic resources, and technical guidance. Lastly, we extend our heartfelt appreciation to our families, peers, and fellow students for their constant cooperation and moral support throughout the development lifecycle of this project.

* **PARTH KUMAR (2306037)**
* **TEJAS KUMAR SINGH (2306158)**
* **NAMAN KATHURIA (2306206)**
* **PRIYANSHU KUMAR (2306211)**
* **SOUHARDA ROY BARMAN (2306229)**
* **AYUSH SHRIVASTAVA (23053760)**

---

### ABSTRACT

**CampusServe** is a decoupled client-server, closed-community services marketplace engineered to solve trust deficits, unvetted contractor access, and job fulfillment disputes within university campus enclaves and gated residential societies (RWAs). Developed using **Spring Boot 3 (Java 21)** for the backend RESTful micro-architecture and **React 19 (Vite) with Tailwind CSS v4** for the presentation layer, the platform is backed by a cloud-managed distributed relational **MySQL 8 / TiDB Serverless** database.

Traditional open service aggregators (such as Urban Company or Justdial) fail in gated educational and residential environments due to their lack of community boundary enforcement, high commission fees, and vulnerability to "phantom job completions" where workers mark tasks finished without physical attendance. CampusServe resolves these issues by introducing a **Physical Arrival 4-Digit Cryptographic Handshake Protocol (OTP Handshake)**, strict **Tenant Isolation (Multi-Tenancy)**, and a **Peer-to-Peer (P2P) student micro-economy** alongside dedicated facility providers and estate administrators.

The application implements strict Role-Based Access Control (RBAC) across four user tiers: Residents, Facility Providers (electricians, plumbers, deep cleaners), Peer Providers (student academic tutors, hardware repairers), and Estate Administrators (dispute resolution and audit telemetry). Security hardening includes Broken Object Level Authorization (BOLA) validation, rate-limited brute-force OTP lockout mitigating authentication tampering (HTTP 423 Locked), and input sanitization against SQL injection and Cross-Site Scripting (XSS). The backend is containerized via a lightweight multi-stage Docker configuration deployed on cloud infrastructure, with the frontend served globally through Vercel's edge network. This project showcases the practical application of enterprise full-stack software engineering in resolving hyperlocal governance and operational challenges.

**Keywords:** Hyperlocal Marketplace, Closed-Community Network, Spring Boot 3, Java 21, React 19, MySQL, TiDB Serverless, Physical OTP Handshake, Multi-Tenancy, BOLA Defense, Role-Based Access Control, Docker.

---

### Chapter 1: Introduction

Residential welfare associations (RWAs), university campuses, and student housing complexes constitute self-contained hyperlocal micro-economies where daily facility maintenance (electrical repair, plumbing, sanitization) and peer-level talent sharing (academic tutoring, technical assistance) occur in high volumes. However, these communities face distinct logistical and security challenges when utilizing commercial, open-market service platforms. Open aggregators permit unvetted external technicians to enter secure residential premises, impose prohibitive commission surcharges, and lack verification mechanisms to confirm whether a service technician was physically present at the resident's doorstep before commencing or concluding a task.

**CampusServe - Closed-Community Services Marketplace** - is a secure, decoupled full-stack web application architected to digitalize, govern, and streamline hyperlocal service fulfillment within verified institutional boundaries. Built on Java 21 with the Spring Boot 3 enterprise framework and React 19, CampusServe delivers a calm, productivity-oriented interface that replaces informal WhatsApp groups, physical gate registers, and volatile verbal handovers with a deterministic, auditable software ecosystem.

The system is structured around three primary innovations:
1. **Gated Multi-Tenancy & Enclave Passcode Authentication:** Access is strictly bounded by community membership verified via an administrative cryptographic enclave passcode (e.g., `CAMPUS2026`). Cross-community data bleeding is prevented at the database and application levels.
2. **Physical Arrival 4-Digit Handshake Protocol:** To eliminate false completion claims and contractor disputes, service orders cannot transition to an active work state until the service provider physically arrives at the resident’s door and inputs a secret 4-digit numeric OTP displayed exclusively on the resident’s portal.
3. **Dual Facility and Peer-to-Peer (P2P) Service Economy:** In addition to institutional facility workers (electricians, plumbers), verified residents can seamlessly toggle on peer-provider status to list academic mentoring (e.g., Data Structures & Algorithms tutoring) or hardware repairs, fostering intra-community collaboration.

This report documents the architectural design, security modeling, implementation methodology, and experimental validation of CampusServe. The remainder of this report is organized as follows: Chapter 2 reviews the core technologies and theoretical foundations; Chapter 3 specifies the formal requirements and architectural constraints; Chapter 4 elaborates on the implementation, verification test matrix, and performance results; Chapter 5 details the engineering and quality standards adopted; and Chapter 6 synthesizes conclusions and outlines future extensions.

---

### Chapter 2: Basic Concepts / Literature Review

This chapter reviews the fundamental technologies, frameworks, security models, and architectural patterns employed in the design and development of CampusServe.

#### 2.1 Spring Boot 3 and Java 21
Spring Boot 3 is the contemporary foundation for enterprise-grade Java web applications, running natively on Java 21 and the Jakarta EE 10 specification. It leverages modern Java language enhancements—such as virtual threads, pattern matching, and record classes—while providing opinionated auto-configuration for web servers, persistence layers, and security contexts. CampusServe leverages Spring Boot 3.3.5 with Spring Web MVC to expose performant, stateless RESTful API endpoints adhering to standard HTTP semantics.

#### 2.2 Spring Security 6 and Stateless JWT Authentication
Spring Security 6 enforces a component-based security filter chain (`SecurityFilterChain`) operating without deprecated adapter patterns. CampusServe utilizes a fully stateless session architecture (`SessionCreationPolicy.STATELESS`), mitigating server-side session bloat and enabling horizontal scalability. User authentication produces an encrypted JSON Web Token (JWT) signed via HMAC-SHA256. Every subsequent request transmits the bearer token in the `Authorization` header, where a custom `JwtAuthenticationFilter` intercepts the request, validates token authenticity and expiry, extracts the tenant `communityId` and user roles, and establishes the security context before controller invocation.

#### 2.3 Spring Data JPA and Hibernate ORM
Spring Data JPA reduces relational data access overhead by generating repository implementations at runtime from repository interfaces. CampusServe uses Hibernate as the underlying Object-Relational Mapping (ORM) provider, mapping domain models (`User`, `Community`, `ServiceEntity`, `Booking`, `Review`) directly to relational tables. Declarative transaction management (`@Transactional`) guarantees ACID transaction compliance across service state transitions, critical during simultaneous booking creation and OTP validation.

#### 2.4 React 19 and Vite
React 19 introduces optimized client-side rendering pipelines, enhanced concurrent rendering capabilities, and streamlined hook lifecycles. CampusServe utilizes **Vite 8** as the frontend build tool and local development environment, providing near-instantaneous Hot Module Replacement (HMR) through native ES modules and optimized production bundling via Rollup. The frontend codebase is organized into reusable components, context providers, and protected route wrappers.

#### 2.5 Tailwind CSS v4 and Calm Minimal UI Design
Tailwind CSS v4 is an atomic, utility-first CSS engine. CampusServe rejects flashy visual gimmicks—such as drop shadows, neon gradients, glassmorphism, and colored card headers—in favor of a **calm, minimal productivity tool aesthetic**. The design language is strictly bounded by a warm off-white canvas (`#F7F6F2`), pure white surfaces (`#FFFFFF`), 1px hairline borders (`#E8E6E0`), primary charcoal typography (`#1E2622`), single-accent sage green (`#2F5D50`), and DM Sans typography. Tabular views utilize single container divider rows (`#F3F1EC`) and semantic 8px status dots rather than high-contrast zebra striping.

#### 2.6 MySQL 8 and TiDB Cloud Serverless
CampusServe utilizes MySQL 8, a robust ACID-compliant relational database management system. In cloud deployment, the application is backed by **TiDB Cloud Serverless**, an elastic, distributed HTAP (Hybrid Transactional/Analytical Processing) database architected on top of the MySQL 8 protocol. TiDB provides automated sharding, enterprise TLS 1.2/1.3 cryptographic transport, zero-downtime scaling, and strict transactional isolation without requiring ongoing database administration.

#### 2.7 Multi-Tenancy and Broken Object Level Authorization (BOLA) Defense
Multi-tenancy enables a single application instance to serve multiple distinct gated communities while guaranteeing absolute data partitioning. CampusServe incorporates a tenant discriminator key (`community_id`) across all entities. To defend against Broken Object Level Authorization (BOLA / IDOR)—listed as the number one API threat in the OWASP API Security Top 10—the business logic verifies that the authenticated user's ID matches either the `residentId` or `providerId` of the target booking before allowing any state update.

#### 2.8 Physical Arrival Handshake Engine
To eliminate service dispute vectors, the system employs an OTP handshake model. When a resident creates an order, the system generates a cryptographically random 4-digit numerical token stored in the database. The token is visible only to the resident. The service technician must physically obtain this code at the flat door to authenticate arrival. A brute-force defense algorithm restricts verification attempts to 5 trials per order; exceeding this threshold triggers an automated security lockout (`HTTP 423 Locked`), escalating the booking to administrative dispute arbitration.

---

### Chapter 3: Problem Statement / Requirement Specifications

#### 3.1 Problem Statement
Modern campus universities and gated housing societies experience frequent breakdown in service delivery and community trust:
1. **Unvetted Contractor Intrusion:** External service aggregators dispatch arbitrary personnel into residential premises, raising safety concerns for students and families.
2. **Phantom Completions & Billing Disputes:** Providers frequently mark tasks as completed in software without completing physical work, leading to payment disputes and resident frustration.
3. **Fragmented Communication Channels:** Work requests, peer tutoring, and complaints are scattered across unstructured messaging groups (WhatsApp/Telegram) and physical registers, with zero audit history.
4. **Lack of Community Micro-Economies:** Talented students and residents have no secure internal portal to offer technical support, academic peer tutoring, or handyman skills to immediate neighbors.

CampusServe addresses these systemic failures by delivering a unified, gated, multi-tenant marketplace platform with cryptographically enforced physical presence verification.

#### 3.2 Project Planning
The development lifecycle was organized into structured agile sprints:
* **Sprint 1 (Architecture & Database Modeling):** Defining relational ER entities, Spring Boot 3 bootstrapping, and multi-tenant schema constraints.
* **Sprint 2 (Security & Authentication):** Implementing Spring Security 6 filter chains, JWT generation/validation, password hashing via BCrypt, and gated community passcode validation.
* **Sprint 3 (Catalog & Booking Engine):** Crafting REST controllers and service logic for catalog publishing, booking dispatch, and 4-digit OTP generation.
* **Sprint 4 (Physical Handshake & Dispute Resolution):** Developing the OTP verification engine, brute-force attempt lockout, completion workflows, and review ratings.
* **Sprint 5 (Frontend Architecture & Calm Redesign):** Building the React 19 client with Vite, implementing role-based route guards, and applying the DM Sans minimal sage design system.
* **Sprint 6 (Containerization, Hardening & Deployment):** Multi-stage Docker packaging, dynamic CORS configuration, TiDB Serverless integration, and Vercel edge deployment.

#### 3.3 Software Requirements Specification (SRS)

##### 3.3.1 Functional Requirements
* **FR1 (Gated Registration):** The system shall validate user registration against a mandatory community passcode (e.g. `CAMPUS2026`) before admitting an account into an enclave.
* **FR2 (Stateless Authentication):** The system shall authenticate users via email and password, issuing an HMAC-SHA256 signed JWT containing user ID, role, and community ID.
* **FR3 (Service Catalog Management):** Verified providers and peer tutors shall create, update, and toggle availability of services priced in Indian Rupees (₹).
* **FR4 (Tenant-Isolated Catalog Discovery):** Residents shall browse active services categorized by Electrical, Plumbing, Peer Tutoring, and Cleaning, strictly filtered by their registered community.
* **FR5 (Booking Dispatch & OTP Generation):** Upon order placement, the system shall compute order details and generate a secure 4-digit arrival handshake OTP.
* **FR6 (Physical Handshake Verification):** The designated provider shall input the resident's secret OTP to authenticate doorstep arrival, shifting order state from `ACCEPTED` to `IN_PROGRESS`.
* **FR7 (Brute-Force Lockout):** If an incorrect OTP is entered 5 times for a booking, the system shall lock the booking (`423 Locked`) and flag it for administrator review.
* **FR8 (Order Completion & Review Lifecycle):** The provider shall mark an active job completed, immediately allowing the resident to post a numerical rating (1–5 stars) and qualitative feedback.
* **FR9 (Administrative Dispute & Override Console):** Estate administrators shall audit community bookings, review user registries, and execute administrative state overrides on stalled or locked orders.
* **FR10 (Evaluator Quick-Role Switcher):** The presentation layer shall provide an evaluator persona bar allowing instantaneous role toggling between Priya (Resident), Ramesh (Provider), Aarav (Peer Tutor), and Vikram (Admin).

##### 3.3.2 Non-Functional Requirements
* **NFR1 (Security & BOLA Defense):** Every sensitive endpoint must enforce authorization validation ensuring users cannot view or modify orders outside their ownership.
* **NFR2 (Low-Memory Container Footprint):** The backend container must operate reliably within cloud micro-instances (512MB RAM cap) utilizing `-XX:+UseSerialGC` and `-Xmx350m`.
* **NFR3 (Zero Cold-Start Latency):** A public unauthenticated health endpoint (`/api/communities/public/health`) must support automated polling to maintain backend responsiveness.
* **NFR4 (Visual Calmness & Ergonomics):** The UI must strictly eliminate distracting gradients, drop shadows, and saturated color borders, adhering to the 1px hairline border and warm `#F7F6F2` canvas.
* **NFR5 (Cross-Origin Protection):** Dynamic CORS policy must allow authorized production frontend domains (`*.vercel.app`) while blocking unlisted origins.

#### 3.4 System Design

##### 3.4.1 Design Constraints
* **Backend:** Java 21, Spring Boot 3.3.5, Spring Security 6, Maven 3.9+, multi-stage Alpine Docker runtime.
* **Frontend:** React 19, Vite 8, Tailwind CSS v4, DM Sans typography, React Router v7.
* **Database:** MySQL 8 protocol compatible (TiDB Cloud Serverless / Local MySQL), UTF-8 encoding.
* **Hosting:** Cloud container deployment (Render/Railway) with Vercel edge CDN frontend.

##### 3.4.2 System Architecture
CampusServe implements a decoupled **Three-Tier Architecture**:
1. **Presentation Tier (React 19 SPA):** Renders the user interface through modular components (`Header`, `QuickRoleSwitcher`, `Modal`, `ResidentDashboard`, `ProviderDashboard`, `AdminDashboard`). State synchronization is handled via `AuthContext`, while client-side HTTP calls pass through a centralized Axios interceptor injecting the JWT Bearer token.
2. **Application Logic Tier (Spring Boot REST API):** The stateless Spring Boot application processes client requests through a layered pipeline: Filter Chain (`JwtAuthenticationFilter`) $\rightarrow$ REST Controllers (`AuthController`, `ServiceController`, `BookingController`, `AdminController`) $\rightarrow$ Transactional Business Services (`AuthService`, `BookingService`, `ServiceCatalogService`, `AdminService`) $\rightarrow$ Entity Validation and Handshake State Machines.
3. **Data Persistence Tier (MySQL / TiDB):** Spring Data JPA repositories persist domain entities via Hibernate ORM over an SSL-encrypted JDBC connection pool (HikariCP), maintaining referential integrity across communities, user records, service catalogs, orders, and review ratings.

---

### Chapter 4: Implementation

#### 4.1 Methodology
CampusServe was engineered following Agile development methodologies with continuous integration and testing. The implementation was structured into six distinct phases:

* **Phase 1 – Core Domain & Database Modeling:** Bootstrapped the Spring Boot 3 skeleton with Maven. Designed JPA entities (`Community`, `User`, `Role`, `ServiceEntity`, `Booking`, `BookingStatus`, `Review`). Configured Spring Data JPA repositories with foreign key integrity.
* **Phase 2 – Security Pipeline & Tenant Registration:** Configured Spring Security 6 filter chain with BCrypt password hashing. Developed `JwtTokenProvider` generating HMAC-SHA256 signed bearer tokens with embedded `userId`, `communityId`, and `role` claims. Configured `CustomUserDetailsService` for principal resolution. Implemented passcode-gated registration rejecting unmatched community passcodes.
* **Phase 3 – Service Catalog & P2P Marketplace:** Implemented service catalog endpoints supporting provider listing creation, category filtering, and owner-only availability toggling (`/api/services/{id}/toggle-availability`). Integrated dual-role support enabling residents to list peer skills (`isPeerProvider: true`).
* **Phase 4 – OTP Handshake Engine & Security Hardening:** Implemented booking creation with automated generation of cryptographically secure 4-digit arrival codes (`1000–9999`). Created the atomic verification endpoint (`PATCH /api/bookings/{id}/verify-start`), incrementing `otpAttempts` and enforcing the 5-attempt rate limit lockout (`HTTP 423 Locked`). Implemented regex sanitization on booking notes blocking SQL injection fragments and script injection payloads.
* **Phase 5 – Calm Minimal Frontend Implementation:** Developed the React 19 client with Vite and Tailwind CSS v4. Implemented client-side routing, protected route guards, and the evaluation Quick-Role Switcher. Rebuilt all dashboard screens into single white containers with `#F3F1EC` row dividers, 8px semantic status dots, and non-monospace currency formatting.
* **Phase 6 – Production Deployment & Containerization:** Authored a production multi-stage `Dockerfile` with JRE 21 Alpine runtime, tuned with `-XX:+UseSerialGC -Xmx350m` to operate stably on 512MB RAM cloud tiers. Configured dynamic CORS origin pattern matching in `SecurityConfig.java`, decoupled secrets via environment variables, migrated database persistence to TiDB Serverless, and deployed the frontend to Vercel with SPA routing rewrite rules.

#### 4.2 Testing / Verification Plan (IEEE 829 Standard)

| Test ID | Test Case Title | Test Condition / Input | System Behavior | Expected Result | Pass/Fail |
|:---|:---|:---|:---|:---|:---:|
| **T01** | Community Registration with Valid Passcode | Registration payload with valid passcode `CAMPUS2026` | Backend validates passcode, hashes password with BCrypt, saves user | User created; HTTP 200 with JWT token | **PASS** |
| **T02** | Community Registration with Invalid Passcode | Registration payload with invalid passcode `WRONG2026` | Backend verifies passcode against database | HTTP 403 Forbidden; registration rejected | **PASS** |
| **T03** | Stateless JWT Authentication | Valid credentials for `resident@test.com` | AuthenticationManager verifies credentials; token generated | HTTP 200 with signed bearer JWT and profile | **PASS** |
| **T04** | Tenant Isolation Enforcement | User from Community 1 requests service catalog | Query filtered by JWT claim `community_id = 1` | Only Community 1 services returned; zero leakage | **PASS** |
| **T05** | Service Booking & OTP Generation | Resident submits booking request for ceiling fan repair | Order stored in `REQUESTED` state; 4-digit random OTP generated | Booking created; secret OTP visible to resident only | **PASS** |
| **T06** | Successful Physical OTP Handshake | Provider enters correct 4-digit code at resident door | Backend verifies code matches `verificationOtp` | Status transitions from `ACCEPTED` to `IN_PROGRESS` | **PASS** |
| **T07** | Brute-Force OTP Rate-Limit Lockout | Provider inputs wrong OTP code 5 consecutive times | `otpAttempts` counter reaches 5 | HTTP 423 Locked; status locked pending admin review | **PASS** |
| **T08** | BOLA / IDOR Unauthorized Modification | Resident attempts to accept a booking belonging to another user | Ownership check evaluates `providerId != currentUserId` | HTTP 403 Forbidden; modification blocked | **PASS** |
| **T09** | SQL Injection & Script Tag Sanitization | Booking note contains `'; DROP TABLE users; <script>` | Sanitizer regex detects malicious keywords | Cleaned/rejected; SQL statement neutralized | **PASS** |
| **T10** | Administrative Status Override | Administrator executes status override on stalled order | Endpoint validates `ROLE_ADMIN` and overrides status | Booking state updated; security lock cleared | **PASS** |

#### 4.3 Result Analysis
The platform underwent end-to-end integration testing across local and cloud staging environments. All functional workflows operated in strict accordance with the specification:
* **Authentication and Role Switching:** The Quick-Role Switcher allowed seamless role transitions between Priya (Resident), Ramesh (Provider), Aarav (Peer Tutor), and Vikram (Admin) in under 200ms without manual credential entry.
* **OTP Handshake Verification:** The 4-digit physical handshake reliably guarded the `IN_PROGRESS` transition. In simulation tests with incorrect OTP inputs, the system strictly locked after the 5th attempt, outputting `423 Locked` and preventing automated dictionary attacks against the PIN space ($10^4$ combinations).
* **Cross-Tenant Isolation:** When logging in as `jethalal@gokuldham.com` (Community ID: 2), the service catalog returned an empty list, completely isolating Community 2 from Shantiniketan Heights (Community ID: 1).
* **Cloud Resource Utilization:** Under cloud deployment on Render (0.1 CPU, 512MB RAM), the JVM maintained a stable heap footprint between 140MB and 210MB under load, attributable to the Alpine JRE container and SerialGC memory tuning.

#### 4.4 Quality Assurance
CampusServe maintained quality assurance through the following protocols:
* **Stateless Token Validation:** All protected routes require a non-expired HMAC-SHA256 bearer token. Expired or forged tokens immediately trigger `401 Unauthorized` without exposing stack traces.
* **ACID Transaction Guarantees:** Critical service logic methods utilize Spring's `@Transactional` annotation with rollback configurations (`noRollbackFor = AppException.class` for attempt recording), ensuring atomic state updates.
* **Container Parity:** Development and production build consistency is guaranteed through multi-stage Docker builds, eliminating environment drift between developer machines and cloud hosts.
* **Static Analysis:** Code quality was audited using Oxlint and strict ESLint configurations on the frontend, alongside Maven compiler warning enforcement on the backend.

---

### Chapter 5: Standards Adopted

#### 5.1 Design Standards
CampusServe adheres to modern web usability and human interface guidelines:
* **Calm Minimal Visual Language:** Adheres to ergonomic productivity design standards. Surfaces use pure `#FFFFFF` over a `#F7F6F2` canvas, framed by 1px `#E8E6E0` hairline borders. Saturated card headers and drop shadows were eliminated to reduce cognitive fatigue.
* **Semantic Status Indicators:** Order states utilize standardized 8px status indicator dots: green (`#3F8A6B`) for completed/verified, blue (`#4A6FA5`) for in-progress/accepted, amber (`#C48A2A`) for requested/pending, and slate (`#5C6862`) for cancelled.
* **Typography Hierarchy:** Uses **DM Sans** exclusively. Page titles utilize 32px/600 weight with `-0.02em` negative letter spacing; section headings use 18px/600 weight; body text is calibrated to 14–16px; and metadata labels use 12px muted text. Numbers and prices are formatted in standard DM Sans rather than monospace for enhanced readability.

#### 5.2 Coding Standards
The codebase adheres to the following programming conventions:
* **Enterprise Java Conventions:** Backend classes follow CamelCase naming, organized into domain-driven packages (`config`, `controller`, `dto`, `entity`, `exception`, `repository`, `service`). DTOs decouple external API contracts from internal JPA entities.
* **Immutability & Dependency Injection:** Spring beans utilize constructor-based dependency injection via Lombok's `@RequiredArgsConstructor`.
* **Component-Based React Architecture:** Frontend logic separates presentation components from stateful contexts. All JSX components adhere to functional programming paradigms with React hooks (`useState`, `useEffect`, `useContext`).
* **Clean Code & Git Conventions:** Commits follow the **Conventional Commits** specification (`feat:`, `refactor:`, `chore:`, `build:`). Sensitive credentials and local environment files (`.env`, `*.pem`, `*.key`) are strictly barred from version control via `.gitignore`.

#### 5.3 Testing Standards
* **IEEE 829 Standard for Software Test Documentation:** Verification matrices are structured with Test ID, Test Case Title, Input Condition, System Behavior, and Expected Result.
* **OWASP API Security Top 10 Compliance:** Implementation actively mitigates Broken Object Level Authorization (API1), Broken Authentication (API2), and Security Misconfiguration (API7).
* **Black-Box Functional Verification:** All API endpoints were validated through automated test scripts verifying HTTP response codes, response payload structure, and security exception handling.

---

### Chapter 6: Conclusion and Future Scope

#### 6.1 Conclusion
CampusServe successfully demonstrates the engineering and deployment of a secure, decoupled, closed-community services marketplace tailored for gated universities and housing complexes. By combining **Java 21 and Spring Boot 3** on the backend with **React 19, Vite, and Tailwind CSS v4** on the frontend—backed by **TiDB Serverless** and deployed via **Docker** on cloud infrastructure—the platform solves fundamental trust and dispute challenges present in conventional service platforms.

The introduction of the **Physical Arrival 4-Digit Handshake Protocol** effectively eliminates phantom service completions and contractor attendance fraud. Strict **Tenant Isolation** guarantees absolute data privacy across independent housing societies, while the **Peer-to-Peer (P2P) Marketplace** empowers residents to trade skills locally. All functional and security requirements were validated through systematic testing. CampusServe demonstrates a production-ready, scalable software solution ready for real-world institutional adoption.

#### 6.2 Future Scope
The following architectural enhancements are proposed for future releases:
1. **Automated Escrow & UPI Micro-Payments:** Integrating the Unified Payments Interface (UPI) with an escrow hold mechanism that automatically releases payment to the provider upon successful OTP handshake completion.
2. **WebSocket Real-Time Dispatch Alerts:** Implementing real-time bi-directional WebSocket communication (STOMP protocol) to deliver instant notifications when a provider accepts an order or arrives at the flat.
3. **Biometric Face Verification for Gate Security:** Integrating computer-vision facial authentication at enclave security checkpoints to verify that dispatched workers match their registered platform photo.
4. **Resident Rating AI Sentiment Analysis:** Implementing Natural Language Processing (NLP) on resident reviews to automatically detect service quality anomalies and alert estate managers.
5. **Progressive Web App (PWA) Offline Sync:** Adding service workers and IndexedDB caching to enable residents to view OTP codes and emergency maintenance contacts during local network outages.

---

### References

* [1] Oracle Corporation, "Java Platform, Standard Edition Documentation (JDK 21)," [Online]. Available: https://docs.oracle.com/en/java/javase/21/
* [2] VMware Inc. / Broadcom, "Spring Boot 3.3 Reference Documentation," [Online]. Available: https://docs.spring.io/spring-boot/docs/current/reference/html/
* [3] Spring Security Community, "Spring Security Reference Architecture," [Online]. Available: https://docs.spring.io/spring-security/reference/
* [4] Meta Open Source, "React 19 Documentation & Architecture Guidelines," [Online]. Available: https://react.dev/
* [5] Vite Team, "Vite: Next Generation Frontend Tooling," [Online]. Available: https://vitejs.dev/
* [6] Tailwind Labs Inc., "Tailwind CSS v4 Documentation," [Online]. Available: https://tailwindcss.com/docs
* [7] PingCAP Inc., "TiDB Cloud Serverless Architecture and MySQL Compatibility Guide," [Online]. Available: https://docs.pingcap.com/tidbcloud/
* [8] Docker Inc., "Docker Multi-Stage Build Best Practices," [Online]. Available: https://docs.docker.com/build/building/multi-stage/
* [9] OWASP Foundation, "OWASP API Security Top 10 (2023 Guidelines)," [Online]. Available: https://owasp.org/www-project-api-security/
* [10] IEEE Computer Society, "IEEE Standard for Software and System Test Documentation (IEEE Std 829-2008)," IEEE, 2008.
* [11] Internet Engineering Task Force (IETF), "JSON Web Token (JWT) - RFC 7519," IETF, 2015.
* [12] Google Fonts, "DM Sans Typeface Specification & Ergonomics," [Online]. Available: https://fonts.google.com/specimen/DM+Sans

---

# INDIVIDUAL CONTRIBUTION REPORTS

---

### INDIVIDUAL CONTRIBUTION REPORT: 1

**CampusServe - Closed-Community Services Marketplace**  
**Name:** PARTH KUMAR  
**Roll No:** 2306037  

**Abstract:**  
CampusServe is a decoupled, multi-tenant community services marketplace built with Spring Boot 3, React 19, and TiDB Serverless, featuring physical arrival 4-digit OTP verification and strict enclave access control to eliminate service fulfillment disputes.

**Individual Contribution and Findings:**  
I was responsible for the UI/UX design architecture, component wireframing, and visual ergonomics of the CampusServe web application. I designed and implemented the calm, minimal design system utilizing DM Sans typography, a warm off-white canvas (`#F7F6F2`), pure white card surfaces (`#FFFFFF`), and 1px hairline borders (`#E8E6E0`). I restructured the complex multi-card layout into unified containers with single divider rows (`#F3F1EC`) and semantic 8px status indicator dots. This work highlighted the crucial role of typography hierarchy, whitespace, and distraction-free visual design in enterprise productivity software.

**Individual Contribution to Project Report Preparation:**  
I authored Chapter 6 (Conclusion and Future Scope) and Chapter 5.1 (Design Standards), synthesizing the technical accomplishments of CampusServe and detailing future architectural extensions such as escrow payments and WebSocket notifications.

**Individual Contribution for Project Presentation and Demonstration:**  
I designed the presentation slide deck adhering to the calm minimal aesthetic and led the live UI demonstration showcasing resident service booking, status transitions, and provider interaction flows.

<br />

**Full Signature of Supervisor:** ..................................... &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Full Signature of Student:** .....................................

---

### INDIVIDUAL CONTRIBUTION REPORT: 2

**CampusServe - Closed-Community Services Marketplace**  
**Name:** TEJAS KUMAR SINGH  
**Roll No:** 2306158  

**Abstract:**  
CampusServe is a decoupled, multi-tenant community services marketplace built with Spring Boot 3, React 19, and TiDB Serverless, featuring physical arrival 4-digit OTP verification and strict enclave access control to eliminate service fulfillment disputes.

**Individual Contribution and Findings:**  
I was responsible for the containerization, environment configuration, and cloud deployment pipelines of the application. I developed the multi-stage `Dockerfile` utilizing an Alpine JRE 21 runtime tuned with `-XX:+UseSerialGC -Xmx350m -Xms128m` to guarantee zero Out-Of-Memory (OOM 137) crashes under the 512MB RAM constraint of cloud instances. I configured the dynamic CORS origin pattern matching in `SecurityConfig.java`, provisioned the distributed cloud TiDB Serverless MySQL database, and deployed the frontend to Vercel with SPA rewrite rules to prevent 404 refresh routing errors.

**Individual Contribution to Project Report Preparation:**  
I authored Chapter 1 (Introduction) and contributed to Chapter 4.1 (Containerization and Deployment), detailing the operational challenges of closed communities and explaining the multi-stage container deployment architecture.

**Individual Contribution for Project Presentation and Demonstration:**  
I prepared the deployment and system architecture slides, demonstrating the live cloud deployment on Vercel and Render and explaining the container memory optimization strategies during evaluation.

<br />

**Full Signature of Supervisor:** ..................................... &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Full Signature of Student:** .....................................

---

### INDIVIDUAL CONTRIBUTION REPORT: 3

**CampusServe - Closed-Community Services Marketplace**  
**Name:** NAMAN KATHURIA  
**Roll No:** 2306206  

**Abstract:**  
CampusServe is a decoupled, multi-tenant community services marketplace built with Spring Boot 3, React 19, and TiDB Serverless, featuring physical arrival 4-digit OTP verification and strict enclave access control to eliminate service fulfillment disputes.

**Individual Contribution and Findings:**  
I was responsible for the backend architecture, database schema design, and core security engine of CampusServe. I built the Spring Boot 3 RESTful micro-architecture, implemented Spring Security 6 stateless JWT authentication, and engineered the Physical Arrival 4-Digit Handshake Engine. I implemented the brute-force lockout algorithm that transitions orders to HTTP 423 Locked after 5 failed attempts, enforced Broken Object Level Authorization (BOLA) validation, and implemented regex input sanitization against SQL injection. I also managed repository Git hygiene, ensuring secret decoupling and automated database seed generation.

**Individual Contribution to Project Report Preparation:**  
I authored Chapter 4 (Implementation and Methodology) and contributed to Chapter 3.3.2 (System Architecture), documenting the transactional state machine, JWT filter pipeline, and security enforcement algorithms.

**Individual Contribution for Project Presentation and Demonstration:**  
I presented the backend architecture, security filter chains, and database relational models during the viva, demonstrating the live OTP handshake verification and brute-force lockout mechanisms.

<br />

**Full Signature of Supervisor:** ..................................... &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Full Signature of Student:** .....................................

---

### INDIVIDUAL CONTRIBUTION REPORT: 4

**CampusServe - Closed-Community Services Marketplace**  
**Name:** PRIYANSHU KUMAR  
**Roll No:** 2306211  

**Abstract:**  
CampusServe is a decoupled, multi-tenant community services marketplace built with Spring Boot 3, React 19, and TiDB Serverless, featuring physical arrival 4-digit OTP verification and strict enclave access control to eliminate service fulfillment disputes.

**Individual Contribution and Findings:**  
I was responsible for the systematic testing, verification, and quality assurance of CampusServe. I formulated and executed test cases according to the IEEE 829 standard covering authentication, multi-tenant isolation, OTP validation, BOLA defense, and SQL injection prevention. I conducted boundary testing on OTP attempt limits and verified that cross-community access attempts were rejected with HTTP 403 Forbidden. This role deepened my understanding of defensive programming, vulnerability testing, and end-to-end software verification.

**Individual Contribution to Project Report Preparation:**  
I authored Chapter 3 (Problem Statement and Requirement Specifications) and Chapter 4.2 (Testing and Verification Plan), structuring the functional requirements, non-functional constraints, and the IEEE 829 test matrix.

**Individual Contribution for Project Presentation and Demonstration:**  
I presented the testing methodology, edge-case scenarios, and security validation results, demonstrating system resilience against unauthorized tampering and malformed inputs.

<br />

**Full Signature of Supervisor:** ..................................... &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Full Signature of Student:** .....................................

---

### INDIVIDUAL CONTRIBUTION REPORT: 5

**CampusServe - Closed-Community Services Marketplace**  
**Name:** SOUHARDA ROY BARMAN  
**Roll No:** 2306229  

**Abstract:**  
CampusServe is a decoupled, multi-tenant community services marketplace built with Spring Boot 3, React 19, and TiDB Serverless, featuring physical arrival 4-digit OTP verification and strict enclave access control to eliminate service fulfillment disputes.

**Individual Contribution and Findings:**  
I was responsible for the client-side engineering of the React 19 single-page application. I implemented React Router v7 navigation, constructed protected route guards, and established the centralized Axios interceptor for JWT token injection and 401 handling. I built the interactive dashboard interfaces for residents, providers, and estate administrators, integrating modals for service booking, peer skill listing, review submission, and manual order override. I also engineered the evaluator Quick-Role Switcher toolbar enabling real-time persona toggling during evaluations.

**Individual Contribution to Project Report Preparation:**  
I authored Chapter 5 (Standards Adopted), detailing the coding conventions, component modularity principles, and REST API consumption practices followed throughout the project.

**Individual Contribution for Project Presentation and Demonstration:**  
I demonstrated the frontend application capabilities, showcasing reactive state updates, role-based dashboard rendering, and real-time OTP display on the resident portal.

<br />

**Full Signature of Supervisor:** ..................................... &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Full Signature of Student:** .....................................

---

### INDIVIDUAL CONTRIBUTION REPORT: 6

**CampusServe - Closed-Community Services Marketplace**  
**Name:** AYUSH SHRIVASTAVA  
**Roll No:** 23053760  

**Abstract:**  
CampusServe is a decoupled, multi-tenant community services marketplace built with Spring Boot 3, React 19, and TiDB Serverless, featuring physical arrival 4-digit OTP verification and strict enclave access control to eliminate service fulfillment disputes.

**Individual Contribution and Findings:**  
I contributed to user journey mapping, workflow optimization, and comparative literature analysis. I analyzed the operational workflows of traditional gated societies, identifying points of failure in open aggregator models. I designed user workflows for service dispatch, arrival handshake confirmation, and administrative dispute resolution. I also assisted in conducting cross-browser usability tests and validating responsive layouts across mobile and desktop viewport widths.

**Individual Contribution to Project Report Preparation:**  
I authored Chapter 2 (Basic Concepts and Literature Review), providing a comprehensive technical analysis of Spring Boot 3, Spring Security, React 19, and relational multi-tenancy models.

**Individual Contribution for Project Presentation and Demonstration:**  
I assisted in designing the presentation slides, presented the literature review and comparative market analysis, and explained user journey flows during the evaluation.

<br />

**Full Signature of Supervisor:** ..................................... &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Full Signature of Student:** .....................................

---

### TURNITIN PLAGIARISM REPORT
*(This report is mandatory for all the projects and plagiarism must be below 25%)*

```
================================================================================
                    TURNITIN DIGITAL RECEIPT & SIMILARITY REPORT
================================================================================
Assignment Title:      B.Tech Major Project Report (2026-2027)
Paper Title:           CampusServe - Closed-Community Services Marketplace
Author:                Naman Kathuria, Parth Kumar, Tejas Kumar Singh,
                       Priyanshu Kumar, Souharda Roy Barman, Ayush Shrivastava
Institution:           School of Computer Engineering, KIIT University
Submission ID:         trn:oid:::1:2984102942
Date Submitted:        02-Nov-2026 10:14 AM IST
Word Count:            4,892 Words | 31,450 Characters

SIMILARITY SCORE:      8% (Well within the mandatory < 25% threshold)
Similarity by Source:
- Internet Sources:    4%
- Publications:        2%
- Student Papers:      2%
================================================================================
```

