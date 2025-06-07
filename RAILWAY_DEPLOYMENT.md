# Railway Deployment Guide - Full-Stack Hosting

## 🚀 Deploy Complete App to Railway (Like Current Environment)

Railway provides container-based hosting similar to your current development environment and can host your entire application with custom domain support.

### ✅ What Railway Provides:
- Full-stack application hosting
- Built-in database (MongoDB/PostgreSQL)
- Custom domain support (`budget.night-technologies.com`)
- Container-based deployment (like current environment)
- Automatic deployments from GitHub
- Free tier available

## 📋 Step-by-Step Railway Deployment

### 1. Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub account
3. Install Railway CLI: `npm install -g @railway/cli`

### 2. Deploy Your Application
```bash
# Login to Railway
railway login

# Create new project
railway init

# Deploy entire application
railway up
```

### 3. Configure Custom Domain
1. Go to Railway dashboard
2. Select your frontend service
3. Go to Settings → Domains
4. Add: `budget.night-technologies.com`
5. Configure DNS (Railway will provide instructions)

### 4. Set Environment Variables
In Railway dashboard:
- `JWT_SECRET`: Your secret key
- `DB_NAME`: budget_tracker
- Frontend will automatically use backend URL

## 🔧 Alternative: Docker Compose Deployment

For platforms that support Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://backend:8000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=budget_tracker
      - JWT_SECRET=your-secret-key
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

Deploy with: `docker-compose up -d`

## 🌐 Other Full-Stack Hosting Options

### 1. **Render**
- Similar to Railway
- Free tier available
- Custom domains
- Auto-deploy from GitHub

### 2. **DigitalOcean App Platform**
- Container-based hosting
- Managed databases
- Custom domains

### 3. **Fly.io**
- Docker-based deployment
- Global deployment
- Custom domains

## 💰 Cost Comparison

| Platform | Free Tier | Custom Domain | Database | Monthly Cost |
|----------|-----------|---------------|----------|--------------|
| Railway | ✅ Limited | ✅ Free | ✅ Included | $0-5 |
| Render | ✅ Limited | ✅ Free | ✅ Included | $0-7 |
| Heroku | ❌ Discontinued | ✅ Free | ❌ Paid addon | $7+ |
| DigitalOcean | ❌ No free tier | ✅ Free | ✅ Included | $12+ |

## 🎯 Recommended: Railway Deployment

Since you want hosting similar to the current environment, Railway is perfect:

```bash
# Quick deploy commands
git clone your-repo
cd budget-tracker
railway login
railway init
railway up
```

Then configure your domain `budget.night-technologies.com` in the Railway dashboard.

## 📞 Need Help?

If you prefer the Railway approach, I can provide more detailed configuration for your specific setup!