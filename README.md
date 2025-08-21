# Lawn Analyzer - Complete AWS Deployment Guide

A comprehensive web application that provides users with intelligent lawn diagnostics and treatment recommendations. This guide will walk you through deploying the entire application on AWS from scratch.

## 🏠 Local Development Setup (Test Before Production)

Before deploying to AWS, you can run everything locally for testing and development.

### Quick Local Setup

#### 1. Prerequisites for Local Development
```bash
# Install required tools
- Node.js 18+ (https://nodejs.org/)
- Docker Desktop (https://www.docker.com/products/docker-desktop/)
- Git
```

#### 2. Clone and Install
```bash
# Clone the repository
git clone <your-repo-url>
cd lawn-analyzer

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

#### 3. Set Up Local Environment Variables

**Frontend (.env):**
```env
# Local Development Environment Variables
NODE_ENV=development
VITE_DEV_MODE=true

# Local API endpoint
VITE_API_BASE_URL=http://localhost:3001/api

# OpenAI API (Required for AI analysis)
VITE_OPENAI_API_KEY=sk-your-openai-key-here

# Reddit API (Optional - for data collection)
VITE_REDDIT_CLIENT_ID=your-reddit-client-id
VITE_REDDIT_CLIENT_SECRET=your-reddit-client-secret

# Local storage settings
VITE_USE_LOCAL_STORAGE=true
VITE_MOCK_ANALYSIS=false
```

**Backend (server/.env):**
```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Local PostgreSQL (via Docker)
DATABASE_URL=postgresql://lawnanalyzer:password123@localhost:5432/lawnanalyzer_dev

# Local Redis (via Docker)
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-local-jwt-secret-key-for-development-only
JWT_EXPIRES_IN=7d

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key-here

# Reddit Configuration (Optional)
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
REDDIT_USER_AGENT=lawn_analyzer_dev_v1.0

# Local file storage (images stored locally)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

#### 4. Start Local Services with Docker

**Create docker-compose.dev.yml:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: lawnanalyzer_dev
      POSTGRES_USER: lawnanalyzer
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

volumes:
  postgres_dev_data:
  redis_dev_data:
```

**Start the services:**
```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose -f docker-compose.dev.yml ps
```

#### 5. Set Up Local Database
```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Optional: Seed with sample data
npm run seed

# View database in browser (optional)
npx prisma studio
```

#### 6. Start Development Servers

**Terminal 1 - Backend API:**
```bash
cd server
npm run dev

# Should show:
# 🚀 Server running on port 3001
# 📊 Health check: http://localhost:3001/health
```

**Terminal 2 - Frontend:**
```bash
# From project root
npm run dev

# Should show:
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

#### 7. Test Local Setup

1. **Open browser to http://localhost:5173 (NOT https://)**
2. **Test user registration:**
   - Create a new account
   - Verify email/password login works

3. **Test lawn analysis:**
   - Upload a test lawn image
   - Fill out the form
   - Submit for analysis
   - Verify AI analysis works

4. **Test admin dashboard:**
   - Go to http://localhost:5173/admin
   - Login with admin credentials
   - Test data collection and analysis features

#### 8. Local Development Workflow

**Daily Development:**
```bash
# Start services (if not running)
docker-compose -f docker-compose.dev.yml up -d

# Start backend (Terminal 1)
cd server && npm run dev

# Start frontend (Terminal 2)
npm run dev

# Make your changes and test locally
```

**Database Management:**
```bash
# Reset database
cd server
npx prisma migrate reset

# Add new migration after schema changes
npx prisma migrate dev --name your-migration-name

# View data
npx prisma studio
```

**Debugging:**
```bash
# View backend logs
cd server && npm run dev

# View database logs
docker-compose -f docker-compose.dev.yml logs postgres

# View Redis logs
docker-compose -f docker-compose.dev.yml logs redis
```

### 🚀 Deploy to Production After Local Testing

Once everything works locally, follow the production deployment steps below:

1. **Test thoroughly locally first**
2. **Commit your changes to Git**
3. **Follow the AWS deployment guide**
4. **Update production environment variables**
5. **Deploy and test in production**

---

## 📋 Prerequisites

Before starting, you'll need:

