import { useEffect, useState } from "react";
import api from "../../services/api";

function TableManagement() {
  // ========================================
  // STATE - RESTAURANT TABLES
  // ========================================

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Manager's Create Table form
  const [formData, setFormData] = useState({
    number: "",
    capacity: "",
  });

  // ========================================
  // FETCH ALL TABLES
  // ========================================

  const fetchTables = async () => {
    try {
      setError("");

      const response = await api.get("/tables");

      setTables(response.data.tables);
    } catch (error) {
      console.error("Fetch tables error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load restaurant tables"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
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
  // CREATE TABLE
  // Manager creates a physical restaurant table
  // ========================================

  const handleCreateTable = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/tables", {
        number: formData.number,
        capacity: Number(formData.capacity),
      });

      const newTable = response.data.table;

      // Update UI immediately
      setTables((prev) => [...prev, newTable]);

      // Clear form
      setFormData({
        number: "",
        capacity: "",
      });

      alert(response.data.message);
    } catch (error) {
      console.error("Create table error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to create restaurant table"
      );
    }
  };

  // ========================================
  // UPDATE TABLE STATUS
  // Manager can manually change physical state
  // ========================================

  const handleStatusChange = async (
    tableId,
    newStatus
  ) => {
    try {
      const response = await api.patch(
        `/tables/${tableId}/status`,
        {
          status: newStatus,
        }
      );

      const updatedTable = response.data.table;

      // Replace changed table in UI
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? updatedTable
            : table
        )
      );

      alert(response.data.message);
    } catch (error) {
      console.error("Update table status error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to update table status"
      );
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>Table Management</h2>

      {/* =====================================
          CREATE TABLE
      ====================================== */}

      <h3>Add Restaurant Table</h3>

      <form onSubmit={handleCreateTable}>
        <div>
          <label>Table Number</label>
          <br />

          <input
            type="text"
            name="number"
            placeholder="e.g. T4"
            value={formData.number}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Capacity</label>
          <br />

          <input
            type="number"
            name="capacity"
            min="1"
            max="20"
            placeholder="e.g. 4"
            value={formData.capacity}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <button type="submit">
          Add Table
        </button>
      </form>

      <br />

      {/* =====================================
          TABLE LIST
      ====================================== */}

      <h3>Restaurant Tables</h3>

      {loading && <p>Loading tables...</p>}

      {error && <p>{error}</p>}

      {!loading &&
        !error &&
        tables.length === 0 && (
          <p>No restaurant tables found.</p>
        )}

      {!loading &&
        !error &&
        tables.length > 0 && (
          <table border="1" cellPadding="10">
            <thead>
              <tr>
                <th>Table</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Change Status</th>
              </tr>
            </thead>

            <tbody>
              {tables.map((table) => (
                <tr key={table.id}>
                  <td>{table.number}</td>

                  <td>
                    {table.capacity} guests
                  </td>

                  <td>{table.status}</td>

                  <td>
                    <select
                      value={table.status}
                      onChange={(e) =>
                        handleStatusChange(
                          table.id,
                          e.target.value
                        )
                      }
                    >
                      <option value="AVAILABLE">
                        Available
                      </option>

                      <option value="RESERVED">
                        Reserved
                      </option>

                      <option value="OCCUPIED">
                        Occupied
                      </option>

                      <option value="CLEANING">
                        Cleaning
                      </option>

                      <option value="DISABLED">
                        Disabled
                      </option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </section>
  );
}

export default TableManagement;