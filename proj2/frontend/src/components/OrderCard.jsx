import React from "react";
import { Package, CheckCircle } from "lucide-react";
import { useEffect, useState } from 'react';

export default function OrderCard({ order }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
  
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center">
      <Package className="w-7 h-7 text-purple-400 mr-3" />
      <h2 className="text-xl font-semibold text-white">Order Details</h2>
    </div>

    {/* Purple order badge */}
    <span className="px-4 py-1 rounded-full bg-purple-600 text-white text-sm font-medium shadow-md">
      #{order.id}
    </span>
  </div>

  {/* Body */}
  <div className="space-y-4 text-sm">
    <div className="flex justify-between">
      <span className="text-gray-400">Status</span>
      <span className="text-white font-medium">{order.status}</span>
    </div>

    <div className="flex justify-between">
      <span className="text-gray-400">Delivery Address</span>
      <span className="text-white max-w-[180px] text-right break-words">
        {order.deliveryAddress}
      </span>
    </div>

    <div className="flex justify-between">
      <span className="text-gray-400">Estimated Delivery</span>
      <span className="text-white">
        {order.estimatedDeliveryTime 
          ? new Date(order.estimatedDeliveryTime).toLocaleTimeString([], { hour: "numeric", minute: "numeric" })
          : "Calculating..."}
      </span>
    </div>
  </div>

  {/* Total */}
  <div className="border-t border-gray-700 mt-5 pt-4 flex justify-between text-base font-semibold">
    <span className="text-gray-300">Total</span>
    <span className="text-green-400">${Number(order.totalAmount).toFixed(2)}</span>
  </div>
</div>
  );
}
