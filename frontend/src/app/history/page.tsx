import { CheckCircle2, XCircle, Clock, FileText } from "lucide-react";

export default function History() {
  const deployments = [
    {
      id: "dep-8f72a",
      prompt: "Create a production-ready Kubernetes cluster",
      target: "Azure",
      status: "Success",
      date: "Today, 10:45 AM",
      resources: 12,
    },
    {
      id: "dep-3b19c",
      prompt: "Deploy a highly available PostgreSQL database",
      target: "AWS",
      status: "Success",
      date: "Yesterday, 3:20 PM",
      resources: 4,
    },
    {
      id: "dep-5d9e1",
      prompt: "Build an Ubuntu VM with 32GB RAM",
      target: "Azure",
      status: "Failed",
      date: "Jun 16, 9:15 AM",
      resources: 0,
    },
    {
      id: "dep-1a42f",
      prompt: "Create a standard web app infrastructure",
      target: "Azure",
      status: "Success",
      date: "Jun 15, 11:30 AM",
      resources: 8,
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto p-8 relative z-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Deployment History</h1>
        <p className="text-gray-400">A complete log of all infrastructure generated and deployed by CloudPilot AI.</p>
      </header>

      <div className="glass rounded-2xl border border-white/5 shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="p-4 text-sm font-medium text-gray-400">Deployment ID</th>
              <th className="p-4 text-sm font-medium text-gray-400">Natural Language Prompt</th>
              <th className="p-4 text-sm font-medium text-gray-400">Target</th>
              <th className="p-4 text-sm font-medium text-gray-400">Date</th>
              <th className="p-4 text-sm font-medium text-gray-400">Status</th>
              <th className="p-4 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((dep, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono text-sm text-primary-400">{dep.id}</td>
                <td className="p-4 text-white max-w-md truncate">"{dep.prompt}"</td>
                <td className="p-4 text-gray-300 flex items-center gap-2">
                  {dep.target}
                </td>
                <td className="p-4 text-gray-400 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {dep.date}
                </td>
                <td className="p-4">
                  {dep.status === "Success" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium">
                      <XCircle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10" title="View Terraform Plan">
                    <FileText className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
