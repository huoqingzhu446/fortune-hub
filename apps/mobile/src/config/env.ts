export const appEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  fileServiceBaseUrl:
    import.meta.env.VITE_FILE_SERVICE_BASE_URL || 'http://8.152.214.57:3000/api',
};
