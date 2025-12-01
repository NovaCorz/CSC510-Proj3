import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import merchants from "../services/merchants";
import { motion } from "framer-motion";

// AdminAnalyticsPage Component
// Parent will pass in:
// - fetchMerchants(): Promise<Merchant[]>
// - fetchMerchantOrders(merchantId): Promise<Order[]>
// Order contains orderItems[] with fields: name, quantity, unitPrice, subtotal
// You handle the HTTP calls; component performs aggregation + visualization.

export default function AdminAnalyticsPage({ fetchMerchantOrders }) {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMerchants() {
      try {
        const data = await merchants.getAll();
        console.log("Merchants:", data)
        setMerchants(data.data.data || []);
      } catch (e) {
        console.error("Error loading merchants", e);
      }
    }
    loadMerchants();
  }, []);

  async function handleMerchantSelect(id) {
    setSelectedMerchant(id);
    setLoading(true);
    try {
      const orders = await merchants.getOrders(id).data;
      console.log("Merchant Orders:", orders);
      const revenueMap = {}; // { itemName: revenue }

      orders?.forEach(order => {
        order.orderItems?.forEach(item => {
          if (!item) return;
          const name = item.name;
          const revenue = Number(item.subtotal);
          if (!revenueMap[name]) revenueMap[name] = 0;
          revenueMap[name] += revenue;
        });
      });

      const formatted = Object.entries(revenueMap).map(([name, revenue]) => ({
        name,
        revenue
      }));

      setChartData(formatted);
    } catch (err) {
      console.error("Error loading merchant orders", err);
    }
    setLoading(false);
  }

  return (
    <div className="w-full p-6 grid gap-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-semibold"
      >
        Admin Analytics
      </motion.h1>

      <Card className="p-4">
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-gray-600">Select Merchant</label>
            <Select onValueChange={handleMerchantSelect}>
              <SelectTrigger className="w-64">
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

          {loading && <div className="text-gray-500">Loading analytics...</div>}

          {!loading && selectedMerchant && chartData.length > 0 && (
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {!loading && selectedMerchant && chartData.length === 0 && (
            <div className="text-gray-500">No revenue data found for this merchant.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
