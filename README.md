# Lawn Analyzer - Production AWS Deployment

A comprehensive web application that provides users with intelligent lawn diagnostics and treatment recommendations. Now migrated from localStorage to a full AWS server architecture with PostgreSQL, Redis, S3, and CloudFront.

## 🏗️ Architecture Overview

### Frontend (React + TypeScript)
- **Hosting**: AWS S3 + CloudFront CDN
- **Authentication**: JWT-based with React Context
- **API Communication**: RESTful API client with caching
- **Image Upload**: Direct to S3 via signed URLs

### Backend (Node.js + Express)
- **Hosting**: AWS ECS Fargate
- **Database**: PostgreSQL on AWS RDS
- **Cache**: Redis on AWS ElastiCache
- **File Storage**: AWS S3 with CloudFront CDN
- **Load Balancer**: AWS Application Load Balancer

### Infrastructure
- **Container Orchestration**: AWS ECS with Fargate
- **Database**: AWS RDS PostgreSQL with automated backups
- **Caching**: AWS ElastiCache Redis
- **CDN**: AWS CloudFront for global content delivery
- **Security**: VPC, Security Groups, IAM roles
- **Monitoring**: CloudWatch logs and metrics

## 🚀 Deployment Guide

### Prerequisites
- AWS CLI configured with appropriate permissions
- Docker installed for local development
- Node.js 18+ for local development
- Domain name registered (optional but recommended)

### 1. Infrastructure Deployment

Deploy the AWS infrastructure using CloudFormation:

```bash
# Deploy the infrastructure
aws cloudformation create-stack \
  --stack-name lawn-analyzer-infrastructure \
  --template-body file://deployment/aws-infrastructure.yml \
  --parameters ParameterKey=Environment,ParameterValue=production \
               ParameterKey=DomainName,ParameterValue=lawnanalyzer.com \
               ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_IAM
```

### 2. Database Setup

Run database migrations:

```bash
cd server
npm install
npx prisma migrate deploy
npx prisma generate
```

### 3. Container Deployment

Build and push the Docker container:

```bash
# Build the container
cd server
docker build -t lawn-analyzer-api .

# Tag and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker tag lawn-analyzer-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/lawn-analyzer-api:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/lawn-analyzer-api:latest
```

### 4. Frontend Deployment

Build and deploy the frontend:

```bash
# Build the frontend
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-frontend-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🔧 Local Development

### Backend Development

```bash
cd server
npm install

# Set up local database
docker-compose up -d postgres redis

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Frontend Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API endpoints

# Start development server
npm run dev
```

## 🔑 Environment Configuration

### Frontend (.env)
```env
VITE_API_BASE_URL=https://api.lawnanalyzer.com/api
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET=lawnanalyzer-images
VITE_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

### Backend (.env)
```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@localhost:5432/lawnanalyzer
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_api_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET=lawnanalyzer-images
```

## 🎯 Key Features

### User Features
- **User Authentication**: Secure JWT-based authentication
- **Image Upload**: Direct S3 upload with progress tracking
- **AI Analysis**: GPT-4o Vision analysis with confidence scoring
- **Treatment Plans**: Step-by-step treatment schedules
- **Similar Cases**: Database-driven similarity matching

### Admin Features
- **User Management**: View and manage user accounts
- **Data Collection**: Automated Reddit data collection
- **AI Analysis**: Batch processing of collected data
- **Root Cause Management**: Dynamic category system
- **Category Suggestions**: AI-suggested new categories
- **Analytics Dashboard**: Usage statistics and insights

### Technical Features
- **Scalable Architecture**: ECS Fargate auto-scaling
- **Global CDN**: CloudFront for fast image delivery
- **Caching**: Redis for improved performance
- **Security**: VPC, security groups, encrypted storage
- **Monitoring**: CloudWatch logs and metrics
- **Backup**: Automated RDS backups

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM:

- **Users**: Authentication and user management
- **Submissions**: User lawn analysis requests
- **RootCauses**: Diagnostic categories and treatments
- **TreatmentSchedules**: Step-by-step treatment plans
- **CategorySuggestions**: AI-suggested new categories
- **RedditPosts/Comments**: Collected community data
- **LearningPatterns**: AI learning and improvement data

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **State Management**: React Context + Hooks

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT
- **File Upload**: Multer + AWS S3
- **AI**: OpenAI GPT-4o Vision API

### Infrastructure
- **Cloud Provider**: AWS
- **Container**: Docker + ECS Fargate
- **Database**: AWS RDS PostgreSQL
- **Cache**: AWS ElastiCache Redis
- **Storage**: AWS S3 + CloudFront CDN
- **Load Balancer**: AWS Application Load Balancer
- **DNS**: AWS Route 53 (optional)

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Submissions
- `POST /api/submissions` - Submit lawn analysis
- `GET /api/submissions` - Get user submissions
- `GET /api/submissions/:id` - Get specific submission

