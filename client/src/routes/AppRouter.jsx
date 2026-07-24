import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import RootRoute from "./RootRoute";
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import Home from "../pages/home/Home";
import AIDetect from "../pages/detection/AIDetect";
import DetectionResult from "../pages/detection/DetectionResult";
import ChooseCategory from "../pages/detection/ChooseCategory";
import WorkerSearch from "../pages/worker/WorkerSearch";
import CreateBooking from "../pages/booking/CreateBooking";
import BookingDetail from "../pages/booking/BookingDetail";
import LeaveReview from "../pages/review/LeaveReview";
import MyBookings from "../pages/booking/MyBookings";
import ShopSearch from "../pages/shop/ShopSearch";
import InquiryChatPage from "../pages/chat/InquiryChatPage";
import Notifications from "../pages/notifications/Notifications";
import ChatPage from "../pages/chat/ChatPage";
import Profile from "../pages/profile/Profile";
import Settings from "../pages/profile/Settings";
import WorkerDashboard from "../pages/worker/WorkerDashboard";
import WorkerJobDetail from "../pages/worker/WorkerJobDetail";
import ShopkeeperDashboard from "../pages/shopkeeper/ShopkeeperDashboard";
import RegisterWorker from "../pages/shopkeeper/RegisterWorker";
import AdminLogin from "../pages/auth/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";


import WorkerEarnings from "../pages/worker/WorkerEarnings";
import WorkerHistory from "../pages/worker/WorkerHistory";
import WorkerProfile from "../pages/worker/WorkerProfile";
import WorkerReviews from "../pages/worker/WorkerReviews";

import ManageWorker from "../pages/shopkeeper/ManageWorker";
import ReportWorker from "../pages/report/ReportWorker";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RootRoute />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<RoleRoute allow={["user"]} />}>
                        <Route path="/home" element={<Home />} />
                        <Route path="/detect" element={<AIDetect />} />
                        <Route path="/detect/result" element={<DetectionResult />} />
                        <Route path="/detect/choose-category" element={<ChooseCategory />} />
                        <Route path="/shops" element={<ShopSearch />} />
                        <Route path="/chat/inquiry/:inquiryId" element={<InquiryChatPage />} />
                        <Route path="/workers" element={<WorkerSearch />} />
                        <Route path="/workers/:id" element={<WorkerProfile />} />
                        <Route path="/booking/create" element={<CreateBooking />} />
                        <Route path="/bookings/:id/report" element={<ReportWorker />} />
                    </Route>

                    <Route element={<RoleRoute allow={["worker"]} />}>
                        <Route path="/worker" element={<WorkerDashboard />} />
                        <Route path="/worker/jobs/:id" element={<WorkerJobDetail />} />
                        <Route path="/worker/earnings" element={<WorkerEarnings />} />
                        <Route path="/worker/history" element={<WorkerHistory />} />
                        <Route path="/reviews" element={<WorkerReviews />} />
                    </Route>

                    <Route element={<RoleRoute allow={["shopkeeper"]} />}>
                        <Route path="/shopkeeper" element={<ShopkeeperDashboard />} />
                        <Route path="/shopkeeper/workers/new" element={<RegisterWorker />} />
                        <Route path="/shopkeeper/workers/:id" element={<ManageWorker />} />
                    </Route>
                    <Route element={<RoleRoute allow={["admin"]} />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                    </Route>


                    <Route path="/bookings/:id" element={<BookingDetail />} />
                    <Route path="/bookings/:id/review" element={<LeaveReview />} />
                    <Route path="/bookings" element={<MyBookings />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/chat/:id" element={<ChatPage />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />

                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}