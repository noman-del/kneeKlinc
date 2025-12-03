import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, User, Clock, CheckCircle2, ArrowLeft } from "lucide-react";

interface Message {
  id: string;
  sender: {
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
  };
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  aiAnalysisId?: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [newMessage, setNewMessage] = useState({
    receiverId: "",
    subject: "",
    message: "",
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    fetchDoctors();
    
    // Real-time polling: refresh messages every 3 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // If URL contains ?to=<id>, auto-open compose with that recipient selected
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const to = params.get("to");
      if (to && to !== newMessage.receiverId) {
        setIsComposing(true);
        setSelectedMessage(null);
        setNewMessage((prev) => ({ ...prev, receiverId: to }));
      }
    } catch {
      // Ignore URL parsing issues
    }
  }, [newMessage.receiverId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/messages/inbox", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/doctors/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/messages/${messageId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMessages();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const sendMessage = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newMessage,
          senderType: user.userType,
          receiverType: user.userType === "patient" ? "doctor" : "patient",
        }),
      });

      if (response.ok) {
        // Clear message input but keep compose open with same recipient
        setNewMessage((prev) => ({ ...prev, message: "", subject: "" }));
        
        // Immediately refresh messages to show sent message
        await fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Messages</h1>
          <p className="text-slate-300">Communicate with your healthcare providers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Inbox</span>
                  <Button
                    size="sm"
                    onClick={() => setIsComposing(true)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    New
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-slate-400">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-slate-400">No messages yet</p>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => {
                          setSelectedMessage(msg);
                          setIsComposing(false);
                          if (!msg.isRead) markAsRead(msg.id);
                        }}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedMessage?.id === msg.id
                            ? "bg-indigo-600/30 border border-indigo-500"
                            : "bg-slate-700/30 hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-white font-medium text-sm">
                              {msg.sender.firstName} {msg.sender.lastName}
                            </span>
                          </div>
                          {!msg.isRead && (
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm font-medium mb-1">
                          {msg.subject || "No subject"}
                        </p>
                        <p className="text-slate-400 text-xs truncate">
                          {msg.message}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message Detail or Compose */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="w-6 h-6 mr-2" />
                  {isComposing ? "Compose Message" : selectedMessage ? "Message Details" : "Select a message"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isComposing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        To (Doctor)
                      </label>
                      <select
                        value={newMessage.receiverId}
                        onChange={(e) =>
                          setNewMessage({ ...newMessage, receiverId: e.target.value })
                        }
                        className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3"
                      >
                        <option value="">Select a doctor</option>
                        {doctors.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} - {doc.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        Subject
                      </label>
                      <Input
                        value={newMessage.subject}
                        onChange={(e) =>
                          setNewMessage({ ...newMessage, subject: e.target.value })
                        }
                        placeholder="Enter subject"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        Message
                      </label>
                      <Textarea
                        value={newMessage.message}
                        onChange={(e) =>
                          setNewMessage({ ...newMessage, message: e.target.value })
                        }
                        placeholder="Type your message here..."
                        rows={10}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.receiverId || !newMessage.message}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                      <Button
                        onClick={() => setIsComposing(false)}
                        className="bg-slate-700 hover:bg-slate-600 text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : selectedMessage ? (
                  <div className="space-y-6">
                    <div className="border-b border-slate-700 pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-bold">
                              {selectedMessage.sender.firstName} {selectedMessage.sender.lastName}
                            </h3>
                            <p className="text-slate-400 text-sm">
                              {selectedMessage.sender.email}
                            </p>
                          </div>
                        </div>
                        {selectedMessage.isRead && (
                          <div className="flex items-center text-emerald-400 text-sm">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Read
                          </div>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2">
                        {selectedMessage.subject || "No subject"}
                      </h2>
                      <p className="text-slate-400 text-sm">
                        {new Date(selectedMessage.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-6">
                      <p className="text-white leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.message}
                      </p>
                    </div>
                    {selectedMessage.aiAnalysisId && (
                      <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-4">
                        <p className="text-indigo-300 text-sm">
                          📊 This message references an AI analysis
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Select a message to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
