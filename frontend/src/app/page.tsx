import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <ChatInterface />
    </div>
  );
}
