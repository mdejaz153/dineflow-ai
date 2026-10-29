import LogoutButton from "../../components/LogoutButton";
import StaffManagement from "../../components/admin/StaffManagement";
import MenuManagement from "../../components/admin/MenuManagement";
import TableManagement from "../../components/admin/TableManagement";
import InventoryManagement from "../../components/admin/InventoryManagement";
import InventoryAlerts from "../../components/inventory/InventoryAlerts";
import ProcurementManagement from "../../components/admin/ProcurementManagement";
import WasteAnalytics from "../../components/inventory/WasteAnalytics";
import RecipeManagement from "../../components/admin/RecipeManagement";


function AdminDashboard() {
  return (
    <div>
      {/* =====================================
          MANAGER DASHBOARD HEADER
      ====================================== */}

      <h1>Manager Dashboard</h1>

      <p>
        Welcome to DineFlow Admin Portal
      </p>

      <LogoutButton />

      {/* =====================================
          MENU MANAGEMENT
      ====================================== */}

      <MenuManagement />

      {/* =====================================
          RECIPE MANAGEMENT
      ====================================== */}

      <RecipeManagement />

      {/* =====================================
          STAFF MANAGEMENT
      ====================================== */}

      <StaffManagement />

      {/* =====================================
          TABLE MANAGEMENT
      ====================================== */}

      <TableManagement />

      {/* =====================================
          SMART INVENTORY ALERTS
      ====================================== */}
      
      <InventoryAlerts />
      
      {/* =====================================
          PROCUREMENT MANAGEMENT
      ====================================== */}
      
      <ProcurementManagement />
      
      {/* =====================================
          WASTE ANALYTICS
      ====================================== */}
      
      <WasteAnalytics />

      
      {/* =====================================
          INVENTORY MANAGEMENT
      ====================================== */}
      
      <InventoryManagement />
      
    </div>
  );
}

export default AdminDashboard;