import React, { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Login from './components/Login'
import DriverLogin from './driver/DriverLogin'
import Home from './components/Home'
import RestaurantMenu from './components/RestaurantMenu'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import UserSettings from './components/UserSettings'
import AdminHome from './admin/AdminHome'
import MerchantHome from './admin/MerchantHome'
import DriverHome from './driver/DriverHome'
import OrderConfirmed from './components/OrderConfirmed'
import AdminAnalyticsPage from './admin/AdminAnalyticsComponent'
import './App.css'
import DriverOrderState from './driver/DriverOrderState'

const ProtectedRoute = ({ condition, redirectTo = '/login', children }) => {
  if (!condition) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

const AppShell = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [cart, setCart] = useState([])

  const hasRole = (role) => user?.roles?.includes(role)

  const handleLogin = (userData) => {
    setUser(userData.user)

    if (userData.user?.roles?.includes('ADMIN')) {
      navigate('/admin')
    } else if (userData.user?.roles?.includes('MERCHANT_ADMIN')) {
      navigate('/merchant')
    } else if (userData.user?.roles?.includes('DRIVER')) {
      navigate('/driver/home')
    } else {
      navigate('/home')
    }
  }

  const handleDriverLogin = (userData) => {
    setUser(userData.user)

    if (userData.user?.roles?.includes('DRIVER')) {
      navigate('/driver/home')
    } else {
      navigate('/login')
    }
  }

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant)
    navigate('/menu')
  }

  const handleAddToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id)
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prevCart, { ...item, quantity: 1 }]
    })
  }

  const handleRemoveFromCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id)
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
      }
      return prevCart.filter((cartItem) => cartItem.id !== item.id)
    })
  }

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== itemId))
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      )
    }
  }

  const handleRemoveItem = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId))
  }

  const handleOrderConfirm = () => {
    setCart([])
    navigate('/home')
  }

  const handleLogout = () => {
    localStorage.removeItem('bb_token')
    localStorage.removeItem('bb_refresh_token')
    setUser(null)
    setCart([])
    setSelectedRestaurant(null)
    navigate('/login')
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <Login
            onLogin={handleLogin}
            onGoToDriverLogin={() => navigate('/driver/login')}
          />
        }
      />
      <Route
        path="/driver/login"
        element={<DriverLogin onDriverLogin={handleDriverLogin} />}
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute condition={!!user && !hasRole('DRIVER')}>
            <Home
              onSelectRestaurant={handleSelectRestaurant}
              onOpenSettings={() => navigate('/settings')}
              onOpenOrders={() => navigate('/orders')}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute condition={!!user && !hasRole('DRIVER')}>
            <OrderConfirmed
              cart={cart}
              onBack={() => navigate('/home')}
              onViewCart={() => navigate('/cart')}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/menu"
        element={
          <ProtectedRoute condition={!!user && !hasRole('DRIVER')}>
            {selectedRestaurant ? (
              <RestaurantMenu
                restaurant={selectedRestaurant}
                user={user}
                cart={cart}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onBack={() => navigate('/home')}
                onViewCart={() => navigate('/cart')}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/home" replace />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute condition={!!user && !hasRole('DRIVER')}>
            <Cart
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onBack={() => navigate(selectedRestaurant ? '/menu' : '/home')}
              onCheckout={() => navigate('/checkout')}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute condition={!!user && !hasRole('DRIVER')}>
            <Checkout
              cart={cart}
              user={user}
              restaurant={selectedRestaurant}
              onBack={() => navigate('/cart')}
              onConfirm={handleOrderConfirm}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute condition={!!user && !hasRole('DRIVER')}>
            <UserSettings onBack={() => navigate('/home')} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute condition={!!user && hasRole('ADMIN')}>
            <AdminHome
              onLogout={handleLogout}
              onAnalytics={() => navigate('/admin/analytics')}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute condition={!!user && hasRole('ADMIN')}>
            <AdminAnalyticsPage onBack={() => navigate('/admin')} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant"
        element={
          <ProtectedRoute condition={!!user && hasRole('MERCHANT_ADMIN')}>
            <MerchantHome user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/home"
        element={
          <ProtectedRoute
            condition={!!user && hasRole('DRIVER')}
            redirectTo="/driver/login"
          >
            <DriverHome user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/order-status"
        element={
          <ProtectedRoute
            condition={!!user && hasRole('DRIVER')}
            redirectTo="/driver/login"
          >
            <DriverOrderState onBack={() => navigate('/driver/home')} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}