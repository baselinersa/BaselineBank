
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  };

  return (
    <nav className="navbar">

      {/* BRAND */}
      <div className="navbar-brand">
        <Link to="/dashboard">
          Baseline Bank
        </Link>
      </div>

    
     {/* LINKS */}
<div className="navbar-links">

  <Link to="/dashboard">
    Dashboard
  </Link>

  <Link to="/transactions">
    Transactions
  </Link>

  <Link to="/ai-assistant">
    🤖 AI Assistant
  </Link>

  <Link to="/profile">
    Profile
  </Link>

  <Link to="/beneficiaries">
    Beneficiaries
  </Link>

  <Link to="/transfer-beneficiary">
    Pay Beneficiary
  </Link>

<Link to="/payshap">
  PayShap
</Link>


</div>

      {/* LOGOUT */}
      <button
        className="logout-button"
        onClick={logout}
      >
        Logout
      </button>

    </nav>
  );
}

