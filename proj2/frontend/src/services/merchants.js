// services/merchants.js
import http from './http'

export const merchants = {
  getAll: () => http.get('/merchants'),
  getById: (id) => http.get(`/merchants/${id}`),
  getByDistance: () => http.get('/merchants/by-distance'),
  getRecommendation: (id) => http.get(`/merchants/${id}/recommendation`),
  register: (merchant) => http.post('/merchants/register', merchant),
  verify: (id, verified) => http.put(`/merchants/${id}/verify?verified=${verified}`),
  delete: (id) => http.delete(`/merchants/${id}`),
  getOrders: (id) => http.get(`/merchants/${id}/all-orders`),
}

export default merchants