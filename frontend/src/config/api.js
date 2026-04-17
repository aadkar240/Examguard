const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const normalizeBaseURL = (url) =>
  String(url)
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/, '')

export const API_BASE_URL = normalizeBaseURL(baseURL)
export const API_URL = `${API_BASE_URL}/api`
