# TicketFlow - Ticketing Application

A comprehensive, production-ready ticketing system built with React, Express, and PostgreSQL.

## Project Structure

```
ticketing_app/
├── client/                          # React frontend
│   ├── components/
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx       # Main app layout with sidebar navigation
│   │   └── ui/                      # Pre-built UI components (Radix UI)
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Authentication state management
│   │   └── ThemeContext.tsx         # Theme management (light/dark/corporate/ghibli)
│   ├── pages/
│   │   ├── Login.tsx                # Login page
│   │   ├── Dashboard.tsx            # Dashboard with stats and charts
│   │   ├── Tickets.tsx              # Ticket management
│   │   ├── KnowledgeBase.tsx        # Knowledge base articles
│   │   ├── Settings.tsx             # User settings and password change
│   │   └── Admin.tsx                # Admin panel (user management & activity logs)
│   ├── types/
│   │   └── index.ts                 # TypeScript types for the app
│   ├── lib/
│   │   └── utils.ts                 # Utility functions
│   ├── App.tsx                      # Main app component with routing
│   └── global.css                   # Global styles with theme variables
│
├── server/                          # Express backend
│   ├── routes/
│   │   ├── auth.ts                  # Authentication endpoints
│   │   ├── dashboard.ts             # Dashboard stats endpoints
│   │   ├── tickets.ts               # Ticket CRUD endpoints
│   │   ├── knowledge-base.ts        # Knowledge base endpoints
│   │   ├── settings.ts              # Settings endpoints
│   │   ├── admin.ts                 # Admin management endpoints
│   │   └── demo.ts                  # Demo endpoint
│   ├── db.ts                        # Database connection utilities
│   └── index.ts                     # Main server setup and route registration
│
├── shared/                          # Shared types and utilities
│   └── api.ts                       # API type definitions
│
├── public/                          # Static assets
├── .env.example                     # Environment variables template
├── package.json                     # Dependencies and scripts
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite frontend configuration
├── vite.config.server.ts            # Vite server configuration
└── README.md                        # This file
```

## Features

### User Authentication
- **Login**: Email and password-based authentication
- **Session Management**: Secure session handling with express-session
- **Role-Based Access Control**: User, Support, Manager, and Admin roles

### Dashboard
- **Statistics Overview**: 
  - Total tickets created (all time)
  - Total tickets archived (all time)
  - Tickets created today
  - Tickets open today
  - Currently open tickets
  - Tickets archived today
- **Charts and Visualizations**:
  - Daily activity bar chart
  - Ticket status distribution pie chart
  - Summary cards with key metrics

### Ticket Management
- **Create Tickets**: Submit new support requests
- **Track Tickets**: View and manage ticket status
- **Filter & Search**: Find tickets by subject, content, status, or priority
- **Priority Levels**: Low, Medium, High, Critical
- **Status Tracking**: Open, In Progress, Closed, Archived
- **Archive Tickets**: Close completed tickets

### Knowledge Base
- **Article Management**: Create and organize KB articles
- **Categorization**: Organize articles by category
- **Search**: Find articles by title or content
- **Reference to Tickets**: Link KB articles to specific tickets for resolution

### User Settings
- **Profile View**: Display user information
- **Password Change**: Update account password with validation
- **User Information**: View name, email, and role

### Admin Panel
- **User Management**: 
  - View all users
  - Assign and modify user roles
- **Activity Logs**: 
  - Monitor user actions and system events
  - 7-day activity history
  - Detailed action logs with timestamps
- **User Statistics**: 
  - Total users by role
  - Admin count
  - Manager count
  - Support count
  - User count

### Theme System
- **Multiple Themes**:
  - **Warm Light**: Default professional light theme
  - **Dark**: Dark mode for reduced eye strain
  - **Corporate**: Professional blue corporate theme
  - **Ghibli**: Warm, soft, whimsical animated theme
- **Color Mode**: Independent light/dark mode toggle
- **Persistent Preferences**: Theme preferences saved in localStorage

## Setup Instructions

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL 18
- Docker (optional, for containerization)

### Database Setup

1. **Create Database and User**:
```sql
CREATE USER user_ticketing_app WITH PASSWORD 'your_password';
CREATE DATABASE db_ticketing OWNER user_ticketing_app;
```

