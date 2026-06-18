"use client";

import { useState } from "react";
import { Key, Save, Server, Shield } from "lucide-react";

export default function Settings() {
  const [formData, setFormData] = useState({
    clientId: "",
    clientSecret: "",
    tenantId: "",
    subscriptionId: ""
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch(`http://${window.location.hostname}:8080/api/infra/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save credentials securely.");

      setStatus({ type: "success", message: "Azure credentials securely encrypted and saved!" });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto p-8 relative z-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Platform Settings</h1>
        <p className="text-gray-400">Configure your Cloud Providers and Azure Service Principals for automated deployments.</p>
      </header>

      <div className="max-w-3xl">
        <div className="glass rounded-2xl border border-white/5 shadow-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Azure Service Principal</h2>
              <p className="text-sm text-gray-400 mt-1">These credentials allow the deployment worker to execute Terraform on your behalf.</p>
            </div>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Client ID</label>
                  <input
                    type="text"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                    placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Client Secret</label>
                  <input
                    type="password"
                    value={formData.clientSecret}
                    onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                    placeholder="••••••••••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Tenant ID</label>
                  <input
                    type="text"
                    value={formData.tenantId}
                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                    placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Subscription ID</label>
                  <input
                    type="text"
                    value={formData.subscriptionId}
                    onChange={(e) => setFormData({ ...formData, subscriptionId: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                    placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                    required
                  />
                </div>
              </div>

              {status.message && (
                <div className={`p-4 rounded-xl border ${status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                  {status.message}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-3 px-6 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {isLoading ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
            <Server className="w-6 h-6 text-gray-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Amazon AWS Configuration</h2>
              <p className="text-sm text-gray-400 mt-1">Configure AWS IAM Keys to deploy resources in Amazon Web Services.</p>
            </div>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-500 italic">AWS Deployment is disabled in the current organization tier.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
