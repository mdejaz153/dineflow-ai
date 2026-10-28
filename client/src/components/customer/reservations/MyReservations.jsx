function MyReservations({
  reservations,
  loading,
  onCancel,
}) {
  // ========================================
  // FORMAT RESERVATION DATE/TIME
  // ========================================

  const formatDateTime = (value) => {
    return new Date(
      value
    ).toLocaleString();
  };

  return (
    <section>
      <hr />

      <h2>My Reservations</h2>

      {/* Loading */}
      {loading ? (
        <p>
          Loading reservations...
        </p>
      ) : reservations.length === 0 ? (
        // No reservations
        <p>
          You have no reservations.
        </p>
      ) : (
        // Reservation list
        reservations.map(
          (reservation) => (
            <div key={reservation.id}>
              <h3>
                Reservation #
                {reservation.id}
              </h3>

              {/* Table */}
              <p>
                Table:{" "}
                <strong>
                  {reservation.table.number}
                </strong>
              </p>

              {/* Guest count */}
              <p>
                Guests:{" "}
                {reservation.guestCount}
              </p>

              {/* Start time */}
              <p>
                Start:{" "}
                {formatDateTime(
                  reservation.startTime
                )}
              </p>

              {/* End time */}
              <p>
                End:{" "}
                {formatDateTime(
                  reservation.endTime
                )}
              </p>

              {/* Status */}
              <p>
                Status:{" "}
                <strong>
                  {reservation.status}
                </strong>
              </p>

              {/* Optional special request */}
              {reservation.specialRequest && (
                <p>
                  Special Request:{" "}
                  {
                    reservation.specialRequest
                  }
                </p>
              )}

              {/* Customer can cancel only
                  CONFIRMED reservations */}
              {reservation.status ===
                "CONFIRMED" && (
                <button
                  type="button"
                  onClick={() =>
                    onCancel(
                      reservation.id
                    )
                  }
                >
                  Cancel Reservation
                </button>
              )}

              <hr />
            </div>
          )
        )
      )}
    </section>
  );
}

export default MyReservations;