"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Truck,
  Users,
  TrendingDown,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  DollarSign,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function SharedProducePoolPage() {
  const { user, farmerProfile } = useAuth();

  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPoolForJoin, setSelectedPoolForJoin] = useState<any>(null);
  const [joinQuantity, setJoinQuantity] = useState<number>(10);
  const [joinSuccessMsg, setJoinSuccessMsg] = useState<string | null>(null);

  // Create Pool Form State
  const [departure, setDeparture] = useState("Tomorrow, 08:30 AM");
  const [vehicle, setVehicle] = useState("TRACTOR_TROLLEY_XL");
  const [capacity, setCapacity] = useState<number>(60);
  const [myQty, setMyQty] = useState<number>(20);
  const [destination, setDestination] = useState("Karnal Central APMC Mandi");

  const fetchPools = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pools");
      if (res.ok) {
        const data = await res.json();
        setPools(data.pools || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const handleJoinPool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoolForJoin) return;

    try {
      const res = await fetch("/api/pools/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolId: selectedPoolForJoin.id,
          farmerName: user?.name || "Farmer",
          farmerPhone: user?.phone || "9876543210",
          quantity: joinQuantity,
          village: farmerProfile?.village || "Taraori",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setJoinSuccessMsg(`✓ Successfully joined ${selectedPoolForJoin.poolNumber}! Collective Mandi Token: ${data.collectiveTokenNumber}`);
        fetchPools();
        setTimeout(() => {
          setSelectedPoolForJoin(null);
          setJoinSuccessMsg(null);
        }, 2200);
      }
    } catch {}
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/pools/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostFarmerName: user?.name || "Farmer Host",
          hostFarmerPhone: user?.phone || "9876543210",
          originVillage: farmerProfile?.village || "Taraori",
          district: farmerProfile?.district || "Karnal",
          destinationCentreName: destination,
          scheduledDeparture: departure,
          vehicleType: vehicle,
          totalCapacityQuintals: capacity,
          hostQuantity: myQty,
          cropType: "WHEAT",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        fetchPools();
      }
    } catch {}
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Community Produce Aggregation • &quot;Uber for Tractors&quot;</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Small Farmer Shared Transport Pooling
          </h1>
          <p className="text-xs text-emerald-100/90 max-w-2xl leading-relaxed">
            Small harvests (5-25 Quintals)? Don&apos;t pay full tractor rent alone. Pool your produce with neighbors from your village into a single shared trolley, cut transport costs by up to 70%, and enter the Mandi with priority collective tokens.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition shadow-lg shadow-emerald-950/50 self-start md:self-auto transform hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Host a Shared Produce Pool</span>
        </button>
      </div>

      {/* Benefits Ticker Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900">₹45/Q vs ₹140/Q Freight</div>
            <div className="text-slate-600 text-[11px]">Save up to 68% on diesel and vehicle hire.</div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900">Priority Gate Clearance</div>
            <div className="text-slate-600 text-[11px]">1 combined vehicle entry replaces 5 individual tractors.</div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900">Itemized Individual DBT</div>
            <div className="text-slate-600 text-[11px]">Each farmer gets paid directly to their own bank account.</div>
          </div>
        </div>
      </div>

      {/* Available Pools List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">
            Active Community Pools Departing from Your Region:
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Showing {pools.length} open shared trips
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Finding community produce pools...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pools.map((pool) => (
              <div
                key={pool.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:border-emerald-500/60 transition"
              >
                <div className="space-y-3">
                  {/* Pool Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {pool.poolNumber}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {pool.originVillage} ➔ {pool.destinationCentreName.split(" ")[0]} Mandi
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      {pool.savingsPercentage}% SAVINGS
                    </span>
                  </div>

                  {/* Telemetry info */}
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Departure:</span>
                      <span className="font-bold">{pool.scheduledDeparture}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Vehicle:</span>
                      <span className="font-bold">{pool.vehicleType.replace(/_/g, " ")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Cost:</span>
                      <span className="font-mono font-extrabold text-emerald-700">₹{pool.estimatedCostPerQuintal}/Q</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Filled: {pool.filledQuantityQuintals}Q / {pool.totalCapacityQuintals}Q</span>
                      <span className="text-emerald-700 font-bold">{pool.availableCapacityQuintals}Q space left</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${(pool.filledQuantityQuintals / pool.totalCapacityQuintals) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Participants list */}
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <span className="font-bold text-slate-700 block">Participants ({pool.participants.length}):</span>
                    {pool.participants.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-slate-600">
                        <span>• {p.farmerName}</span>
                        <span className="font-mono font-bold">{p.quantity}Q</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Join CTA */}
                <button
                  onClick={() => {
                    setSelectedPoolForJoin(pool);
                    setJoinQuantity(Math.min(10, pool.availableCapacityQuintals));
                  }}
                  disabled={pool.availableCapacityQuintals <= 0}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-xs disabled:opacity-40"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Join this Shared Produce Pool</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Pool Modal */}
      {selectedPoolForJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 pb-2 border-b">
              <Truck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                Join Pool: {selectedPoolForJoin.poolNumber}
              </h3>
            </div>

            {joinSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center text-xs font-bold text-emerald-900">
                {joinSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleJoinPool} className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination:</span>
                    <span className="font-bold">{selectedPoolForJoin.destinationCentreName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Departure:</span>
                    <span className="font-bold">{selectedPoolForJoin.scheduledDeparture}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Available Space:</span>
                    <span className="font-bold text-emerald-700">{selectedPoolForJoin.availableCapacityQuintals} Quintals</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Your Produce Quantity to Transport (Quintals):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedPoolForJoin.availableCapacityQuintals}
                    value={joinQuantity}
                    onChange={(e) => setJoinQuantity(parseFloat(e.target.value) || 1)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Estimated Freight Share: ₹{(joinQuantity * selectedPoolForJoin.estimatedCostPerQuintal).toLocaleString("en-IN")} (You save ~₹{(joinQuantity * 85).toLocaleString("en-IN")})
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition shadow-md"
                  >
                    Confirm & Reserve Trolley Space
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPoolForJoin(null)}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Host / Create Pool Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                Host a Shared Produce Transport Pool
              </h3>
            </div>

            <form onSubmit={handleCreatePool} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Mandi Centre:</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Type:</label>
                  <select
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="TRACTOR_TROLLEY">Tractor Trolley (40-50Q)</option>
                    <option value="TRACTOR_TROLLEY_XL">Tractor Trolley XL (60-80Q)</option>
                    <option value="EICHER_CANTER_14FT">Mini Truck / Canter (80-100Q)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Capacity (Q):</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(parseFloat(e.target.value) || 50)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Crop Quantity (Q):</label>
                  <input
                    type="number"
                    value={myQty}
                    onChange={(e) => setMyQty(parseFloat(e.target.value) || 20)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Departure:</label>
                  <input
                    type="text"
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Publish Pool to Village Farmers
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
