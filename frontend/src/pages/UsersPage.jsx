import { useState, useEffect } from 'react';
import { userAPI } from '../utils/api';
import { Users, Plus, Edit, Trash2, Shield, User, Search, Eye, EyeOff, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState({
    username: user?.username || '',
    full_name: user?.full_name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'evaluador',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Requerido';
    if (!form.full_name.trim()) e.full_name = 'Requerido';
    if (!isEdit && !form.password) e.password = 'Requerido';
    if (form.password && form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (isEdit) {
        await userAPI.update(user.id, payload);
        toast.success('Usuario actualizado');
      } else {
        await userAPI.create(payload);
        toast.success('Usuario creado');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'username', label: 'Usuario', placeholder: 'nombre_usuario', type: 'text' },
    { key: 'full_name', label: 'Nombre Completo', placeholder: 'Nombre y apellido', type: 'text' },
    { key: 'email', label: 'Correo Electrónico', placeholder: 'correo@empresa.com', type: 'email' },
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: 480 }}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={18} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {isEdit ? 'Modifica los datos del usuario' : 'Crea una nueva cuenta de acceso'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}><X size={18} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fields.map(f => (
            <div key={f.key} className="form-group">
              <label className="form-label">{f.label}</label>
              <input
                type={f.type}
                className={`form-input ${errors[f.key] ? 'error' : ''}`}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(p => ({ ...p, [f.key]: '' })); }}
              />
              {errors[f.key] && <p className="form-error">{errors[f.key]}</p>}
            </div>
          ))}

          {/* Password */}
          <div className="form-group">
            <label className="form-label">{isEdit ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder={isEdit ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
                value={form.password}
                onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button" onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          {/* Role */}
          <div className="form-group">
            <label className="form-label">Rol</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { value: 'administrador', label: 'Administrador', desc: 'Acceso total', icon: Shield, color: '#ef4444' },
                { value: 'evaluador', label: 'Evaluador', desc: 'Solo evalúa', icon: User, color: '#3b82f6' },
              ].map(r => (
                <div key={r.value}
                  onClick={() => setForm(p => ({ ...p, role: r.value }))}
                  style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${form.role === r.value ? r.color : 'var(--border-color)'}`,
                    background: form.role === r.value ? `${r.color}10` : 'var(--bg-tertiary)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <r.icon size={14} style={{ color: r.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.label}</span>
                    {form.role === r.value && <Check size={12} style={{ color: r.color, marginLeft: 'auto' }} />}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary flex items-center gap-2" disabled={loading}>
            {loading ? <div className="loader-ring" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Check size={16} />}
            {isEdit ? 'Actualizar' : 'Crear Usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | user object
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(res.users || []);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await userAPI.remove(id);
      toast.success('Usuario eliminado');
      setDeleteConfirm(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const admins = users.filter(u => u.role === 'administrador').length;
  const evaluators = users.filter(u => u.role === 'evaluador').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">Administra las cuentas de acceso al sistema</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Usuarios', value: users.length, icon: Users, color: '#3b82f6' },
          { label: 'Administradores', value: admins, icon: Shield, color: '#ef4444' },
          { label: 'Evaluadores', value: evaluators, icon: User, color: '#10b981' },
        ].map(item => (
          <div key={item.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: `${item.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <item.icon size={20} style={{ color: item.color }} />
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{item.value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 380 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="form-input"
          style={{ paddingLeft: 42 }}
          placeholder="Buscar por nombre, usuario o correo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: 200 }}>
            <div className="loader-ring" />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre Completo</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : filtered.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: user.role === 'administrador'
                          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                          : 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0
                      }}>
                        {user.username?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                        @{user.username}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user.full_name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user.email || '—'}</td>
                  <td>
                    <span className={`badge ${user.role === 'administrador' ? 'badge-danger' : 'badge-info'}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {user.role === 'administrador' ? <Shield size={11} /> : <User size={11} />}
                      {user.role === 'administrador' ? 'Admin' : 'Evaluador'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {user.is_active ? '● Activo' : '● Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModal(user)}
                        className="btn-ghost"
                        style={{ padding: '6px 10px', fontSize: 12 }}
                        title="Editar"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user)}
                        className="btn-ghost"
                        style={{ padding: '6px 10px', fontSize: 12, color: 'var(--danger)' }}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <UserModal
          user={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadUsers(); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal-content" style={{ width: 400 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Confirmar Eliminación
              </h2>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                ¿Estás seguro de que deseas eliminar al usuario <strong style={{ color: 'var(--text-primary)' }}>@{deleteConfirm.username}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancelar</button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--danger)', color: '#fff', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
