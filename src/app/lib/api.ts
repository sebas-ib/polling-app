import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g. "http://localhost:5001"
  withCredentials: true,                    // send cookies on every request
});

export default apiClient;