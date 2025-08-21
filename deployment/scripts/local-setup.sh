#!/bin/bash

# Local Development Setup Script
# This script sets up everything needed for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏠 Setting up Lawn Analyzer for Local Development${NC}"
echo "=================================================="

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Current version: $(node --version)${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker Desktop first.${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Step 1: Install Dependencies
echo -e "\n${BLUE}📦 Step 1: Installing dependencies...${NC}"

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd server
npm install
cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 2: Set up Environment Files
echo -e "\n${BLUE}⚙️ Step 2: Setting up environment files...${NC}"

# Create frontend .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}📝 Creating frontend .env.local...${NC}"
    cp .env.local.example .env.local
    echo -e "${YELLOW}⚠️ Please edit .env.local and add your OpenAI API key${NC}"
fi

# Create backend .env.local if it doesn't exist
if [ ! -f "server/.env.local" ]; then
    echo -e "${YELLOW}📝 Creating backend .env.local...${NC}"
    cp server/.env.local.example server/.env.local
    echo -e "${YELLOW}⚠️ Please edit server/.env.local and add your API keys${NC}"
fi

echo -e "${GREEN}✅ Environment files created${NC}"

# Step 3: Start Docker Services
echo -e "\n${BLUE}🐳 Step 3: Starting Docker services...${NC}"

# Start PostgreSQL and Redis
echo -e "${YELLOW}🚀 Starting PostgreSQL and Redis...${NC}"
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Check if services are running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker services started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start Docker services${NC}"
    docker-compose -f docker-compose.dev.yml logs
    exit 1
fi

# Step 4: Set up Database
echo -e "\n${BLUE}🗄️ Step 4: Setting up database...${NC}"

cd server

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${YELLOW}📊 Running database migrations...${NC}"
npx prisma migrate dev --name init

# Seed database with sample data
echo -e "${YELLOW}🌱 Seeding database...${NC}"
npm run seed

echo -e "${GREEN}✅ Database setup complete${NC}"

cd ..

# Step 5: Test the Setup
echo -e "\n${BLUE}🧪 Step 5: Testing the setup...${NC}"

# Test database connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
cd server
if npx prisma db push --accept-data-loss &> /dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi
cd ..

# Test Redis connection
echo -e "${YELLOW}🔍 Testing Redis connection...${NC}"
if docker exec $(docker-compose -f docker-compose.dev.yml ps -q redis) redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✅ Redis connection successful${NC}"
else
    echo -e "${RED}❌ Redis connection failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Setup testing complete${NC}"

# Final Instructions
echo -e "\n${GREEN}🎉 Local Development Setup Complete!${NC}"
echo "=================================================="
echo -e "${BLUE}🚀 To start development:${NC}"
echo ""
echo -e "${YELLOW}Terminal 1 (Backend):${NC}"
echo "   cd server"
echo "   npm run dev"
echo ""
echo -e "${YELLOW}Terminal 2 (Frontend):${NC}"
echo "   npm run dev"
echo ""
echo -e "${BLUE}📱 Access your application:${NC}"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3001"
echo "   Database Admin: http://localhost:8080"
echo "   Prisma Studio: cd server && npm run studio"
echo ""
echo -e "${BLUE}👤 Default Accounts:${NC}"
echo "   Admin: Jletz14 / Fanduel01"
echo ""
echo -e "${YELLOW}⚠️ Important:${NC}"
echo "1. Add your OpenAI API key to .env.local"
echo "2. Add your Reddit API keys to server/.env.local (optional)"
echo "3. Test everything locally before deploying to AWS"
echo ""
echo -e "${GREEN}Happy coding! 🌿${NC}"