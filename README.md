# TicketFlow - Ticketing Management System

## Overview
TicketFlow is a multi-tenant ticketing system with role-based access control (RBAC), bin management, knowledge base, and team-based ticket organization.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, TanStack Query, Shadcn UI, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL
- **Deployment**: Docker, Docker Compose
- **Database**: PostgreSQL 14+

---

## Database Structure

### Schema Organization
- `schema_auth` - Authentication, users, roles, accounts, permissions
- `schema_ticket` - Tickets, bins, teams, knowledge base, attachments

---

### Schema: `schema_auth`

#### 1. `table_accounts`
Multi-tenancy support - each account is a separate organization.

```sql
CREATE TABLE schema_auth.table_accounts (
  id SERIAL PRIMARY KEY,
  account_name VARCHAR(255) UNIQUE NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',  -- Account-specific timezone
  is_active BOOLEAN DEFAULT TRUE,
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id` - Primary key
- `account_name` - Organization name (e.g., "BCITS")
- `timezone` - Account timezone (default: Asia/Kolkata for IST)
- `is_active` - Account status
- `created_time` - Account creation timestamp
- `updated_time` - Last update timestamp

---

#### 2. `table_users`
User accounts with account isolation.

```sql
CREATE TABLE schema_auth.table_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hashed
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'User',  -- Legacy: 'Admin', 'Manager', 'User'
  account_id INTEGER NOT NULL REFERENCES schema_auth.table_accounts(id),
  is_active BOOLEAN DEFAULT TRUE,
  creation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Note: creation_time, not created_time
  last_login TIMESTAMP,
  CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES schema_auth.table_accounts(id) ON DELETE CASCADE
);
```

**Columns:**
- `id` - Primary key
- `email` - User email (unique, used for login)
- `password` - bcrypt hashed password
- `firstname`, `lastname` - User name
- `role` - Legacy role field (still used for backward compatibility)
- `account_id` - Links to account (multi-tenancy)
- `is_active` - User status
- `creation_time` - **Important**: Column name is `creation_time`, not `created_time`
- `last_login` - Last login timestamp

**Indexes:**
```sql
CREATE INDEX idx_users_account ON schema_auth.table_users(account_id);
CREATE INDEX idx_users_email ON schema_auth.table_users(email);
```

---

#### 3. `table_roles`
Predefined system roles.

