import { useEffect, useState } from "react";
import api from "../../services/api";

function ReservationManagement() {
  // ========================================
  // STATE
  // ========================================

  const [reservations, setReservations] =
    useState([]);

  const [tables, setTables] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // FETCH SERVICE DATA
  // Reservations + physical table states
  // ========================================

  const fetchServiceData = async () => {
    try {
      setError("");

      const [
        reservationResponse,
        tableResponse,
      ] = await Promise.all([
        api.get("/waiter/reservations"),
        api.get("/tables"),
      ]);

      setReservations(
        reservationResponse.data.reservations
      );

      setTables(tableResponse.data.tables);
    } catch (error) {
      console.error(
        "Fetch waiter reservation data error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load reservation data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceData();
  }, []);

  // ========================================
  // UPDATE RESERVATION STATUS
  // CONFIRMED -> SEATED
  // SEATED -> COMPLETED
  // ========================================

  const handleReservationStatus = async (
    reservationId,
    newStatus
  ) => {
    try {
      const response = await api.patch(
        `/waiter/reservations/${reservationId}/status`,
        {
          status: newStatus,
        }
      );

      alert(response.data.message);

      // Re-fetch because reservation update can also
      // change the physical table state.
      await fetchServiceData();
    } catch (error) {
      console.error(
        "Update reservation error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update reservation"
      );
    }
  };

  // ========================================
  // UPDATE TABLE STATUS
  // Mainly used after cleaning is finished
  // ========================================

  const handleTableStatus = async (
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

      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? updatedTable
            : table
        )
      );

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Update table status error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update table status"
      );
    }
  };

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDateTime = (value) => {
    return new Date(value).toLocaleString();
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>Reservations</h2>

      {loading && (
        <p>Loading reservations...</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        reservations.length === 0 && (
          <p>No active reservations.</p>
        )}

      {!loading &&
        !error &&
        reservations.map((reservation) => (
          <div key={reservation.id}>
            <h3>
              Reservation #{reservation.id}
            </h3>

            <p>
              Customer:{" "}
              {reservation.customer.name}
            </p>

            <p>
              Phone:{" "}
              {reservation.customer.phone || "-"}
            </p>

            <p>
              Table:{" "}
              <strong>
                {reservation.table.number}
              </strong>
            </p>

            <p>
              Guests: {reservation.guestCount}
            </p>

            <p>
              Time:{" "}
              {formatDateTime(
                reservation.startTime
              )}
            </p>

            <p>
              Status:{" "}
              <strong>
                {reservation.status}
              </strong>
            </p>

            {/* Guest arrives */}
            {reservation.status ===
              "CONFIRMED" && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleReservationStatus(
                      reservation.id,
                      "SEATED"
                    )
                  }
                >
                  Seat Guests
                </button>

                {" "}

                <button
                  type="button"
                  onClick={() =>
                    handleReservationStatus(
                      reservation.id,
                      "NO_SHOW"
                    )
                  }
                >
                  Mark No Show
                </button>
              </>
            )}

            {/* Guest finishes dining */}
            {reservation.status ===
              "SEATED" && (
              <button
                type="button"
                onClick={() =>
                  handleReservationStatus(
                    reservation.id,
                    "COMPLETED"
                  )
                }
              >
                Complete Reservation
              </button>
            )}

            <hr />
          </div>
        ))}

      {/* =====================================
          TABLE STATUS
      ====================================== */}

      <h2>Table Status</h2>

      {tables.length === 0 ? (
        <p>No tables found.</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Table</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Action</th>
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
                  {/* Cleaning completed */}
                  {table.status ===
                  "CLEANING" ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleTableStatus(
                          table.id,
                          "AVAILABLE"
                        )
                      }
                    >
                      Cleaning Done
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default ReservationManagement;