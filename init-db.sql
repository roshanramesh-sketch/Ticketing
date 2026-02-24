-- ==========================================
-- TicketFlow Database Initialization Script
-- ==========================================
-- This script initializes the database with:
-- 1. Admin user account
-- 2. Sample users
-- 3. Sample data for testing

-- ==========================================
-- Add Admin User (if not exists)
-- ==========================================
INSERT INTO schema_auth.table_users (firstname, lastname, email, password, role)
SELECT 'Roshan', 'Ramesh', 'roshan.ramesh@bcits.in', 'Ticketing#321!', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM schema_auth.table_users 
    WHERE email = 'roshan.ramesh@bcits.in'
);

-- ==========================================
-- Add Sample Users for Testing
-- ==========================================
INSERT INTO schema_auth.table_users (firstname, lastname, email, password, role)
SELECT 'John', 'Doe', 'john.doe@bcits.in', 'Password@123', 'user'
WHERE NOT EXISTS (
    SELECT 1 FROM schema_auth.table_users 
    WHERE email = 'john.doe@bcits.in'
);

INSERT INTO schema_auth.table_users (firstname, lastname, email, password, role)
SELECT 'Jane', 'Smith', 'jane.smith@bcits.in', 'Password@123', 'support'
WHERE NOT EXISTS (
    SELECT 1 FROM schema_auth.table_users 
    WHERE email = 'jane.smith@bcits.in'
);

INSERT INTO schema_auth.table_users (firstname, lastname, email, password, role)
SELECT 'Mike', 'Johnson', 'mike.johnson@bcits.in', 'Password@123', 'manager'
WHERE NOT EXISTS (
    SELECT 1 FROM schema_auth.table_users 
    WHERE email = 'mike.johnson@bcits.in'
);

-- ==========================================
-- Add Sample Ticket Bins
-- ==========================================
INSERT INTO schema_ticket.table_ticket_bins (name, description, manager_id, created_time)
SELECT 'General Support', 'General support tickets', 4, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM schema_ticket.table_ticket_bins 
    WHERE name = 'General Support'
);

INSERT INTO schema_ticket.table_ticket_bins (name, description, manager_id, created_time)
SELECT 'Technical Issues', 'Technical and infrastructure issues', 4, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM schema_ticket.table_ticket_bins 
    WHERE name = 'Technical Issues'
);

INSERT INTO schema_ticket.table_ticket_bins (name, description, manager_id, created_time)
SELECT 'Feature Requests', 'Feature requests and enhancements', 4, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM schema_ticket.table_ticket_bins 
    WHERE name = 'Feature Requests'
);

-- ==========================================
-- Add Sample Tickets
-- ==========================================
INSERT INTO schema_ticket.table_tickets (subject, content, status, priority, requester_id, assignee_id, created_time, updated_time, bin_id)
SELECT 
    'Cannot reset password',
    'User unable to reset password using forgot password link. Receiving error: Invalid token',
    'open',
    'high',
    2,
    3,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    1
WHERE NOT EXISTS (
    SELECT 1 FROM schema_ticket.table_tickets 
    WHERE subject = 'Cannot reset password'
);

INSERT INTO schema_ticket.table_tickets (subject, content, status, priority, requester_id, assignee_id, created_time, updated_time, bin_id)
SELECT 
    'Application crashes on login',
    'Application is crashing when users try to login. Error logs show database connection timeout.',
    'in_progress',
    'critical',
    2,
    3,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    2
WHERE NOT EXISTS (
    SELECT 1 FROM schema_ticket.table_tickets 
    WHERE subject = 'Application crashes on login'
);

INSERT INTO schema_ticket.table_tickets (subject, content, status, priority, requester_id, assignee_id, created_time, updated_time, bin_id, archived_time)
SELECT 
    'Add dark mode theme',
    'Request to add dark mode theme to improve user experience for night time users.',
    'closed',
    'medium',
    2,
    NULL,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 day',
    3,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (
    SELECT 1 FROM schema_ticket.table_tickets 
    WHERE subject = 'Add dark mode theme'
);

INSERT INTO schema_ticket.table_tickets (subject, content, status, priority, requester_id, assignee_id, created_time, updated_time, bin_id)
SELECT 
    'Improve dashboard performance',
    'Dashboard is loading slowly. Need to optimize queries and add caching.',
    'open',
    'medium',
    2,
    NULL,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours',
    2
