import React, { useEffect, useState } from 'react'
import { users as usersAPI } from '../services/api'
import { CheckCircle, XCircle } from 'lucide-react'

const UserSettings = ({ onBack, asModal = false, onClose }) => {
  // FRONTEND-ONLY ADDRESS/PAYMENT
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', zip: '' })
  const [payment, setPayment] = useState({ cardName: '', cardNumber: '', exp: '', cvc: '' })

  // BACKEND PROFILE FIELDS
  const [userProfile, setUserProfile] = useState(null)
  const [edit, setEdit] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    latitude: '',
    longitude: ''
  })

  const [saved, setSaved] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState('')

  // Load saved address/payment AND fetch backend profile
  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem('bb_address') || 'null')
      const p = JSON.parse(localStorage.getItem('bb_payment') || 'null')
      if (a) setAddress(a)
      if (p) setPayment(p)
    } catch {}

    fetchUserProfile()
  }, [])

  // Fetch backend user /me
  const fetchUserProfile = async () => {
    try {
      const response = await usersAPI.getMe()
      const profile = response.data?.data || response.data

      if (profile) {
        setUserProfile(profile)

        setEdit({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          dateOfBirth: profile.dateOfBirth || '',
          latitude: profile.latitude || '',
          longitude: profile.longitude || ''
        })
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
    }
  }

  // -------------------------
  // Auto-fill lat/long
  // -------------------------
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEdit({
          ...edit,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        })
      },
      () => alert("Unable to retrieve your location.")
    )
  }

  // -------------------------
  // Save backend profile
  // -------------------------
  const saveProfile = async () => {
    if (!userProfile?.id) return

    setSavingProfile(true)

    const payload = {
      name: edit.name,
      email: edit.email,
      phone: edit.phone,
      dateOfBirth: edit.dateOfBirth,
      latitude: edit.latitude ? parseFloat(edit.latitude) : null,
      longitude: edit.longitude ? parseFloat(edit.longitude) : null,
    }

    try {
      const res = await usersAPI.update(userProfile.id, payload)
      const updated = res.data?.data || res.data
      setUserProfile(updated)

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert("Profile update failed: " + (err.response?.data?.message || err.message))
    }

    setSavingProfile(false)
  }

  // -------------------------
  // Age verification
  // -------------------------
  const handleVerifyAge = async () => {
    if (!userProfile?.id) {
      setVerifyMessage("Profile not loaded")
      return
    }

    setVerifying(true)
    setVerifyMessage("")

    try {
      const response = await usersAPI.verifyAge(userProfile.id)
      const updated = response.data?.data || response.data
      setUserProfile(updated)

      setVerifyMessage('Age verified successfully! ✔')
      setTimeout(() => setVerifyMessage(''), 3000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed'
      setVerifyMessage("Verification failed: " + msg)
      setTimeout(() => setVerifyMessage(''), 5000)
    }

    setVerifying(false)
  }

  // -------------------------
  // Save localStorage address/payment
  // -------------------------
  const saveAll = () => {
    localStorage.setItem('bb_address', JSON.stringify(address))
    localStorage.setItem('bb_payment', JSON.stringify(payment))
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  // -------------------------
  // Profile Editor UI
  // -------------------------
  const renderProfileEditor = () => (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <input className="border rounded-lg px-3 py-2" placeholder="Full Name"
          value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} />

        <input className="border rounded-lg px-3 py-2" placeholder="Email"
          value={edit.email} onChange={e => setEdit({ ...edit, email: e.target.value })} />

        <input className="border rounded-lg px-3 py-2" placeholder="Phone Number"
          value={edit.phone} onChange={e => setEdit({ ...edit, phone: e.target.value })} />

        <input type="date" className="border rounded-lg px-3 py-2"
          value={edit.dateOfBirth} onChange={e => setEdit({ ...edit, dateOfBirth: e.target.value })} />

        <input type="number" step="0.000001" placeholder="Latitude"
          className="border rounded-lg px-3 py-2"
          value={edit.latitude} onChange={e => setEdit({ ...edit, latitude: e.target.value })} />

        <input type="number" step="0.000001" placeholder="Longitude"
          className="border rounded-lg px-3 py-2"
          value={edit.longitude} onChange={e => setEdit({ ...edit, longitude: e.target.value })} />

      </div>

      <button
        onClick={handleUseLocation}
        className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
        Use My Location
      </button>

      <div className="flex justify-end mt-4">
        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
          {savingProfile ? "Saving..." : "Save Profile"}
        </button>
      </div>

      {saved && <p className="text-green-600 text-sm mt-2">Profile saved!</p>}
    </div>
  )

  // ===========================================================================================
  // MODAL MODE
  // ===========================================================================================
  if (asModal) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">User Settings</h1>
          <button onClick={onClose}
            className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-100">
            Close
          </button>
        </div>

        {renderProfileEditor()}

        {/* Frontend-only Payment */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Payment</h2>
          <div className="grid grid-cols-1 gap-3">
            <input className="border rounded-lg px-3 py-2" placeholder="Name on card"
              value={payment.cardName} onChange={e => setPayment({ ...payment, cardName: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="Card number"
              value={payment.cardNumber} onChange={e => setPayment({ ...payment, cardNumber: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="MM/YY"
              value={payment.exp} onChange={e => setPayment({ ...payment, exp: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="CVC"
              value={payment.cvc} onChange={e => setPayment({ ...payment, cvc: e.target.value })} />
          </div>
          <p className="text-xs text-gray-500 mt-1">Stored locally only.</p>
        </section>


        {/* Frontend-only Address */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Address</h2>
          <div className="grid grid-cols-1 gap-3">
            <input className="border rounded-lg px-3 py-2" placeholder="Address line 1"
              value={address.line1} onChange={e => setAddress({ ...address, line1: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="Address line 2"
              value={address.line2} onChange={e => setAddress({ ...address, line2: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="City"
              value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="State"
              value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="ZIP"
              value={address.zip} onChange={e => setAddress({ ...address, zip: e.target.value })} />
          </div>
        </section>

        <div className="flex justify-end">
          <button onClick={saveAll} className="px-4 py-2 rounded-lg bg-red-600 text-white">
            Save
          </button>
        </div>

        {saved && <p className="text-green-600 text-sm">Saved.</p>}
      </div>
    )
  }

  // ===========================================================================================
  // FULL PAGE VIEW
  // ===========================================================================================
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={onBack}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100">← Back</button>
          <h1 className="text-lg font-semibold">User Settings</h1>
          <div className="w-[90px]" />
        </div>
      </div>

      <div style={{ height: 72 }} />

      <div className="max-w-3xl mx-auto px-6 pb-10 grid grid-cols-1 gap-8">

        {renderProfileEditor()}

        {/* AGE VERIFICATION */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Age Verification</h2>
          <div className="bg-gray-50 border rounded-lg p-4">

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {userProfile?.ageVerified ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">Age Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 font-medium">Not Verified</span>
                  </>
                )}
              </div>

              {!userProfile?.ageVerified && (
                <button onClick={handleVerifyAge} disabled={verifying}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                  {verifying ? "Verifying..." : "Verify Age"}
                </button>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-2">
              {userProfile?.ageVerified
                ? "Your age has been verified."
                : "Verification is required before ordering alcohol."}
            </p>

            {verifyMessage && (
              <p className={`text-sm mt-2 ${verifyMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {verifyMessage}
              </p>
            )}

          </div>
        </div>

        {/* ADDRESS (local only) */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-3 py-2" placeholder="Address line 1"
              value={address.line1} onChange={e => setAddress({ ...address, line1: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="Address line 2"
              value={address.line2} onChange={e => setAddress({ ...address, line2: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="City"
              value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="State"
              value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="ZIP"
              value={address.zip} onChange={e => setAddress({ ...address, zip: e.target.value })} />
          </div>
        </div>

        {/* PAYMENT (local only) */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Payment (Frontend only)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-3 py-2" placeholder="Name on card"
              value={payment.cardName} onChange={e => setPayment({ ...payment, cardName: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="Card number"
              value={payment.cardNumber} onChange={e => setPayment({ ...payment, cardNumber: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="MM/YY"
              value={payment.exp} onChange={e => setPayment({ ...payment, exp: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="CVC"
              value={payment.cvc} onChange={e => setPayment({ ...payment, cvc: e.target.value })} />
          </div>
          <p className="mt-2 text-xs text-gray-500">Data is stored locally only.</p>
        </div>

        {/* SAVE local storage button */}
        <div className="flex justify-end">
          <button onClick={saveAll}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
            Save
          </button>
        </div>
        {saved && <div className="text-green-600 text-sm">Saved.</div>}

      </div>
    </div>
  )
}

export default UserSettings
