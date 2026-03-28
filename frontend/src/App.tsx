import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ARScene from "./pages/ARScene";
import RankingPage from "./pages/Ranking";
import HistoryPage from "./pages/History";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEditPoint from "./pages/AdminEditPoint";
import AdminUsers from "./pages/AdminUsers";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";

function App() {
  const location = useLocation();
  const isARRoute = location.pathname === "/ar";

  return (
    <div className={isARRoute ? "min-h-screen px-4 pb-4" : "max-w-6xl mx-auto px-4 pb-8"}>
      <NavBar />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/ar" element={<ProtectedRoute><ARScene /></ProtectedRoute>} />
        <Route path="/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/points/new"
          element={
            <AdminRoute>
              <AdminEditPoint />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/points/:id"
          element={
            <AdminRoute>
              <AdminEditPoint />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
