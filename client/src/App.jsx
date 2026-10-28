import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import CustomerHome from "./pages/customer/CustomerHome";
import ChefDashboard from "./pages/chef/ChefDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Unauthorized from "./pages/Unauthorized";
import WaiterDashboard from "./pages/waiter/WaiterDashboard";
import InventoryDashboard from "./pages/inventory/InventoryDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Public */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />

        {/* Customer Only */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerHome />
            </ProtectedRoute>
          }
        />

        {/* Chef + Manager */}
        <Route
          path="/staff/kitchen"
          element={
            <ProtectedRoute allowedRoles={["CHEF", "MANAGER"]}>
              <ChefDashboard />
            </ProtectedRoute>
          }
        />
        {/* Waiter + Manager */}
        <Route
          path="/staff/tables"
          element={
            <ProtectedRoute allowedRoles={["WAITER", "MANAGER"]}>
              <WaiterDashboard />
            </ProtectedRoute>
          }
        />
        {/* Inventory Staff + Manager */}
        <Route
          path="/staff/inventory"
          element={
            <ProtectedRoute allowedRoles={["INVENTORY_STAFF", "MANAGER"]}>
              <InventoryDashboard />
            </ProtectedRoute>
          }
        />

        {/* Manager Only */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;