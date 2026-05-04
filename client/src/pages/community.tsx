import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, ThumbsUp, CheckCircle2, Users, Clock } from "lucide-react";

interface CommunityPost {
  id: string;
  authorName: string;
  authorRole: "doctor" | "patient" | string;
  isVerifiedDoctor: boolean;
  content: string;
  createdAt: string;
  likesCount: number;
  repliesCount: number;
  likedByCurrentUser: boolean;
  isOwner?: boolean;
}

interface CommunityReply {
  id: string;
  postId: string;
  authorName: string;
  authorRole: "doctor" | "patient" | string;
  isVerifiedDoctor: boolean;
  content: string;
  createdAt: string;
  likesCount: number;
  likedByCurrentUser: boolean;
  isOwner?: boolean;
}

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, CommunityReply[]>>({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingRepliesFor, setLoadingRepliesFor] = useState<string | null>(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const [creatingReplyFor, setCreatingReplyFor] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [newReply, setNewReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostContent, setEditingPostContent] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyContent, setEditingReplyContent] = useState("");

  // Initial load with loading state (runs once)
  useEffect(() => {
    fetchPosts(true);
  }, []);

  // Background polling so new posts/replies auto-appear (silent, no loading)
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchPosts(false);
      if (selectedPostId) {
        fetchReplies(selectedPostId, false);
      }
    }, 7000);
    return () => clearInterval(intervalId);
  }, [selectedPostId]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchPosts = async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setLoadingPosts(true);
      }
      if (showLoading) {
        // Only clear/show error for explicit loads, not background polling
        setError(null);
      }
      const res = await fetch("/api/community/posts", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error("Failed to load community posts");
      }
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Error loading posts", err);
      if (showLoading) {
        setError("Could not load community right now. Please try again.");
      }
    } finally {
      if (showLoading) {
        setLoadingPosts(false);
      }
    }
  };

  const startEditPost = (post: CommunityPost) => {
    setEditingPostId(post.id);
    setEditingPostContent(post.content);
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditingPostContent("");
  };

  const saveEditPost = async (postId: string) => {
    const trimmed = editingPostContent.trim();
    if (!trimmed) return;
    try {
      setError(null);
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to update post");
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                content: trimmed,
              }
            : p,
        ),
      );
      cancelEditPost();
    } catch (err: any) {
      console.error("Error updating post", err);
      setError(err.message || "Could not update post. Please try again.");
    }
  };

  const startEditReply = (reply: CommunityReply) => {
    setEditingReplyId(reply.id);
    setEditingReplyContent(reply.content);
  };

  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditingReplyContent("");
  };

  const saveEditReply = async (replyId: string, postId: string) => {
    const trimmed = editingReplyContent.trim();
    if (!trimmed) return;
    try {
      setError(null);
      const res = await fetch(`/api/community/replies/${replyId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to update reply");
      }
      setReplies((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((r) =>
          r.id === replyId
            ? {
                ...r,
                content: trimmed,
              }
            : r,
        ),
      }));
      cancelEditReply();
    } catch (err: any) {
      console.error("Error updating reply", err);
      setError(err.message || "Could not update reply. Please try again.");
    }
  };

  const fetchReplies = async (postId: string, showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setLoadingRepliesFor(postId);
      }
      if (showLoading) {
        setError(null);
      }
      const res = await fetch(`/api/community/posts/${postId}/replies`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error("Failed to load replies");
      }
      const data = await res.json();
      setReplies((prev) => ({ ...prev, [postId]: data.replies || [] }));
    } catch (err) {
      console.error("Error loading replies", err);
      if (showLoading) {
        setError("Could not load replies. Please try again.");
      }
    } finally {
      if (showLoading) {
        setLoadingRepliesFor(null);
      }
    }
  };

  const handleCreatePost = async () => {
    if (!newQuestion.trim()) return;
    try {
      setCreatingPost(true);
      setError(null);
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: newQuestion.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to create post");
      }
      setNewQuestion("");
      await fetchPosts(false);
    } catch (err: any) {
      console.error("Error creating post", err);
      setError(err.message || "Could not create post. Please try again.");
    } finally {
      setCreatingPost(false);
    }
  };

  const handleCreateReply = async (postId: string) => {
    if (!newReply.trim()) return;
    try {
      setCreatingReplyFor(postId);
      setError(null);
      const res = await fetch(`/api/community/posts/${postId}/replies`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: newReply.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to create reply");
      }
      setNewReply("");
      // Refresh replies and posts silently after sending
      await fetchReplies(postId, false);
      await fetchPosts(false);
    } catch (err: any) {
      console.error("Error creating reply", err);
      setError(err.message || "Could not create reply. Please try again.");
    } finally {
      setCreatingReplyFor(null);
    }
  };

  const toggleLikePost = async (postId: string) => {
    try {
      setError(null);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByCurrentUser: !p.likedByCurrentUser,
                likesCount: p.likedByCurrentUser ? p.likesCount - 1 : p.likesCount + 1,
              }
            : p,
        ),
      );
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error("Failed to update like");
      }
    } catch (err) {
      console.error("Error liking post", err);
      setError("Could not update like. Please try again.");
      // Optionally refetch to fix state
      fetchPosts();
    }
  };

  const toggleLikeReply = async (replyId: string, postId: string) => {
    try {
      setError(null);
      setReplies((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((r) =>
          r.id === replyId
            ? {
                ...r,
                likedByCurrentUser: !r.likedByCurrentUser,
                likesCount: r.likedByCurrentUser ? r.likesCount - 1 : r.likesCount + 1,
              }
            : r,
        ),
      }));
      const res = await fetch(`/api/community/replies/${replyId}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error("Failed to update like");
      }
    } catch (err) {
      console.error("Error liking reply", err);
      setError("Could not update like. Please try again.");
      if (postId) {
        fetchReplies(postId);
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete post");
      }
      if (selectedPostId === postId) {
        setSelectedPostId(null);
      }
      // Remove from local state
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      console.error("Error deleting post", err);
      setError(err.message || "Could not delete post. Please try again.");
    }
  };

  const handleDeleteReply = async (replyId: string, postId: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/community/replies/${replyId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete reply");
      }
      setReplies((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((r) => r.id !== replyId),
      }));
      // Also decrement repliesCount for the post
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                repliesCount: Math.max(0, p.repliesCount - 1),
              }
            : p,
        ),
      );
    } catch (err: any) {
      console.error("Error deleting reply", err);
      setError(err.message || "Could not delete reply. Please try again.");
    }
  };

  const handleSelectPost = (postId: string) => {
    if (selectedPostId === postId) {
      setSelectedPostId(null);
      return;
    }
    setSelectedPostId(postId);
    if (!replies[postId]) {
      fetchReplies(postId, true);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  const isDoctor = (user as any)?.userType === "doctor";

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 py-10">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-ac-muted flex items-center justify-center">
              <Users className="w-5 h-5 text-ac" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-th tracking-tight">Community Q&A</h1>
              <p className="text-tm text-sm">Ask questions and get answers from doctors and patients in the KneeKlinic community.</p>
            </div>
          </div>
        </div>

        {error && <div className="mb-6 bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1">
            <Card className="bg-surface border-bd p-6 space-y-5">
              <h2 className="text-lg font-semibold text-th flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-ac" />
                <span>Ask the community</span>
              </h2>
              <p className="text-sm text-tm">Your question will be visible to all verified doctors and patients. Please do not share personal identifiers.</p>
              <Textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Type your question here..." className="min-h-[140px] bg-ib border-ibr text-th placeholder:text-tm text-sm" />
              <div className="flex items-center justify-between text-sm text-tm">
                <span>{newQuestion.trim().length} / 400</span>
                {isDoctor && (
                  <span className="text-ac flex items-center space-x-2 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Posting as verified doctor</span>
                  </span>
                )}
              </div>
              <Button onClick={handleCreatePost} disabled={!newQuestion.trim() || creatingPost} className="w-full bg-ac hover:bg-ac-hover text-primary-foreground font-medium mt-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200">
                {creatingPost ? "Posting..." : "Post question"}
              </Button>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-th flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-ac" />
                <span>Latest questions</span>
              </h2>
            </div>

            {loadingPosts ? (
              <div className="bg-surface border border-bd rounded-lg p-6 text-center text-tm">Loading community...</div>
            ) : posts.length === 0 ? (
              <div className="bg-surface border border-bd rounded-lg p-6 text-center text-tm">No questions posted yet. Be the first to ask!</div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  const isSelected = selectedPostId === post.id;
                  const postReplies = replies[post.id] || [];
                  const doctorBadge = post.authorRole === "doctor";

                  return (
                    <Card key={post.id} className="bg-surface border-bd p-6 hover:border-bs transition-colors duration-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="text-base font-semibold text-th">{post.authorName}</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-alt text-ts capitalize">{post.authorRole}</span>
                            {post.isVerifiedDoctor && (
                              <span className="flex items-center text-xs text-emerald-400 space-x-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Verified doctor</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-tm flex items-center space-x-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDate(post.createdAt)}</span>
                          </p>
                        </div>
                        {post.isOwner && (
                          <div className="flex items-center space-x-3 ml-4 text-sm">
                            {editingPostId === post.id ? (
                              <>
                                <button onClick={() => saveEditPost(post.id)} className="text-emerald-300 hover:text-emerald-200 hover:underline">
                                  Save
                                </button>
                                <button onClick={cancelEditPost} className="text-ts hover:text-th hover:underline">
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditPost(post)} className="text-ac hover:text-ac-hover hover:underline">
                                  Edit
                                </button>
                                <button onClick={() => handleDeletePost(post.id)} className="text-red-300 hover:text-red-200 hover:underline">
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {editingPostId === post.id ? <Textarea value={editingPostContent} onChange={(e) => setEditingPostContent(e.target.value)} className="mt-5 text-base bg-surface border-bd text-th whitespace-pre-wrap break-words" rows={5} /> : <p className="mt-5 text-base text-tb whitespace-pre-wrap break-words">{post.content}</p>}

                      <div className="mt-6 flex items-center justify-between text-sm text-tm">
                        <div className="flex items-center space-x-6">
                          <button onClick={() => toggleLikePost(post.id)} className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm transition-colors ${post.likedByCurrentUser ? "bg-ac/20 text-ac border-ac/30" : "border-bd text-tm hover:border-ac/30 hover:text-ac"}`}>
                            <ThumbsUp className="w-4 h-4" />
                            <span>{post.likesCount}</span>
                          </button>
                          <button type="button" onClick={() => handleSelectPost(post.id)} className="flex items-center space-x-2 text-sm text-ts hover:text-th">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.repliesCount} replies</span>
                          </button>
                        </div>
                        {isSelected && (
                          <button type="button" onClick={() => handleSelectPost(post.id)} className="text-sm text-ac hover:text-ac-hover hover:underline">
                            Collapse replies
                          </button>
                        )}
                      </div>

                      {isSelected && (
                        <div className="mt-6 border-t border-bd pt-5 space-y-5">
                          {loadingRepliesFor === post.id ? (
                            <div className="text-sm text-tm">Loading replies...</div>
                          ) : postReplies.length === 0 ? (
                            <div className="text-sm text-tm">No replies yet. Be the first to respond.</div>
                          ) : (
                            <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                              {postReplies.map((reply) => (
                                <div key={reply.id} className="rounded-lg bg-surface-alt border border-bd px-5 py-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-sm font-semibold text-th">{reply.authorName}</span>
                                      <span className="text-xs px-2.5 py-1 rounded-full bg-surface text-ts capitalize">{reply.authorRole}</span>
                                      {reply.isVerifiedDoctor && (
                                        <span className="flex items-center text-xs text-ac space-x-1">
                                          <CheckCircle2 className="w-4 h-4" />
                                          <span>Doctor</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <span className="text-sm text-tm">{formatDate(reply.createdAt)}</span>
                                      {reply.isOwner && (
                                        <div className="flex items-center space-x-3 text-sm">
                                          {editingReplyId === reply.id ? (
                                            <>
                                              <button onClick={() => saveEditReply(reply.id, post.id)} className="text-emerald-300 hover:text-emerald-200 hover:underline">
                                                Save
                                              </button>
                                              <button onClick={cancelEditReply} className="text-ts hover:text-th hover:underline">
                                                Cancel
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button onClick={() => startEditReply(reply)} className="text-ac hover:text-ac-hover hover:underline">
                                                Edit
                                              </button>
                                              <button onClick={() => handleDeleteReply(reply.id, post.id)} className="text-red-300 hover:text-red-200 hover:underline">
                                                Delete
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {editingReplyId === reply.id ? <Textarea value={editingReplyContent} onChange={(e) => setEditingReplyContent(e.target.value)} className="text-sm bg-surface border-bd text-th whitespace-pre-wrap break-words mt-2" rows={4} /> : <p className="text-sm text-tb whitespace-pre-wrap break-words">{reply.content}</p>}
                                  <div className="mt-3 flex items-center justify-between text-sm text-tm">
                                    <button onClick={() => toggleLikeReply(reply.id, post.id)} className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${reply.likedByCurrentUser ? "bg-ac/20 text-ac border-ac/30" : "border-bd text-tm hover:border-ac/30 hover:text-ac"}`}>
                                      <ThumbsUp className="w-4 h-4" />
                                      <span>{reply.likesCount}</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="pt-1 space-y-2">
                            <Input
                              value={newReply}
                              onChange={(e) => setNewReply(e.target.value)}
                              onFocus={() => {
                                if (!isSelected) {
                                  handleSelectPost(post.id);
                                }
                              }}
                              placeholder="Write a reply..."
                              className="bg-ib border-ibr text-th placeholder:text-tm text-sm"
                            />
                            <div className="flex justify-end">
                              <Button size="sm" onClick={() => handleCreateReply(post.id)} disabled={!newReply.trim() || creatingReplyFor === post.id} className="bg-ac hover:bg-ac-hover text-primary-foreground text-xs px-4 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200">
                                {creatingReplyFor === post.id ? "Posting..." : "Reply"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
