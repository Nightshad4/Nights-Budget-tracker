# Deployment Guide for Budget Tracker

## 🚀 GitHub Pages Setup

### 1. Repository Setup
1. Create a new GitHub repository for your budget tracker
2. Push all the code to the `main` branch

### 2. Domain Configuration
Your domain `budget.night-technologies.com` is already configured in:
- `frontend/package.json` - homepage field
- `frontend/public/CNAME` - GitHub Pages custom domain
- `.github/workflows/deploy.yml` - GitHub Actions deployment

### 3. DNS Configuration
Point your domain to GitHub Pages by adding these DNS records:

#### For root domain (budget.night-technologies.com):
```
Type: A
Name: budget (or @)
Value: 185.199.108.153
```
```
Type: A
Name: budget (or @)  
Value: 185.199.109.153
```
```
Type: A
Name: budget (or @)
Value: 185.199.110.153
```
```
Type: A
Name: budget (or @)
Value: 185.199.111.153
```

#### Alternative CNAME (if using subdomain):
```
Type: CNAME
Name: budget
Value: your-github-username.github.io
```

### 4. GitHub Repository Settings
1. Go to your repository → Settings → Pages
2. Set source to "GitHub Actions"
3. Add custom domain: `budget.night-technologies.com`
4. Enable "Enforce HTTPS"

## 🖥️ Backend Deployment Options

### Option 1: Heroku (Recommended)

#### Steps:
1. Create a Heroku account and install Heroku CLI
2. Create a Heroku app:
```bash
heroku create your-budget-tracker-api
```

3. Add MongoDB Atlas:
```bash
heroku addons:create mongolab:sandbox
```

4. Set environment variables:
```bash
heroku config:set JWT_SECRET=your-super-secret-jwt-key
```

5. Create `Procfile` in backend directory:
```
web: uvicorn server:app --host=0.0.0.0 --port=${PORT:-8000}
```

6. Deploy:
```bash
git subtree push --prefix backend heroku main
```

7. Update frontend/.env with your Heroku URL:
```env
REACT_APP_BACKEND_URL=https://your-budget-tracker-api.herokuapp.com
```

### Option 2: Railway

1. Connect your GitHub repository to Railway
2. Deploy the backend folder
3. Add environment variables in Railway dashboard
4. Update frontend environment with Railway URL

### Option 3: DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build/run commands
3. Set environment variables
4. Update frontend environment

## 🔧 Environment Configuration

### Production Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://your-backend-url.herokuapp.com
```

### Production Backend (.env)
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/budget_tracker
DB_NAME=budget_tracker
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## 📋 Deployment Checklist

### Pre-deployment:
- [ ] Update backend URL in frontend/.env
- [ ] Test the application locally
- [ ] Ensure all environment variables are set
- [ ] Update CORS settings for production domain

### GitHub Pages:
- [ ] Repository created and code pushed
- [ ] GitHub Actions workflow is working
- [ ] Custom domain DNS is configured
- [ ] HTTPS is enabled

### Backend:
- [ ] Backend deployed to chosen platform
- [ ] Database connection is working
- [ ] Environment variables are set
- [ ] API endpoints are accessible

### Post-deployment:
- [ ] Test user registration and login
- [ ] Verify all features work correctly
- [ ] Check mobile responsiveness
- [ ] Test dark/light mode functionality

## 🔍 Troubleshooting

### Common Issues:

#### 1. CORS Errors
Update backend CORS settings to include your domain:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://budget.night-technologies.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 2. Build Failures
Check GitHub Actions logs for specific errors and ensure all dependencies are correct.

#### 3. Domain Not Working
Verify DNS propagation (can take up to 24 hours) and ensure GitHub Pages custom domain is set correctly.

#### 4. API Connection Issues
Verify the backend URL in frontend/.env matches your deployed backend URL exactly.

## 📞 Support

If you encounter any issues during deployment, check:
1. GitHub Actions logs
2. Browser developer console
3. Backend application logs
4. DNS propagation status

For additional help, create an issue in the repository or contact support.