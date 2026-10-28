// ========================================
// ORDER TRACKING
// Displays customer's previous/current
// orders and their restaurant workflow
// ========================================

function OrderTracking({
  orders,
  loading,
  error,
}) {
  // ========================================
  // STATUS HELPERS
  // ========================================

  const hasReachedStatus = (
    currentStatus,
    targetStatus
  ) => {
    const statusOrder = [
      "PENDING",
      "ACCEPTED",
      "PREPARING",
      "READY",
      "SERVED",
    ];

    const currentIndex =
      statusOrder.indexOf(currentStatus);

    const targetIndex =
      statusOrder.indexOf(targetStatus);

    if (currentIndex === -1) {
      return false;
    }

    return currentIndex >= targetIndex;
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>My Orders</h2>

      {loading && (
        <p>Loading your orders...</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        orders.length === 0 && (
          <p>
            You have not placed any orders yet.
          </p>
        )}

      {!loading &&
        !error &&
        orders.map((order) => (
          <div key={order.id}>
            {/* =====================================
                ORDER INFORMATION
            ====================================== */}

            <h3>Order #{order.id}</h3>

            <p>
              Status:{" "}
              <strong>{order.status}</strong>
            </p>

            <p>
              Total: ₹
              {Number(order.total).toFixed(2)}
            </p>

            {/* =====================================
                ORDER ITEMS
            ====================================== */}

            <h4>Items</h4>

            <ul>
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.menuItem.name}
                  {" × "}
                  {item.quantity}
                  {" — ₹"}
                  {(
                    Number(item.unitPrice) *
                    item.quantity
                  ).toFixed(2)}
                </li>
              ))}
            </ul>

            {/* =====================================
                CANCELLED ORDER
            ====================================== */}

            {order.status === "CANCELLED" ? (
              <p>
                <strong>
                  ❌ Order Cancelled
                </strong>
              </p>
            ) : (
              <>
                {/* =================================
                    ORDER PROGRESS
                ================================= */}

                <h4>Order Tracking</h4>

                <p>
                  {hasReachedStatus(
                    order.status,
                    "PENDING"
                  )
                    ? "✓"
                    : "○"}{" "}
                  Order Placed
                </p>

                <p>
                  {hasReachedStatus(
                    order.status,
                    "ACCEPTED"
                  )
                    ? "✓"
                    : "○"}{" "}
                  Accepted
                </p>

                <p>
                  {hasReachedStatus(
                    order.status,
                    "PREPARING"
                  )
                    ? "✓"
                    : "○"}{" "}
                  Preparing
                </p>

                <p>
                  {hasReachedStatus(
                    order.status,
                    "READY"
                  )
                    ? "✓"
                    : "○"}{" "}
                  Ready
                </p>

                <p>
                  {hasReachedStatus(
                    order.status,
                    "SERVED"
                  )
                    ? "✓"
                    : "○"}{" "}
                  Served
                </p>
              </>
            )}

            <hr />
          </div>
        ))}
    </section>
  );
}

export default OrderTracking;