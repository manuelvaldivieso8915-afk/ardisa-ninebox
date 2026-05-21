import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeAPI, areaAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Field = ({ label, name, type = 'text', required, children, form, onChange }) => (
  <div className="form-group">
    <label className="form-label">{label}{required && <span style={{color:'var(--danger)'}}>*</span>}</label>
    {children || (
      <input
        type={type} name={name} className="form-input"
        value={form[name]} onChange={onChange}
        required={required}
      />
    )}
  </div>
);

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', document_type: 'CC', document_number: '',
    email: '', phone: '', position: '', area_id: '',
    direct_boss: '', hire_date: '', birth_date: '',
    status: 'activo', notes: ''
  });

  useEffect(() => {
    areaAPI.getAll().then(setAreas).catch(() => {});
    if (isEdit) {
      employeeAPI.getOne(id).then(data => {
        setForm({
          ...data,
          hire_date: data.hire_date ? data.hire_date.split('T')[0] : '',
          birth_date: data.birth_date ? data.birth_date.split('T')[0] : '',
          area_id: data.area_id || ''
        });
      }).catch(() => toast.error('Error al cargar colaborador'));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await employeeAPI.update(id, form);
        toast.success('Colaborador actualizado');
      } else {
        const res = await employeeAPI.create(form);
        toast.success('Colaborador creado exitosamente');
        navigate(`/colaboradores/${res.id}`);
        return;
      }
      navigate(`/employees`);
    } catch (err) {
      toast.error(err.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Editar Colaborador' : 'Nuevo Colaborador'}</h1>
          <p className="page-subtitle">Complete la información del colaborador</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/colaboradores')}>← Volver</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{padding:'24px',marginBottom:'20px'}}>
          <h3 style={{fontSize:'15px',fontWeight:'700',marginBottom:'20px',paddingBottom:'12px',borderBottom:'1px solid var(--border)'}}>
            Información Personal
          </h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <Field label="Nombre Completo" name="full_name" required form={form} onChange={handleChange} />
            <div className="form-group">
              <label className="form-label">Tipo de Documento</label>
              <select name="document_type" className="form-input" value={form.document_type} onChange={handleChange}>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="PA">Pasaporte</option>
              </select>
            </div>
            <Field label="Número de Documento" name="document_number" required form={form} onChange={handleChange} />
            <Field label="Correo Electrónico" name="email" type="email" form={form} onChange={handleChange} />
            <Field label="Teléfono" name="phone" form={form} onChange={handleChange} />
            <Field label="Fecha de Nacimiento" name="birth_date" type="date" form={form} onChange={handleChange} />
          </div>
        </div>

        <div className="card" style={{padding:'24px',marginBottom:'20px'}}>
          <h3 style={{fontSize:'15px',fontWeight:'700',marginBottom:'20px',paddingBottom:'12px',borderBottom:'1px solid var(--border)'}}>
            Información Laboral
          </h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <Field label="Cargo" name="position" required form={form} onChange={handleChange} />
            <div className="form-group">
              <label className="form-label">Área<span style={{color:'var(--danger)'}}>*</span></label>
              <select name="area_id" className="form-input" value={form.area_id} onChange={handleChange} required>
                <option value="">Seleccionar área</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <Field label="Jefe Directo" name="direct_boss" form={form} onChange={handleChange} />
            <Field label="Fecha de Ingreso" name="hire_date" type="date" required form={form} onChange={handleChange} />
            {isEdit && (
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select name="status" className="form-input" value={form.status} onChange={handleChange}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="retirado">Retirado</option>
                </select>
              </div>
            )}
          </div>
          <div className="form-group" style={{marginTop:'4px'}}>
            <label className="form-label">Observaciones</label>
            <textarea
              name="notes" className="form-input" rows={3}
              value={form.notes} onChange={handleChange}
              style={{resize:'vertical'}}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/colaboradores')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Colaborador'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