### Admin
- `GET /api/admin/submissions` - Get all submissions
- `PUT /api/admin/submissions/:id` - Update submission
- `POST /api/admin/reddit/collect` - Trigger Reddit collection
- `POST /api/admin/analysis/run` - Trigger AI analysis
- `GET /api/admin/stats` - Get dashboard statistics

### Root Causes & Treatments
- `GET /api/root-causes` - Get all root causes
- `POST /api/root-causes` - Create root cause
- `PUT /api/root-causes/:id` - Update root cause
- `GET /api/treatment-schedules` - Get treatment schedules
- `POST /api/treatment-schedules` - Create treatment schedule

## 📈 Monitoring & Maintenance

### Health Checks
- Application: `GET /health`
- Database connectivity
- Redis connectivity
- S3 access verification

### Logging
- Application logs via CloudWatch
- Access logs via ALB
- Database logs via RDS
- Error tracking and alerting

### Backup Strategy
- **Database**: Automated RDS backups (7-day retention)
- **Images**: S3 versioning enabled
- **Code**: Git repository with CI/CD

### Scaling
- **Horizontal**: ECS service auto-scaling
- **Database**: RDS read replicas for read-heavy workloads
- **Cache**: ElastiCache cluster mode for high availability
- **CDN**: CloudFront global edge locations

## 🔒 Security Features

- **Authentication**: JWT with secure HTTP-only cookies
- **Authorization**: Role-based access control
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Request sanitization and validation
- **HTTPS**: SSL/TLS encryption for all traffic
- **VPC**: Private network isolation
- **Security Groups**: Firewall rules
- **IAM**: Least privilege access policies
- **Encryption**: At-rest and in-transit encryption

## 💰 Cost Optimization

### AWS Services Cost Estimates (Monthly)
- **ECS Fargate**: ~$15-30 (1 task, 0.25 vCPU, 0.5 GB RAM)
- **RDS PostgreSQL**: ~$15-25 (db.t3.micro)
- **ElastiCache Redis**: ~$15-20 (cache.t3.micro)
- **S3 Storage**: ~$5-15 (depending on image volume)
- **CloudFront**: ~$5-10 (depending on traffic)
- **ALB**: ~$20-25 (fixed cost)
- **Data Transfer**: ~$5-15 (depending on usage)

**Total Estimated Cost**: $80-140/month for production workload

### Cost Optimization Strategies
- Use Fargate Spot for non-critical workloads
- Implement S3 lifecycle policies for old images
- Use CloudFront caching to reduce origin requests
- Monitor and right-size resources based on usage
- Consider Reserved Instances for predictable workloads

## 🚀 Future Enhancements

- **Mobile App**: React Native mobile application
- **Real-time Notifications**: WebSocket-based updates
- **Advanced Analytics**: Machine learning insights
- **Multi-region Deployment**: Global availability
- **API Rate Limiting**: Per-user quotas
- **Payment Integration**: Stripe for premium features
- **Email Notifications**: SES for user communications
- **Advanced Monitoring**: Custom CloudWatch dashboards

---

**Built with ❤️ for production deployment on AWS**

*Ready for scale with enterprise-grade architecture and security*
```

## 🆘 Troubleshooting

### Common Issues
1. **Database Connection**: Check VPC security groups and RDS endpoint
2. **Image Upload Fails**: Verify S3 bucket permissions and CORS settings
3. **Authentication Issues**: Check JWT secret and token expiration
4. **API Timeouts**: Review ECS task resources and ALB timeout settings

### Debug Commands
```bash
# Check ECS service status
aws ecs describe-services --cluster production-lawn-analyzer --services production-lawn-analyzer-api

# View application logs
aws logs tail /ecs/production-lawn-analyzer --follow

# Check database connectivity
psql -h your-db-endpoint.rds.amazonaws.com -U lawnanalyzer -d lawnanalyzer

# Test Redis connection
redis-cli -h your-redis-endpoint.cache.amazonaws.com
```

For additional support, check the CloudWatch logs and AWS service health dashboards.


### Common Issues

1. **"OpenAI API error"**: Check API key and billing status
2. **"Reddit authentication failed"**: Verify client ID/secret
3. **"Analysis failed"**: Will fallback to mock analysis automatically
4. **Images not loading**: Check base64 data format

### Debug Mode
Open browser console to see detailed logs of:
- API requests and responses
- Data storage operations  
- Analysis results and confidence scores
- Collection progress and errors

---

**Built with ❤️ for lawn care enthusiasts and professionals using real AI and community data.**

*Production-ready with real APIs and local development support!*