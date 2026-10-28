import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { token, user } = response.data;

localStorage.setItem("token", token);
localStorage.setItem("user", JSON.stringify(user));

if (user.role === "CUSTOMER") {
  navigate("/customer");
} else if (user.role === "CHEF") {
  navigate("/staff/kitchen");
} else if (user.role === "WAITER") {
  navigate("/staff/tables");
} else if (user.role === "INVENTORY_STAFF") {
  navigate("/staff/inventory");
} else if (user.role === "MANAGER") {
  navigate("/admin/dashboard");
} else {
  alert("Dashboard for this role is not ready yet.");
}
  } catch (error) {
    console.error("Login error:", error);

    alert(
      error.response?.data?.message ||
      "Login failed"
    );
  }
};

  return (
    <div>
      <h1>DineFlow Login</h1>
      <p>Customer, Staff & Manager Login</p>

      <form onSubmit={handleSubmit}>

        <div>
          <label>Email</label>
          <br />

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Password</label>
          <br />

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <br />

        <button type="submit">
          Login
        </button>

      </form>
    </div>
  );
}

export default Login;