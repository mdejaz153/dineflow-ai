import { useNavigate } from "react-router-dom";

function Unauthorized() {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div>
      <h1>403 - Access Denied</h1>

      <p>
        You do not have permission to access this page.
      </p>

      <button onClick={goBack}>
        Go Back
      </button>
    </div>
  );
}

export default Unauthorized;