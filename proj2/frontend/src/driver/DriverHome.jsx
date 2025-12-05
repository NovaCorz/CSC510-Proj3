import React, { useEffect, useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { drivers, orders } from "../services/api";

const DriverHome = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [filter, setFilter] = useState("all");

  const driverId = user.id;

  useEffect(() => {
    fetchDriverProfile();
  }, [driverId]);

  useEffect(() => {
    if (driverLocation) {
      fetchAvailableOrders();
    }
  }, [driverLocation]);

  const fetchDriverProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("bb_token");
      if (!token) {
        setError("Authentication token missing. Please log in again.");
        return;
      }

      if (!user?.id) {
        setError("User ID missing. Please log in again.");
        return;
      }

      const response = await drivers.getMyProfile(user.id);
      const driverData = response.data?.data || response.data;

      if (driverData) {
        if (
          driverData.currentLatitude != null &&
          driverData.currentLongitude != null
        ) {
          setDriverLocation({
            lat: driverData.currentLatitude,
            lng: driverData.currentLongitude,
          });
        } else {
          setDriverLocation({ lat: 35.78, lng: -78.638 });
        }

        if (driverData.isAvailable !== undefined) {
          setIsOnline(driverData.isAvailable);
        }
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch driver profile";
      const statusCode = err.response?.status;

      if (statusCode === 403) {
        setError(
          "Access forbidden. Please ensure you are logged in as a driver."
        );
      } else if (statusCode === 401) {
        setError("Authentication failed. Please log in again.");
        localStorage.removeItem("bb_token");
        localStorage.removeItem("bb_refresh_token");
      } else {
        setError(errorMessage);
      }

      setDriverLocation({ lat: 35.78, lng: -78.638 });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableOrders = async () => {
    if (!driverLocation) return;

    try {
      setLoading(true);
      setError("");

      const response = await orders.getAvailableForDriver(
        driverLocation.lat,
        driverLocation.lng,
        10
      );

      if (response.data?.data) {
        setAvailableOrders(response.data.data);
      } else if (Array.isArray(response.data)) {
        setAvailableOrders(response.data);
      } else {
        setError("Unexpected response format.");
      }
    } catch (err) {
      setError("Failed to fetch available orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    try {
      setLoading(true);
      setError("");
      setIsOnline(!isOnline);
      await drivers.updateAvailability(isOnline);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update availability");
    } finally {
      setLoading(false);
    }
  };

  function acceptOrder(orderId) {
    const order = availableOrders.find((o) => o.id === orderId);
    if (!order) return;
    const accepted = {
      ...order,
      status: "accepted",
      acceptedAt: Date.now(),
    };
    setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
    setAssignedOrders((prev) => [accepted, ...prev]);
  }

  function startPickup(orderId) {
    try {
      orders.updateStatus(orderId, "picking_up");
      setAssignedOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "picking_up", startedAt: Date.now() }
            : o
        )
      );
    } catch {}
  }

  function markPickedUp(orderId) {
    try {
      orders.updateStatus(orderId, "in_transit");
      setAssignedOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "on_route", pickedUpAt: Date.now() }
            : o
        )
      );
    } catch {}
  }

  function completeDelivery(orderId) {
    try {
      orders.updateStatus(orderId, "delivered");
      setAssignedOrders((prev) => prev.filter((o) => o.id !== orderId));
      alert("Delivery completed. Good job!");
    } catch {}
  }

  const filteredAvailable = availableOrders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "nearby") return o.distanceKm <= 2.5;
    if (filter === "fast") return o.etaMin <= 12;
    return true;
  });

  function formatDistance(km) {
    if (km == null) return "N/A";
    if (km < 1) return `${(km * 1000).toFixed(0)}m`;
    return `${km.toFixed(1)}km`;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Driver Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Manage your deliveries and stay on the road
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchAvailableOrders}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="mb-6">
        <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl">
          <div>
            <div className="text-xs text-slate-400">Status</div>
            <div className="mt-1 font-semibold">
              <button
                onClick={handleToggleOnline}
                className={`px-4 py-1 rounded-lg font-semibold ${
                  isOnline
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-slate-600 hover:bg-slate-500"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Available Orders */}
      <div className="bg-slate-800 p-6 rounded-xl mb-8">
        <h2 className="text-xl font-bold mb-4">Available Orders</h2>

        <div className="flex items-center gap-3 mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600"
          >
            <option value="all">All</option>
            <option value="nearby">Nearby (≤ 2.5 km)</option>
            <option value="fast">Fast (≤ 12 min)</option>
          </select>

          <div className="text-sm text-slate-400">
            {filteredAvailable.length} result(s)
          </div>
        </div>

        <div className="space-y-4">
          {filteredAvailable.length === 0 && (
            <div className="text-slate-400">No available orders.</div>
          )}

          {filteredAvailable.map((order) => {
            const itemNames = order.items?.length
              ? order.items
                  .filter((i) => i)
                  .map((i) => i.productName || i.name || "Unknown")
                  .join(", ")
              : "No items";

            return (
              <div
                key={order.id}
                className="flex justify-between items-center bg-slate-700 p-4 rounded-lg"
              >
                <div>
                  <div className="font-bold text-white">
                    {order.merchantName || "Unknown Merchant"}
                  </div>
                  <div className="text-sm text-slate-400">{itemNames}</div>

                  <div className="flex gap-4 mt-2 text-sm">
                    <div>{formatDistance(order.distanceKm)}</div>
                    <div>{order.etaMin ? `${order.etaMin} min` : "N/A"}</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      if (!isOnline) {
                        if (
                          !window.confirm(
                            "You are offline. Go online to accept orders?"
                          )
                        )
                          return;
                        setIsOnline(true);
                      }
                      acceptOrder(order.id);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => {
                      const details = `Order #${order.id}\nRestaurant: ${
                        order.merchantName || "Unknown"
                      }\nCustomer: ${
                        order.customerName || "Unknown"
                      }\nAddress: ${
                        order.deliveryAddress || "N/A"
                      }\nItems: ${itemNames}\nTotal: $${
                        order.totalAmount || "0.00"
                      }\nDistance: ${formatDistance(
                        order.distanceKm
                      )}\nETA: ${
                        order.etaMin != null ? `${order.etaMin} min` : "N/A"
                      }`;

                      alert(details);
                    }}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-medium"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assigned Orders */}
      <div className="bg-slate-800 p-6 rounded-xl mb-8">
        <h2 className="text-xl font-bold mb-4">Your Assigned Deliveries</h2>

        <div className="space-y-4">
          {assignedOrders.length === 0 && (
            <div className="text-slate-400">You have no assigned deliveries.</div>
          )}

          {assignedOrders.map((order) => {
            const itemNames = order.items?.length
              ? order.items
                  .filter((i) => i)
                  .map((i) => i.productName || i.name || "Unknown")
                  .join(", ")
              : "No items";

            return (
              <div
                key={order.id}
                className="flex justify-between items-center bg-slate-700 p-4 rounded-lg"
              >
                <div>
                  <div className="font-bold text-white">
                    {order.merchantName || "Unknown"} →{" "}
                    {order.customerName || "Unknown"}
                  </div>
                  <div className="text-sm text-slate-400">{itemNames}</div>

                  <div className="flex gap-4 mt-2 text-sm">
                    <div>{order.status?.replace("_", " ")}</div>
                    <div className="text-slate-400">
                      {order.distanceKm ? formatDistance(order.distanceKm) : ""}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {order.status === "accepted" && (
                    <button
                      onClick={() => startPickup(order.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
                    >
                      Start Pickup
                    </button>
                  )}

                  {order.status === "picking_up" && (
                    <button
                      onClick={() => markPickedUp(order.id)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-medium"
                    >
                      Mark Picked Up
                    </button>
                  )}

                  {order.status === "on_route" && (
                    <button
                      onClick={() => completeDelivery(order.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium"
                    >
                      Complete
                    </button>
                  )}

                  <button
                    onClick={() =>
                      alert(`Contact ${order.customerName || "Customer"}`)
                    }
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-medium"
                  >
                    Contact
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="bg-slate-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-2">Map / Navigation</h2>
          <div className="bg-slate-700 p-6 rounded-lg text-center text-slate-400 mb-4">
            Map placeholder — integrate your maps provider here
          </div>

          <div className="flex justify-between items-center mt-4">
            <div>
              <div className="text-sm text-slate-400">Current location</div>
              <div className="font-bold text-white">
                {driverLocation
                  ? `${driverLocation.lat.toFixed(
                      4
                    )}, ${driverLocation.lng.toFixed(4)}`
                  : "Loading..."}
              </div>
            </div>

            <button
              onClick={async () => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                      };
                      setDriverLocation(newLocation);

                      try {
                        await drivers.updateLocation(
                          newLocation.lat,
                          newLocation.lng
                        );
                      } catch {}
                    },
                    () => {
                      alert("Unable to get location.");
                    }
                  );
                } else {
                  alert("Geolocation not supported.");
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
            >
              Update Location
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-2">Quick Stats</h2>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-slate-700 p-4 rounded-lg">
              <div className="text-xs text-slate-400">Earnings (today)</div>
              <div className="text-xl font-bold">$0.00</div>
            </div>

            <div className="flex-1 bg-slate-700 p-4 rounded-lg">
              <div className="text-xs text-slate-400">Completed</div>
              <div className="text-xl font-bold">0</div>
            </div>
          </div>

          <p className="text-sm text-slate-400">
            Tip: Toggle online to receive orders.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DriverHome;
