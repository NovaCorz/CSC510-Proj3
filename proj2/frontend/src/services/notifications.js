import http from './http'

const notifications = {
  broadcast: (payload) => http.post('/notifications/broadcast', payload),
}

export default notifications

