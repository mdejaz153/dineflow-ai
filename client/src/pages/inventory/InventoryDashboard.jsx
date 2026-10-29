import { useEffect, useState } from "react";
import api from "../../services/api";
import LogoutButton from "../../components/LogoutButton";
import InventoryAlerts from "../../components/inventory/InventoryAlerts";
import ReorderManagement from "../../components/inventory/ReorderManagement";
import WasteAnalytics from "../../components/inventory/WasteAnalytics";
import ConsumptionAnalytics from "../../components/inventory/ConsumptionAnalytics";


function InventoryDashboard() {
  // ========================================
  // STATE - INVENTORY
  // ========================================

  const [items, setItems] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Stores quantity/note inputs separately
  // for every inventory item
  const [actionForms, setActionForms] = useState({});

  // ========================================
  // STATE - TRANSACTION HISTORY
  // ========================================

  const [history, setHistory] = useState([]);
  const [historyItem, setHistoryItem] = useState(null);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  // ========================================
  // FETCH INVENTORY
  // ========================================

  const fetchInventory = async () => {
    try {
      setError("");

      const response = await api.get("/inventory");

      setItems(response.data.items);

      setLowStockCount(
        response.data.lowStockCount
      );
    } catch (error) {
      console.error(
        "Inventory fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load inventory"
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // AUTO-SYNC CURRENT INVENTORY
  //
  // Keeps stock quantities updated when stock
  // changes through procurement or other users.
  // ========================================
  
  useEffect(() => {
    fetchInventory();
  
    const interval = setInterval(() => {
      fetchInventory();
    }, 5000);
  
    return () => {
      clearInterval(interval);
    };
  }, []);

  // ========================================
  // UPDATE ONE INVENTORY ITEM IN UI
  //
  // Used after Add Stock, Waste and
  // Adjustment so page refresh is not needed.
  // ========================================

  const updateItemInState = (updatedItem) => {
    setItems((prev) => {
      const updatedItems = prev.map((item) =>
        item.id === updatedItem.id
          ? updatedItem
          : item
      );

      // Recalculate basic low-stock count
      const newLowStockCount =
        updatedItems.filter(
          (item) =>
            item.stockStatus === "LOW_STOCK"
        ).length;

      setLowStockCount(newLowStockCount);

      return updatedItems;
    });
  };

  // ========================================
  // ACTION FORM CHANGE
  //
  // Every inventory item keeps separate
  // quantity/newStock/note inputs.
  // ========================================

  const handleActionChange = (
    itemId,
    field,
    value
  ) => {
    setActionForms((prev) => ({
      ...prev,

      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  // ========================================
  // CLEAR ACTION FORM
  // ========================================

  const clearActionForm = (itemId) => {
    setActionForms((prev) => ({
      ...prev,

      [itemId]: {
        quantity: "",
        newStock: "",
        note: "",
      },
    }));
  };

  // ========================================
  // ADD STOCK
  // ========================================

  const handleAddStock = async (itemId) => {
    const form =
      actionForms[itemId] || {};

    const quantity =
      Number(form.quantity);

    if (!quantity || quantity <= 0) {
      alert(
        "Enter a valid stock quantity"
      );

      return;
    }

    try {
      const response = await api.patch(
        `/inventory/${itemId}/add-stock`,
        {
          quantity,
          note: form.note || "",
        }
      );

      updateItemInState(
        response.data.item
      );

      clearActionForm(itemId);

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Add stock error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to add stock"
      );
    }
  };

  // ========================================
  // RECORD WASTE
  // ========================================

  const handleWaste = async (itemId) => {
    const form =
      actionForms[itemId] || {};

    const quantity =
      Number(form.quantity);

    if (!quantity || quantity <= 0) {
      alert(
        "Enter a valid waste quantity"
      );

      return;
    }

    try {
      const response = await api.patch(
        `/inventory/${itemId}/waste`,
        {
          quantity,
          note: form.note || "",
        }
      );

      updateItemInState(
        response.data.item
      );

      clearActionForm(itemId);

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Waste error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to record waste"
      );
    }
  };

  // ========================================
  // MANUAL STOCK ADJUSTMENT
  //
  // Inventory staff enters actual physical
  // stock after counting inventory.
  // ========================================

  const handleAdjustment = async (
    itemId
  ) => {
    const form =
      actionForms[itemId] || {};

    if (
      form.newStock === undefined ||
      form.newStock === ""
    ) {
      alert(
        "Enter the new stock quantity"
      );

      return;
    }

    const newStock =
      Number(form.newStock);

    if (
      Number.isNaN(newStock) ||
      newStock < 0
    ) {
      alert(
        "Enter a valid non-negative stock"
      );

      return;
    }

    try {
      const response = await api.patch(
        `/inventory/${itemId}/adjust`,
        {
          newStock,
          note: form.note || "",
        }
      );

      updateItemInState(
        response.data.item
      );

      clearActionForm(itemId);

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Stock adjustment error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to adjust stock"
      );
    }
  };

  // ========================================
  // VIEW INVENTORY TRANSACTION HISTORY
  // ========================================

  const handleViewHistory = async (
    item
  ) => {
    try {
      setHistoryLoading(true);
      setHistoryItem(item);

      const response = await api.get(
        `/inventory/${item.id}/history`
      );

      setHistory(
        response.data.transactions
      );
    } catch (error) {
      console.error(
        "Inventory history error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to load inventory history"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div>
      {/* =====================================
          DASHBOARD HEADER
      ====================================== */}

      <h1>Inventory Dashboard</h1>

      <p>
        Welcome to DineFlow Inventory Portal
      </p>

      <LogoutButton />

      {/* =====================================
          SMART INVENTORY ALERTS
      ====================================== */}
      
      <InventoryAlerts />
      
      {/* =====================================
          REORDER / PROCUREMENT
      ====================================== */}
      
      <ReorderManagement />

      {/* =====================================
          BASIC INVENTORY SUMMARY
      ====================================== */}

     {/* =====================================
          CONSUMPTION ANALYTICS
      ====================================== */}

      <ConsumptionAnalytics />

      {/* =====================================
          WASTE ANALYTICS
      ====================================== */}
      
      <WasteAnalytics />
      <hr />

      <h2>Inventory Summary</h2>

      <p>
        Total Items:{" "}
        <strong>
          {items.length}
        </strong>
      </p>

      <p>
        Low Stock Items:{" "}
        <strong>
          {lowStockCount}
        </strong>
      </p>

      {lowStockCount > 0 && (
        <p>
          ⚠ {lowStockCount} inventory
          item(s) require attention.
        </p>
      )}

      <hr />

      {/* =====================================
          CURRENT INVENTORY
      ====================================== */}

      <h2>Current Inventory</h2>

      {loading && (
        <p>Loading inventory...</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        items.length === 0 && (
          <p>
            No inventory items found.
          </p>
        )}

      {!loading &&
        !error &&
        items.map((item) => {
          const form =
            actionForms[item.id] || {};

          return (
            <div key={item.id}>
              {/* Ingredient information */}

              <h3>{item.name}</h3>

              <p>
                Current Stock:{" "}
                <strong>
                  {Number(
                    item.currentStock
                  ).toFixed(3)}{" "}
                  {item.unit}
                </strong>
              </p>

              <p>
                Minimum Stock:{" "}
                {Number(
                  item.minimumStock
                ).toFixed(3)}{" "}
                {item.unit}
              </p>

              <p>
                Status:{" "}
                <strong>
                  {item.stockStatus ===
                  "LOW_STOCK"
                    ? "⚠ LOW STOCK"
                    : "OK"}
                </strong>
              </p>

              {/* =================================
                  STOCK IN / WASTE INPUT
              ================================= */}

              <label>Quantity</label>

              <br />

              <input
                type="number"
                min="0"
                step="0.001"
                placeholder={`Quantity in ${item.unit}`}
                value={
                  form.quantity || ""
                }
                onChange={(e) =>
                  handleActionChange(
                    item.id,
                    "quantity",
                    e.target.value
                  )
                }
              />

              <br />
              <br />

              {/* Audit note */}

              <label>Note</label>

              <br />

              <input
                type="text"
                placeholder="Reason / supplier / waste note"
                value={form.note || ""}
                onChange={(e) =>
                  handleActionChange(
                    item.id,
                    "note",
                    e.target.value
                  )
                }
              />

              <br />
              <br />

              <button
                type="button"
                onClick={() =>
                  handleAddStock(
                    item.id
                  )
                }
              >
                Add Stock
              </button>

              {" "}

              <button
                type="button"
                onClick={() =>
                  handleWaste(
                    item.id
                  )
                }
              >
                Record Waste
              </button>

              <br />
              <br />

              {/* =================================
                  PHYSICAL STOCK ADJUSTMENT
              ================================= */}

              <label>
                Actual Physical Stock
              </label>

              <br />

              <input
                type="number"
                min="0"
                step="0.001"
                placeholder={`Actual ${item.unit}`}
                value={
                  form.newStock || ""
                }
                onChange={(e) =>
                  handleActionChange(
                    item.id,
                    "newStock",
                    e.target.value
                  )
                }
              />

              <br />
              <br />

              <button
                type="button"
                onClick={() =>
                  handleAdjustment(
                    item.id
                  )
                }
              >
                Adjust Stock
              </button>

              {" "}

              <button
                type="button"
                onClick={() =>
                  handleViewHistory(
                    item
                  )
                }
              >
                View History
              </button>

              <hr />
            </div>
          );
        })}

      {/* =====================================
          TRANSACTION HISTORY
      ====================================== */}

      {historyItem && (
        <section>
          <h2>
            {historyItem.name}
            {" — "}
            Stock History
          </h2>

          {historyLoading ? (
            <p>
              Loading history...
            </p>
          ) : history.length === 0 ? (
            <p>
              No stock transactions found.
            </p>
          ) : (
            <table
              border="1"
              cellPadding="10"
            >
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Note</th>
                  <th>
                    Performed By
                  </th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {history.map(
                  (transaction) => (
                    <tr
                      key={
                        transaction.id
                      }
                    >
                      <td>
                        {
                          transaction.type
                        }
                      </td>

                      <td>
                        {Number(
                          transaction.quantity
                        ).toFixed(3)}{" "}
                        {historyItem.unit}
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
                        {new Date(
                          transaction.createdAt
                        ).toLocaleString()}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}

          <br />

          <button
            type="button"
            onClick={() => {
              setHistoryItem(null);
              setHistory([]);
            }}
          >
            Close History
          </button>
        </section>
      )}
    </div>
  );
}

export default InventoryDashboard;