WHERE NOT EXISTS (
    SELECT 1 FROM schema_ticket.table_tickets 
    WHERE subject = 'Improve dashboard performance'
);

-- ==========================================
-- Add Sample Knowledge Base Articles
-- ==========================================
INSERT INTO schema_kb.table_kb_items (title, content, category, author_id, created_time)
SELECT 
    'How to Reset Your Password',
    'Step 1: Click on "Forgot Password" link on the login page.\nStep 2: Enter your email address.\nStep 3: Check your email for password reset link.\nStep 4: Click the link and create a new password.\nStep 5: Login with your new password.',
    'Authentication',
    1,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM schema_kb.table_kb_items 
    WHERE title = 'How to Reset Your Password'
);

INSERT INTO schema_kb.table_kb_items (title, content, category, author_id, created_time)
SELECT 
    'How to Create a Ticket',
    'Step 1: Navigate to the Tickets page from the sidebar.\nStep 2: Click "Create Ticket" button.\nStep 3: Fill in the subject and description.\nStep 4: Select priority level.\nStep 5: Click "Create Ticket".\n\nYour ticket will be assigned a unique ID for tracking.',
    'Getting Started',
    1,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM schema_kb.table_kb_items 
    WHERE title = 'How to Create a Ticket'
);

INSERT INTO schema_kb.table_kb_items (title, content, category, author_id, created_time)
SELECT 
    'Understanding Ticket Priorities',
    'Low: Minor issues, cosmetic problems, general inquiries\nMedium: Moderate issues affecting some features\nHigh: Significant issues affecting important features\nCritical: System down or severe data loss risk\n\nCritical tickets are handled with highest priority.',
    'Tickets',
    1,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM schema_kb.table_kb_items 
    WHERE title = 'Understanding Ticket Priorities'
);

INSERT INTO schema_kb.table_kb_items (title, content, category, author_id, created_time)
SELECT 
    'Frequently Asked Questions',
    'Q: What is my ticket ID?\nA: Your ticket ID is displayed at the top of the ticket details page.\n\nQ: How long does it take to resolve a ticket?\nA: Resolution time depends on priority. Critical issues are resolved within 4 hours, High within 24 hours, Medium within 48 hours, Low within 5 business days.\n\nQ: Can I update my ticket after creation?\nA: You can add comments and attachments to your ticket, but the core details cannot be changed.',
    'General',
    1,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM schema_kb.table_kb_items 
    WHERE title = 'Frequently Asked Questions'
);

-- ==========================================
-- Add Sample Activity Logs
-- ==========================================
INSERT INTO schema_system.table_activity_logs (user_id, action, details, timestamp)
SELECT 
    1, 
    'LOGIN', 
    'Admin user logged in from IP 10.20.10.65',
    NOW() - INTERVAL '2 hours'
WHERE NOT EXISTS (
    SELECT 1 FROM schema_system.table_activity_logs 
    WHERE user_id = 1 AND action = 'LOGIN' AND timestamp > NOW() - INTERVAL '1 hour'
);

INSERT INTO schema_system.table_activity_logs (user_id, action, details, timestamp)
SELECT 
    2, 
    'CREATE_TICKET', 
    'Created ticket: Cannot reset password',
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (
    SELECT 1 FROM schema_system.table_activity_logs 
    WHERE user_id = 2 AND action = 'CREATE_TICKET'
);

-- ==========================================
-- Display Summary
-- ==========================================
SELECT 
    (SELECT COUNT(*) FROM schema_auth.table_users) as total_users,
    (SELECT COUNT(*) FROM schema_ticket.table_tickets) as total_tickets,
    (SELECT COUNT(*) FROM schema_kb.table_kb_items) as total_kb_articles,
    (SELECT COUNT(*) FROM schema_system.table_activity_logs) as total_activity_logs;

-- ==========================================
-- Script Complete
-- ==========================================
-- Database initialization completed successfully!
-- Admin user: roshan.ramesh@bcits.in / Ticketing#321!
-- Sample users have been added for testing
-- Sample tickets and knowledge base articles are ready
