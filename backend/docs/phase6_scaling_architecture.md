# Phase 6: Enterprise Architecture & Scaling Strategy

## 1. System Architecture Overview
The SpaPOS platform has evolved from a simple monolithic SaaS to a robust, scalable enterprise architecture capable of handling hundreds of spas, multi-branch environments, and thousands of concurrent users.

### Architecture Components
- **Frontend (Web/PWA):** React 19, Vite, Tailwind CSS, Zustand, React Query. Deployed globally via CDN (AWS CloudFront / Vercel).
- **Desktop POS:** Electron-based local-first application with SQLite cache and auto-sync.
- **Backend API:** Node.js, Express, TypeScript. Scalable horizontally via Docker containers.
- **Database:** PostgreSQL via Prisma ORM, utilizing connection pooling (PgBouncer).

## 2. Multi-Branch & Tenant Isolation
- **Logical Isolation:** Data is strictly isolated using `spaId`.
- **Branch Level Granularity:** Large chains can create `Branches`. Staff, inventory, invoices, and appointments are assigned to specific branches while rolling up to the parent `Spa` analytics.

## 3. DevOps & CI/CD Strategy
- **Containerization:** The backend and frontend are containerized using `Docker` and orchestrated via `docker-compose` for local dev.
- **CI/CD Pipeline:** Configured via GitHub Actions (`.github/workflows/deploy.yml`).
  - *Automated Testing:* Runs linting and tests on PR.
  - *Build:* Builds Prisma models, compiles TypeScript, and builds the React Vite app.
  - *Deployment:* Pushes Docker images to Amazon ECR/Docker Hub and triggers rolling updates on ECS/EKS or VPS.

## 4. Scaling the Infrastructure (AWS)
- **Compute:** Amazon ECS (Elastic Container Service) with AWS Fargate for serverless backend container scaling. Auto-scaling rules trigger based on CPU/Memory utilization.
- **Database:** Amazon RDS (PostgreSQL) Multi-AZ for high availability. Read Replicas configured for heavy analytics/reporting queries.
- **Caching & Sessions:** Amazon ElastiCache (Redis) to store JWT refresh tokens, rate-limiting counters, and caching heavy Dashboard aggregations.
- **Storage:** Amazon S3 for storing invoice PDFs, user avatars, and system backups.

## 5. Security Posture
- **Authentication:** Short-lived JWT access tokens + HTTP-only secure Refresh Tokens.
- **RBAC:** Strict Role-Based Access Control enforcing Super Admin, Spa Owner, Manager, and Staff limits.
- **Audit Trails:** Complete system `AuditLogs` for tracking plan upgrades, deletions, and sensitive financial changes.
- **Login Tracking:** Device, IP, and User-Agent tracking stored in `LoginHistory` to identify unauthorized access attempts.

## 6. Advanced Marketing & AI Features
- **CRM Marketing Engine:** Integrated model to handle targeted email/SMS/WhatsApp campaigns based on Customer Segmentation (VIPs, Inactive users).
- **AI Readiness:** Backend architecture supports future microservices written in Python (FastAPI/Flask) for predictive ML models (revenue forecasting, churn prediction) by directly querying read-replicas.