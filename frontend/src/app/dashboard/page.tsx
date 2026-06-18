"use client";

import { useState, useEffect } from "react";
import { Server, Activity, ArrowUpRight, Cpu, Database, Network } from "lucide-react";

export default function Dashboard() {
  const [liveStats, setLiveStats] = useState({ vms: 0, k8s: 0, dbs: 0, networks: 0 });
  
  useEffect(() => {
    fetch(`/api/infra/stats`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.vms !== 'undefined') {
          setLiveStats(data);
        }
      })
      .catch(err => console.error("Failed to fetch live stats", err));
  }, []);

  const stats = [
    { label: "Active VMs", value: liveStats.vms, icon: Server, color: "text-blue-400" },
    { label: "Kubernetes Clusters", value: liveStats.k8s, icon: Cpu, color: "text-purple-400" },
    { label: "Databases", value: liveStats.dbs, icon: Database, color: "text-green-400" },
    { label: "Networks", value: liveStats.networks, icon: Network, color: "text-orange-400" },
  ];

  const [recent, setRecent] = useState([]);
  useEffect(() => {
    fetch(`/api/infra/history`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecent(data.slice(0, 5)); // Show only 5 most recent
        }
      })
      .catch(err => console.error("Failed to fetch history", err));
  }, []);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto p-8 relative z-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cloud Dashboard</h1>
          <p className="text-gray-400">Overview of your AI-managed infrastructure across all clouds.</p>
        </div>
        <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-2 font-medium">
          <Activity className="w-4 h-4" />
          Systems Connected
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className={`w-24 h-24 ${stat.color} translate-x-4 -translate-y-4`} />
            </div>
            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <h3 className="text-gray-400 font-medium mb-1">{stat.label}</h3>
            <div className="text-3xl font-bold text-white flex items-baseline gap-2">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Deployments Panel */}
      <div className="glass rounded-2xl border border-white/5 shadow-xl flex-1 flex flex-col min-h-[400px]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Live Deployments</h2>
          <button className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Auto-Sync Active
          </button>
        </div>
        <div className="flex-1 p-6 flex flex-col gap-4">
          {recent.length === 0 ? (
            <div className="text-gray-400 text-center mt-10">No deployments yet. Ask CloudPilot AI to build something!</div>
          ) : (
            recent.map((item: any, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
                    <Server className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{item.resource_name || item.id}</h4>
                    <p className="text-sm text-gray-400">Target: {item.target}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-gray-400">{item.date}</span>
                  <span className="px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
