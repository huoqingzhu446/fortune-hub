import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  timeout: 12000,
  headers: {
    'X-Client': 'fortune-hub-admin',
  },
});
