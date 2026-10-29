import { useEffect, useState } from "react";
import api from "../../services/api";

function DemandForecast({
  allowReorder = false,
}) {
  // ========================================
  // STATE
  // ========================================

  const [methodology, setMethodology] =
    useState(null);

  const [summary, setSummary] =
    useState(null);

  const [insight, setInsight] =
    useState(null);

  const [forecasts, setForecasts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // Stores ID of item whose reorder request
  // is currently being created.
  const [
    creatingReorderFor,
    setCreatingReorderFor,
  ] = useState(null);

  // ========================================
  // FETCH FORECAST
  // ========================================

  const fetchForecast = async () => {
    try {
      setError("");

      const response = await api.get(
        "/forecast/demand"
      );

      setMethodology(
        response.data.methodology
      );

      setSummary(
        response.data.summary
      );

      setInsight(
        response.data.insight
      );

      setForecasts(
        response.data.forecasts
      );
    } catch (error) {
      console.error(
        "Demand forecast fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load demand forecast"
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // AUTO-SYNC
  //
  // Consumption, stock deliveries and other
  // inventory changes automatically cause
  // forecast values to refresh.
  // ========================================

  useEffect(() => {
    fetchForecast();

    const interval = setInterval(() => {
      fetchForecast();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ========================================
  // CREATE FORECAST-BASED REORDER
  //
  // Uses the quantity calculated by the
  // forecasting engine.
  //
  // Existing backend duplicate protection
  // prevents multiple active requests for
  // the same inventory item.
  // ========================================

  const handleCreateForecastReorder =
    async (forecast) => {
      if (
        !forecast.recommendedReorder ||
        forecast.recommendedReorder <= 0
      ) {
        alert(
          "No reorder is currently recommended for this item"
        );

        return;
      }

      try {
        setCreatingReorderFor(
          forecast.inventoryItemId
        );

        const response = await api.post(
          "/reorders",
          {
            inventoryItemId:
              forecast.inventoryItemId,

            quantity:
              forecast.recommendedReorder,

            note:
              `7-day demand forecast reorder — ${forecast.riskLevel} risk`,
          }
        );

        alert(response.data.message);
      } catch (error) {
        console.error(
          "Forecast reorder error:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Failed to create forecast reorder request"
        );
      } finally {
        setCreatingReorderFor(null);
      }
    };

  // ========================================
  // RISK DISPLAY
  // ========================================

  const getRiskLabel = (
    riskLevel
  ) => {
    switch (riskLevel) {
      case "HIGH":
        return "🔴 HIGH";

      case "MEDIUM":
        return "⚠️ MEDIUM";

      case "LOW":
        return "✅ LOW";

      default:
        return "ℹ️ NO DATA";
    }
  };

  // ========================================
  // INSIGHT DISPLAY
  // ========================================

  const getInsightIcon = (
    level
  ) => {
    switch (level) {
      case "HIGH":
        return "🔴";

      case "MEDIUM":
        return "⚠️";

      case "HEALTHY":
        return "✅";

      default:
        return "ℹ️";
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>
        Predictive Demand Forecast
      </h2>

      <p>
        Consumption-based inventory
        planning for upcoming demand.
      </p>

      {loading && (
        <p>
          Generating demand forecast...
        </p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        summary &&
        methodology && (
          <>
            {/* =================================
                METHODOLOGY
            ================================= */}

            <h3>
              Forecast Method
            </h3>

            <p>
              Analysis Window:{" "}
              <strong>
                {
                  methodology.analysisWindowDays
                }{" "}
                days
              </strong>
            </p>

            <p>
              Forecast Horizon:{" "}
              <strong>
                {
                  methodology.forecastDays
                }{" "}
                days
              </strong>
            </p>

            <p>
              Model:{" "}
              <strong>
                Recent Average Consumption
              </strong>
            </p>

            <p>
              Safety Stock:{" "}
              <strong>
                Inventory Minimum Stock
              </strong>
            </p>

            {/* =================================
                SUMMARY
            ================================= */}

            <h3>
              Forecast Summary
            </h3>

            <p>
              Total Items:{" "}
              <strong>
                {summary.totalItems}
              </strong>
            </p>

            <p>
              High Risk:{" "}
              <strong>
                {summary.highRiskItems}
              </strong>
            </p>

            <p>
              Medium Risk:{" "}
              <strong>
                {summary.mediumRiskItems}
              </strong>
            </p>

            <p>
              Low Risk:{" "}
              <strong>
                {summary.lowRiskItems}
              </strong>
            </p>

            <p>
              Insufficient Usage Data:{" "}
              <strong>
                {summary.noDataItems}
              </strong>
            </p>

            <p>
              Reorder Recommended:{" "}
              <strong>
                {
                  summary.reorderRecommendedItems
                }
              </strong>
            </p>

            {/* =================================
                OVERALL INSIGHT
            ================================= */}

            {insight && (
              <>
                <h3>
                  Forecast Insight
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
                ITEM FORECASTS
            ================================= */}

            <h3>
              Ingredient Forecast
            </h3>

            <table
              border="1"
              cellPadding="10"
            >
              <thead>
                <tr>
                  <th>
                    Ingredient
                  </th>

                  <th>
                    Current
                  </th>

                  <th>
                    Avg / Day
                  </th>

                  <th>
                    7-Day Demand
                  </th>

                  <th>
                    Projected Stock
                  </th>

                  <th>
                    Safety Stock
                  </th>

                  <th>
                    Expected Shortage
                  </th>

                  <th>
                    Recommended Reorder
                  </th>

                  <th>
                    Risk
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {forecasts.map(
                  (forecast) => (
                    <tr
                      key={
                        forecast.inventoryItemId
                      }
                    >
                      <td>
                        {
                          forecast.name
                        }
                      </td>

                      <td>
                        {Number(
                          forecast.currentStock
                        ).toFixed(3)}
                        {" "}
                        {forecast.unit}
                      </td>

                      <td>
                        {Number(
                          forecast.averageDailyConsumption
                        ).toFixed(3)}
                        {" "}
                        {forecast.unit}
                        /day
                      </td>

                      <td>
                        {Number(
                          forecast.forecastDemand
                        ).toFixed(3)}
                        {" "}
                        {forecast.unit}
                      </td>

                      <td>
                        {Number(
                          forecast.projectedStockAfterForecast
                        ).toFixed(3)}
                        {" "}
                        {forecast.unit}
                      </td>

                      <td>
                        {Number(
                          forecast.safetyStock
                        ).toFixed(3)}
                        {" "}
                        {forecast.unit}
                      </td>

                      <td>
                        {Number(
                          forecast.expectedShortage
                        ).toFixed(3)}
                        {" "}
                        {forecast.unit}
                      </td>

                      <td>
                        <strong>
                          {Number(
                            forecast.recommendedReorder
                          ).toFixed(3)}
                          {" "}
                          {forecast.unit}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {getRiskLabel(
                            forecast.riskLevel
                          )}
                        </strong>
                      </td>

                      <td>
                        {allowReorder &&
                        forecast.recommendedReorder > 0 ? (
                          <button
                            type="button"
                            disabled={
                              creatingReorderFor ===
                              forecast.inventoryItemId
                            }
                            onClick={() =>
                              handleCreateForecastReorder(
                                forecast
                              )
                            }
                          >
                            {creatingReorderFor ===
                            forecast.inventoryItemId
                              ? "Creating..."
                              : "Create Forecast Reorder"}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            <br />

            <p>
              <small>
                Forecasts are based on
                available recent consumption
                history. Accuracy improves
                as more operational data is
                collected.
              </small>
            </p>
          </>
        )}
    </section>
  );
}

export default DemandForecast;