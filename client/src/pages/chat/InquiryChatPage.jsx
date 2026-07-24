import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Store } from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";
import ChatBubble from "../../components/chat/ChatBubble";
import ChatInput from "../../components/chat/ChatInput";
import { inquiryService } from "../../services/inquiryService";
import { useSocket } from "../../hooks/useSocket";
import { useAuthStore } from "../../store/authStore";

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function InquiryChatPage() {
    const { inquiryId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const currentUser = useAuthStore((state) => state.user);

    const [messages, setMessages] = useState([]);
    const [shopName, setShopName] = useState("Shop");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await inquiryService.getInquiryById(inquiryId);
                const inquiry = res.inquiry;
                if (currentUser.role === "shopkeeper") {
                    setShopName(inquiry.user?.name || "Customer");
                } else {
                    setShopName(inquiry.shop?.shopName || "Hardware Store");
                }

                try {
                    const msgData = await inquiryService.getMessages(inquiryId);
                    setMessages(msgData.messages || []);
                } catch {
                    setMessages([]);
                }
            } catch {
                // Ignore
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [inquiryId, currentUser.role]);

    useEffect(() => {
        if (!socket) return;

        const joinRoom = () => socket.emit("inquiry:join", inquiryId);
        joinRoom();
        socket.on("connect", joinRoom);

        const handleNewMessage = (message) => {
            if (message.inquiryId === inquiryId) {
                setMessages((prev) => [...prev, message]);
            }
        };

        socket.on("chat:new", handleNewMessage);

        return () => {
            socket.emit("inquiry:leave", inquiryId);
            socket.off("connect", joinRoom);
            socket.off("chat:new", handleNewMessage);
        };
    }, [socket, inquiryId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (text) => {
        if (!socket) return;
        const message = {
            inquiryId,
            text,
            senderId: currentUser?._id || currentUser?.id,
            timestamp: new Date().toISOString(),
        };
        socket.emit("chat:send", message);
    };

    return (
        <PageWrapper>
            <div className="flex items-center gap-3 mb-1">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ArrowLeft size={20} />
                </button>
                <div className="w-9 h-9 rounded-[10px] bg-indigo-100 text-indigo-800 flex items-center justify-center text-sm font-bold">
                    <Store size={16} />
                </div>
                <div>
                    <h1 className="text-sm font-semibold text-[#1e1b4b]">
                        {shopName}
                    </h1>
                    <p className="text-xs text-gray-500">Parts Inquiry</p>
                </div>
            </div>

            <div className="max-w-[560px] mx-auto mt-6 flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
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
                            <p className="text-sm text-gray-400">Ask about spare parts availability and prices.</p>
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

                <ChatInput onSend={handleSend} disabled={!socket} placeholder="Ask about item or price..." />
            </div>
        </PageWrapper>
    );
}
