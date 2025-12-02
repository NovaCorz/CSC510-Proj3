import React, { useEffect, useState } from 'react'
import { Plus, Minus, ArrowLeft, Sparkles, X, MessageCircle, Star } from 'lucide-react'
import { products, merchants, ratings } from '../services/api'
import { THUMBNAIL_SIZE } from '../config/ui'
const IMG_PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%239ca3af">No Image</text></svg>'

const initialReviewForm = { rating: '', review: '' }

const RestaurantMenu = ({ restaurant, user, cart, onAddToCart, onRemoveFromCart, onBack, onViewCart }) => {
  const [menuItems, setMenuItems] = useState([])
  const [search, setSearch] = useState('')
  const [recommendation, setRecommendation] = useState(null)
  const [showRecommendation, setShowRecommendation] = useState(true)
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false)
  const [recommendationError, setRecommendationError] = useState(null)
  const [merchantReviews, setMerchantReviews] = useState([])
  const [merchantReviewForm, setMerchantReviewForm] = useState(initialReviewForm)
  const [merchantReviewStatus, setMerchantReviewStatus] = useState(null)
  const [isSubmittingMerchantReview, setIsSubmittingMerchantReview] = useState(false)
  const [productReviewForm, setProductReviewForm] = useState({ productId: '', rating: '', review: '' })
  const [currentProductReviews, setCurrentProductReviews] = useState([])
  const [productReviewStatus, setProductReviewStatus] = useState(null)
  const [isSubmittingProductReview, setIsSubmittingProductReview] = useState(false)

  useEffect(() => {
    if (!restaurant?.id) return
    let mounted = true
    setRecommendation(null)
    setRecommendationError(null)
    setIsLoadingRecommendation(true)

    merchants.getRecommendation(restaurant.id)
      .then(resp => {
        if (!mounted) return
        const payload = resp.data?.data || resp.data
        if (payload?.product) {
          setRecommendation(payload)
          setShowRecommendation(true)
        } else {
          setRecommendation(null)
        }
      })
      .catch((err) => {
        console.error('Failed to load recommendation:', err)
        if (mounted) {
          setRecommendation(null)
          setRecommendationError('No recommendation available right now.')
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingRecommendation(false)
        }
      })

    products.getByMerchant(restaurant.id)
      .then(resp => {
        // ProductController returns ApiResponse envelope: { success, data: [...], message }
        const items = resp.data?.data || resp.data || []
        if (mounted) setMenuItems(Array.isArray(items) ? items : [])
      })
      .catch((err) => {
        console.error('Failed to load menu items:', err)
        if (mounted) setMenuItems([])
      })

    ratings.getMerchantReviews(restaurant.id)
      .then(resp => {
        if (!mounted) return
        const items = resp.data?.data || resp.data || []
        setMerchantReviews(Array.isArray(items) ? items : [])
      })
      .catch((err) => {
        console.error('Failed to load merchant reviews:', err)
        if (mounted) setMerchantReviews([])
      })
    return () => { mounted = false }
  }, [restaurant?.id])

  const getItemQuantity = (itemId) => {
    return cart.find(item => item.id === itemId)?.quantity || 0
  }

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0)
  const formatPrice = (value) => {
    const numeric = typeof value === 'number' ? value : parseFloat(value ?? 0)
    return Number.isNaN(numeric) ? '0.00' : numeric.toFixed(2)
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString()
  }

  const handleMerchantReviewChange = (field, value) => {
    setMerchantReviewForm(prev => ({ ...prev, [field]: value }))
    setMerchantReviewStatus(null)
  }

  const handleProductReviewChange = (field, value) => {
    setProductReviewForm(prev => ({ ...prev, [field]: value }))
    setProductReviewStatus(null)
  }

  const loadProductReviews = (productId) => {
    if (!productId) {
      setCurrentProductReviews([])
      return
    }
    ratings.getProductReviews(productId)
      .then(resp => {
        const items = resp.data?.data || resp.data || []
        setCurrentProductReviews(Array.isArray(items) ? items : [])
      })
      .catch((err) => {
        console.error('Failed to load product reviews:', err)
        setCurrentProductReviews([])
      })
  }

  const handleProductSelection = (event) => {
    const value = event.target.value
    handleProductReviewChange('productId', value)
    loadProductReviews(value)
  }

  const submitMerchantReview = (event) => {
    event.preventDefault()
    if (!user?.id) {
      setMerchantReviewStatus({ type: 'error', message: 'You must be logged in to leave a review.' })
      return
    }
    if (!merchantReviewForm.rating) {
      setMerchantReviewStatus({ type: 'error', message: 'Please select a rating.' })
      return
    }
    setIsSubmittingMerchantReview(true)
    setMerchantReviewStatus(null)
    ratings.createMerchantReview({
      userId: user.id,
      merchantId: restaurant.id,
      rating: merchantReviewForm.rating,
      review: merchantReviewForm.review,
    })
      .then(() => {
        setMerchantReviewStatus({ type: 'success', message: 'Thanks for sharing your feedback!' })
        setMerchantReviewForm(initialReviewForm)
        return ratings.getMerchantReviews(restaurant.id)
      })
      .then(resp => {
        const items = resp?.data?.data || resp?.data || []
        setMerchantReviews(Array.isArray(items) ? items : [])
      })
      .catch((err) => {
        console.error('Failed to submit merchant review', err)
        setMerchantReviewStatus({ type: 'error', message: 'Unable to submit review right now.' })
      })
      .finally(() => setIsSubmittingMerchantReview(false))
  }

  const submitProductReview = (event) => {
    event.preventDefault()
    if (!user?.id) {
      setProductReviewStatus({ type: 'error', message: 'You must be logged in to leave a review.' })
      return
    }
    if (!productReviewForm.productId || !productReviewForm.rating) {
      setProductReviewStatus({ type: 'error', message: 'Select a product and rating first.' })
      return
    }
    setIsSubmittingProductReview(true)
    setProductReviewStatus(null)
    ratings.createProductReview({
      userId: user.id,
      productId: productReviewForm.productId,
      rating: productReviewForm.rating,
      review: productReviewForm.review,
    })
      .then(() => {
        setProductReviewStatus({ type: 'success', message: 'Thanks for reviewing this item!' })
        setProductReviewForm(prev => ({ ...prev, rating: '', review: '' }))
        return ratings.getProductReviews(productReviewForm.productId)
      })
      .then(resp => {
        const items = resp?.data?.data || resp?.data || []
        setCurrentProductReviews(Array.isArray(items) ? items : [])
      })
      .catch((err) => {
        console.error('Failed to submit product review', err)
        setProductReviewStatus({ type: 'error', message: 'Unable to submit review right now.' })
      })
      .finally(() => setIsSubmittingProductReview(false))
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Floating top bar */}
      <div className="fixed top-0 inset-x-0 z-50 w-full" style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: 960, margin: '0 auto', padding: '12px 24px' }}>
          <button
            onClick={onBack}
            className="flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Restaurants
          </button>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full max-w-xl px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
            />
          </div>
          <button
            onClick={onViewCart}
            className="px-4 py-2 rounded-lg border border-red-300 bg-red-600 text-white hover:bg-red-700 transition"
          >
            🛒 Cart ({cartItemCount})
          </button>
        </div>
      </div>

      {/* Spacer for fixed bar */}
      <div style={{ height: 112 }} />

      {/* Recommendation Sidebar */}
      {recommendation && (
        <div
          className={`fixed top-24 right-6 z-50 w-80 max-w-full bg-white border border-red-100 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 ease-out ${showRecommendation ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}
        >
          <div className="flex items-start justify-between px-4 py-3 bg-red-50 border-b border-red-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700">Chatbot Recommends</p>
                <p className="text-xs text-red-500">{recommendation.strategy === 'BEST_RATED' ? 'Top rated favorite' : 'Popular pick'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowRecommendation(false)}
              className="text-red-400 hover:text-red-600 transition"
              aria-label="Close recommendation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-4 space-y-3 text-sm">
            <p className="text-gray-700 leading-5">{recommendation.message}</p>

            <div className="rounded-xl border border-gray-200 p-3 bg-gradient-to-br from-white to-red-50 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{recommendation.product?.name}</p>
                  <p className="text-xs text-gray-500">{restaurant.name}</p>
                </div>
                <span className="text-sm font-bold text-red-600">${formatPrice(recommendation.product?.price)}</span>
              </div>
              {recommendation.averageRating !== null && recommendation.averageRating !== undefined && (
                <div className="text-xs text-gray-600">
                  ⭐ {Number(recommendation.averageRating).toFixed(1)} • {recommendation.reviewCount ?? 0} reviews
                </div>
              )}
              <button
                onClick={() => onAddToCart(recommendation.product)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white py-2 text-sm font-semibold hover:bg-red-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {recommendation && !showRecommendation && (
        <button
          onClick={() => setShowRecommendation(true)}
          className="fixed bottom-10 right-10 z-40 inline-flex items-center gap-2 rounded-full bg-red-600 text-white px-4 py-2 shadow-lg hover:bg-red-700 transition"
        >
          <MessageCircle className="w-4 h-4" />
          Chatbot tip
        </button>
      )}

      {!recommendation && isLoadingRecommendation && (
        <div className="fixed bottom-10 right-10 z-40 rounded-lg bg-white px-4 py-2 shadow-md border border-gray-200 text-sm text-gray-600">
          Fetching a recommendation...
        </div>
      )}

      {!recommendation && recommendationError && !isLoadingRecommendation && (
        <div className="fixed bottom-10 right-10 z-40 rounded-lg bg-white px-4 py-2 shadow-md border border-gray-200 text-sm text-gray-600">
          {recommendationError}
        </div>
      )}

      <div className="px-6 pb-10" style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Restaurant Info */}
        <div className="bg-white p-6 mb-8 rounded-xl border border-transparent shadow-sm">
          <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
          <p className="text-gray-600 mb-4">{restaurant.cuisineType} • {restaurant.rating ?? 0} ★</p>

          {/* Centered product search */}
          <div className="w-full flex justify-center mt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full max-w-xl px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-10">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Rate this merchant
            </h2>
            <form onSubmit={submitMerchantReview} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Rating</label>
                <select
                  value={merchantReviewForm.rating}
                  onChange={(e) => handleMerchantReviewChange('rating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="">Select…</option>
                  {[5, 4, 3, 2, 1].map(value => (
                    <option key={value} value={value}>{value} ★</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Review (optional)</label>
                <textarea
                  value={merchantReviewForm.review}
                  onChange={(e) => handleMerchantReviewChange('review', e.target.value)}
                  rows={3}
                  placeholder="How was your visit?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              {merchantReviewStatus && (
                <p className={`text-sm ${merchantReviewStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {merchantReviewStatus.message}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmittingMerchantReview}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmittingMerchantReview ? 'Submitting…' : 'Submit merchant review'}
              </button>
            </form>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Recent reviews
              </h3>
              {merchantReviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet. Be the first!</p>
              ) : (
                <ul className="space-y-3">
                  {merchantReviews.slice(0, 5).map(review => (
                    <li key={review.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-800">{review.userName ?? 'Anonymous'}</span>
                        <span className="text-xs text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      </div>
                      {review.review && (
                        <p className="text-sm text-gray-600 mb-1">{review.review}</p>
                      )}
                      <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Rate a menu item
            </h2>
            <form onSubmit={submitProductReview} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Product</label>
                <select
                  value={productReviewForm.productId}
                  onChange={handleProductSelection}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="">Select a product…</option>
                  {menuItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Rating</label>
                <select
                  value={productReviewForm.rating}
                  onChange={(e) => handleProductReviewChange('rating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="">Select…</option>
                  {[5, 4, 3, 2, 1].map(value => (
                    <option key={value} value={value}>{value} ★</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Review (optional)</label>
                <textarea
                  value={productReviewForm.review}
                  onChange={(e) => handleProductReviewChange('review', e.target.value)}
                  rows={3}
                  placeholder="Share your thoughts about this item"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              {productReviewStatus && (
                <p className={`text-sm ${productReviewStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {productReviewStatus.message}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmittingProductReview}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmittingProductReview ? 'Submitting…' : 'Submit product review'}
              </button>
            </form>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Reviews for this item
              </h3>
              {productReviewForm.productId === '' ? (
                <p className="text-sm text-gray-500">Select a product to see recent reviews.</p>
              ) : currentProductReviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet.</p>
              ) : (
                <ul className="space-y-3">
                  {currentProductReviews.slice(0, 5).map(review => (
                    <li key={review.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-800">{review.userName ?? 'Anonymous'}</span>
                        <span className="text-xs text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      </div>
                      {review.review && (
                        <p className="text-sm text-gray-600 mb-1">{review.review}</p>
                      )}
                      <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          {menuItems
            .filter(i => !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()))
            .map(item => (
            <div key={item.id} className="bg-white p-6 rounded-xl border border-transparent shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:border-gray-300">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <img
                  src={item.imageUrl || IMG_PLACEHOLDER}
                  alt={item.name}
                  width={THUMBNAIL_SIZE}
                  height={THUMBNAIL_SIZE}
                  className="object-cover"
                  style={{ borderRadius: 8, flexShrink: 0 }}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_PLACEHOLDER }}
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{item.name}</h3>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center gap-2 mb-2">
                        {item.category && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-700">
                            {item.category}
                          </span>
                        )}
                        {item.isAlcohol && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-white">🍺 {item.alcoholContent}% ABV</span>
                        )}
                      </div>
                    </div>
                    <span className="text-2xl font-bold ml-4">${Number(item.price).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-gray-600">
                      {getItemQuantity(item.id) > 0 ? `${getItemQuantity(item.id)} in cart` : 'Not in cart'}
                    </span>
                    <div className="flex items-center space-x-2">
                      {getItemQuantity(item.id) > 0 && (
                        <button
                          onClick={() => onRemoveFromCart(item)}
                          className="bg-gray-200 text-gray-900 p-2 rounded-lg hover:bg-gray-300 transition duration-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onAddToCart(item)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition duration-200 flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RestaurantMenu