1. **AWS Account** - [Create one here](https://aws.amazon.com/free/) if you don't have one
2. **Domain Name** (optional but recommended) - Purchase from AWS Route 53 or any registrar
3. **Computer with:**
   - Git installed
   - Node.js 18+ installed
   - AWS CLI installed
   - Docker installed (for local testing)

## 🎯 What We'll Deploy

By the end of this guide, you'll have:
- A production-ready web application running on AWS
- Secure user authentication and file uploads
- AI-powered lawn analysis using OpenAI
- Admin dashboard for managing the system
- Automatic scaling and backups
- Global CDN for fast image delivery

**Estimated Monthly Cost: $80-140** (can be lower with AWS Free Tier)

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Set Up Your Development Environment

#### 1.1 Install Required Tools

**Install AWS CLI:**
```bash
# On macOS
brew install awscli

# On Windows (using Chocolatey)
choco install awscli

# On Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Install Node.js:**
- Download from [nodejs.org](https://nodejs.org/) (choose LTS version)
- Verify installation: `node --version` (should show v18 or higher)

**Install Docker:**
- Download from [docker.com](https://www.docker.com/products/docker-desktop/)
- Verify installation: `docker --version`

#### 1.2 Configure AWS CLI

```bash
# Configure AWS credentials
aws configure

# You'll be prompted for:
# AWS Access Key ID: [Get from AWS Console > IAM > Users > Security credentials]
# AWS Secret Access Key: [Get from AWS Console > IAM > Users > Security credentials]
# Default region name: us-east-1 (recommended)
# Default output format: json
```

**To get AWS credentials:**
1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to IAM > Users
3. Click "Create user" if you don't have one
4. Attach policy: `AdministratorAccess` (for deployment)
5. Go to Security credentials tab
6. Click "Create access key" > "Command Line Interface (CLI)"
7. Copy the Access Key ID and Secret Access Key

### Step 2: Get API Keys

#### 2.1 OpenAI API Key (Required for AI Analysis)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. **Important:** Add billing information to your OpenAI account

#### 2.2 Reddit API Keys (Optional - for data collection)

1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Choose "script" type
4. Fill in name and description
5. Copy Client ID (under app name) and Client Secret

### Step 3: Clone and Prepare the Project

```bash
# Clone the repository
git clone <your-repo-url>
cd lawn-analyzer

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 4: Set Up Environment Variables

#### 4.1 Create Frontend Environment File

```bash
# Create frontend environment file
cp .env.example .env
```

Edit `.env` with your values:
```env
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com/api
# For testing: http://localhost:3001/api

# OpenAI Configuration (Required)
VITE_OPENAI_API_KEY=sk-your-openai-key-here

# Reddit Configuration (Optional)
VITE_REDDIT_CLIENT_ID=your-reddit-client-id
VITE_REDDIT_CLIENT_SECRET=your-reddit-client-secret

# AWS Configuration (Will be set after deployment)
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET=your-app-name-images
VITE_CLOUDFRONT_URL=https://your-cloudfront-url.cloudfront.net
```

#### 4.2 Create Backend Environment File

```bash
# Create backend environment file
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
# Server Configuration
NODE_ENV=production
PORT=3001

# Database (Will be set after AWS deployment)
DATABASE_URL=postgresql://username:password@your-db-endpoint:5432/lawnanalyzer

# Redis (Will be set after AWS deployment)
REDIS_URL=redis://your-redis-endpoint:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key-here

# Reddit Configuration (Optional)
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
REDDIT_USER_AGENT=lawn_analyzer_v1.0_by_/u/yourusername

# AWS Configuration (Will be set after deployment)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET=your-app-name-images
CLOUDFRONT_URL=https://your-cloudfront-url.cloudfront.net
```

### Step 5: Deploy AWS Infrastructure

#### 5.1 Create the CloudFormation Stack

```bash
# Navigate to deployment directory
cd deployment

# Deploy the infrastructure (replace values with yours)
aws cloudformation create-stack \
  --stack-name lawn-analyzer-production \
  --template-body file://aws-infrastructure.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=DomainName,ParameterValue=yourdomain.com \
    ParameterKey=DBPassword,ParameterValue=YourSecureDBPassword123! \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

**Wait for deployment to complete (15-20 minutes):**
```bash
# Check deployment status
aws cloudformation describe-stacks \
  --stack-name lawn-analyzer-production \
  --query 'Stacks[0].StackStatus'

# Wait until it shows "CREATE_COMPLETE"
```

#### 5.2 Get Infrastructure Information

```bash
# Get important endpoints and values
aws cloudformation describe-stacks \
  --stack-name lawn-analyzer-production \
  --query 'Stacks[0].Outputs'
```

**Save these values - you'll need them:**
- LoadBalancerDNS
- DatabaseEndpoint  
- S3BucketName
- CloudFrontURL

### Step 6: Set Up the Database

#### 6.1 Update Database Connection

Update your `server/.env` file with the database endpoint:
```env
DATABASE_URL=postgresql://lawnanalyzer:YourSecureDBPassword123!@your-db-endpoint.rds.amazonaws.com:5432/lawnanalyzer
```

#### 6.2 Run Database Migrations

```bash
# Navigate to server directory
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Optional: Seed the database with sample data
npm run seed
```

### Step 7: Build and Deploy the Application

#### 7.1 Create ECR Repository

```bash
# Create repository for Docker images
aws ecr create-repository \
  --repository-name lawn-analyzer-api \
  --region us-east-1
```

#### 7.2 Build and Push Docker Image

```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR-ACCOUNT-ID.dkr.ecr.us-east-1.amazonaws.com

# Build the Docker image
cd server
docker build -t lawn-analyzer-api .

# Tag the image
docker tag lawn-analyzer-api:latest YOUR-ACCOUNT-ID.dkr.ecr.us-east-1.amazonaws.com/lawn-analyzer-api:latest

# Push to ECR
docker push YOUR-ACCOUNT-ID.dkr.ecr.us-east-1.amazonaws.com/lawn-analyzer-api:latest
```

**To find your AWS Account ID:**
```bash
aws sts get-caller-identity --query Account --output text
```

#### 7.3 Update ECS Service

```bash
# Update the ECS service to use the new image
aws ecs update-service \
  --cluster production-lawn-analyzer \
  --service production-lawn-analyzer-api \
  --force-new-deployment
```

### Step 8: Deploy the Frontend

#### 8.1 Update Frontend Environment

Update your `.env` file with the actual AWS values:
```env
VITE_API_BASE_URL=https://your-load-balancer-dns.us-east-1.elb.amazonaws.com/api
VITE_S3_BUCKET=your-actual-s3-bucket-name
VITE_CLOUDFRONT_URL=https://your-actual-cloudfront-url.cloudfront.net
```

#### 8.2 Build and Deploy Frontend

```bash
# Build the frontend
npm run build

# Deploy to S3 (replace with your bucket name)
aws s3 sync dist/ s3://your-s3-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR-DISTRIBUTION-ID \
  --paths "/*"
```

**To find your CloudFront Distribution ID:**
```bash
aws cloudfront list-distributions \
  --query 'DistributionList.Items[0].Id' \
  --output text
```

### Step 9: Set Up Domain (Optional but Recommended)

#### 9.1 If you have a domain:

```bash
# Create hosted zone (if using Route 53)
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)

