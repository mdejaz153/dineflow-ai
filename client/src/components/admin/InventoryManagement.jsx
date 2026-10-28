import { useEffect, useState } from "react";
import api from "../../services/api";

function InventoryManagement() {
  // ========================================
  // STATE - INVENTORY
  // ========================================

  const [items, setItems] = useState([]);
  const [lowStockCount, setLowStockCount] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // STATE - CREATE INGREDIENT FORM
  // ========================================

  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    currentStock: "",
    minimumStock: "",
  });

  // Stores temporary minimum threshold input
  const [minimumInputs, setMinimumInputs] =
    useState({});

  // ========================================
  // FETCH INVENTORY
  // ========================================

  const fetchInventory = async () => {
    try {
      setError("");

      const response = await api.get(
        "/inventory"
      );

      setItems(response.data.items);

      setLowStockCount(
        response.data.lowStockCount
      );
    } catch (error) {
      console.error(
        "Manager inventory fetch error:",
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

  useEffect(() => {
    fetchInventory();
  }, []);

  // ========================================
  // CREATE FORM CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========================================
  // CREATE INGREDIENT
  // Manager only
  // ========================================

  const handleCreateItem = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "/inventory",
        {
          name: formData.name,
          unit: formData.unit,
          currentStock: Number(
            formData.currentStock
          ),
          minimumStock: Number(
            formData.minimumStock
          ),
        }
      );

      const newItem = response.data.item;

      const updatedItems = [
        ...items,
        newItem,
      ];

      setItems(updatedItems);

      setLowStockCount(
        updatedItems.filter(
          (item) =>
            item.stockStatus === "LOW_STOCK"
        ).length
      );

      setFormData({
        name: "",
        unit: "",
        currentStock: "",
        minimumStock: "",
      });

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Create inventory item error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to create inventory item"
      );
    }
  };

  // ========================================
  // UPDATE MINIMUM STOCK
  // Manager changes low-stock threshold
  // ========================================

  const handleMinimumStockUpdate = async (
    itemId
  ) => {
    const value = minimumInputs[itemId];

    if (
      value === undefined ||
      value === ""
    ) {
      alert("Enter minimum stock");
      return;
    }

    const minimumStock = Number(value);

    if (
      Number.isNaN(minimumStock) ||
      minimumStock < 0
    ) {
      alert(
        "Minimum stock must be a valid non-negative number"
      );
      return;
    }

    try {
      const response = await api.patch(
        `/inventory/${itemId}/minimum-stock`,
        {
          minimumStock,
        }
      );

      const updatedItem = response.data.item;

      const updatedItems = items.map((item) =>
        item.id === itemId
          ? updatedItem
          : item
      );

      setItems(updatedItems);

      setLowStockCount(
        updatedItems.filter(
          (item) =>
            item.stockStatus === "LOW_STOCK"
        ).length
      );

      setMinimumInputs((prev) => ({
        ...prev,
        [itemId]: "",
      }));

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Minimum stock update error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update minimum stock"
      );
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>Inventory Management</h2>

      {/* =====================================
          SUMMARY
      ====================================== */}

      <p>
        Total Inventory Items:{" "}
        <strong>{items.length}</strong>
      </p>

      <p>
        Low Stock Items:{" "}
        <strong>{lowStockCount}</strong>
      </p>

      {lowStockCount > 0 && (
        <p>
          ⚠ Inventory attention required.
        </p>
      )}

      {/* =====================================
          CREATE INGREDIENT
      ====================================== */}

      <h3>Add Ingredient</h3>

      <form onSubmit={handleCreateItem}>
        <div>
          <label>Ingredient Name</label>
          <br />

          <input
            type="text"
            name="name"
            placeholder="e.g. Chicken"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Unit</label>
          <br />

          <input
            type="text"
            name="unit"
            placeholder="kg / g / L / pcs"
            value={formData.unit}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Current Stock</label>
          <br />

          <input
            type="number"
            min="0"
            step="0.001"
            name="currentStock"
            placeholder="e.g. 5"
            value={formData.currentStock}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Minimum Stock</label>
          <br />

          <input
            type="number"
            min="0"
            step="0.001"
            name="minimumStock"
            placeholder="e.g. 2"
            value={formData.minimumStock}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <button type="submit">
          Add Ingredient
        </button>
      </form>

      <hr />

      {/* =====================================
          INVENTORY TABLE
      ====================================== */}

      <h3>Inventory Overview</h3>

      {loading && (
        <p>Loading inventory...</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        items.length === 0 && (
          <p>No inventory items found.</p>
        )}

      {!loading &&
        !error &&
        items.length > 0 && (
          <table
            border="1"
            cellPadding="10"
          >
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Current Stock</th>
                <th>Minimum Stock</th>
                <th>Status</th>
                <th>Change Minimum</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>

                  <td>
                    {Number(
                      item.currentStock
                    ).toFixed(3)}{" "}
                    {item.unit}
                  </td>

                  <td>
                    {Number(
                      item.minimumStock
                    ).toFixed(3)}{" "}
                    {item.unit}
                  </td>

                  <td>
                    {item.stockStatus ===
                    "LOW_STOCK"
                      ? "⚠ LOW STOCK"
                      : "OK"}
                  </td>

                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="New minimum"
                      value={
                        minimumInputs[
                          item.id
                        ] || ""
                      }
                      onChange={(e) =>
                        setMinimumInputs(
                          (prev) => ({
                            ...prev,
                            [item.id]:
                              e.target
                                .value,
                          })
                        )
                      }
                    />

                    {" "}

                    <button
                      type="button"
                      onClick={() =>
                        handleMinimumStockUpdate(
                          item.id
                        )
                      }
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </section>
  );
}

export default InventoryManagement;