2. **Create Schemas**:
```sql
CREATE SCHEMA schema_auth AUTHORIZATION user_ticketing_app;
CREATE SCHEMA schema_ticket AUTHORIZATION user_ticketing_app;
CREATE SCHEMA schema_kb AUTHORIZATION user_ticketing_app;
CREATE SCHEMA schema_system AUTHORIZATION user_ticketing_app;
```

3. **Create Tables** (as per your existing schema):
   - schema_auth.table_users
   - schema_ticket.table_tickets
   - schema_ticket.table_ticket_messages
   - schema_ticket.table_ticket_bins
   - schema_kb.table_kb_items
   - schema_system.table_activity_logs
   - schema_system.table_email_configs

### Application Setup

1. **Install Dependencies**:
```bash
pnpm install
```

2. **Configure Environment Variables**:
Copy `.env.example` to `.env` and update with your configuration:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DB_HOST=localhost
DB_PORT=5434
DB_USER=user_ticketing_app
DB_PASSWORD=your_password
DB_NAME=db_ticketing
SESSION_SECRET=your-secure-random-secret
NODE_ENV=development
PORT=8080
```

3. **Start Development Server**:
```bash
pnpm dev
```

The application will be available at `http://localhost:8080`

4. **Build for Production**:
```bash
pnpm build
```

5. **Start Production Server**:
```bash
pnpm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Tickets
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/archive` - Archive ticket

### Knowledge Base
- `GET /api/knowledge-base` - Get all KB items
- `POST /api/knowledge-base` - Create KB article
- `GET /api/knowledge-base/:id` - Get KB article
- `DELETE /api/knowledge-base/:id` - Delete KB article

### Settings
- `POST /api/settings/change-password` - Change user password

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:id/role` - Update user role (admin only)
- `GET /api/admin/activity-logs` - Get activity logs (admin only)
- `GET /api/admin/user-stats` - Get user statistics (admin only)

## Security Considerations

### Important Security Notes:
1. **Password Hashing**: Currently uses plain text comparison for demo purposes. **In production, use bcrypt or similar:**
   ```typescript
   import bcrypt from 'bcrypt';
   const hashedPassword = await bcrypt.hash(password, 10);
   const isValid = await bcrypt.compare(password, hashedPassword);
   ```

2. **Session Management**: Use a proper session store (MongoDB, Redis, etc.) instead of memory
3. **HTTPS**: Enable SSL/TLS in production
4. **CORS**: Configure CORS properly for your domain
5. **Rate Limiting**: Add rate limiting to prevent brute force attacks
6. **Input Validation**: All user inputs are validated with Zod
7. **SQL Injection**: Using parameterized queries with pg library

## Development Guidelines

### Adding New Routes
1. Create route handler in `server/routes/`
2. Register in `server/index.ts`
3. Create corresponding API hook in `client/` if needed

### Adding New Pages
1. Create component in `client/pages/`
2. Add route in `client/App.tsx`
3. Use `AppLayout` wrapper for authenticated pages

### Styling
- Use Tailwind CSS utility classes
- Theme variables defined in `client/global.css`
- Access colors via HSL CSS variables
- Radix UI components available in `client/components/ui/`

### Environment Variables
- Update `.env` file for local development
- Use environment variables for secrets
- Never commit `.env` to version control

## Deployment

### Docker Deployment
1. Create Dockerfile for the application
2. Configure PostgreSQL connection
3. Set environment variables in production

### Netlify/Vercel Deployment
1. Connect your Git repository
2. Set environment variables in hosting platform
3. Configure build command: `pnpm build`
4. Configure start command: `pnpm start`

## Maintenance

### Database Backups
- Regular backups of PostgreSQL database
- Store backups securely

### Activity Log Retention
- Activity logs are retained for 7 days
- Implement automated cleanup for older logs
- Archive important logs to long-term storage

### Updates
- Keep dependencies updated
- Monitor security advisories
- Test updates in staging environment before production

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running on port 5434
- Check database credentials in .env
- Ensure database and schemas exist
- Check network connectivity

### Port Already in Use
- Change PORT in .env
- Kill existing processes on port 8080

### Session Errors
- Clear browser cookies
- Restart server
- Check SESSION_SECRET is set

## Tech Stack Summary

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL 18
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Validation**: Zod
- **Styling**: Tailwind CSS 3

## License

This project is provided as-is for ticketing system implementation.

## Support

For issues or questions, refer to the documentation or contact your system administrator.
