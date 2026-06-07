import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { getOwnProfile, updateOwnProfile } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

export default function AdminProfilePage() {
  const { user, setUser } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getOwnProfile();

        setFormData({
          username: result.username || "",
          email: result.email || "",
          password: "",
        });
      } catch (error) {
        setError(error.message || "Error al cargar perfil");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateField = (field, value) => {
    setError("");
    setSuccess("");

    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.username.trim()) {
      setError("El nombre de usuario es obligatorio");
      return;
    }

    if (!formData.email.trim()) {
      setError("El email es obligatorio");
      return;
    }

    if (formData.password && formData.password.trim().length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        username: formData.username,
        email: formData.email,
      };

      if (formData.password.trim() !== "") {
        payload.password = formData.password;
      }

      const updatedUser = await updateOwnProfile(payload);

      if (typeof setUser === "function") {
        setUser(updatedUser);
      }

      setFormData((current) => ({
        ...current,
        password: "",
      }));

      setSuccess("Perfil actualizado correctamente");
    } catch (error) {
      setError(error.message || "Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando perfil...</p>;

  return (
    <section className="detail-section-stack">
      <div className="admin-page-heading">
        <button
          type="button"
          onClick={() => history.back()}
          className="back-button"
        >
          Atrás
        </button>

        <h1>Mi perfil</h1>
        <p>Actualiza tu información de acceso.</p>
      </div>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <Card>
        <h2>Datos de usuario</h2>

        <form onSubmit={handleSubmit} className="form-grid">
          <Input
            id="profile-username"
            label="Nombre de usuario"
            required
            value={formData.username}
            onChange={(event) => updateField("username", event.target.value)}
          />

          <Input
            id="profile-email"
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(event) => updateField("email", event.target.value)}
          />

          <Input
            id="profile-password"
            label="Nueva contraseña"
            type="password"
            value={formData.password}
            onChange={(event) => updateField("password", event.target.value)}
          />

          <div className="form-actions field-full">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2>Rol</h2>
        <p>
          Tu rol actual es <strong>{user?.role}</strong>.
        </p>
        <p>
          Los cambios de rol solo pueden realizarlos usuarios SUPERADMIN desde
          la gestión de usuarios.
        </p>
      </Card>
    </section>
  );
}