import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000, // 60s timeout for AI-heavy endpoints
  headers: { 'Content-Type': 'application/json' }
})

// Response interceptor for consistent error handling
API.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.'
    } else if (!error.response) {
      error.message = 'Cannot connect to server. Make sure the backend is running.'
    } else if (error.response.status === 429) {
      error.message = 'Too many requests. Please wait a moment and try again.'
    } else if (error.response.status === 503) {
      error.message = 'AI service is temporarily unavailable. Please try again.'
    }
    return Promise.reject(error)
  }
)

export const createSession = () => API.post('/session/create')
export const sendChat = (data) => API.post('/chat', data)
export const getQuestions = () => API.get('/personality/questions')
export const calculatePersonality = (answers) => API.post('/personality/calculate', { answers })
export const matchCareers = (data) => API.post('/match-careers', data)
export const generateRoadmap = (profile) => API.post('/generate-roadmap', profile)
export const getOpportunities = (city) => API.get(`/opportunities/${city}`)
export const getTrends = () => API.get('/trends')
export const getHealth = () => API.get('/health')