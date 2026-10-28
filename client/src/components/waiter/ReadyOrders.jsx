import { useEffect, useState } from "react";
import api from "../../services/api";

function ReadyOrders() {
  // ========================================
  // STATE - READY ORDERS
  // Orders completed by kitchen and waiting
  // to be served by waiter.
  // ========================================

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // FETCH READY ORDERS
  // ========================================

  const fetchReadyOrders = async () => {
    try {
      setError("");

      const response = await api.get(
        "/waiter/orders"
      );

      setOrders(response.data.orders);
    } catch (error) {
      console.error(
        "Waiter orders fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load ready orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  // ========================================
  // SERVE ORDER
  // READY -> SERVED
  // ========================================

  const handleServeOrder = async (
    orderId
  ) => {
    try {
      const response = await api.patch(
        `/waiter/orders/${orderId}/status`,
        {
          status: "SERVED",
        }
      );

      // Served order should disappear from
      // Ready to Serve list immediately.
      setOrders((prev) =>
        prev.filter(
          (order) =>
            order.id !== orderId
        )
      );

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Serve order error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to serve order"
      );
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>Ready to Serve</h2>

      {loading && (
        <p>Loading orders...</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        orders.length === 0 && (
          <p>
            No orders are ready to serve.
          </p>
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
                </li>
              ))}
            </ul>

            {/* =================================
                SERVE ACTION
            ================================= */}

            <button
              type="button"
              onClick={() =>
                handleServeOrder(
                  order.id
                )
              }
            >
              Serve Order
            </button>

            <hr />
          </div>
        ))}
    </section>
  );
}

export default ReadyOrders;