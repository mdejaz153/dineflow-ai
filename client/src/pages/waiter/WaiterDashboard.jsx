import LogoutButton from "../../components/LogoutButton";

import ReadyOrders from "../../components/waiter/ReadyOrders";
import ReservationManagement from "../../components/waiter/ReservationManagement";

function WaiterDashboard() {
  return (
    <div>
      {/* =====================================
          WAITER DASHBOARD HEADER
      ====================================== */}

      <h1>Waiter Dashboard</h1>

      <p>
        Welcome to DineFlow Service Portal
      </p>

      <LogoutButton />

      {/* =====================================
          READY ORDERS
      ====================================== */}

      <ReadyOrders />

      {/* =====================================
          RESERVATIONS + TABLE MANAGEMENT
      ====================================== */}

      <ReservationManagement />
    </div>
  );
}

export default WaiterDashboard;