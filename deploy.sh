#!/bin/bash

# ==========================================
# TicketFlow Deployment Script
# ==========================================
# This script automates the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/application/ticketing_hub"
SECRETS_DIR="$APP_DIR/secrets"
BACKUP_DIR="$APP_DIR/backups"

# ==========================================
# Functions
# ==========================================

print_header() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# ==========================================
# Pre-flight Checks
# ==========================================

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root or with sudo"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker is installed"
    
    # Check Docker Compose
    if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose is installed"
    
    # Check PostgreSQL client
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client not found. Installing..."
        apt-get update && apt-get install -y postgresql-client
    fi
    print_success "PostgreSQL client is available"
}

# ==========================================
# Database Checks
# ==========================================

check_database() {
    print_header "Checking Database Connection"
    
    if PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -c "SELECT 1" > /dev/null 2>&1; then
        print_success "Database connection successful"
        return 0
    else
        print_error "Cannot connect to database at 10.20.10.65:5434"
        print_info "Ensure PostgreSQL is running and accessible"
        return 1
    fi
}

# ==========================================
# Setup Directories
# ==========================================

setup_directories() {
    print_header "Setting up Directories"
    
    # Create necessary directories
    mkdir -p $APP_DIR
    mkdir -p $SECRETS_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p $APP_DIR/logs
    
    # Set permissions
    chmod 755 $APP_DIR
    chmod 700 $SECRETS_DIR
    
    print_success "Directories created and configured"
}

# ==========================================
# Verify Secrets
# ==========================================

verify_secrets() {
    print_header "Verifying Secrets"
    
    if [ ! -f "$SECRETS_DIR/tickets-key.json" ]; then
        print_warning "Gmail service account key not found at $SECRETS_DIR/tickets-key.json"
        print_info "This is optional - email integration will not work without it"
        print_info "To add it later, copy your key file to: $SECRETS_DIR/tickets-key.json"
    else
        print_success "Gmail service account key found"
        chmod 600 $SECRETS_DIR/tickets-key.json
    fi
}

# ==========================================
# Build and Deploy
# ==========================================

build_application() {
    print_header "Building Application"
    
    cd $APP_DIR
    
    # Build Docker image
    print_info "Building Docker image... (this may take a few minutes)"
    docker compose build --no-cache
    
    print_success "Application built successfully"
}

start_application() {
    print_header "Starting Application"
    
    cd $APP_DIR
    
    # Start containers
    print_info "Starting containers..."
    docker compose up -d

    # Wait for application to start
    sleep 10

    # Check if container is running
    if docker compose ps | grep -q "ticketflow-app.*Up"; then
        print_success "Application started successfully"
    else
        print_error "Application failed to start"
        docker compose logs ticketflow
        exit 1
    fi
}

# ==========================================
# Health Checks
# ==========================================

health_check() {
    print_header "Performing Health Checks"
    
    # Check if application is responding
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8080/api/ping > /dev/null; then
            print_success "Application is responding"
            
            # Verify response
            response=$(curl -s http://localhost:8080/api/ping)
            print_success "Health check response: $response"
            return 0
        fi
        
        print_info "Waiting for application to start... ($attempt/$max_attempts)"
        sleep 1
        ((attempt++))
    done
    
    print_error "Application health check failed"
    return 1
}

# ==========================================
# Post-Deployment
# ==========================================

post_deployment() {
    print_header "Post-Deployment Configuration"
    
    print_success "Application deployed successfully!"
    print_info ""
    print_info "Access Information:"
    echo "  URL: http://10.20.10.65:8080"
    echo "  Username: roshan.ramesh@bcits.in"
    echo "  Password: Ticketing#321!"
    print_info ""
    print_info "Useful Commands:"
    echo "  View logs: docker compose -f $APP_DIR/docker-compose.yml logs -f"
    echo "  Stop app: docker compose -f $APP_DIR/docker-compose.yml down"
    echo "  Restart app: docker compose -f $APP_DIR/docker-compose.yml restart"
    echo "  Status: docker compose -f $APP_DIR/docker-compose.yml ps"
}

# ==========================================
# Cleanup
# ==========================================

cleanup() {
    print_header "Cleaning Up"
    
    cd $APP_DIR
    
    # Remove dangling images
    docker image prune -f > /dev/null 2>&1
    
    print_success "Cleanup completed"
}

# ==========================================
# Main Deployment Flow
# ==========================================

main() {
    print_header "TicketFlow Deployment Script"
    print_info "Starting deployment process..."
    
    # Pre-flight checks
    check_prerequisites
    
    # Check database
    if ! check_database; then
        print_error "Exiting due to database connection failure"
        exit 1
    fi
    
    # Setup
    setup_directories
    verify_secrets
    
    # Backup (if updating)
    if [ -f "$APP_DIR/.env" ]; then
        print_header "Creating Backup"
        cp $APP_DIR/.env "$BACKUP_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
        print_success "Backup created"
    fi
    
    # Build and deploy
    build_application
    start_application
    
    # Verify
    if health_check; then
        cleanup
        post_deployment
        print_success "Deployment completed successfully!"
        exit 0
    else
        print_error "Deployment completed with errors"
        print_info "Check logs: docker compose logs ticketflow"
        exit 1
    fi
}

# ==========================================
# Script Execution
# ==========================================

# Handle script interruption
trap 'print_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"
