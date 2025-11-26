import React, { useState } from 'react'
import auth from '../services/auth'

const Login = ({ onLogin, onGoToDriverLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6))
        setLongitude(pos.coords.longitude.toFixed(6))
      },
      (err) => {
        setError("Unable to get location. Please enter manually.")
      }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const registerData = {
          name,
          email,
          password,
          phone,
          dateOfBirth: dateOfBirth || null,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }

        const response = await auth.register(registerData)
        const responseData = response?.data || response

        if (responseData) {
          if (responseData.token) {
            localStorage.setItem('bb_token', responseData.token)
          }
          if (responseData.refreshToken) {
            localStorage.setItem('bb_refresh_token', responseData.refreshToken)
          }
          onLogin(responseData)
        } else throw new Error("Invalid registration response")

      } else {
        const response = await auth.login({ email, password })
        const responseData = response?.data || response

        if (responseData) {
          if (responseData.token)
            localStorage.setItem('bb_token', responseData.token)

          if (responseData.refreshToken)
            localStorage.setItem('bb_refresh_token', responseData.refreshToken)

          onLogin(responseData)
        } else throw new Error("Invalid login response")
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-white text-black rounded-lg shadow-2xl p-8 w-full max-w-md border-2 border-red-600">
        
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2">🍻</h1>
          <h2 className="text-3xl font-bold text-gray-900">BoozeBuddies</h2>
          <p className="text-gray-600 mt-2">Your alcohol delivery service</p>
        </div>

        {/* Toggle */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError('') }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
              !isSignUp ? 'bg-red-600 text-white' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError('') }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
              isSignUp ? 'bg-red-600 text-white' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              required
            />
          </div>

          {isSignUp && (
            <>
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              {/* DOB */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              {/* Latitude + Longitude */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="35.7796"
                    required
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="-78.6382"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={handleUseLocation}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Use My Location
                </button>
              </div>
            </>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        {!isSignUp && (
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo credentials:</p>
            <p className="font-mono">User: user@boozebuddies.com / password</p>
            <p className="font-mono">Admin: admin@boozebuddies.com / password</p>
            <p className="font-mono">Merchant: merchant1@boozebuddies.com / password</p>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => onGoToDriverLogin && onGoToDriverLogin()}
            className="inline-block mt-2 px-4 py-2 text-sm rounded-md text-red-700 bg-red-100 hover:bg-red-200"
          >
            Driver login
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
