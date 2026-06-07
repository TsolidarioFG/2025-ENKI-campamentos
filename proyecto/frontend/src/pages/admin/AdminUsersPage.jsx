import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../../services/userService";

const emptyForm = {
  username: "",
  email: "",
  password: "",
  role: "ADMIN",
  active: true,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getUsers();
      setUsers(result);
    } catch (error) {
      setError(error.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateField = (field, value) => {
    setError("");
    setSuccess("");

    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      username: user.username || "",
      email: user.email || "",
      password: "",
      role: user.role || "ADMIN",
      active: user.active ?? true,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      return "El nombre de usuario es obligatorio";
    }

    if (!formData.email.trim()) {
      return "El email es obligatorio";
    }

    if (!editingId && !formData.password.trim()) {
      return "La contraseña es obligatoria";
    }

    if (formData.password.trim() && formData.password.trim().length < 6) {
      return "La contraseña debe tener al menos 6 caracteres";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        active: formData.active,
      };

      if (formData.password.trim() !== "") {
        payload.password = formData.password;
      }

      if (editingId) {
        await updateUser(editingId, payload);
        setSuccess("Usuario actualizado correctamente");
      } else {
        await createUser({
          ...payload,
          password: formData.password,
        });
        setSuccess("Usuario creado correctamente");
      }

      resetForm();
      await loadUsers();
    } catch (error) {
      setError(error.message || "Error al guardar usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (user) => {
    const confirmDeactivate = window.confirm(
      `¿Seguro que quieres desactivar al usuario ${user.username}?`
    );

    if (!confirmDeactivate) return;

    try {
      setError("");
      setSuccess("");

      await deleteUser(user.id);

      setSuccess("Usuario desactivado correctamente");
      await loadUsers();
    } catch (error) {
      setError(error.message || "Error al desactivar usuario");
    }
  };

  if (loading) {
    return <p>Cargando usuarios...</p>;
  }

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

        <h1>Usuarios</h1>
        <p>Gestión completa de usuarios de administración.</p>
      </div>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <Card>
        <h2>{editingId ? "Editar usuario" : "Crear usuario"}</h2>

        <form onSubmit={handleSubmit} className="form-grid">
          <Input
            id="user-username"
            label="Nombre de usuario"
            required
            value={formData.username}
            onChange={(event) => updateField("username", event.target.value)}
          />

          <Input
            id="user-email"
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(event) => updateField("email", event.target.value)}
          />

          <Input
            id="user-password"
            label={
              editingId
                ? "Nueva contraseña, dejar vacío para no cambiar"
                : "Contraseña"
            }
            type="password"
            required={!editingId}
            value={formData.password}
            onChange={(event) => updateField("password", event.target.value)}
          />

          <Select
            id="user-role"
            label="Rol"
            required
            value={formData.role}
            onChange={(event) => updateField("role", event.target.value)}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
          </Select>

          <label className="checkbox-field field-full">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(event) => updateField("active", event.target.checked)}
            />
            Usuario activo
          </label>

          <div className="form-actions field-full">
            <Button type="submit" disabled={saving}>
              {saving
                ? "Guardando..."
                : editingId
                ? "Guardar cambios"
                : "Crear usuario"}
            </Button>

            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancelar edición
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <h2>Listado de usuarios</h2>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Activo</th>
                <th>Creado</th>
                <th>Actualizado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.active ? "Sí" : "No"}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>{new Date(user.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <Button type="button" onClick={() => handleEdit(user)}>
                        Editar
                      </Button>

                      {user.active && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleDeactivate(user)}
                        >
                          Desactivar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}