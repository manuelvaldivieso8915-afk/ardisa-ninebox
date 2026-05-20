import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI, areaAPI } from '../utils/api';
import toast from 'react-hot-toast';

const NINEBOX_COLORS = {
  1:'#DC2626',2:'#EF4444',3:'#F97316',4:'#F59E0B',5:'#6366F1',6:'#10B981',7:'#8B5CF6',8:'#3B82F6',9:'#059669'
};

const EmployeesPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ search: '', area_id: '', status: '' });

  const fetchEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await employeeAPI.getAll({ ...filters, page, limit: 15 });
      setEmployees(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Error al cargar colaboradores');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { areaAPI.getAll().then(setAreas).catch(() => {}); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEmployees(1);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Desactivar a ${name}?`)) return;
    try {
      await employeeAPI.remove(id);
      toast.success('Colaborador desactivado');
      fetchEmployees();
    } catch (err) {
      toast.error('Error al desactivar');
    }
  };

  const getNineboxBadge = (pos) => {
    if (!pos) return null;
    const color = NINEBOX_COLORS[pos] || '#94A3B8';
    return (
      <span style={{
        display:'inline-flex',alignItems:'center',gap:'4px',
        padding:'3px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',
        background:`${color}15`,color
      }}>
        Box {pos}
      </span>
    );
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Colaboradores</h1>
          <p className="page-subtitle">{pagination.total} colaboradores registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/colaboradores/nuevo')}>
          + Nuevo Colaborador
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{padding:'16px 20px',marginBottom:'20px'}}>
        <form onSubmit={handleSearch} style={{display:'flex',gap:'12px',flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{flex:'1',minWidth:'200px'}}>
            <label className="form-label">Buscar</label>
            <input
              className="form-input"
              placeholder="Nombre, documento o cargo..."
              value={filters.search}
              onChange={e => setFilters(f => ({...f, search: e.target.value}))}
            />
          </div>
          <div style={{minWidth:'160px'}}>
            <label className="form-label">Área</label>
            <select className="form-input" value={filters.area_id} onChange={e => setFilters(f => ({...f, area_id: e.target.value}))}>
              <option value="">Todas las áreas</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div style={{minWidth:'130px'}}>
            <label className="form-label">Estado</label>
            <select className="form-input" value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))}>
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Buscar</button>
          <button type="button" className="btn btn-secondary" onClick={() => { setFilters({search:'',area_id:'',status:''}); }}>
            Limpiar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loader"><div className="loader-spinner"/></div>
        ) : employees.length === 0 ? (
          <div style={{padding:'60px',textAlign:'center',color:'var(--text-muted)'}}>
            <div style={{fontSize:'48px',marginBottom:'12px'}}>👥</div>
            <div style={{fontSize:'16px',fontWeight:'600',marginBottom:'6px'}}>Sin colaboradores</div>
            <div style={{fontSize:'14px'}}>Agrega el primer colaborador para comenzar</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Cargo</th>
                <th>Área</th>
                <th>Jefe Directo</th>
                <th>Ingreso</th>
                <th>Nine Box</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'var(--blue-500)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'13px',flexShrink:0}}>
                        {emp.full_name[0]}
                      </div>
                      <div>
                        <div style={{fontWeight:'600',fontSize:'14px'}}>{emp.full_name}</div>
                        <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{emp.document_number}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{fontSize:'13px'}}>{emp.position}</td>
                  <td>
                    <span className="badge badge-blue" style={{fontSize:'11px'}}>{emp.area_name || '—'}</span>
                  </td>
                  <td style={{fontSize:'13px',color:'var(--text-secondary)'}}>{emp.direct_boss || '—'}</td>
                  <td style={{fontSize:'13px',color:'var(--text-muted)'}}>
                    {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td>{getNineboxBadge(emp.ninebox_position)}</td>
                  <td>
                    <span className={`badge ${emp.status === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/colaboradores/${emp.id}`)}>
                        Ver
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/evaluaciones/nueva?employee=${emp.id}`)}>
                        Evaluar
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{color:'var(--danger)'}} onClick={() => handleDelete(emp.id, emp.full_name)}>
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',borderTop:'1px solid var(--border)'}}>
            <span style={{fontSize:'13px',color:'var(--text-muted)'}}>
              Página {pagination.page} de {pagination.pages} · {pagination.total} resultados
            </span>
            <div style={{display:'flex',gap:'8px'}}>
              <button className="btn btn-secondary btn-sm" disabled={pagination.page <= 1}
                onClick={() => fetchEmployees(pagination.page - 1)}>← Anterior</button>
              <button className="btn btn-secondary btn-sm" disabled={pagination.page >= pagination.pages}
                onClick={() => fetchEmployees(pagination.page + 1)}>Siguiente →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesPage;
