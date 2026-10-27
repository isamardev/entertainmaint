import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Mail,
  MailOpen,
  Search,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  Send,
  ExternalLink,
  X,
  User,
  Inbox,
  Filter,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import {
  getContactMessages,
  markContactMessageRead,
  deleteContactMessage,
  clearReadContactMessages,
  type ReceivedContactMessage,
} from "@/services/contactService";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function ContactMessagesInbox() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedMessage, setSelectedMessage] = useState<ReceivedContactMessage | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [clearingRead, setClearingRead] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const {
    data: messagesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: getContactMessages,
    refetchInterval: 15_000,
  });

  const messages: ReceivedContactMessage[] = useMemo(
    () => messagesResponse?.data || [],
    [messagesResponse?.data],
  );
  const totalCount = messages.length;
  const unreadCount = useMemo(() => messages.filter((m) => !m.is_read).length, [messages]);
  const readCount = totalCount - unreadCount;

  // Filter and search
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // Status filter
      if (statusFilter === "unread" && msg.is_read) return false;
      if (statusFilter === "read" && !msg.is_read) return false;

      // Text search
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        msg.name.toLowerCase().includes(term) ||
        msg.email.toLowerCase().includes(term) ||
        msg.subject.toLowerCase().includes(term) ||
        msg.message.toLowerCase().includes(term)
      );
    });
  }, [messages, statusFilter, searchTerm]);

  // Handle Mark as Read / Unread
  async function handleToggleRead(msg: ReceivedContactMessage, e?: React.MouseEvent) {
    e?.stopPropagation();
    const newStatus = !msg.is_read;
    setActionInProgressId(msg.id);

    try {
      const ok = await markContactMessageRead(msg.id, newStatus);
      if (ok) {
        queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
        if (selectedMessage?.id === msg.id) {
          setSelectedMessage({ ...selectedMessage, is_read: newStatus });
        }
        toast.success(newStatus ? "Marked as read" : "Marked as unread");
      } else {
        toast.error("Could not update message status.");
      }
    } catch {
      toast.error("Error updating message status.");
    } finally {
      setActionInProgressId(null);
    }
  }

  // Handle Delete Single Message
  async function handleDeleteMessage(msg: ReceivedContactMessage, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!window.confirm(`Delete message from "${msg.name}"? This cannot be undone.`)) {
      return;
    }

    setActionInProgressId(msg.id);
    try {
      const ok = await deleteContactMessage(msg.id);
      if (ok) {
        queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
        if (selectedMessage?.id === msg.id) {
          setSelectedMessage(null);
        }
        toast.success("Message deleted successfully.");
      } else {
        toast.error("Could not delete message.");
      }
    } catch {
      toast.error("Error deleting message.");
    } finally {
      setActionInProgressId(null);
    }
  }

  // Handle Clear All Read Messages
  async function handleClearAllRead() {
    if (readCount === 0) {
      toast.info("No read messages to clear.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to permanently delete all ${readCount} read messages? Unread messages will be preserved.`,
      )
    ) {
      return;
    }

    setClearingRead(true);
    try {
      const ok = await clearReadContactMessages();
      if (ok) {
        queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
        if (selectedMessage?.is_read) {
          setSelectedMessage(null);
        }
        toast.success(`Cleared ${readCount} read messages.`);
      } else {
        toast.error("Failed to clear read messages.");
      }
    } catch {
      toast.error("Error clearing read messages.");
    } finally {
      setClearingRead(false);
    }
  }

  // Open Message Modal (automatically mark as read)
  async function openMessage(msg: ReceivedContactMessage) {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      await markContactMessageRead(msg.id, true);
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      setSelectedMessage({ ...msg, is_read: true });
    }
  }

  // Copy Email to Clipboard
  function copyEmail(email: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    toast.success(`Copied "${email}" to clipboard.`);
    setTimeout(() => setCopiedEmail(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Inquiries */}
        <div className="border border-neutral-200 bg-white p-5 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Total Inquiries
            </div>
            <div className="text-3xl font-black mt-1 text-black">{totalCount}</div>
            <div className="text-xs text-neutral-500 mt-1">Submitted via /contact</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        {/* Unread */}
        <div
          onClick={() => setStatusFilter("unread")}
          className={`border cursor-pointer transition-all p-5 rounded-lg shadow-sm flex items-center justify-between ${
            statusFilter === "unread"
              ? "border-black bg-neutral-100 ring-2 ring-black"
              : "border-neutral-200 bg-white hover:border-black/40"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Unread Messages
              </span>
              {unreadCount > 0 && (
                <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              )}
            </div>
            <div className="text-3xl font-black mt-1 text-black flex items-baseline gap-2">
              {unreadCount}
              {unreadCount > 0 && (
                <span className="text-xs font-bold bg-black text-white px-2 py-0.5 rounded uppercase tracking-wider">
                  Needs Attention
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {unreadCount === 0 ? "Inbox is fully caught up" : "Awaiting response"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-black font-black">
            <Mail className="w-6 h-6 text-black" />
          </div>
        </div>

        {/* Read */}
        <div
          onClick={() => setStatusFilter("read")}
          className={`border cursor-pointer transition-all p-5 rounded-lg shadow-sm flex items-center justify-between ${
            statusFilter === "read"
              ? "border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900"
              : "border-neutral-200 bg-white hover:border-neutral-400"
          }`}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Read / Handled
            </div>
            <div className="text-3xl font-black mt-1 text-black">{readCount}</div>
            <div className="text-xs text-neutral-500 mt-1">Processed inquiries</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search & Actions */}
      <div className="border border-neutral-200 bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by sender name, email, subject, or message content..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:border-black transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start md:self-auto bg-neutral-100 p-1 rounded-md text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded transition-all ${
              statusFilter === "all"
                ? "bg-black text-white shadow-sm"
                : "text-neutral-600 hover:bg-black hover:text-white"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("unread")}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              statusFilter === "unread"
                ? "bg-black text-white shadow-sm"
                : "text-neutral-600 hover:bg-black hover:text-white"
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  statusFilter === "unread"
                    ? "bg-white text-black"
                    : "bg-black text-white"
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("read")}
            className={`px-3 py-1.5 rounded transition-all ${
              statusFilter === "read"
                ? "bg-black text-white shadow-sm"
                : "text-neutral-600 hover:bg-black hover:text-white"
            }`}
          >
            Read ({readCount})
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh messages"
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 rounded hover:bg-black hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {readCount > 0 && (
            <button
              type="button"
              onClick={handleClearAllRead}
              disabled={clearingRead}
              title="Delete all read messages to clean up inbox"
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="border border-neutral-200 bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
            <p className="text-sm font-medium">Loading received inquiries...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 mx-auto flex items-center justify-center text-neutral-400">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="font-bold text-lg text-black">
                {searchTerm
                  ? "No matching messages found"
                  : statusFilter === "unread"
                    ? "No unread messages"
                    : statusFilter === "read"
                      ? "No read messages"
                      : "No contact messages received yet"}
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                {searchTerm
                  ? `No inquiries match "${searchTerm}". Try adjusting your search or filter.`
                  : "Messages submitted by readers and partners on the public /contact page will appear right here with full details."}
              </p>
            </div>

            {totalCount === 0 && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/contact"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-black text-white rounded hover:bg-neutral-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Public Contact Page
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {filteredMessages.map((msg) => {
              const isUnread = !msg.is_read;
              const isBusy = actionInProgressId === msg.id;

              return (
                <div
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  className={`group relative p-4 sm:p-5 cursor-pointer transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                    isUnread
                      ? "bg-neutral-50 hover:bg-neutral-100 border-l-4 border-black font-medium"
                      : "hover:bg-neutral-50 border-l-4 border-transparent"
                  }`}
                >
                  {/* Left: Status Indicator & Sender Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                    <button
                      type="button"
                      title={isUnread ? "Click to mark as read" : "Click to mark as unread"}
                      onClick={(e) => handleToggleRead(msg, e)}
                      disabled={isBusy}
                      className="mt-1 flex-shrink-0 text-neutral-400 hover:text-black transition-colors"
                    >
                      {isUnread ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white font-black text-[10px] ring-2 ring-neutral-300">
                          ●
                        </span>
                      ) : (
                        <MailOpen className="w-5 h-5 text-neutral-300 hover:text-neutral-600" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Top line: Name, Email & Timestamp */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-sm ${
                            isUnread ? "font-black text-black" : "font-semibold text-neutral-800"
                          }`}
                        >
                          {msg.name}
                        </span>

                        <span className="text-xs text-neutral-400">•</span>

                        <a
                          href={`mailto:${msg.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-neutral-600 hover:text-black underline underline-offset-2 flex items-center gap-1 truncate max-w-[200px]"
                          title={`Send email to ${msg.email}`}
                        >
                          <Mail className="w-3 h-3" />
                          {msg.email}
                        </a>

                        <button
                          type="button"
                          onClick={(e) => copyEmail(msg.email, e)}
                          title="Copy email address"
                          className="text-neutral-400 hover:text-black p-0.5"
                        >
                          <Copy className="w-3 h-3" />
                        </button>

                        <div className="ml-auto text-xs text-neutral-500 flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span>{timeAgo(msg.created_at)}</span>
                          <span className="hidden sm:inline text-neutral-400">
                            ({formatDate(msg.created_at)})
                          </span>
                        </div>
                      </div>

                      {/* Subject Line */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-sm ${
                            isUnread
                              ? "font-extrabold text-black"
                              : "font-semibold text-neutral-900"
                          }`}
                        >
                          {msg.subject || "General Inquiry"}
                        </span>
                        {isUnread && (
                          <span className="bg-black text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                            New
                          </span>
                        )}
                      </div>

                      {/* Message Preview (truncated snippet) */}
                      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions Bar (Quick buttons) */}
                  <div className="flex items-center gap-1.5 self-end md:self-center flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMessage(msg);
                      }}
                      className="px-2.5 py-1 text-xs font-bold border border-neutral-200 rounded hover:bg-black hover:text-white text-neutral-700 transition-colors"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      title={isUnread ? "Mark as read" : "Mark as unread"}
                      onClick={(e) => handleToggleRead(msg, e)}
                      disabled={isBusy}
                      className="p-1.5 text-neutral-400 hover:text-black transition-colors rounded hover:bg-neutral-100"
                    >
                      {isUnread ? (
                        <CheckCircle className="w-4 h-4 text-neutral-600" />
                      ) : (
                        <Mail className="w-4 h-4 text-neutral-400" />
                      )}
                    </button>

                    <button
                      type="button"
                      title="Delete message"
                      onClick={(e) => handleDeleteMessage(msg, e)}
                      disabled={isBusy}
                      className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Detail View Modal */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="bg-white border-2 border-black max-w-2xl w-full rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b-2 border-black bg-black text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-white" />
                <h3 className="font-black uppercase tracking-wider text-sm sm:text-base">
                  Contact Inquiry Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="text-neutral-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Meta details */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Subject
                  </span>
                  <span className="font-extrabold text-black">
                    {selectedMessage.subject || "General Inquiry"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    From (Sender)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-black">{selectedMessage.name}</span>
                    <span className="text-neutral-400">•</span>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="font-medium text-black underline hover:text-neutral-600 transition-colors"
                    >
                      {selectedMessage.email}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyEmail(selectedMessage.email)}
                      title="Copy email"
                      className="text-neutral-400 hover:text-black p-0.5"
                    >
                      {copiedEmail ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Date Received
                  </span>
                  <span className="text-neutral-700">
                    {formatDate(selectedMessage.created_at)} ({timeAgo(selectedMessage.created_at)})
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Message Body
                </div>
                <div className="bg-white border border-neutral-300 rounded-lg p-4 text-sm text-neutral-900 leading-relaxed whitespace-pre-wrap font-sans select-text">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-neutral-200 bg-neutral-50 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleRead(selectedMessage)}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-neutral-300 rounded hover:bg-black hover:text-white transition-colors"
                >
                  {selectedMessage.is_read ? "Mark as Unread" : "Mark as Read"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(selectedMessage)}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-red-200 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-black text-white hover:bg-neutral-800 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
