// src/lib/api.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // inlined at build time
  withCredentials: true,
})

export default apiClient
