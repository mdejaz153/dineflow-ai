import LogoutButton from "../../components/LogoutButton";
import KitchenOrders from "../../components/chef/KitchenOrders";

function ChefDashboard() {
  return (
    <div>
      {/* =====================================
          KITCHEN DASHBOARD HEADER
      ====================================== */}

      <h1>Kitchen Dashboard</h1>

      <p>
        Welcome to DineFlow Kitchen Portal
      </p>

      <LogoutButton />

      {/* =====================================
          KITCHEN ORDER MANAGEMENT
      ====================================== */}

      <KitchenOrders />
    </div>
  );
}

export default ChefDashboard;