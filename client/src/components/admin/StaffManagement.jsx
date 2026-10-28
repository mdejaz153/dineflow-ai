import { useEffect, useState } from "react";
import api from "../../services/api";

function StaffManagement() {
  // ========================================
  // STATE - STAFF LIST
  // ========================================

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // STATE - ADD EMPLOYEE FORM
  // ========================================

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
    department: "",
    shift: "",
  });

  // ========================================
  // FETCH ALL STAFF
  // ========================================

  const fetchStaff = async () => {
    try {
      setError("");

      const response = await api.get("/admin/staff");

      setStaff(response.data.staff);
    } catch (error) {
      console.error("Staff fetch error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load staff"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
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
  // CREATE STAFF MEMBER
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "/admin/staff",
        formData
      );

      const newStaff = response.data.staff;

      // Backend create response is flattened,
      // so convert it into same structure used
      // by GET /admin/staff.
      const formattedStaff = {
        id: newStaff.employeeId,
        employeeCode: newStaff.employeeCode,
        department: newStaff.department,
        shift: newStaff.shift,

        user: {
          id: newStaff.id,
          name: newStaff.name,
          email: newStaff.email,
          phone: newStaff.phone,
          role: newStaff.role,
          status: newStaff.status,
        },
      };

      // Update table instantly
      setStaff((prev) => [
        ...prev,
        formattedStaff,
      ]);

      // Clear form
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "",
        department: "",
        shift: "",
      });

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Create employee error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to create employee"
      );
    }
  };

  // ========================================
  // DEACTIVATE STAFF
  // ========================================

  const handleDeactivate = async (employeeId) => {
    try {
      const response = await api.patch(
        `/admin/staff/${employeeId}/deactivate`
      );

      setStaff((prev) =>
        prev.map((employee) =>
          employee.id === employeeId
            ? {
                ...employee,

                user: {
                  ...employee.user,
                  status: "INACTIVE",
                },
              }
            : employee
        )
      );

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Deactivate employee error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to deactivate employee"
      );
    }
  };

  // ========================================
  // REACTIVATE STAFF
  // ========================================

  const handleReactivate = async (employeeId) => {
    try {
      const response = await api.patch(
        `/admin/staff/${employeeId}/reactivate`
      );

      setStaff((prev) =>
        prev.map((employee) =>
          employee.id === employeeId
            ? {
                ...employee,

                user: {
                  ...employee.user,
                  status: "ACTIVE",
                },
              }
            : employee
        )
      );

      alert(response.data.message);
    } catch (error) {
      console.error(
        "Reactivate employee error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to reactivate employee"
      );
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <section>
      <hr />

      <h2>Staff Management</h2>

      {/* =====================================
          ADD EMPLOYEE
      ====================================== */}

      <h3>Add Employee</h3>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <br />

          <input
            type="text"
            name="name"
            placeholder="Employee name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Email</label>
          <br />

          <input
            type="email"
            name="email"
            placeholder="Employee email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Phone</label>
          <br />

          <input
            type="text"
            name="phone"
            placeholder="Phone number"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <br />

        <div>
          <label>Password</label>
          <br />

          <input
            type="password"
            name="password"
            placeholder="Temporary password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Role</label>
          <br />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="">
              Select Role
            </option>

            <option value="CHEF">
              Chef
            </option>

            <option value="WAITER">
              Waiter
            </option>

            <option value="INVENTORY_STAFF">
              Inventory Staff
            </option>
          </select>
        </div>

        <br />

        <div>
          <label>Department</label>
          <br />

          <input
            type="text"
            name="department"
            placeholder="e.g. Kitchen"
            value={formData.department}
            onChange={handleChange}
          />
        </div>

        <br />

        <div>
          <label>Shift</label>
          <br />

          <select
            name="shift"
            value={formData.shift}
            onChange={handleChange}
          >
            <option value="">
              Select Shift
            </option>

            <option value="Morning">
              Morning
            </option>

            <option value="Evening">
              Evening
            </option>

            <option value="Night">
              Night
            </option>
          </select>
        </div>

        <br />

        <button type="submit">
          Add Employee
        </button>
      </form>

      <hr />

      {/* =====================================
          STAFF LIST
      ====================================== */}

      <h3>Staff Members</h3>

      {loading && (
        <p>Loading staff...</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {!loading &&
        !error &&
        staff.length === 0 && (
          <p>No staff members found.</p>
        )}

      {!loading &&
        !error &&
        staff.length > 0 && (
          <table
            border="1"
            cellPadding="10"
          >
            <thead>
              <tr>
                <th>Employee Code</th>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Shift</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {staff.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    {employee.employeeCode}
                  </td>

                  <td>
                    {employee.user.name}
                  </td>

                  <td>
                    {employee.user.role}
                  </td>

                  <td>
                    {employee.department || "-"}
                  </td>

                  <td>
                    {employee.shift || "-"}
                  </td>

                  <td>
                    {employee.user.status}
                  </td>

                  <td>
                    {employee.user.status ===
                    "ACTIVE" ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeactivate(
                            employee.id
                          )
                        }
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleReactivate(
                            employee.id
                          )
                        }
                      >
                        Reactivate
                      </button>
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

export default StaffManagement;