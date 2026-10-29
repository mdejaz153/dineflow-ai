import { useEffect, useState } from "react";
import api from "../../services/api";

function ConsumptionAnalytics() {
  // ========================================
  // STATE
  // ========================================

  const [summary, setSummary] =
    useState(null);

  const [insight, setInsight] =
    useState(null);

  const [items, setItems] =
    useState([]);

  const [analysisWindowDays, setAnalysisWindowDays] =
    useState(30);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ========================================
  // FETCH CONSUMPTION ANALYTICS
  // ========================================

  const fetchConsumptionAnalytics =
    async () => {
      try {
        setError("");

        const response = await api.get(
          "/analytics/consumption"
        );

        setSummary(
          response.data.summary
        );

        setInsight(
          response.data.insight
        );

        setItems(
          response.data.items
        );

        setAnalysisWindowDays(
          response.data.analysisWindowDays
        );
      } catch (error) {
        console.error(
          "Consumption analytics fetch error:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load consumption analytics"
        );
      } finally {
        setLoading(false);
      }
    };

  // ========================================
  // AUTO-SYNC
  //
  // New kitchen consumption automatically
  // appears without manual refresh.
  // ========================================

  useEffect(() => {
    fetchConsumptionAnalytics();

    const interval = setInterval(() => {
      fetchConsumptionAnalytics();
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
      case "URGENT":
        return "🔴";

      case "WARNING":
        return "⚠️";

      case "HEALTHY":
        return "✅";

      default:
        return "ℹ️";
    }
  };

  // ========================================
  // COVERAGE LABEL
  // ========================================

  const getCoverageLabel = (status) => {
    switch (status) {
      case "URGENT":
        return "🔴 Urgent";

      case "LOW_COVERAGE":
        return "⚠️ Low Coverage";

      case "HEALTHY":
        return "✅ Healthy";

      default:
        return "No Usage Data";
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>
        Consumption & Demand Analytics
      </h2>

      <p>
        Analysis Window:{" "}
        <strong>
          Last {analysisWindowDays} days
        </strong>
      </p>

      {loading && (
        <p>
          Loading consumption analytics...
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

            <h3>
              Consumption Summary
            </h3>

            <p>
              Total Inventory Items:{" "}
              <strong>
                {summary.totalInventoryItems}
              </strong>
            </p>

            <p>
              Items With Consumption Data:{" "}
              <strong>
                {summary.itemsWithConsumption}
              </strong>
            </p>

            <p>
              Urgent Stock Coverage:{" "}
              <strong>
                {summary.urgentItems}
              </strong>
            </p>

            <p>
              Low Stock Coverage:{" "}
              <strong>
                {summary.lowCoverageItems}
              </strong>
            </p>

            {summary.fastestMovingItem && (
              <>
                <p>
                  Fastest Moving Ingredient:{" "}
                  <strong>
                    {
                      summary
                        .fastestMovingItem
                        .name
                    }
                  </strong>
                </p>

                <p>
                  Average Daily Usage:{" "}
                  {
                    summary
                      .fastestMovingItem
                      .averageDailyConsumption
                  }{" "}
                  {
                    summary
                      .fastestMovingItem
                      .unit
                  }
                  /day
                </p>
              </>
            )}

            {/* =================================
                SMART INSIGHT
            ================================= */}

            {insight && (
              <>
                <h3>
                  Stock Coverage Insight
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
                ITEM ANALYTICS
            ================================= */}

            <h3>
              Ingredient Consumption
            </h3>

            <table
              border="1"
              cellPadding="10"
            >
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Current Stock</th>
                  <th>Total Consumed</th>
                  <th>Events</th>
                  <th>Avg / Day</th>
                  <th>
                    Est. Days Remaining
                  </th>
                  <th>Total Waste</th>
                  <th>Waste Rate</th>
                  <th>Coverage</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
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
                        item.currentStock
                      ).toFixed(3)}
                      {" "}
                      {item.unit}
                    </td>

                    <td>
                      {Number(
                        item.totalConsumed
                      ).toFixed(3)}
                      {" "}
                      {item.unit}
                    </td>

                    <td>
                      {
                        item.consumptionEvents
                      }
                    </td>

                    <td>
                      {Number(
                        item.averageDailyConsumption
                      ).toFixed(3)}
                      {" "}
                      {item.unit}
                      /day
                    </td>

                    <td>
                      {item.estimatedDaysRemaining ===
                      null
                        ? "-"
                        : `${item.estimatedDaysRemaining} days`}
                    </td>

                    <td>
                      {Number(
                        item.totalWaste
                      ).toFixed(3)}
                      {" "}
                      {item.unit}
                    </td>

                    <td>
                      {Number(
                        item.wasteRate
                      ).toFixed(1)}
                      %
                    </td>

                    <td>
                      {getCoverageLabel(
                        item.stockCoverageStatus
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
    </section>
  );
}

export default ConsumptionAnalytics;