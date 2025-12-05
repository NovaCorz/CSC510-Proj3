import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { LogOut } from 'lucide-react';
import merchantAPI from "../services/merchants";
import { motion } from "framer-motion";

export default function AdminAnalyticsPage({ onBack, onLogout }) {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [merchantTotals, setMerchantTotals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMerchants() {
      try {
        const data = await merchantAPI.getAll();
        setMerchants(data.data.data || []);
        await loadMerchantTotals(data.data.data || []);
      } catch (e) {
        console.error("Error loading merchants", e);
      }
    }

    async function loadMerchantTotals(merchantList) {
      try {
        const totals = await Promise.all(
          merchantList.map(async (merchant) => {
            const orders = await merchantAPI.getOrders(merchant.id);
            const totalRevenue = orders.data.data?.reduce((sum, order) => {
              const orderTotal = order.items?.reduce(
                (s, item) => s + Number(item.subtotal || 0),
                0
              ) || 0;
              return sum + orderTotal;
            }, 0) || 0;
            return { name: merchant.name, revenue: totalRevenue };
          })
        );

        totals.sort((a, b) => b.revenue - a.revenue);
        setMerchantTotals(totals);
      } catch (err) {
        console.error("Error loading merchant totals", err);
      }
    }

    loadMerchants();
  }, []);

  async function handleMerchantSelect(id) {
    setSelectedMerchant(id);
    setLoading(true);
    try {
      const orders = await merchantAPI.getOrders(id);
      const revenueMap = {};
      orders.data.data?.forEach(order => {
        order.items?.forEach(item => {
          if (!item) return;
          const name = item.productName;
          const revenue = Number(item.subtotal) || 0;
          if (!revenueMap[name]) revenueMap[name] = 0;
          revenueMap[name] += revenue;
        });
      });

      const formatted = Object.entries(revenueMap)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue);

      setChartData(formatted);
    } catch (err) {
      console.error("Error loading merchant orders", err);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 grid gap-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Analytics</h1>
          <p className="text-gray-400">View financial data across merchants</p>
        </div>
        <div className="flex space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              Home
            </button>
          )}
          <button
            onClick={onLogout}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-200 flex items-center"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    <div className="flex flex-col lg:flex-row gap-6">
        {/* Total Revenue per Merchant */}
        <Card className="bg-gray-900 text-white rounded-lg shadow flex-1">
            <CardContent className="grid gap-4">
            <motion.h2 className="text-xl font-semibold text-white">Total Revenue by Merchant</motion.h2>
            {merchantTotals.length > 0 ? (
                <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                    data={merchantTotals}
                    margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
                    >
                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={60} tick={{ fill: "white" }} />
                    <YAxis tick={{ fill: "white" }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#555', color: 'white' }} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#dc2626" barSize={merchantTotals.length < 10 ? 40 : undefined} /> {/* Red-600 */}
                    </BarChart>
                </ResponsiveContainer>
                </div>
            ) : (
                <div className="text-gray-400">Loading total revenue...</div>
            )}
            </CardContent>
        </Card>

        {/* Individual Merchant Breakdown */}
        <Card className="bg-gray-900 text-white rounded-lg shadow flex-1">
            <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <label className="text-sm text-gray-400">Select Merchant</label>
                <Select onValueChange={handleMerchantSelect}>
                <SelectTrigger className="w-64 bg-gray-800 text-white rounded-md border border-gray-700">
                    <SelectValue placeholder="Choose merchant..." />
                </SelectTrigger>
                <SelectContent>
                    {merchants.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                        {m.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            {loading && <div className="text-gray-400">Loading analytics...</div>}

            {!loading && selectedMerchant && chartData.length > 0 && (
                <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 20, bottom: 80, left: 20 }}
                    >
                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={60} tick={{ fill: "white" }} />
                    <YAxis tick={{ fill: "white" }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#555', color: 'white' }} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#b91c1c" barSize={chartData.length < 10 ? 40 : undefined} /> {/* Red-700 */}
                    </BarChart>
                </ResponsiveContainer>
                </div>
            )}

            {!loading && selectedMerchant && chartData.length === 0 && (
                <div className="text-gray-400">No revenue data found for this merchant.</div>
            )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
