import React from 'react'
import { CheckCircle, Home, Package } from 'lucide-react'
import orders from '../services/orders'
import OrderCard from './OrderCard';
import { useEffect, useState } from 'react';
import { Plus, Minus, ArrowLeft } from 'lucide-react'
import { products } from '../services/api'
const IMG_PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%239ca3af">No Image</text></svg>'

export default function OrderConfirmed({ bannerOffset = 0, onBack, onViewCart, cart }) {
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('')
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0)
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await orders.getMyOrders();
        console.log("Fetched orders:", res.data.data);
        setOrderList(res.data.data || []);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) {
    return <div className="text-white text-center p-20">Loading orders...</div>;
  }

  return (
    
    <div className="min-h-screen bg-black text-white p-4">
      {/* Floating top bar */}
      <div className="fixed inset-x-0 z-50 w-full" style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', top: bannerOffset }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: 960, margin: '0 auto', padding: '12px 24px' }}>
          <button
            onClick={onBack}
            className="flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-900 transition"
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
      <div style={{ height: 112 + bannerOffset }} />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Your Orders</h1>

        {orderList.length === 0 && (
          <p className="text-gray-400 text-center">You have no orders yet.</p>
        )}

        <div className="space-y-6">
          {orderList.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
}