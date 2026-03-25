import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export const NavBar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex flex-wrap items-center gap-3 justify-between px-5 py-3 glass rounded-2xl mt-4">
      <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary whitespace-nowrap">
        🥚 Caça aos Ovos
      </Link>
      <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-100 justify-end w-full sm:w-auto">
        {user ? (
          <>
            <Link to="/ar" className="hover:text-primary">
              Caça AR
            </Link>
            <Link to="/ranking" className="hover:text-primary">
              Ranking
            </Link>
            <Link to="/history" className="hover:text-primary">
              Histórico
            </Link>
            {user.role === "ADMIN" && (
              <Link to="/admin" className="hover:text-primary">
                Admin
              </Link>
            )}
            <span className="text-primary font-semibold whitespace-nowrap">Score: {user.totalScore}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded bg-primary text-white shadow-sm hover:bg-primary/90 w-full sm:w-auto"
            >
              Sair
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-primary">
              Login
            </Link>
            <Link to="/register" className="hover:text-primary">
              Registrar
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};