# Get name servers and update your domain registrar
aws route53 get-hosted-zone --id YOUR-HOSTED-ZONE-ID
```

#### 9.2 Create SSL Certificate

```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --domain-name www.yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

### Step 10: Test Your Deployment

#### 10.1 Test the API

```bash
# Test health endpoint
curl https://your-load-balancer-dns.us-east-1.elb.amazonaws.com/health

# Should return: {"status":"healthy","timestamp":"..."}
```

#### 10.2 Test the Frontend

1. Open your browser
2. Go to your CloudFront URL or domain
3. You should see the Lawn Analyzer homepage
4. Try creating an account and uploading a test image

### Step 11: Set Up Monitoring (Recommended)

#### 11.1 CloudWatch Alarms

```bash
# Create alarm for high error rate
aws cloudwatch put-metric-alarm \
  --alarm-name "LawnAnalyzer-HighErrorRate" \
  --alarm-description "High error rate detected" \
  --metric-name "HTTPCode_Target_5XX_Count" \
  --namespace "AWS/ApplicationELB" \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

#### 11.2 Set Up Log Monitoring

```bash
# View application logs
aws logs tail /ecs/production-lawn-analyzer --follow
```

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Database connection failed"

**Solution:**
```bash
# Check if database is running
aws rds describe-db-instances \
  --db-instance-identifier production-lawn-analyzer-db

