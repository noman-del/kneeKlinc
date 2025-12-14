import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, User, ArrowLeft, Image as ImageIcon, X } from "lucide-react";

interface Conversation {
  userId: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  profileImage?: string;
  userType: string;
  title?: string;
  specialization?: string;
  experience?: string;
  hospital?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  isMine: boolean;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentOriginalName?: string;
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initial load + poll conversations list
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUserId(user.id);
    fetchConversations();

    const convInterval = setInterval(() => {
      fetchConversations();
    }, 3000);

    return () => clearInterval(convInterval);
  }, []);

  // Check for ?to= parameter and auto-open conversation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toUserId = params.get("to");
    if (toUserId) {
      // Always try to fetch user details and open chat
      fetchUserDetails(toUserId);
    }
  }, []);

  // When a conversation is active, poll its messages
  useEffect(() => {
    if (!activeConversation) return;
    fetchChatMessages(activeConversation.userId);

    const chatInterval = setInterval(() => {
      fetchChatMessages(activeConversation.userId);
    }, 3000);

    return () => clearInterval(chatInterval);
  }, [activeConversation]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentError(null);

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setAttachmentError("Only image files (JPG, PNG, GIF, WEBP) are allowed.");
      setSelectedFile(null);
      setAttachmentPreviewUrl(null);
      return;
    }

    if (file.size > maxSize) {
      setAttachmentError("Image is too large. Maximum size is 10MB.");
      setSelectedFile(null);
      setAttachmentPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setAttachmentPreviewUrl(objectUrl);
  };

  const clearAttachment = () => {
    if (attachmentPreviewUrl) {
      URL.revokeObjectURL(attachmentPreviewUrl);
    }
    setSelectedFile(null);
    setAttachmentPreviewUrl(null);
    setAttachmentError(null);
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setErrorMessage("User not found. Cannot start conversation.");
        return;
      }

      const data = await response.json();
      if (data.user) {
        const newConv: Conversation = {
          userId: data.user.id,
          name: `${data.user.firstName} ${data.user.lastName}`,
          lastMessage: "",
          lastMessageTime: "",
          unreadCount: 0,
          userType: data.user.userType,
          title: data.user.title,
          specialization: data.user.specialization,
          experience: data.user.experience,
          hospital: data.user.hospital,
        };
        setActiveConversation(newConv);
        setChatMessages([]);
        setErrorMessage(null);
        // Fetch messages which will mark them as read
        await fetchChatMessages(data.user.id);
        // Refresh conversations to update unread count
        await fetchConversations();
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      setErrorMessage("Failed to load user details. Please try again.");
    }
  };

  const fetchChatMessages = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/messages/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setChatMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to fetch chat messages:", error);
    }
  };

  const openConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    await fetchChatMessages(conv.userId);
    // Refresh conversations list to update unread count
    await fetchConversations();
  };

  const sendMessage = async () => {
    if (!activeConversation) return;

    if (!messageInput.trim() && !selectedFile) return;

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      let attachmentPayload: { attachmentUrl?: string; attachmentType?: string; attachmentOriginalName?: string } = {};

      if (selectedFile) {
        // Upload attachment first
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResp = await fetch("/api/messages/attachments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResp.ok) {
          const err = await uploadResp.json().catch(() => ({}));
          setAttachmentError(err.message || "Failed to upload attachment");
          return; // Do not send message if attachment failed
        }

        const uploadData = await uploadResp.json();
        attachmentPayload = {
          attachmentUrl: uploadData.attachmentUrl,
          attachmentType: "image",
          attachmentOriginalName: uploadData.originalName,
        };
      }

      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: activeConversation.userId,
          message: messageInput,
          senderType: user.userType,
          receiverType: activeConversation.userType,
          ...attachmentPayload,
        }),
      });

      if (response.ok) {
        setMessageInput("");
        setErrorMessage(null);
        clearAttachment();
        await fetchChatMessages(activeConversation.userId);
        await fetchConversations();
      } else {
        const errorData = await response.json();
        console.error("Send message failed:", response.status, errorData);
        setErrorMessage(errorData.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setErrorMessage("Network error: Could not send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-4">
      <div className="max-w-[1600px] mx-auto h-full flex flex-col">
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
          <p className="text-slate-300">Chat with your healthcare providers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Conversations List */}
          <div className={`lg:col-span-4 ${activeConversation ? "hidden lg:block" : ""} h-full flex flex-col min-h-0`}>
            <Card className="bg-slate-800/50 border-slate-700 flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-white font-semibold text-lg">Conversations</h2>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {loading ? (
                  <p className="text-slate-400 p-4">Loading...</p>
                ) : conversations.length === 0 ? (
                  <div className="text-center p-8">
                    <p className="text-slate-400">No conversations yet</p>
                    <p className="text-slate-500 text-sm mt-2">Start by booking an appointment</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {conversations.map((conv) => (
                      <div key={conv.userId} onClick={() => openConversation(conv)} className={`p-4 rounded-lg cursor-pointer transition-all ${activeConversation?.userId === conv.userId ? "bg-indigo-600/30 border border-indigo-500" : "bg-slate-700/30 hover:bg-slate-700/50"}`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">{conv.profileImage ? <img src={conv.profileImage} alt={conv.name} className="w-full h-full rounded-full object-cover" /> : <User className="w-6 h-6 text-white" />}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-white font-medium truncate">{conv.name}</h3>
                              {conv.unreadCount > 0 && <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5 ml-2">{conv.unreadCount}</span>}
                            </div>
                            <p className="text-slate-400 text-sm truncate">{conv.lastMessage || "No messages yet"}</p>
                            {conv.lastMessageTime && <p className="text-slate-500 text-xs mt-1">{new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Chat Window */}
          {activeConversation && (
            <div className="lg:col-span-8 h-full flex flex-col min-h-0">
              <Card className="bg-slate-800/50 border-slate-700 flex-1 flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-700 flex items-center space-x-3 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="lg:hidden text-white" onClick={() => setActiveConversation(null)}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">{activeConversation.profileImage ? <img src={activeConversation.profileImage} alt={activeConversation.name} className="w-full h-full rounded-full object-cover" /> : <User className="w-6 h-6 text-white" />}</div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">
                      {activeConversation.userType === "doctor" && activeConversation.title ? `${activeConversation.title} ` : ""}
                      {activeConversation.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm">
                      <p className="text-slate-400 capitalize">{activeConversation.userType}</p>
                      {activeConversation.specialization && (
                        <>
                          <span className="text-slate-600">•</span>
                          <p className="text-indigo-400">{activeConversation.specialization}</p>
                        </>
                      )}
                      {activeConversation.experience && (
                        <>
                          <span className="text-slate-600">•</span>
                          <p className="text-slate-400">{activeConversation.experience}</p>
                        </>
                      )}
                    </div>
                    {activeConversation.hospital && <p className="text-slate-500 text-xs mt-0.5">{activeConversation.hospital}</p>}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {errorMessage ? (
                    <div className="text-center py-12">
                      <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-red-300 font-medium">{errorMessage}</p>
                      </div>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.isMine ? "bg-indigo-600 text-white" : "bg-slate-700 text-white"}`}>
                          {msg.attachmentUrl && (
                            <div className="mb-2">
                              <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" download={msg.attachmentOriginalName || true}>
                                <img src={msg.attachmentUrl} alt={msg.attachmentOriginalName || "Attachment"} className="max-h-64 rounded-lg border border-slate-600 mb-1 object-contain" />
                              </a>
                              <a href={msg.attachmentUrl} download={msg.attachmentOriginalName || true} className={`text-xs underline ${msg.isMine ? "text-indigo-100" : "text-slate-200"}`}>
                                Download image{msg.attachmentOriginalName ? ` (${msg.attachmentOriginalName})` : ""}
                              </a>
                            </div>
                          )}
                          {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                          <p className={`text-xs mt-1 ${msg.isMine ? "text-indigo-200" : "text-slate-400"}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-700 flex-shrink-0">
                  {attachmentError && <p className="text-xs text-red-400 mb-2">{attachmentError}</p>}
                  {selectedFile && attachmentPreviewUrl && (
                    <div className="mb-2 flex items-center justify-between bg-slate-700/60 border border-slate-600 rounded-lg p-2">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-slate-200" />
                        <span className="text-xs text-slate-100 truncate max-w-[200px]">{selectedFile.name}</span>
                      </div>
                      <button type="button" onClick={clearAttachment} className="text-slate-300 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <button type="button" onClick={handleAttachmentClick} className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <Input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type a message..." className="flex-1 bg-slate-700 border-slate-600 text-white" />
                    <Button onClick={sendMessage} disabled={!messageInput.trim() && !selectedFile} className="bg-indigo-600 hover:bg-indigo-700">
                      <Send className="w-5 h-5" />
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAttachmentChange} />
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
