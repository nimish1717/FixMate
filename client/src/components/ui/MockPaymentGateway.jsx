import React, { useState } from 'react';
import { IndianRupee, ShieldCheck, CheckCircle2, Loader2, X } from 'lucide-react';

export default function MockPaymentGateway({ amount = 5, onSuccess, onClose }) {
    const [status, setStatus] = useState("idle"); // idle, processing, success
    const [selectedMethod, setSelectedMethod] = useState("upi");

    const handlePay = () => {
        setStatus("processing");
        setTimeout(() => {
            setStatus("success");
            setTimeout(() => {
                onSuccess();
            }, 1000); // Wait 1s on success screen before triggering callback
        }, 2000); // 2s simulated processing time
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[400px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="bg-[#0f172a] p-5 text-white flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-300 mb-0.5">Payment to FixMate</p>
                        <div className="flex items-center gap-1">
                            <IndianRupee size={18} />
                            <span className="text-2xl font-bold">{amount}</span>
                        </div>
                    </div>
                    {status === "idle" && (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-5">
                    {status === "idle" && (
                        <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95">
                            <div className="bg-[#f8f7ff] border border-[#ede9fe] rounded-2xl p-4">
                                <p className="text-xs font-semibold text-[#1e1b4b] mb-3">Select Payment Method</p>
                                
                                <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${selectedMethod === 'upi' ? 'border-[#0f172a] bg-white shadow-sm' : 'border-transparent hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <span className="text-[10px] font-bold">UPI</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#1e1b4b]">UPI Apps</p>
                                            <p className="text-[10px] text-gray-500">Google Pay, PhonePe, Paytm</p>
                                        </div>
                                    </div>
                                    <input type="radio" name="paymentMethod" checked={selectedMethod === 'upi'} onChange={() => setSelectedMethod('upi')} className="w-4 h-4 accent-[#0f172a]" />
                                </label>

                                <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${selectedMethod === 'card' ? 'border-[#0f172a] bg-white shadow-sm' : 'border-transparent hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                            <span className="text-[10px] font-bold">💳</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#1e1b4b]">Cards</p>
                                            <p className="text-[10px] text-gray-500">Credit / Debit Card</p>
                                        </div>
                                    </div>
                                    <input type="radio" name="paymentMethod" checked={selectedMethod === 'card'} onChange={() => setSelectedMethod('card')} className="w-4 h-4 accent-[#0f172a]" />
                                </label>
                            </div>

                            <p className="text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
                                <ShieldCheck size={12} /> 100% Secure Payment
                            </p>

                            <button 
                                onClick={handlePay}
                                className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white text-sm font-semibold py-4 rounded-xl transition-colors shadow-md active:scale-[0.98]"
                            >
                                Pay ₹{amount} Securely
                            </button>
                        </div>
                    )}

                    {status === "processing" && (
                        <div className="py-10 flex flex-col items-center justify-center gap-4 animate-in fade-in">
                            <Loader2 size={40} className="text-[#0f172a] animate-spin" />
                            <div className="text-center">
                                <p className="text-sm font-semibold text-[#1e1b4b]">Processing Payment...</p>
                                <p className="text-[11px] text-gray-500 mt-1">Please do not close or refresh this page.</p>
                            </div>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="py-8 flex flex-col items-center justify-center gap-3 animate-in zoom-in">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={40} className="text-green-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-[#1e1b4b]">Payment Successful</p>
                                <p className="text-xs text-gray-500 mt-1">₹{amount} paid securely via {selectedMethod.toUpperCase()}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
