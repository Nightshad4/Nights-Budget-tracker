import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

// Auth Context
const AuthContext = createContext();
const ThemeContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// API configuration
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Helper functions
const convertToCSV = (data) => {
  if (!data || !data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
};

// API functions
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    console.log('Making API request:', {
      method: options.method || 'GET',
      url: `${API_BASE_URL}/api${endpoint}`,
      headers: headers
    });

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers,
    });

    console.log('API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API error response:', error);
      throw new Error(error || 'Request failed');
    }

    // Handle empty responses (like DELETE requests)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      console.log('API JSON response:', result);
      return result;
    } else {
      // For non-JSON responses (like DELETE), try to get text or return empty object
      const text = await response.text();
      console.log('API text response:', text);
      return text ? JSON.parse(text) : { success: true };
    }
  },

  // Auth
  login: (credentials) => api.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  register: (userData) => api.request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  getProfile: () => api.request('/auth/me'),

  // Categories
  getCategories: () => api.request('/categories'),
  createCategory: (category) => api.request('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  }),
  deleteCategory: (id) => api.request(`/categories/${id}`, {
    method: 'DELETE',
  }),

  // Transactions
  getTransactions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.request(`/transactions${queryString ? `?${queryString}` : ''}`);
  },
  
  createTransaction: (transaction) => api.request('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  }),

  updateTransaction: (id, transaction) => api.request(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(transaction),
  }),

  deleteTransaction: (id) => api.request(`/transactions/${id}`, {
    method: 'DELETE',
  }),

  // Budgets
  getBudgets: () => api.request('/budgets'),
  createBudget: (budget) => api.request('/budgets', {
    method: 'POST',
    body: JSON.stringify(budget),
  }),
  deleteBudget: (id) => api.request(`/budgets/${id}`, {
    method: 'DELETE',
  }),

  // Goals
  getGoals: () => api.request('/goals'),
  createGoal: (goal) => api.request('/goals', {
    method: 'POST',
    body: JSON.stringify(goal),
  }),
  updateGoalProgress: (id, amount) => api.request(`/goals/${id}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ amount }),
  }),
  deleteGoal: (id) => api.request(`/goals/${id}`, {
    method: 'DELETE',
  }),

  // Analytics
  getDashboard: (period = 'month') => api.request(`/analytics/dashboard?period=${period}`),
  getSpendingTrend: (period = '6months') => api.request(`/analytics/spending-trend?period=${period}`),

  // Settings
  getSettings: () => api.request('/settings'),
  updateSettings: (settings) => api.request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
  changePassword: (passwordData) => api.request('/settings/change-password', {
    method: 'POST',
    body: JSON.stringify(passwordData),
  }),
  forgotPassword: (email) => api.request('/settings/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  deleteAccount: () => api.request('/settings/delete-account', {
    method: 'DELETE',
  }),

  // Export
  exportData: async (format = 'json') => {
    const [transactions, categories, budgets, goals] = await Promise.all([
      api.request('/transactions?limit=1000'),
      api.request('/categories'),
      api.request('/budgets'),
      api.request('/goals')
    ]);
    
    const exportData = {
      exported_at: new Date().toISOString(),
      transactions,
      categories,
      budgets,
      goals
    };

    if (format === 'csv') {
      return {
        transactions: convertToCSV(transactions),
        categories: convertToCSV(categories),
        budgets: convertToCSV(budgets),
        goals: convertToCSV(goals)
      };
    }
    
    return exportData;
  },
};

// Theme Provider Component
const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    isDarkMode,
    toggleDarkMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getProfile()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const response = await api.login(credentials);
    localStorage.setItem('token', response.access_token);
    setUser(response.user);
    return response;
  };

  const register = async (userData) => {
    const response = await api.register(userData);
    localStorage.setItem('token', response.access_token);
    setUser(response.user);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Login Component
const LoginForm = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ email, password });
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 dark:border-gray-700/50">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">B</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to your budget tracker</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white backdrop-blur-sm"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white backdrop-blur-sm"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Don't have an account?{' '}
            <button
              onClick={onToggle}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Register Component
const RegisterForm = ({ onToggle }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 dark:border-gray-700/50">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">B</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Start tracking your budget today</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white backdrop-blur-sm"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white backdrop-blur-sm"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white backdrop-blur-sm"
              placeholder="Create a password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white backdrop-blur-sm"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
            <button
              onClick={onToggle}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold transition"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Enhanced Dashboard Component
const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [spendingTrend, setSpendingTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { isDarkMode } = useTheme();

  useEffect(() => {
    Promise.all([
      api.getDashboard(selectedPeriod),
      api.getSpendingTrend(selectedPeriod)
    ]).then(([dashboard, trend]) => {
      setDashboardData(dashboard);
      setSpendingTrend(trend);
    }).catch(console.error).finally(() => setLoading(false));
  }, [selectedPeriod]);

  const periodOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'This Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: 'year', label: 'Last Year' },
  ];

  const handleExport = async (format) => {
    try {
      setLoading(true);
      const data = await api.exportData(format);
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // CSV export with multiple files
        const files = [
          { name: 'transactions', data: data.transactions },
          { name: 'categories', data: data.categories },
          { name: 'budgets', data: data.budgets },
          { name: 'goals', data: data.goals }
        ];
        
        files.forEach(file => {
          const blob = new Blob([file.data], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${file.name}-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load dashboard data</p>
      </div>
    );
  }

  // Prepare chart data
  const pieChartData = {
    labels: dashboardData.category_spending.map(cat => cat.category),
    datasets: [
      {
        data: dashboardData.category_spending.map(cat => cat.amount),
        backgroundColor: dashboardData.category_spending.map(cat => cat.color),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const lineChartData = {
    labels: spendingTrend.map(item => item.period),
    datasets: [
      {
        label: 'Income',
        data: spendingTrend.map(item => item.income),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Expenses',
        data: spendingTrend.map(item => item.expenses),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const barChartData = {
    labels: spendingTrend.map(item => item.period),
    datasets: [
      {
        label: 'Net Income',
        data: spendingTrend.map(item => item.net),
        backgroundColor: spendingTrend.map(item => 
          item.net >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: spendingTrend.map(item => 
          item.net >= 0 ? '#10B981' : '#EF4444'
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Complete overview of your finances for {dashboardData.period}</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button
            onClick={() => handleExport('json')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
          >
            <span>📄</span>
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
          >
            <span>📊</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Income</p>
              <p className="text-2xl font-bold">${dashboardData.total_income.toFixed(2)}</p>
              <p className="text-green-100 text-xs mt-1">This month</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold">${dashboardData.total_expenses.toFixed(2)}</p>
              <p className="text-red-100 text-xs mt-1">This month</p>
            </div>
            <div className="text-3xl">💸</div>
          </div>
        </div>

        <div className={`bg-gradient-to-r ${dashboardData.balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-xl p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Net Balance</p>
              <p className="text-2xl font-bold">${dashboardData.balance.toFixed(2)}</p>
              <p className="text-blue-100 text-xs mt-1">Income - Expenses</p>
            </div>
            <div className="text-3xl">{dashboardData.balance >= 0 ? '📈' : '📉'}</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Savings Rate</p>
              <p className="text-2xl font-bold">
                {dashboardData.total_income > 0 ? 
                  ((dashboardData.balance / dashboardData.total_income) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-purple-100 text-xs mt-1">Of total income</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Income vs Expenses Trend - {periodOptions.find(p => p.value === selectedPeriod)?.label}
          </h3>
          <div className="h-80">
            <Line data={lineChartData} options={{...chartOptions, plugins: {...chartOptions.plugins, legend: {...chartOptions.plugins.legend, labels: {color: isDarkMode ? '#ffffff' : '#000000'}}}}} />
          </div>
        </div>

        {/* Expense Categories Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Expense Breakdown by Category</h3>
          <div className="h-80">
            {dashboardData.category_spending.length > 0 ? (
              <Pie data={pieChartData} options={{...pieChartOptions, plugins: {...pieChartOptions.plugins, legend: {...pieChartOptions.plugins.legend, labels: {color: isDarkMode ? '#ffffff' : '#000000'}}}}} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <p className="text-xl">📊</p>
                  <p>No expense data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Net Income Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Net Income Trend - {periodOptions.find(p => p.value === selectedPeriod)?.label}
        </h3>
        <div className="h-80">
          <Bar data={barChartData} options={{...chartOptions, plugins: {...chartOptions.plugins, legend: {...chartOptions.plugins.legend, labels: {color: isDarkMode ? '#ffffff' : '#000000'}}}}} />
        </div>
      </div>

      {/* Recent Transactions and Category Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{dashboardData.recent_transactions.length} latest</span>
          </div>
          {dashboardData.recent_transactions.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recent_transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{transaction.category_icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">💳</div>
              <p>No transactions yet</p>
              <p className="text-sm">Add your first transaction to get started!</p>
            </div>
          )}
        </div>

        {/* Category Spending List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Category Spending</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">This period</span>
          </div>
          {dashboardData.category_spending.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.category_spending
                .sort((a, b) => b.amount - a.amount)
                .map((category, index) => {
                  const percentage = ((category.amount / dashboardData.total_expenses) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-gray-900 dark:text-white">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900 dark:text-white">${category.amount.toFixed(2)}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📊</div>
              <p>No spending data</p>
              <p className="text-sm">Add some expenses to see the breakdown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Transactions Component
const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const { isDarkMode } = useTheme();

  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    Promise.all([
      api.getTransactions(),
      api.getCategories()
    ]).then(([transactionsData, categoriesData]) => {
      setTransactions(transactionsData);
      setCategories(categoriesData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
    };

    try {
      if (editingTransaction) {
        const updated = await api.updateTransaction(editingTransaction.id, transactionData);
        setTransactions(transactions.map(t => t.id === editingTransaction.id ? updated : t));
      } else {
        const newTransaction = await api.createTransaction(transactionData);
        setTransactions([newTransaction, ...transactions]);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'expense',
      category_id: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowAddForm(false);
    setEditingTransaction(null);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount.toString(),
      type: transaction.type,
      category_id: transaction.category_id,
      description: transaction.description,
      date: new Date(transaction.date).toISOString().split('T')[0],
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    console.log('Delete button clicked for transaction ID:', id);
    console.log('Transaction object:', transactions.find(t => t.id === id));
    
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        console.log('Attempting to delete transaction with ID:', id);
        console.log('Making DELETE request to:', `${process.env.REACT_APP_BACKEND_URL}/api/transactions/${id}`);
        
        const response = await api.deleteTransaction(id);
        console.log('Delete response:', response);
        
        setTransactions(transactions.filter(t => t.id !== id));
        console.log('Transaction deleted successfully from frontend state');
        alert('Transaction deleted successfully!');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          response: error.response
        });
        alert(`Error deleting transaction: ${error.message}`);
      }
    } else {
      console.log('Delete cancelled by user');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : '💰';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          Add Transaction
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select Category</option>
                {categories
                  .filter(cat => cat.type === formData.type)
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Transaction description"
              />
            </div>

            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                {editingTransaction ? 'Update' : 'Add'} Transaction
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
        
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getCategoryIcon(transaction.category_id)}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getCategoryName(transaction.category_id)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-blue-600 hover:text-blue-700 text-sm px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions yet. Add your first transaction!</p>
        )}
      </div>
    </div>
  );
};

// Categories Component
const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#3B82F6',
    icon: '💰',
  });

  const predefinedIcons = [
    // Income icons
    '💰', '💸', '💵', '💴', '💶', '💷', '🏦', '💳', '🎯', '📈', 
    '💼', '👔', '🏢', '💎', '🏆', '🎁', '📊', '💹', '🪙', '💱',
    // Expense icons  
    '🍕', '🍔', '🥗', '☕', '🍺', '🛒', '🛍️', '👕', '👟', '🎬',
    '🎮', '📱', '💻', '🚗', '⛽', '🚌', '✈️', '🏠', '⚡', '💧',
    '📺', '🎵', '🏥', '💊', '📚', '✏️', '🎓', '🏃', '🎾', '🎸',
    '🎨', '📷', '🍎', '🥤', '🧴', '🔧', '🎂', '💐', '🎪', '🎭'
  ];
  
  const predefinedColors = [
    // Professional palette
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', 
    '#6B7280', '#14B8A6', '#F97316', '#84CC16', '#06B6D4', '#8B5A2B',
    // Additional vibrant colors
    '#DC2626', '#059669', '#7C3AED', '#DB2777', '#0891B2', '#65A30D',
    '#EA580C', '#CA8A04', '#9333EA', '#C2410C', '#0D9488', '#4338CA',
    // Pastel colors
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981',
    '#3B82F6', '#6B7280', '#14B8A6', '#84CC16', '#F97316', '#06B6D4'
  ];

  useEffect(() => {
    api.getCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newCategory = await api.createCategory(formData);
      setCategories([...categories, newCategory]);
      resetForm();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      color: '#3B82F6',
      icon: '💰',
    });
    setShowAddForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all associated transactions.')) {
      try {
        await api.deleteCategory(id);
        setCategories(categories.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          Add Category
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Category name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {predefinedIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({...formData, icon})}
                    className={`p-2 text-xl border rounded-lg hover:bg-gray-100 ${formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="grid grid-cols-4 gap-2">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, color})}
                    className={`w-8 h-8 rounded-lg border-2 ${formData.color === color ? 'border-gray-900' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                Add Category
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Income Categories */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-green-600">Income Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incomeCategories.map(category => (
            <div key={category.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-sm text-gray-500 capitalize">{category.type}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(category.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Expense Categories */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">Expense Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseCategories.map(category => (
            <div key={category.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-sm text-gray-500 capitalize">{category.type}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(category.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Settings Component
const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('profile');
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [resetEmail, setResetEmail] = useState('');
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { logout } = useAuth();

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSettingsUpdate = async (updateData) => {
    try {
      await api.updateSettings(updateData);
      const updatedSettings = await api.getSettings();
      setSettings(updatedSettings);
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error updating settings. Please try again.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      alert('New password must be at least 8 characters long');
      return;
    }

    try {
      await api.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      alert('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password. Please check your current password.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      await api.forgotPassword(resetEmail);
      alert('Password reset instructions sent to your email if the account exists.');
      setResetEmail('');
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert('Error sending password reset. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      'Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your data including transactions, categories, budgets, and goals.'
    );

    if (confirmDelete) {
      const doubleConfirm = window.prompt(
        'To confirm account deletion, please type "DELETE MY ACCOUNT" (case sensitive):'
      );

      if (doubleConfirm === 'DELETE MY ACCOUNT') {
        try {
          await api.deleteAccount();
          alert('Your account has been successfully deleted.');
          logout();
        } catch (error) {
          console.error('Error deleting account:', error);
          alert('Error deleting account. Please try again.');
        }
      } else {
        alert('Account deletion cancelled - confirmation text did not match.');
      }
    }
  };

  const sections = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
    { id: 'account', name: 'Account', icon: '🔧' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Unable to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your account preferences and security</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-1/4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <nav className="space-y-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition ${
                    activeSection === section.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span className="font-medium">{section.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:w-3/4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({...settings, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({...settings, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSettingsUpdate({ name: settings.name, email: settings.email })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Update Profile
                </button>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Security Settings</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your password and account security</p>
                </div>

                {/* Change Password */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h4>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                      <input
                        type="password"
                        required
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                        <input
                          type="password"
                          required
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
                    >
                      Change Password
                    </button>
                  </form>
                </div>

                {/* Forgot Password */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Forgot Password</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Send a password reset link to your email</p>
                  <form onSubmit={handleForgotPassword} className="flex gap-4">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition"
                    >
                      Send Reset Link
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Preferences</h3>
                
                <div className="space-y-6">
                  {/* Theme */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Dark Mode</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Toggle between light and dark themes</p>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isDarkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Currency */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Currency</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => {
                        const newSettings = {...settings, currency: e.target.value};
                        setSettings(newSettings);
                        handleSettingsUpdate({ currency: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="USD">🇺🇸 USD - US Dollar</option>
                      <option value="EUR">🇪🇺 EUR - Euro</option>
                      <option value="GBP">🇬🇧 GBP - British Pound</option>
                      <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
                      <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                      <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                      <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
                      <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                      <option value="INR">🇮🇳 INR - Indian Rupee</option>
                    </select>
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Receive budget alerts and updates via email</p>
                    </div>
                    <button
                      onClick={() => {
                        const newNotifications = !settings.notifications;
                        setSettings({...settings, notifications: newNotifications});
                        handleSettingsUpdate({ notifications: newNotifications });
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Account Section */}
            {activeSection === 'account' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Account Management</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your account data and settings</p>
                </div>

                {/* Export Data */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">📊 Export Your Data</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Download all your financial data for backup or analysis</p>
                  <div className="flex gap-4">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">
                      Export as JSON
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition">
                      Export as CSV
                    </button>
                  </div>
                </div>

                {/* Account Statistics */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">📈 Account Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">-</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Transactions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">-</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Categories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">-</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Budgets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">-</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Goals</div>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-red-900 dark:text-red-300 mb-4">⚠️ Danger Zone</h4>
                  <p className="text-red-700 dark:text-red-300 mb-4">
                    Once you delete your account, there is no going back. This will permanently delete your account and all associated data including transactions, categories, budgets, and goals.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
const BudgetTrackerApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'transactions', name: 'Transactions', icon: '💳' },
    { id: 'categories', name: 'Categories', icon: '📝' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      {/* Enhanced Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Budget Tracker
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Professional Finance Manager</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{user?.name?.charAt(0)}</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300 text-sm">Welcome, {user?.name}!</span>
              </div>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
              </button>
              
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Tab Navigation */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 mb-8">
          <div className="flex border-b border-gray-200/50 dark:border-gray-700/50">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.name}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'transactions' && <Transactions />}
          {activeTab === 'categories' && <Categories />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </div>
    </div>
  );
};

// Main App with Authentication
const App = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
          <AuthConsumer isLogin={isLogin} setIsLogin={setIsLogin} />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Auth Consumer Component
const AuthConsumer = ({ isLogin, setIsLogin }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return isLogin ? (
      <LoginForm onToggle={() => setIsLogin(false)} />
    ) : (
      <RegisterForm onToggle={() => setIsLogin(true)} />
    );
  }

  return <BudgetTrackerApp />;
};

export default App;
