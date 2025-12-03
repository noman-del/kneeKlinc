import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useLocation } from "wouter";

export function FloatingChatButton() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);

    if (!token) return;

    // Fetch unread count
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/messages/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const total = data.conversations?.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0) || 0;
          setUnreadCount(total);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    // Poll every 3 seconds for faster updates
    const interval = setInterval(fetchUnreadCount, 3000);

    return () => clearInterval(interval);
  }, []);

  const hiddenPaths = ["/login", "/signup", "/signup/patient", "/signup/doctor", "/doctor-registration", "/patient-registration"];

  if (!isAuthenticated || hiddenPaths.includes(location)) return null;

  return (
    <button onClick={() => setLocation("/messages")} className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-400/50" aria-label="Open messages">
      <MessageCircle className="w-6 h-6" />
      {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>
  );
}
