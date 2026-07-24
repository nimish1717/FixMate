import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import ChatBubble from "../../components/chat/ChatBubble";
import ChatInput from "../../components/chat/ChatInput";
import { chatService } from "../../services/chatService";
import { bookingService } from "../../services/bookingService";
import { useSocket } from "../../hooks/useSocket";
import { useAuthStore } from "../../store/authStore";

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function ChatPage() {
    const { id: bookingId } = useParams(); // chat is per-booking
    const navigate = useNavigate();
    const socket = useSocket();
    const currentUser = useAuthStore((state) => state.user);

    const [messages, setMessages] = useState([]);
    const [workerName, setWorkerName] = useState("Worker");
    const [bookingStatus, setBookingStatus] = useState("pending");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    // Load booking (for worker name) + chat history
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const bookingData = await bookingService.getById(bookingId);
                const booking = bookingData.booking || bookingData;
                setWorkerName(booking.worker?.user?.name || "Worker");
                setBookingStatus(booking.status);

                try {
                    const msgData = await chatService.getMessages(bookingId);
                    setMessages(msgData.messages || msgData || []);
                } catch {
                    // chat history endpoint may not exist yet — start empty, live messages still work
                    setMessages([]);
                }
            } catch {
                // booking fetch failed — still allow chat UI with default name
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [bookingId]);

    // Socket: join room, listen for new messages
    useEffect(() => {
        if (!socket) return;

        const joinRoom = () => socket.emit("booking:join", bookingId);
        joinRoom(); // Join immediately on mount
        socket.on("connect", joinRoom); // Re-join if socket reconnects after server restart

        const handleNewMessage = (message) => {
            setMessages((prev) => [...prev, message]);
        };

        socket.on("chat:new", handleNewMessage);

        return () => {
            socket.emit("booking:leave", bookingId);
            socket.off("connect", joinRoom);
            socket.off("chat:new", handleNewMessage);
        };
    }, [socket, bookingId]);

    // Auto-scroll to bottom on new message
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (text) => {
        if (!socket) return;
        const message = {
            bookingId,
            text,
            senderId: currentUser?._id || currentUser?.id,
            timestamp: new Date().toISOString(),
        };
        socket.emit("chat:send", message);
        // Optimistically add removed! We now rely purely on the chat:new broadcast 
        // from the backend, which emits to everyone in the booking room.
    };

    return (
        <PageWrapper>
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ArrowLeft size={20} />
                </button>
                <div className="w-9 h-9 rounded-[10px] bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold">
                    {workerName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-sm font-semibold text-[#1e1b4b] flex items-center gap-1.5">
                        {workerName}
                        <ShieldCheck size={13} className="text-green-500" />
                    </h1>
                    <p className="text-xs text-gray-500">Online</p>
                </div>
            </div>

            <div className="max-w-[560px] mx-auto mt-6 flex flex-col" style={{ height: "calc(100vh - 220px)" }}>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-1 pb-4">
                    {loading && (
                        <div className="flex flex-col gap-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white border border-[#ede9fe] rounded-2xl h-[44px] w-2/3 animate-pulse" />
                            ))}
                        </div>
                    )}

                    {!loading && messages.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-sm text-gray-400">No messages yet. Say hello 👋</p>
                        </div>
                    )}

                    {messages.map((msg, i) => {
                        const isOwn = msg.senderId === (currentUser?._id || currentUser?.id);
                        return (
                            <ChatBubble
                                key={msg._id || i}
                                text={msg.text}
                                time={formatTime(msg.timestamp || msg.createdAt)}
                                isOwn={isOwn}
                            />
                        );
                    })}
                    <div ref={scrollRef} />
                </div>

                {/* Input */}
                {["completed", "payment_completed", "review_submitted", "cancelled"].includes(bookingStatus) ? (
                    <div className="text-center py-4 bg-gray-50 border-t border-[#ede9fe]">
                        <p className="text-sm font-semibold text-gray-500">Chat is disabled for closed bookings.</p>
                    </div>
                ) : (
                    <ChatInput onSend={handleSend} disabled={!socket} />
                )}
            </div>
        </PageWrapper>
    );
}