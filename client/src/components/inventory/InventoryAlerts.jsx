import { useEffect, useState } from "react";
import api from "../../services/api";

function InventoryAlerts() {
  // ========================================
  // STATE - SMART INVENTORY ALERTS
  // ========================================

  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // FETCH SMART INVENTORY ALERTS
  //
  // Backend calculates:
  // - Healthy stock
  // - Low stock
  // - Critical stock
  // - Out of stock
  // - Suggested reorder quantity
  // ========================================

  const fetchAlerts = async () => {
    try {
      setError("");

      const response = await api.get(
        "/inventory-alerts"
      );

      setAlerts(response.data.alerts);
      setSummary(response.data.summary);
    } catch (error) {
      console.error(
        "Inventory alerts fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load inventory alerts"
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // AUTO-SYNC SMART INVENTORY ALERTS
  //
  // Stock changes can happen from procurement,
  // waste, adjustments or deliveries.
  // ========================================
  
  useEffect(() => {
    fetchAlerts();
  
    const interval = setInterval(() => {
      fetchAlerts();
    }, 5000);
  
    return () => {
      clearInterval(interval);
    };
  }, []);

  // ========================================
  // GET ALERT ICON
  // ========================================

  const getAlertIcon = (severity) => {
    switch (severity) {
      case "OUT_OF_STOCK":
        return "🔴";

      case "CRITICAL":
        return "🔴";

      case "LOW":
        return "⚠️";

      default:
        return "✅";
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>Smart Inventory Alerts</h2>

      {/* Loading state */}
      {loading && (
        <p>Loading smart inventory alerts...</p>
      )}

      {/* Error state */}
      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        summary && (
          <>
            {/* =====================================
                INVENTORY HEALTH SUMMARY
            ====================================== */}

            <h3>Inventory Health</h3>

            <p>
              Total Items:{" "}
              <strong>
                {summary.totalItems}
              </strong>
            </p>

            <p>
              Healthy:{" "}
              <strong>
                {summary.healthyItems}
              </strong>
            </p>

            <p>
              Low Stock:{" "}
              <strong>
                {summary.lowItems}
              </strong>
            </p>

            <p>
              Critical:{" "}
              <strong>
                {summary.criticalItems}
              </strong>
            </p>

            <p>
              Out of Stock:{" "}
              <strong>
                {summary.outOfStockItems}
              </strong>
            </p>

            <p>
              Total Alerts:{" "}
              <strong>
                {summary.totalAlerts}
              </strong>
            </p>

            <hr />

            {/* =====================================
                ITEMS REQUIRING ATTENTION
            ====================================== */}

            <h3>
              Items Requiring Attention
            </h3>

            {alerts.length === 0 ? (
              <p>
                ✅ All inventory items are
                currently healthy.
              </p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id}>
                  <h4>
                    {getAlertIcon(
                      alert.severity
                    )}{" "}
                    {alert.name}
                  </h4>

                  <p>
                    Severity:{" "}
                    <strong>
                      {alert.severity}
                    </strong>
                  </p>

                  <p>
                    Current Stock:{" "}
                    {alert.currentStock}{" "}
                    {alert.unit}
                  </p>

                  <p>
                    Minimum Stock:{" "}
                    {alert.minimumStock}{" "}
                    {alert.unit}
                  </p>

                  {/* Percentage is unavailable
                      when minimum stock is zero */}
                  {alert.stockPercentage !==
                    null && (
                    <p>
                      Stock Level:{" "}
                      {
                        alert.stockPercentage
                      }
                      % of minimum
                    </p>
                  )}

                  <p>
                    {alert.message}
                  </p>

                  <p>
                    Suggested Reorder:{" "}
                    <strong>
                      {
                        alert.suggestedReorder
                      }{" "}
                      {alert.unit}
                    </strong>
                  </p>

                  <hr />
                </div>
              ))
            )}
          </>
        )}
    </section>
  );
}

export default InventoryAlerts;