# Check security groups allow connection
aws ec2 describe-security-groups \
  --group-names production-rds-sg
```

### Issue 2: "ECS task keeps stopping"

**Solution:**
```bash
# Check ECS service events
aws ecs describe-services \
  --cluster production-lawn-analyzer \
  --services production-lawn-analyzer-api

# Check task logs
aws logs get-log-events \
  --log-group-name /ecs/production-lawn-analyzer \
  --log-stream-name ecs/api/TASK-ID
```

### Issue 3: "Images not uploading"

**Solution:**
```bash
# Check S3 bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name

# Test S3 access
aws s3 ls s3://your-bucket-name
```

### Issue 4: "OpenAI API errors"

**Solution:**
1. Check your OpenAI API key is correct
2. Verify you have billing set up on OpenAI account
3. Check API usage limits

### Issue 5: "Frontend not loading"

**Solution:**
```bash
# Check CloudFront distribution status
aws cloudfront get-distribution --id YOUR-DISTRIBUTION-ID

# Check S3 bucket contents
aws s3 ls s3://your-bucket-name
```

---

## 🔒 Security Checklist

After deployment, ensure:

- [ ] Database is in private subnets
- [ ] Security groups only allow necessary traffic
- [ ] SSL certificates are properly configured
- [ ] API keys are stored securely (not in code)
- [ ] IAM roles follow least privilege principle
- [ ] CloudWatch logging is enabled
- [ ] Backup retention is configured

---

## 💰 Cost Management

### Monitor Your Costs

```bash
# Check current month's costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

### Cost Optimization Tips

1. **Use Fargate Spot** for non-critical workloads (50% savings)
2. **Set up S3 lifecycle policies** to delete old images
3. **Use CloudFront caching** to reduce origin requests
4. **Monitor and right-size** your RDS instance
5. **Set up billing alerts** to avoid surprises

---

## 🚀 Going Live Checklist

Before announcing your application:

- [ ] Test user registration and login
- [ ] Test image upload and analysis
- [ ] Test admin dashboard functionality
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Test error handling
- [ ] Performance test with multiple users
- [ ] Set up domain and SSL
- [ ] Create user documentation
- [ ] Plan for scaling

---

## 📞 Support and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Check CloudWatch logs for errors
- Monitor costs and usage
- Review security alerts

**Monthly:**
- Update dependencies
- Review and optimize costs
- Check backup integrity
- Update SSL certificates if needed

**Quarterly:**
- Security audit
- Performance optimization
- Capacity planning
- Disaster recovery testing

### Getting Help

If you run into issues:

1. **Check the logs first:**
   ```bash
   aws logs tail /ecs/production-lawn-analyzer --follow
   ```

2. **Check AWS Service Health:**
   - Visit [AWS Service Health Dashboard](https://status.aws.amazon.com/)

3. **Common AWS Support Resources:**
   - [AWS Documentation](https://docs.aws.amazon.com/)
   - [AWS Forums](https://forums.aws.amazon.com/)
   - [AWS Support](https://aws.amazon.com/support/) (paid plans available)

---

## 🎉 Congratulations!

You now have a production-ready Lawn Analyzer application running on AWS! Your users can:

- Create accounts and securely log in
- Upload lawn photos for AI analysis
- Receive professional treatment recommendations
- Access step-by-step treatment schedules

As an admin, you can:
- Manage users and submissions
- Collect data from Reddit
- Run AI analysis on collected data
- Manage diagnostic categories
- Monitor system performance

**Your application is now ready to serve users worldwide with enterprise-grade reliability and security!**

---

## 📈 Next Steps

Consider these enhancements:

1. **Mobile App** - React Native version
2. **Email Notifications** - AWS SES integration
3. **Payment System** - Stripe for premium features
4. **Advanced Analytics** - Custom dashboards
5. **Multi-language Support** - Internationalization
6. **API Rate Limiting** - Per-user quotas
7. **Advanced Monitoring** - Custom metrics and alerts

**Built with ❤️ for production deployment on AWS**

*Ready to scale and serve thousands of lawn care enthusiasts!*