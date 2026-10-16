import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/health")
      .then((response) => {
        setStatus(response.data.message);
      })
      .catch(() => {
        setStatus("Backend connection failed");
      });
  }, []);

  return (
    <main>
      <h1>DineFlow AI</h1>
      <p>{status}</p>
    </main>
  );
}

export default App;