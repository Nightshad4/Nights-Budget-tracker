# Budget Tracker 💰

A modern, comprehensive budget tracking application built with React and FastAPI.

![Budget Tracker](https://img.shields.io/badge/Status-Live-brightgreen)
![React](https://img.shields.io/badge/Frontend-React-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Live Demo

**Frontend**: [https://budget.night-technologies.com](https://budget.night-technologies.com)

## ✨ Features

### 💳 **Transaction Management**
- Add, edit, and delete income/expense transactions
- Real-time transaction filtering and search
- Category-based organization with custom icons and colors
- Recurring transaction support

### 📊 **Advanced Analytics**
- Interactive charts and graphs (Chart.js)
- Income vs expenses trend analysis
- Category spending breakdown with pie charts
- Flexible time periods (24 hours to 1 year)
- Monthly net income visualization

### 🎯 **Budget Planning**
- Set budgets for different categories
- Budget monitoring with alerts
- Goal setting and progress tracking
- Savings rate calculation

### ⚙️ **User Management**
- Secure JWT authentication
- User profile management
- Password change functionality
- Account export (JSON/CSV)
- Complete account deletion

### 🌙 **Modern UI/UX**
- Beautiful dark/light mode toggle
- Responsive design for all devices
- Glass-morphism effects and gradients
- Professional animations and transitions
- Accessible design with high contrast

### 🔒 **Security Features**
- Secure password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Input validation and sanitization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.8+ and pip
- MongoDB

### Frontend Setup
```bash
cd frontend
yarn install
yarn start
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python server.py
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Beautiful, responsive charts
- **React Context** - State management

### Backend
- **FastAPI** - High-performance Python web framework
- **MongoDB** - NoSQL database with Motor async driver
- **JWT** - Secure authentication
- **Pydantic** - Data validation and serialization

## 📱 Features Overview

### Dashboard
- Real-time financial overview
- Interactive charts and visualizations
- Recent transactions display
- Category spending breakdown

### Transactions
- CRUD operations for all transactions
- Advanced filtering and search
- Category assignment with visual indicators
- Bulk operations support

### Categories
- Custom category creation with icons and colors
- Separate income/expense categorization
- 40+ predefined icons and professional color palette

### Settings
- Profile management
- Security settings
- Theme preferences
- Currency selection
- Export functionality

## 🌐 Deployment

### GitHub Pages (Frontend)
The frontend is automatically deployed to GitHub Pages using GitHub Actions.

**Live URL**: [https://budget.night-technologies.com](https://budget.night-technologies.com)

### Backend Deployment Options
The backend can be deployed to:
- **Heroku** (Recommended)
- **Railway**
- **DigitalOcean App Platform**
- **AWS/GCP/Azure**

## 📊 API Documentation

The FastAPI backend provides comprehensive API documentation:
- **Swagger UI**: Available at `/docs` endpoint
- **ReDoc**: Available at `/redoc` endpoint

### Key Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/categories` - User categories

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://your-backend-url.herokuapp.com
```

#### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=budget_tracker
JWT_SECRET=your-secret-key
```

## 📈 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: Optimized with code splitting
- **Database**: Indexed queries for fast response times
- **Caching**: Smart data caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chart.js** for beautiful data visualizations
- **Tailwind CSS** for the utility-first CSS framework
- **FastAPI** for the excellent Python web framework
- **MongoDB** for the flexible NoSQL database

## 📞 Support

For support, email support@night-technologies.com or create an issue on GitHub.

---

Built with ❤️ by **Night Technologies**