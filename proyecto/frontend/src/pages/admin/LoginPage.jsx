import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import enkiLogo from "../../assets/images/MARCA ENKI NEGRO.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      console.log("LOGIN PAYLOAD:", formData);
      await login(formData);

      navigate("/administracion");
    } catch (error) {
      setError(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page login-page">
      <div className="login-logo-wrapper">
  <img src={enkiLogo} alt="ENKI" className="login-logo" />
</div>
      <Card>
        <h1>Acceso administración</h1>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit} className="form-grid">
          <Input
            id="admin-identifier"
            label="Email o nombre de usuario"
            value={formData.identifier}
            onChange={(event) => updateField("identifier", event.target.value)}
          />

          <Input
            id="admin-password"
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={(event) => updateField("password", event.target.value)}
          />

          <div className="form-actions">
            <Button type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}