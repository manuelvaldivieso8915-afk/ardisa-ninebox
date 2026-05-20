import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationAPI } from '../utils/api';
import toast from 'react-hot-toast';

const NINEBOX_COLORS = {1:'#DC2626',2:'#F97316',3:'#EAB308',4:'#8B5CF6',5:'#6366F1',6:'#10B981',7:'#3B82F6',8:'#0EA5E9',9:'#059669'};

const EvaluationsPage = () => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({page:1,total:0,pages:1});
  const [filter, setFilter] = useState({period:'',status:''});

  const fetchEvals = useCallback(async (page=1) => {
    setLoading(true);
    try {
      const res = await evaluationAPI.getAll({...filter, page, limit:15});
      setEvaluations(res.data);
      setPagination(res.pagination);
    } catch { toast.error('Error al cargar evaluaciones'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchEvals(); }, [fetchEvals]);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Evaluaciones</h1>
          <p className="page-subtitle">{pagination.total} evaluaciones registradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/evaluaciones/nueva')}>
          + Nueva Evaluación
        </button>
      </div>

      <div className="card" style={{padding:'16px 20px',marginBottom:'20px'}}>
        <div style={{display:'flex',gap:'12px',flexWrap:'wrap',alignItems:'flex-end'}}>
          <div className="form-group" style={{marginBottom:0}}>
            <label className="form-label">Estado</label>
            <select className="form-input" value={filter.status} onChange={e => setFilter(f=>({...f,status:e.target.value}))}>
              <option value="">Todos</option>
              <option value="completada">Completada</option>
              <option value="borrador">Borrador</option>
              <option value="aprobada">Aprobada</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => fetchEvals(1)}>Filtrar</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loader"><div className="loader-spinner"/></div>
        ) : evaluations.length === 0 ? (
          <div style={{padding:'60px',textAlign:'center',color:'var(--text-muted)'}}>
            <div style={{fontSize:'48px',marginBottom:'12px'}}>📊</div>
            <div style={{fontSize:'16px',fontWeight:'600',marginBottom:'6px'}}>Sin evaluaciones</div>
            <div style={{fontSize:'14px'}}>Comienza evaluando a tus colaboradores</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Área</th>
                <th>Período</th>
                <th>Desempeño</th>
                <th>Potencial</th>
                <th>Nine Box</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map(ev => {
                const color = NINEBOX_COLORS[ev.ninebox_position] || '#94A3B8';
                return (
                  <tr key={ev.id}>
                    <td>
                      <div>
                        <div style={{fontWeight:'600',fontSize:'14px'}}>{ev.full_name}</div>
                        <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{ev.position}</div>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{ev.area_name||'—'}</span></td>
                    <td style={{fontSize:'13px',fontWeight:'600'}}>{ev.period}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <div style={{width:'50px',height:'5px',background:'var(--border)',borderRadius:'3px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${(ev.performance_score/5)*100}%`,background:'#3B82F6',borderRadius:'3px'}}/>
                        </div>
                        <span style={{fontSize:'12px',fontWeight:'700',color:'#3B82F6'}}>{ev.performance_score}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <div style={{width:'50px',height:'5px',background:'var(--border)',borderRadius:'3px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${(ev.potential_score/5)*100}%`,background:'#10B981',borderRadius:'3px'}}/>
                        </div>
                        <span style={{fontSize:'12px',fontWeight:'700',color:'#10B981'}}>{ev.potential_score}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display:'inline-flex',alignItems:'center',gap:'4px',
                        padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'700',
                        background:`${color}15`,color
                      }}>
                        Box {ev.ninebox_position} · {ev.ninebox_label?.split('/')[0]?.trim() || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${ev.status==='completada'?'badge-success':ev.status==='aprobada'?'badge-blue':'badge-warning'}`}>
                        {ev.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/evaluaciones/${ev.id}`)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {pagination.pages > 1 && (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',borderTop:'1px solid var(--border)'}}>
            <span style={{fontSize:'13px',color:'var(--text-muted)'}}>Página {pagination.page} de {pagination.pages}</span>
            <div style={{display:'flex',gap:'8px'}}>
              <button className="btn btn-secondary btn-sm" disabled={pagination.page<=1} onClick={() => fetchEvals(pagination.page-1)}>← Anterior</button>
              <button className="btn btn-secondary btn-sm" disabled={pagination.page>=pagination.pages} onClick={() => fetchEvals(pagination.page+1)}>Siguiente →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationsPage;
