import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/authService";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email, password });
      setAuth(res);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao fazer login");
    }
  };

  return (
    <div className="mt-10 max-w-md mx-auto glass p-6 rounded-3xl">
      <h1 className="text-2xl font-bold mb-4 text-accent">Entrar</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="w-full bg-primary hover:bg-primary/80 text-white py-2 rounded">
          Login
        </button>
      </form>
      <p className="text-sm mt-3">
        Não tem conta? <Link className="text-accent" to="/register">Registrar</Link>
      </p>
    </div>
  );
}
