import http from './http'

const buildFormBody = (payload) => {
  const params = new URLSearchParams()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value)
    }
  })
  return params
}

const ratings = {
  getMerchantReviews: (merchantId) =>
    http.get(`/ratings/merchant/${merchantId}`),
  getProductReviews: (productId) =>
    http.get(`/ratings/product/${productId}`),
  createMerchantReview: ({ userId, merchantId, rating, review }) =>
    http.post(
      '/ratings/merchant',
      buildFormBody({ userId, merchantId, rating, review }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    ),
  createProductReview: ({ userId, productId, rating, review }) =>
    http.post(
      '/ratings/product',
      buildFormBody({ userId, productId, rating, review }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    ),
}

export default ratings

