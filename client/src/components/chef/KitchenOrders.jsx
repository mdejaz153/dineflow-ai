import { useEffect, useState } from "react";
import api from "../../services/api";

function KitchenOrders() {
  // ========================================
  // STATE - ACTIVE KITCHEN ORDERS
  // ========================================

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // FETCH ACTIVE KITCHEN ORDERS
  // ========================================

  const fetchKitchenOrders = async () => {
    try {
      setError("");

      // JWT automatically added by api.js
      const response = await api.get(
        "/kitchen/orders"
      );

      setOrders(response.data.orders);
    } catch (error) {
      console.error(
        "Kitchen orders fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load kitchen orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
  }, []);

  // ========================================
  // UPDATE ORDER STATUS
  //
  // Kitchen workflow:
  // PENDING -> ACCEPTED
  // ACCEPTED -> PREPARING
  // PREPARING -> READY
  // ========================================

  const handleStatusUpdate = async (
    orderId,
    newStatus
  ) => {
    try {
      const response = await api.patch(
        `/kitchen/orders/${orderId}/status`,
        {
          status: newStatus,
        }
      );

      const updatedOrder =
        response.data.order;

      // Update changed order instantly
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? updatedOrder
            : order
        )
      );

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Order status update error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update order status"
      );
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>Active Orders</h2>

      {loading && (
        <p>Loading orders...</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        orders.length === 0 && (
          <p>No active orders.</p>
        )}

      {!loading &&
        !error &&
        orders.map((order) => (
          <div key={order.id}>
            {/* =================================
                ORDER INFORMATION
            ================================= */}

            <h3>Order #{order.id}</h3>

            <p>
              Customer:{" "}
              {order.customer.name}
            </p>

            <p>
              Status:{" "}
              <strong>
                {order.status}
              </strong>
            </p>

            <p>
              Total: ₹
              {Number(
                order.total
              ).toFixed(2)}
            </p>

            {/* =================================
                ORDER ITEMS
            ================================= */}

            <h4>Items</h4>

            <ul>
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.menuItem.name}
                  {" × "}
                  {item.quantity}

                  {item.menuItem.prepTime
                    ? ` — ${item.menuItem.prepTime} min`
                    : ""}
                </li>
              ))}
            </ul>

            {/* =================================
                ORDER ACTIONS
            ================================= */}

            {/* New customer order */}
            {order.status === "PENDING" && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleStatusUpdate(
                      order.id,
                      "ACCEPTED"
                    )
                  }
                >
                  Accept Order
                </button>

                {" "}

                <button
                  type="button"
                  onClick={() =>
                    handleStatusUpdate(
                      order.id,
                      "CANCELLED"
                    )
                  }
                >
                  Cancel Order
                </button>
              </>
            )}

            {/* Accepted order */}
            {order.status === "ACCEPTED" && (
              <button
                type="button"
                onClick={() =>
                  handleStatusUpdate(
                    order.id,
                    "PREPARING"
                  )
                }
              >
                Start Preparing
              </button>
            )}

            {/* Order being prepared */}
            {order.status === "PREPARING" && (
              <button
                type="button"
                onClick={() =>
                  handleStatusUpdate(
                    order.id,
                    "READY"
                  )
                }
              >
                Mark Ready
              </button>
            )}

            {/* Ready order waits for waiter */}
            {order.status === "READY" && (
              <p>
                ✓ Ready for waiter pickup
              </p>
            )}

            <hr />
          </div>
        ))}
    </section>
  );
}

export default KitchenOrders;