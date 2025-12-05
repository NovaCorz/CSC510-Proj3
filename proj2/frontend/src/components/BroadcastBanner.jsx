import React, { forwardRef } from 'react'
import { X } from 'lucide-react'

const BroadcastBanner = forwardRef(({ message, createdAt, onDismiss }, ref) => {
  const formattedDate = createdAt ? new Date(createdAt).toLocaleString() : ''

  return (
    <div
      ref={ref}
      className="bg-yellow-50 border-b border-yellow-200 text-yellow-900 px-4 py-3 flex items-start justify-between gap-3 shadow-sm"
      style={{ position: 'relative', zIndex: 1000 }}
    >
      <div>
        <p className="font-semibold">System notice</p>
        <p className="text-sm">{message}</p>
        {formattedDate && (
          <p className="text-xs text-yellow-700 mt-1">{formattedDate}</p>
        )}
      </div>
      <button
        aria-label="Dismiss broadcast"
        onClick={onDismiss}
        className="text-yellow-700 hover:text-yellow-900"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
})

export default BroadcastBanner


