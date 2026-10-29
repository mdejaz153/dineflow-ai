import { useEffect, useState } from "react";
import api from "../../services/api";

function OperationsAnalytics() {
  // ========================================
  // STATE
  // ========================================

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ========================================
  // FETCH OPERATIONS ANALYTICS
  // ========================================

  const fetchOperations = async () => {
    try {
      setError("");

      const response = await api.get(
        "/analytics/operations"
      );

      setData(response.data);
    } catch (error) {
      console.error(
        "Operations analytics error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load operations analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // AUTO-SYNC
  // ========================================

  useEffect(() => {
    fetchOperations();

    const interval = setInterval(() => {
      fetchOperations();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ========================================
  // ATTENTION ICON
  // ========================================

  const getAttentionIcon = (level) => {
    switch (level) {
      case "HIGH":
        return "🔴";

      case "MEDIUM":
        return "⚠️";

      default:
        return "ℹ️";
    }
  };

  // ========================================
  // UI
  // ========================================

  if (loading) {
    return (
      <section>
        <hr />

        <h2>
          Operations Analytics
        </h2>

        <p>
          Loading operations analytics...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <hr />

        <h2>
          Operations Analytics
        </h2>

        <p>{error}</p>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const {
    orders,
    menu,
    reservations,
    inventory,
    procurement,
    attention,
  } = data;

  return (
    <section>
      <hr />

      <h2>
        Operations Analytics
      </h2>

      <p>
        Live operational overview for
        DineFlow management.
      </p>

      {/* =====================================
          OPERATIONAL ATTENTION
      ====================================== */}

      <h3>
        Operational Attention
      </h3>

      {attention.length === 0 ? (
        <p>
          ✅ No immediate operational
          issues require attention.
        </p>
      ) : (
        attention.map(
          (item, index) => (
            <div
              key={`${item.type}-${index}`}
            >
              <p>
                {getAttentionIcon(
                  item.level
                )}{" "}
                <strong>
                  {item.type}
                </strong>
                {" — "}
                {item.message}
              </p>
            </div>
          )
        )
      )}

      <hr />

      {/* =====================================
          ORDER PERFORMANCE
      ====================================== */}

      <h3>
        Order Performance
      </h3>

      <p>
        Total Orders:{" "}
        <strong>
          {orders.total}
        </strong>
      </p>

      <p>
        Pending:{" "}
        <strong>
          {orders.pending}
        </strong>
      </p>

      <p>
        Accepted:{" "}
        <strong>
          {orders.accepted}
        </strong>
      </p>

      <p>
        Preparing:{" "}
        <strong>
          {orders.preparing}
        </strong>
      </p>

      <p>
        Ready:{" "}
        <strong>
          {orders.ready}
        </strong>
      </p>

      <p>
        Served:{" "}
        <strong>
          {orders.served}
        </strong>
      </p>

      <p>
        Cancelled:{" "}
        <strong>
          {orders.cancelled}
        </strong>
      </p>

      <p>
        Active Revenue:{" "}
        <strong>
          ₹
          {Number(
            orders.totalRevenue
          ).toFixed(2)}
        </strong>
      </p>

      <p>
        Served Revenue:{" "}
        <strong>
          ₹
          {Number(
            orders.servedRevenue
          ).toFixed(2)}
        </strong>
      </p>

      <hr />

      {/* =====================================
          MENU PERFORMANCE
      ====================================== */}

      <h3>
        Menu Performance
      </h3>

      {menu.mostOrderedDish ? (
        <>
          <p>
            Most Ordered Dish:{" "}
            <strong>
              {
                menu
                  .mostOrderedDish
                  .name
              }
            </strong>
          </p>

          <p>
            Units Sold:{" "}
            <strong>
              {
                menu
                  .mostOrderedDish
                  .unitsSold
              }
            </strong>
          </p>

          <p>
            Revenue:{" "}
            <strong>
              ₹
              {Number(
                menu
                  .mostOrderedDish
                  .revenue
              ).toFixed(2)}
            </strong>
          </p>
        </>
      ) : (
        <p>
          No menu sales data yet.
        </p>
      )}

      {menu.performance.length >
        0 && (
        <>
          <h4>
            Dish Performance
          </h4>

          <table
            border="1"
            cellPadding="10"
          >
            <thead>
              <tr>
                <th>Dish</th>
                <th>
                  Units Sold
                </th>
                <th>
                  Order Appearances
                </th>
                <th>Revenue</th>
              </tr>
            </thead>

            <tbody>
              {menu.performance.map(
                (item) => (
                  <tr
                    key={
                      item.menuItemId
                    }
                  >
                    <td>
                      {item.name}
                    </td>

                    <td>
                      {item.unitsSold}
                    </td>

                    <td>
                      {
                        item.orderAppearances
                      }
                    </td>

                    <td>
                      ₹
                      {Number(
                        item.revenue
                      ).toFixed(2)}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </>
      )}

      <hr />

      {/* =====================================
          RESERVATIONS
      ====================================== */}

      <h3>
        Reservation Overview
      </h3>

      <p>
        Total Reservations:{" "}
        <strong>
          {reservations.total}
        </strong>
      </p>

      <p>
        Confirmed:{" "}
        <strong>
          {reservations.confirmed}
        </strong>
      </p>

      <p>
        Seated:{" "}
        <strong>
          {reservations.seated}
        </strong>
      </p>

      <p>
        Completed:{" "}
        <strong>
          {reservations.completed}
        </strong>
      </p>

      <p>
        Cancelled:{" "}
        <strong>
          {reservations.cancelled}
        </strong>
      </p>

      <p>
        No Show:{" "}
        <strong>
          {reservations.noShow}
        </strong>
      </p>

      <hr />

      {/* =====================================
          INVENTORY HEALTH
      ====================================== */}

      <h3>
        Inventory Health
      </h3>

      <p>
        Total Items:{" "}
        <strong>
          {inventory.totalItems}
        </strong>
      </p>

      <p>
        Healthy:{" "}
        <strong>
          {inventory.healthyItems}
        </strong>
      </p>

      <p>
        Low Stock:{" "}
        <strong>
          {inventory.lowStockItems}
        </strong>
      </p>

      <p>
        Out of Stock:{" "}
        <strong>
          {inventory.outOfStockItems}
        </strong>
      </p>

      <hr />

      {/* =====================================
          PROCUREMENT
      ====================================== */}

      <h3>
        Procurement Overview
      </h3>

      <p>
        Total Requests:{" "}
        <strong>
          {procurement.totalRequests}
        </strong>
      </p>

      <p>
        Active Requests:{" "}
        <strong>
          {procurement.activeRequests}
        </strong>
      </p>

      <p>
        Pending Approval:{" "}
        <strong>
          {procurement.pending}
        </strong>
      </p>

      <p>
        Approved / Awaiting Delivery:{" "}
        <strong>
          {procurement.approved}
        </strong>
      </p>

      <p>
        Received:{" "}
        <strong>
          {procurement.received}
        </strong>
      </p>

      <p>
        Rejected:{" "}
        <strong>
          {procurement.rejected}
        </strong>
      </p>
    </section>
  );
}

export default OperationsAnalytics;