import { useEffect, useState } from "react";
import api from "../../services/api";

function WasteAnalytics() {
  // ========================================
  // STATE - WASTE ANALYTICS
  // ========================================

  const [summary, setSummary] =
    useState(null);

  const [insight, setInsight] =
    useState(null);

  const [itemWaste, setItemWaste] =
    useState([]);

  const [recentWaste, setRecentWaste] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ========================================
  // FETCH WASTE ANALYTICS
  // ========================================

  const fetchWasteAnalytics = async () => {
    try {
      setError("");

      const response = await api.get(
        "/analytics/waste"
      );

      setSummary(response.data.summary);
      setInsight(response.data.insight);

      setItemWaste(
        response.data.itemWaste
      );

      setRecentWaste(
        response.data.recentWaste
      );
    } catch (error) {
      console.error(
        "Waste analytics fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load waste analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // AUTO-SYNC
  //
  // Waste may be recorded by Inventory Staff
  // while Manager dashboard is already open.
  // ========================================

  useEffect(() => {
    fetchWasteAnalytics();

    const interval = setInterval(() => {
      fetchWasteAnalytics();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ========================================
  // INSIGHT ICON
  // ========================================

  const getInsightIcon = (level) => {
    switch (level) {
      case "HIGH":
        return "🔴";

      case "MODERATE":
        return "⚠️";

      case "LOW":
        return "🟡";

      default:
        return "✅";
    }
  };

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDateTime = (value) => {
    if (!value) {
      return "-";
    }

    return new Date(
      value
    ).toLocaleString();
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>Waste Analytics</h2>

      {loading && (
        <p>
          Loading waste analytics...
        </p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        summary && (
          <>
            {/* =================================
                SUMMARY
            ================================= */}

            <h3>Waste Summary</h3>

            <p>
              Total Waste Events:{" "}
              <strong>
                {summary.totalWasteEvents}
              </strong>
            </p>

            <p>
              Items With Waste:{" "}
              <strong>
                {summary.itemsWithWaste}
              </strong>
            </p>

            {summary.highestWasteItem && (
              <>
                <p>
                  Highest Waste Frequency:{" "}
                  <strong>
                    {
                      summary
                        .highestWasteItem
                        .name
                    }
                  </strong>
                </p>

                <p>
                  Waste Events:{" "}
                  {
                    summary
                      .highestWasteItem
                      .wasteEvents
                  }
                </p>

                <p>
                  Recorded Waste:{" "}
                  {
                    summary
                      .highestWasteItem
                      .totalWaste
                  }{" "}
                  {
                    summary
                      .highestWasteItem
                      .unit
                  }
                </p>
              </>
            )}

            {/* =================================
                SMART WASTE INSIGHT
            ================================= */}

            {insight && (
              <>
                <h3>
                  Smart Waste Insight
                </h3>

                <p>
                  {getInsightIcon(
                    insight.level
                  )}{" "}
                  <strong>
                    {insight.level}
                  </strong>
                </p>

                <p>
                  {insight.message}
                </p>
              </>
            )}

            <hr />

            {/* =================================
                ITEM-WISE WASTE
            ================================= */}

            <h3>
              Item-wise Waste
            </h3>

            {itemWaste.length === 0 ? (
              <p>
                No waste has been recorded.
              </p>
            ) : (
              <table
                border="1"
                cellPadding="10"
              >
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Total Waste</th>
                    <th>Waste Events</th>
                  </tr>
                </thead>

                <tbody>
                  {itemWaste.map(
                    (item) => (
                      <tr
                        key={
                          item.inventoryItemId
                        }
                      >
                        <td>
                          {item.name}
                        </td>

                        <td>
                          {Number(
                            item.totalWaste
                          ).toFixed(3)}
                          {" "}
                          {item.unit}
                        </td>

                        <td>
                          {
                            item.wasteEvents
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}

            <hr />

            {/* =================================
                RECENT WASTE ACTIVITY
            ================================= */}

            <h3>
              Recent Waste Activity
            </h3>

            {recentWaste.length === 0 ? (
              <p>
                No recent waste activity.
              </p>
            ) : (
              <table
                border="1"
                cellPadding="10"
              >
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Reason</th>
                    <th>Recorded By</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentWaste.map(
                    (transaction) => (
                      <tr
                        key={
                          transaction.id
                        }
                      >
                        <td>
                          {
                            transaction.name
                          }
                        </td>

                        <td>
                          {Number(
                            transaction.quantity
                          ).toFixed(3)}
                          {" "}
                          {
                            transaction.unit
                          }
                        </td>

                        <td>
                          {transaction.note ||
                            "-"}
                        </td>

                        <td>
                          {
                            transaction
                              .performedBy
                              .name
                          }
                          {" ("}
                          {
                            transaction
                              .performedBy
                              .role
                          }
                          {")"}
                        </td>

                        <td>
                          {formatDateTime(
                            transaction.createdAt
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </>
        )}
    </section>
  );
}

export default WasteAnalytics;