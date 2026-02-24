#!/bin/bash

# ==========================================
# TicketFlow Deployment Commands
# ==========================================
# Execute these commands in order on your Ubuntu VM
# Location: /application/ticketing_hub
# Each section is numbered for easy reference

echo "=================================================="
echo "TicketFlow Deployment - Command Reference"
echo "=================================================="
echo ""
echo "IMPORTANT: Run these commands in order!"
echo "Execute from: /application/ticketing_hub"
echo ""

# ==========================================
# STEP 1: Navigate to Application Directory
# ==========================================
echo "STEP 1: Navigate to Application Directory"
echo "Command:"
echo "cd /application/ticketing_hub"
echo ""

# ==========================================
# STEP 2: Initialize Database with Sample Data
# ==========================================
echo "STEP 2: Initialize Database with Sample Data"
echo "Command:"
echo "PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -f init-db.sql"
echo ""
echo "Expected Output: Should show INSERT operations and final summary"
echo ""

# ==========================================
# STEP 3: Create Secrets Directory
# ==========================================
echo "STEP 3: Create Secrets Directory"
echo "Commands:"
echo "mkdir -p /application/ticketing_hub/secrets"
echo "chmod 700 /application/ticketing_hub/secrets"
echo ""
echo "(Optional) Add Gmail key if available:"
echo "cp /path/to/tickets-key.json /application/ticketing_hub/secrets/tickets-key.json"
echo "chmod 600 /application/ticketing_hub/secrets/tickets-key.json"
echo ""

# ==========================================
# STEP 4: Build Docker Image
# ==========================================
echo "STEP 4: Build Docker Image (This takes 5-10 minutes)"
echo "Command:"
echo "docker compose build --no-cache"
echo ""
echo "Expected Output: Image build progress, ending with:"
echo "=> => naming to docker.io/library/ticketing_hub-ticketflow:latest"
echo ""

# ==========================================
# STEP 5: Start Application
# ==========================================
echo "STEP 5: Start Application"
echo "Command:"
echo "docker compose up -d"
echo ""
echo "Expected Output: Creating ticketflow-app ... done"
echo ""

# ==========================================
# STEP 6: Verify Application is Running
# ==========================================
echo "STEP 6: Verify Application is Running"
echo "Commands:"
echo ""
echo "Check container status:"
echo "docker compose ps"
echo ""
echo "Should show: ticketflow-app    Up (healthy)"
echo ""

# ==========================================
# STEP 7: Test API Endpoint
# ==========================================
echo "STEP 7: Test API Endpoint"
echo "Command:"
echo "curl http://localhost:8080/api/ping"
echo ""
echo "Expected Output: {\"message\":\"pong\"}"
echo ""

# ==========================================
# STEP 8: View Application Logs
# ==========================================
echo "STEP 8: View Application Logs (Optional)"
echo "Command:"
echo "docker compose logs -f"
echo ""
echo "Press Ctrl+C to exit logs"
echo ""

# ==========================================
# STEP 9: Access Application in Browser
# ==========================================
echo "STEP 9: Access Application in Browser"
echo "URL: http://10.20.10.65:8080"
echo ""
echo "Login with admin credentials:"
echo "Email: roshan.ramesh@bcits.in"
echo "Password: Ticketing#321!"
echo ""

# ==========================================
# Additional Useful Commands
# ==========================================
echo "=================================================="
echo "ADDITIONAL USEFUL COMMANDS"
echo "=================================================="
echo ""

echo "Stop Application:"
echo "docker compose down"
echo ""

echo "Restart Application:"
echo "docker compose restart"
echo ""

echo "View Logs (follow):"
echo "docker compose logs -f ticketflow"
echo ""

echo "Check System Resources:"
echo "docker stats ticketflow-app"
echo ""

echo "Database Backup:"
echo "PGPASSWORD='Ticketing@123' pg_dump -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing > backup.sql"
echo ""

echo "Database Restore:"
echo "PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing < backup.sql"
echo ""

echo "Verify Sample Data:"
echo "PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -c 'SELECT COUNT(*) FROM schema_auth.table_users'"
echo ""

# ==========================================
# Troubleshooting Commands
# ==========================================
echo "=================================================="
echo "TROUBLESHOOTING COMMANDS"
echo "=================================================="
echo ""

echo "Test Database Connection:"
echo "PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -c 'SELECT 1'"
echo ""

echo "Check if Port 8080 is in Use:"
echo "sudo lsof -i :8080"
echo ""

echo "View Docker Images:"
echo "docker images | grep ticketing"
echo ""

echo "View All Containers (including stopped):"
echo "docker ps -a"
echo ""

echo "Remove All Containers:"
echo "docker compose down -v"
echo ""

echo "Clean Up Docker (removes unused images/volumes):"
echo "docker system prune -a -f"
echo ""

echo "View Docker Logs (all output):"
echo "docker compose logs --tail=100"
echo ""

# ==========================================
# Summary
# ==========================================
echo "=================================================="
echo "DEPLOYMENT SUMMARY"
echo "=================================================="
echo ""
echo "1. Run commands in STEP 1-9 in order"
echo "2. Total time: ~15-20 minutes"
echo "3. After deployment:"
echo "   - App URL: http://10.20.10.65:8080"
echo "   - Admin Email: roshan.ramesh@bcits.in"
echo "   - Admin Password: Ticketing#321!"
echo ""
echo "4. Verify in browser that you can:"
echo "   - Login successfully"
echo "   - See Dashboard with 4 tickets"
echo "   - See Knowledge Base with 4 articles"
echo "   - Access Admin Panel"
echo ""
echo "Ready to deploy? Start with STEP 1!"
echo ""
