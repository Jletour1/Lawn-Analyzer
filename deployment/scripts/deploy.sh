#!/bin/bash

# AWS Deployment Script for Lawn Analyzer
# This script automates the entire deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="lawn-analyzer-production"
REGION="us-east-1"
ECR_REPO="lawn-analyzer-api"

echo -e "${BLUE}🚀 Starting Lawn Analyzer AWS Deployment${NC}"
echo "=================================================="

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install it first.${NC}"
    exit 1
fi

# Check if logged into AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Not logged into AWS. Run 'aws configure' first.${NC}"
    exit 1
fi

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account ID: ${ACCOUNT_ID}${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found. Please create it from .env.production.example${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Step 1: Deploy Infrastructure
echo -e "\n${BLUE}🏗️ Step 1: Deploying AWS Infrastructure...${NC}"

# Check if stack exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
    echo -e "${YELLOW}📦 Stack exists, updating...${NC}"
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://aws-infrastructure.yml \
        --capabilities CAPABILITY_IAM \
        --region $REGION
else
    echo -e "${YELLOW}📦 Creating new stack...${NC}"
    read -p "Enter database password (min 8 chars): " -s DB_PASSWORD
    echo
    
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://aws-infrastructure.yml \
        --parameters \
            ParameterKey=Environment,ParameterValue=production \
            ParameterKey=DomainName,ParameterValue=lawnanalyzer.com \
            ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD \
        --capabilities CAPABILITY_IAM \
        --region $REGION
fi

# Wait for stack to complete
echo -e "${YELLOW}⏳ Waiting for infrastructure deployment...${NC}"
aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $REGION || \
aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region $REGION

echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"

# Get stack outputs
echo -e "\n${BLUE}📊 Getting infrastructure details...${NC}"
OUTPUTS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs')

# Extract important values
DB_ENDPOINT=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="DatabaseEndpoint") | .OutputValue')
S3_BUCKET=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="S3BucketName") | .OutputValue')
CLOUDFRONT_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="CloudFrontURL") | .OutputValue')
ALB_DNS=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="LoadBalancerDNS") | .OutputValue')

echo -e "${GREEN}✅ Database Endpoint: ${DB_ENDPOINT}${NC}"
echo -e "${GREEN}✅ S3 Bucket: ${S3_BUCKET}${NC}"
echo -e "${GREEN}✅ CloudFront URL: ${CLOUDFRONT_URL}${NC}"
echo -e "${GREEN}✅ Load Balancer: ${ALB_DNS}${NC}"

# Step 2: Create ECR Repository
echo -e "\n${BLUE}🐳 Step 2: Setting up Docker repository...${NC}"

# Create ECR repository if it doesn't exist
if ! aws ecr describe-repositories --repository-names $ECR_REPO --region $REGION &> /dev/null; then
    echo -e "${YELLOW}📦 Creating ECR repository...${NC}"
    aws ecr create-repository --repository-name $ECR_REPO --region $REGION
fi

# Get ECR login
echo -e "${YELLOW}🔐 Logging into ECR...${NC}"
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

echo -e "${GREEN}✅ ECR setup complete${NC}"

# Step 3: Build and Push Docker Image
echo -e "\n${BLUE}🔨 Step 3: Building and pushing Docker image...${NC}"

cd ../server

# Build Docker image
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
docker build -t $ECR_REPO .

# Tag for ECR
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO:latest"
docker tag $ECR_REPO:latest $ECR_URI

# Push to ECR
echo -e "${YELLOW}📤 Pushing to ECR...${NC}"
docker push $ECR_URI

echo -e "${GREEN}✅ Docker image pushed successfully${NC}"

cd ../deployment

# Step 4: Update ECS Service
echo -e "\n${BLUE}🚀 Step 4: Deploying application...${NC}"

# Force new deployment
echo -e "${YELLOW}🔄 Updating ECS service...${NC}"
aws ecs update-service \
    --cluster production-lawn-analyzer \
    --service production-lawn-analyzer-api \
    --force-new-deployment \
    --region $REGION

# Wait for deployment
echo -e "${YELLOW}⏳ Waiting for service deployment...${NC}"
aws ecs wait services-stable \
    --cluster production-lawn-analyzer \
    --services production-lawn-analyzer-api \
    --region $REGION

echo -e "${GREEN}✅ Application deployed successfully${NC}"

# Step 5: Run Database Migrations
echo -e "\n${BLUE}🗄️ Step 5: Setting up database...${NC}"

# This would typically be done via ECS task or CI/CD pipeline
echo -e "${YELLOW}📝 Database migrations need to be run manually:${NC}"
echo "1. Connect to your ECS task"
echo "2. Run: npx prisma migrate deploy"
echo "3. Run: npm run seed"

# Step 6: Build and Deploy Frontend
echo -e "\n${BLUE}🌐 Step 6: Deploying frontend...${NC}"

cd ..

# Update frontend environment variables
echo -e "${YELLOW}⚙️ Updating frontend configuration...${NC}"
cat > .env.production << EOF
VITE_API_BASE_URL=https://$ALB_DNS/api
VITE_S3_BUCKET=$S3_BUCKET
VITE_CLOUDFRONT_URL=$CLOUDFRONT_URL
VITE_AWS_REGION=$REGION
EOF

# Build frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build

# Deploy to S3
echo -e "${YELLOW}📤 Deploying to S3...${NC}"
aws s3 sync dist/ s3://$S3_BUCKET --delete --region $REGION

# Invalidate CloudFront cache
echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query 'DistributionList.Items[0].Id' --output text --region $REGION)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --region $REGION

echo -e "${GREEN}✅ Frontend deployed successfully${NC}"

# Step 7: Final Setup
echo -e "\n${BLUE}🎯 Step 7: Final configuration...${NC}"

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=================================================="
echo -e "${GREEN}🌐 Your application is now live at:${NC}"
echo -e "${BLUE}   Frontend: $CLOUDFRONT_URL${NC}"
echo -e "${BLUE}   API: https://$ALB_DNS${NC}"
echo -e "${BLUE}   Admin: $CLOUDFRONT_URL/admin${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Set up your domain DNS to point to: $ALB_DNS"
echo "2. Configure SSL certificate in AWS Certificate Manager"
echo "3. Update ALB listener to use HTTPS"
echo "4. Test the application thoroughly"
echo "5. Set up monitoring and alerts"
echo ""
echo -e "${YELLOW}🔐 Default Admin Credentials:${NC}"
echo "   Email: admin@lawnanalyzer.com"
echo "   Password: admin123"
echo "   (Change these immediately after first login!)"
echo ""
echo -e "${GREEN}🎉 Congratulations! Your Lawn Analyzer is now running on AWS!${NC}"