import { useEffect, useState } from "react";
import api from "../../services/api";

function ReorderManagement() {
  // ========================================
  // STATE - INVENTORY ITEMS
  // Used while creating a reorder request
  // ========================================

  const [inventoryItems, setInventoryItems] =
    useState([]);

  // ========================================
  // STATE - MY REORDER REQUESTS
  // ========================================

  const [reorderRequests, setReorderRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ========================================
  // STATE - CREATE REORDER FORM
  // ========================================

  const [formData, setFormData] =
    useState({
      inventoryItemId: "",
      quantity: "",
      note: "",
    });

  const [creating, setCreating] =
    useState(false);

  // ========================================
  // FETCH INVENTORY + MY REQUESTS
  // ========================================

  const fetchReorderData = async () => {
    try {
      setError("");

      const [
        inventoryResponse,
        reorderResponse,
      ] = await Promise.all([
        api.get("/inventory"),

        api.get(
          "/reorders/my-requests"
        ),
      ]);

      setInventoryItems(
        inventoryResponse.data.items
      );

      setReorderRequests(
        reorderResponse.data.reorderRequests
      );
    } catch (error) {
      console.error(
        "Reorder data fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load procurement data"
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // AUTO-SYNC PROCUREMENT DATA
  //
  // Refreshes every 5 seconds so Manager
  // approvals appear without page refresh.
  // ========================================
  
  useEffect(() => {
    // Initial load
    fetchReorderData();
  
    // Periodically sync with backend
    const interval = setInterval(() => {
      fetchReorderData();
    }, 5000);
  
    // Prevent memory leak when component closes
    return () => {
      clearInterval(interval);
    };
  }, []);

  // ========================================
  // FORM INPUT CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========================================
  // USE SMART REORDER SUGGESTION
  //
  // Calculates same V1 target used by
  // Smart Inventory Alerts:
  //
  // Target = minimum stock × 2
  // Reorder = target - current stock
  // ========================================

  const handleUseSuggestion = () => {
    const itemId = Number(
      formData.inventoryItemId
    );

    const item = inventoryItems.find(
      (inventoryItem) =>
        inventoryItem.id === itemId
    );

    if (!item) {
      alert(
        "Please select an inventory item first"
      );

      return;
    }

    const currentStock =
      Number(item.currentStock);

    const minimumStock =
      Number(item.minimumStock);

    const targetStock =
      minimumStock * 2;

    const suggestedQuantity =
      Math.max(
        targetStock - currentStock,
        0
      );

    if (suggestedQuantity <= 0) {
      alert(
        `${item.name} currently has healthy stock`
      );

      return;
    }

    setFormData((prev) => ({
      ...prev,

      quantity:
        suggestedQuantity.toFixed(3),

      note:
        "Smart alert suggested reorder",
    }));
  };

  // ========================================
  // CREATE REORDER REQUEST
  // ========================================

  const handleCreateReorder = async (e) => {
    e.preventDefault();

    const inventoryItemId =
      Number(
        formData.inventoryItemId
      );

    const quantity =
      Number(formData.quantity);

    if (
      !inventoryItemId ||
      Number.isNaN(quantity) ||
      quantity <= 0
    ) {
      alert(
        "Select an item and enter a valid quantity"
      );

      return;
    }

    try {
      setCreating(true);

      const response = await api.post(
        "/reorders",
        {
          inventoryItemId,
          quantity,
          note:
            formData.note || "",
        }
      );

      const newRequest =
        response.data.reorderRequest;

      // New request appears instantly
      setReorderRequests((prev) => [
        newRequest,
        ...prev,
      ]);

      // Clear form
      setFormData({
        inventoryItemId: "",
        quantity: "",
        note: "",
      });

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Create reorder error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to create reorder request"
      );
    } finally {
      setCreating(false);
    }
  };

  // ========================================
  // MARK APPROVED DELIVERY AS RECEIVED
  //
  // Backend automatically:
  // 1. Marks request RECEIVED
  // 2. Increases inventory
  // 3. Creates STOCK_IN audit entry
  // ========================================

  const handleReceive = async (
    requestId
  ) => {
    try {
      const response = await api.patch(
        `/reorders/${requestId}/receive`
      );

      const updatedRequest =
        response.data.reorderRequest;

      // Update request instantly
      setReorderRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? updatedRequest
            : request
        )
      );

      // Refresh inventory values because
      // received stock has changed quantity.
      const inventoryResponse =
        await api.get("/inventory");

      setInventoryItems(
        inventoryResponse.data.items
      );

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Receive reorder error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to receive reorder"
      );
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

      <h2>
        Reorder / Procurement
      </h2>

      {/* =====================================
          CREATE REORDER REQUEST
      ====================================== */}

      <h3>
        Create Reorder Request
      </h3>

      <form
        onSubmit={
          handleCreateReorder
        }
      >
        {/* Ingredient */}

        <div>
          <label>
            Inventory Item
          </label>

          <br />

          <select
            name="inventoryItemId"
            value={
              formData.inventoryItemId
            }
            onChange={handleChange}
            required
          >
            <option value="">
              Select Item
            </option>

            {inventoryItems.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                  {" — "}
                  {Number(
                    item.currentStock
                  ).toFixed(3)}
                  {" "}
                  {item.unit}
                </option>
              )
            )}
          </select>
        </div>

        <br />

        {/* Quantity */}

        <div>
          <label>
            Reorder Quantity
          </label>

          <br />

          <input
            type="number"
            min="0.001"
            step="0.001"
            name="quantity"
            value={
              formData.quantity
            }
            onChange={handleChange}
            placeholder="Quantity"
            required
          />

          {" "}

          <button
            type="button"
            onClick={
              handleUseSuggestion
            }
          >
            Use Smart Suggestion
          </button>
        </div>

        <br />

        {/* Note */}

        <div>
          <label>Note</label>

          <br />

          <input
            type="text"
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Reason for reorder"
          />
        </div>

        <br />

        <button
          type="submit"
          disabled={creating}
        >
          {creating
            ? "Creating..."
            : "Create Reorder Request"}
        </button>
      </form>

      <hr />

      {/* =====================================
          MY REORDER REQUESTS
      ====================================== */}

      <h3>
        My Reorder Requests
      </h3>

      {loading && (
        <p>
          Loading reorder requests...
        </p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        reorderRequests.length === 0 && (
          <p>
            No reorder requests found.
          </p>
        )}

      {!loading &&
        !error &&
        reorderRequests.length > 0 && (
          <table
            border="1"
            cellPadding="10"
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Created</th>
                <th>Reviewed By</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {reorderRequests.map(
                (request) => (
                  <tr key={request.id}>
                    <td>
                      #{request.id}
                    </td>

                    <td>
                      {
                        request
                          .inventoryItem
                          .name
                      }
                    </td>

                    <td>
                      {Number(
                        request.quantity
                      ).toFixed(3)}
                      {" "}
                      {
                        request
                          .inventoryItem
                          .unit
                      }
                    </td>

                    <td>
                      <strong>
                        {request.status}
                      </strong>
                    </td>

                    <td>
                      {formatDateTime(
                        request.createdAt
                      )}
                    </td>

                    <td>
                      {request.reviewedBy
                        ?.name || "-"}
                    </td>

                    <td>
                      {request.status ===
                      "APPROVED" ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleReceive(
                              request.id
                            )
                          }
                        >
                          Mark Received
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
        )}
    </section>
  );
}

export default ReorderManagement;