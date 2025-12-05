import http from './http'

const notifications = {
  broadcast: (payload) => http.post('/notifications/broadcast', payload),
  list: () => http.get('/notifications'),
}

export default notifications