```sql
CREATE TABLE schema_auth.table_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,  -- 'admin', 'manager', 'agent', 'viewer', 'bin_manager', 'user'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,  -- Array of permission strings
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Default Roles:**
1. **Admin** - Full system access
2. **Manager** - Manage users, bins, teams
3. **Agent** - Create/assign/resolve tickets
4. **Viewer** - Read-only access
5. **Bin Manager** - Manage specific bins
6. **User** - Basic ticket creation

**Permissions Array Example:**
```json
["all", "all_users", "all_bins", "transfer_tickets"]
```

---

#### 4. `table_user_roles`
Maps users to roles (many-to-many). Supports bin-specific role assignments.

```sql
CREATE TABLE schema_auth.table_user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES schema_auth.table_users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES schema_auth.table_roles(id) ON DELETE CASCADE,
  bin_id INTEGER REFERENCES schema_ticket.table_ticket_bins(id) ON DELETE SET NULL,  -- Optional: bin-specific
  granted_by INTEGER REFERENCES schema_auth.table_users(id),
  granted_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id, bin_id)
);
```

**Columns:**
- `user_id` - User receiving the role
- `role_id` - Role being assigned
- `bin_id` - Optional: Restrict role to specific bin
- `granted_by` - Admin who granted the role
- `granted_time` - When role was assigned

**Indexes:**
```sql
CREATE INDEX idx_user_roles_user ON schema_auth.table_user_roles(user_id);
CREATE INDEX idx_user_roles_role ON schema_auth.table_user_roles(role_id);
```

---

### Schema: `schema_ticket`

#### 5. `table_teams`
Organizational teams for ticket categorization.

```sql
CREATE TABLE schema_ticket.table_teams (
  id SERIAL PRIMARY KEY,
  team_name VARCHAR(100) UNIQUE NOT NULL,  -- 'HES', 'MDM', 'WFM', etc.
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Default Teams:**
1. HES - Hospital Enterprise System
2. MDM - Master Data Management
3. WFM - Workforce Management
4. SLA - Service Level Agreement
5. Cloud - Cloud Services
6. DB - Database
7. Organization - Organizational Support
8. Reporting - Reporting & Analytics
9. Integration - System Integration
10. Security - Security & Compliance
11. Infrastructure - Infrastructure Support
12. General - General Support

---

#### 6. `table_ticket_bins`
Ticket bins/queues for organizing tickets.

```sql
CREATE TABLE schema_ticket.table_ticket_bins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',  -- Hex color code
  manager_id INTEGER REFERENCES schema_auth.table_users(id) ON DELETE SET NULL,
  account_id INTEGER NOT NULL REFERENCES schema_auth.table_accounts(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `name` - Bin name (e.g., "General Support", "HES Tickets")
- `color` - UI color for bin (hex code)
- `manager_id` - Optional: bin manager user
- `account_id` - Account isolation
- `is_active` - Active/inactive status

**Indexes:**
```sql
CREATE INDEX idx_bins_account ON schema_ticket.table_ticket_bins(account_id);
CREATE INDEX idx_bins_manager ON schema_ticket.table_ticket_bins(manager_id);
```

---

#### 7. `table_tickets`
Support tickets.

```sql
CREATE TABLE schema_ticket.table_tickets (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,  -- Auto-generated: TKT-20260212-001
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Open',  -- 'Open', 'In Progress', 'Resolved', 'Closed'
  priority VARCHAR(20) DEFAULT 'P3',  -- 'P0' (Critical) to 'P4' (Low)
  team_id INTEGER REFERENCES schema_ticket.table_teams(id) ON DELETE SET NULL,
  bin_id INTEGER REFERENCES schema_ticket.table_ticket_bins(id) ON DELETE SET NULL,
  created_by INTEGER NOT NULL REFERENCES schema_auth.table_users(id) ON DELETE CASCADE,
  assigned_to INTEGER REFERENCES schema_auth.table_users(id) ON DELETE SET NULL,
  account_id INTEGER NOT NULL REFERENCES schema_auth.table_accounts(id) ON DELETE CASCADE,
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_time TIMESTAMP,
  closed_time TIMESTAMP
);
```

**Columns:**
- `ticket_number` - Unique identifier (e.g., TKT-20260212-001)
- `status` - Ticket workflow status
- `priority` - P0 (Critical), P1 (High), P2 (Medium), P3 (Normal), P4 (Low)
- `team_id` - Team responsible
- `bin_id` - Current bin
- `created_by` - User who created ticket
- `assigned_to` - User assigned to ticket
- `resolved_time`, `closed_time` - Workflow timestamps

**Indexes:**
```sql
CREATE INDEX idx_tickets_account ON schema_ticket.table_tickets(account_id);
CREATE INDEX idx_tickets_bin ON schema_ticket.table_tickets(bin_id);
CREATE INDEX idx_tickets_created_by ON schema_ticket.table_tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON schema_ticket.table_tickets(assigned_to);
CREATE INDEX idx_tickets_status ON schema_ticket.table_tickets(status);
```

---

#### 8. `table_attachments`
File attachments for tickets.

```sql
CREATE TABLE schema_ticket.table_attachments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES schema_ticket.table_tickets(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,  -- Bytes
  mime_type VARCHAR(100),
  uploaded_by INTEGER NOT NULL REFERENCES schema_auth.table_users(id) ON DELETE CASCADE,
  uploaded_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_attachments_ticket ON schema_ticket.table_attachments(ticket_id);
```

---

#### 9. `table_knowledge_base`
Knowledge base articles.

```sql
CREATE TABLE schema_ticket.table_knowledge_base (
  id SERIAL PRIMARY KEY,
  kb_number VARCHAR(20) UNIQUE NOT NULL,  -- KB-001, KB-002, etc.
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  bin_id INTEGER REFERENCES schema_ticket.table_ticket_bins(id) ON DELETE SET NULL,
  linked_ticket_id INTEGER REFERENCES schema_ticket.table_tickets(id) ON DELETE SET NULL,
  created_by INTEGER NOT NULL REFERENCES schema_auth.table_users(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES schema_auth.table_accounts(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT FALSE,
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `kb_number` - Unique KB identifier
- `bin_id` - Category bin
- `linked_ticket_id` - Optional: source ticket
- `is_published` - Published/draft status

**Indexes:**
```sql
CREATE INDEX idx_kb_account ON schema_ticket.table_knowledge_base(account_id);
CREATE INDEX idx_kb_bin ON schema_ticket.table_knowledge_base(bin_id);
```

---

## Timezone Handling

### Implementation Strategy

**1. Database Storage:**
- All timestamps stored in UTC (PostgreSQL default)
- Use `TIMESTAMP WITHOUT TIME ZONE` (not `TIMESTAMPTZ`)

**2. Account-Level Timezone:**
- `table_accounts.timezone` stores IANA timezone (e.g., `Asia/Kolkata`)
- Default: `Asia/Kolkata` (IST - Indian Standard Time)
- Admin can change per account

**3. Application Layer:**
- Backend: Convert UTC to account timezone before sending to frontend
- Frontend: Display timestamps in user's account timezone
- User input: Convert local time to UTC before storing

**4. BCITS Account Configuration:**
```sql
UPDATE schema_auth.table_accounts 
SET timezone = 'Asia/Kolkata'
WHERE account_name = 'BCITS';
```

### Timezone Conversion Functions

**Backend Helper (Node.js):**
```typescript
import { formatInTimeZone } from 'date-fns-tz';

function convertToAccountTimezone(utcDate: Date, timezone: string) {
  return formatInTimeZone(utcDate, timezone, 'yyyy-MM-dd HH:mm:ss');
}

// Usage
const accountTimezone = 'Asia/Kolkata';
const displayTime = convertToAccountTimezone(ticket.created_time, accountTimezone);
```

**SQL Query with Timezone:**
```sql
-- Convert UTC to IST when querying
SELECT 
  id, 
  ticket_number,
  created_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as created_time_ist
FROM schema_ticket.table_tickets;
```

---

## Migration Files

All migrations located in: `database/migrations/`

1. `001_create_accounts.sql` - Accounts table
2. `002_add_account_to_users.sql` - Add account_id to users
3. `003_create_roles.sql` - Roles and user_roles tables
4. `004_create_teams.sql` - Teams table
5. `005_create_bins.sql` - Enhanced bins table
6. `006_enhance_tickets.sql` - Add team_id, priority to tickets
7. `007_create_attachments.sql` - Attachments table
8. `008_grant_permissions.sql` - Grant permissions to user_ticketing_app

Run migrations: See `database/RUN_MIGRATIONS.md`

---

## Environment Variables

```env
# Database
POSTGRES_HOST=10.20.10.65
POSTGRES_PORT=5434
POSTGRES_DB=db_ticketing
POSTGRES_USER=user_ticketing_app
POSTGRES_PASSWORD=YourSecurePassword

# Session
SESSION_SECRET=your-secret-key-here
SESSION_TIMEOUT=86400000  # 24 hours in ms

# Application
NODE_ENV=production
PORT=8080

# Timezone (optional, defaults to account setting)
DEFAULT_TIMEZONE=Asia/Kolkata
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/check` - Check authentication status

### User Management
- `GET /api/user-management/users` - List users
- `POST /api/user-management/users` - Create user
- `PUT /api/user-management/users/:id` - Update user
- `DELETE /api/user-management/users/:id` - Delete user
- `POST /api/user-management/users/:id/roles` - Assign roles
- `GET /api/user-management/roles` - List roles

### Bins
- `GET /api/bins` - List bins
- `POST /api/bins` - Create bin
- `GET /api/bins/:id` - Get bin details
- `PUT /api/bins/:id` - Update bin
- `DELETE /api/bins/:id` - Delete bin

### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Tickets
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

---

## Deployment

See: `PHASE1_DEPLOYMENT.md`

**Quick Start:**
```bash
cd /application/ticketing_hub
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose logs -f ticketflow
```

---

## Important Notes

### Column Name Inconsistency
⚠️ **Critical**: The `table_users` table uses `creation_time`, not `created_time`
- Most other tables use `created_time`
- Users table is legacy and uses `creation_time`
- Backend must use `creation_time` when querying users

### Timezone Best Practices
1. Always store in UTC
2. Convert to account timezone for display
3. Account admins can change timezone in account settings
4. IST (Asia/Kolkata) is default for all Indian accounts

### Session Management
- Sessions stored in memory (development)
- Production: Should use Redis or PostgreSQL session store
- Session timeout: 24 hours default

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f ticketflow`
- Database access: `psql -p 5434 -U postgres db_ticketing`
- Migrations: See `database/RUN_MIGRATIONS.md`
