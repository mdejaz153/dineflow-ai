function AvailableTables({
  availabilityChecked,
  availableTables,
  onReserve,
}) {
  // Do not display anything until customer
  // has performed an availability search.
  if (!availabilityChecked) {
    return null;
  }

  return (
    <section>
      <br />

      <h3>Available Tables</h3>

      {/* No tables available */}
      {availableTables.length === 0 ? (
        <p>
          No tables are available for this
          time and guest count.
        </p>
      ) : (
        <table
          border="1"
          cellPadding="10"
        >
          <thead>
            <tr>
              <th>Table</th>
              <th>Capacity</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {availableTables.map((table) => (
              <tr key={table.id}>
                <td>{table.number}</td>

                <td>
                  {table.capacity} guests
                </td>

                <td>
                  <button
                    type="button"
                    onClick={() =>
                      onReserve(table.id)
                    }
                  >
                    Reserve
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

export default AvailableTables;