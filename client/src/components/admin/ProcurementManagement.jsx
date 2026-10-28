import { useEffect, useState } from "react";
import api from "../../services/api";

function ProcurementManagement() {
  // ========================================
  // STATE - PROCUREMENT REQUESTS
  // ========================================

  const [
    reorderRequests,
    setReorderRequests,
  ] = useState([]);

  const [summary, setSummary] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ========================================
  // FETCH ALL PROCUREMENT REQUESTS
  // Manager only
  // ========================================

  const fetchReorders = async () => {
    try {
      setError("");

      const response = await api.get(
        "/reorders"
      );

      setReorderRequests(
        response.data.reorderRequests
      );

      setSummary(
        response.data.summary
      );
    } catch (error) {
      console.error(
        "Manager reorder fetch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load procurement requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReorders();
  }, []);

  // ========================================
  // RECALCULATE SUMMARY
  //
  // Keeps Manager UI updated immediately
  // after Approve / Reject.
  // ========================================

  const recalculateSummary = (
    requests
  ) => {
    setSummary({
      total: requests.length,

      pending: requests.filter(
        (request) =>
          request.status === "PENDING"
      ).length,

      approved: requests.filter(
        (request) =>
          request.status === "APPROVED"
      ).length,

      rejected: requests.filter(
        (request) =>
          request.status === "REJECTED"
      ).length,

      received: requests.filter(
        (request) =>
          request.status === "RECEIVED"
      ).length,
    });
  };

  // ========================================
  // REVIEW PROCUREMENT REQUEST
  //
  // PENDING -> APPROVED
  // PENDING -> REJECTED
  // ========================================

  const handleReview = async (
    requestId,
    newStatus
  ) => {
    try {
      const response = await api.patch(
        `/reorders/${requestId}/review`,
        {
          status: newStatus,
        }
      );

      const updatedRequest =
        response.data.reorderRequest;

      const updatedRequests =
        reorderRequests.map(
          (request) =>
            request.id === requestId
              ? updatedRequest
              : request
        );

      setReorderRequests(
        updatedRequests
      );

      recalculateSummary(
        updatedRequests
      );

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Review reorder error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to review reorder request"
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
        Procurement Management
      </h2>

      {loading && (
        <p>
          Loading procurement requests...
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
                PROCUREMENT SUMMARY
            ================================= */}

            <h3>
              Procurement Summary
            </h3>

            <p>
              Total Requests:{" "}
              <strong>
                {summary.total}
              </strong>
            </p>

            <p>
              Pending:{" "}
              <strong>
                {summary.pending}
              </strong>
            </p>

            <p>
              Approved:{" "}
              <strong>
                {summary.approved}
              </strong>
            </p>

            <p>
              Rejected:{" "}
              <strong>
                {summary.rejected}
              </strong>
            </p>

            <p>
              Received:{" "}
              <strong>
                {summary.received}
              </strong>
            </p>

            <hr />

            {/* =================================
                PROCUREMENT REQUEST LIST
            ================================= */}

            <h3>
              Reorder Requests
            </h3>

            {reorderRequests.length ===
            0 ? (
              <p>
                No procurement requests
                found.
              </p>
            ) : (
              <table
                border="1"
                cellPadding="10"
              >
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Requested By</th>
                    <th>Note</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Reviewed By</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {reorderRequests.map(
                    (request) => (
                      <tr
                        key={
                          request.id
                        }
                      >
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
                          {
                            request
                              .createdBy
                              .name
                          }
                        </td>

                        <td>
                          {request.note ||
                            "-"}
                        </td>

                        <td>
                          <strong>
                            {
                              request.status
                            }
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
                          "PENDING" ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleReview(
                                    request.id,
                                    "APPROVED"
                                  )
                                }
                              >
                                Approve
                              </button>

                              {" "}

                              <button
                                type="button"
                                onClick={() =>
                                  handleReview(
                                    request.id,
                                    "REJECTED"
                                  )
                                }
                              >
                                Reject
                              </button>
                            </>
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
          </>
        )}
    </section>
  );
}

export default ProcurementManagement;