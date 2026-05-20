import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationAPI, areaAPI } from '../utils/api';
import toast from 'react-hot-toast';

const NINEBOX_LABELS = {
  1:'Bajo Desempeño\nBajo Potencial',
  2:'En Desarrollo\nBajo Potencial',
  3:'Alto Desempeño\nBajo Potencial',
  4:'Enigma',
  5:'Colaborador\nClave',
  6:'Fuerte\nDesempeño',
  7:'Diamante\nen Bruto',
  8:'Alto\nPotencial',
  9:'Estrella ⭐',
};

const NINEBOX_COLORS = {
  1:'#DC2626',2:'#F97316',3:'#EAB308',
  4:'#8B5CF6',5:'#6366F1',6:'#10B981',
  7:'#3B82F6',8:'#0EA5E9',9:'#059669',
};

const QUADRANT_BG = {
  1:'rgba(220,38,38,.06)',2:'rgba(249,115,22,.06)',3:'rgba(234,179,8,.06)',
  4:'rgba(139,92,246,.06)',5:'rgba(99,102,241,.06)',6:'rgba(16,185,129,.06)',
  7:'rgba(59,130,246,.06)',8:'rgba(14,165,233,.06)',9:'rgba(5,150,105,.10)',
};

const EmployeeDot = ({ employee, onClick }) => {
  const [hover, setHover] = useState(false);
  const color = NINEBOX_COLORS[employee.ninebox_position] || '#94A3B8';
  return (
    <div style={{position:'relative',display:'inline-block'}}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onClick(employee)}
    >
      <div style={{
        width:'36px',height:'36px',borderRadius:'50%',
        background:`${color}25`,border:`2px solid ${color}`,
        display:'flex',alignItems:'center',justifyContent:'center',
        fontWeight:'700',fontSize:'13px',color,
        cursor:'pointer',transition:'transform 0.2s',
        transform: hover ? 'scale(1.2)' : 'scale(1)',
      }}>
        {employee.full_name[0]}
      </div>

      {hover && (
        <div style={{
          position:'absolute',bottom:'calc(100% + 8px)',left:'50%',
          transform:'translateX(-50%)',
          background:'var(--bg-card)',border:'1px solid var(--border)',
          borderRadius:'10px',padding:'10px 14px',
          boxShadow:'var(--shadow-lg)',
          minWidth:'200px',zIndex:1000,pointerEvents:'none',
          whiteSpace:'nowrap'
        }}>
          <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'4px'}}>{employee.full_name}</div>
          <div style={{fontSize:'12px',color:'var(--text-muted)',marginBottom:'4px'}}>{employee.position}</div>
          <div style={{fontSize:'12px',color:'var(--text-muted)'}}>Área: {employee.area_name}</div>
          <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
            <span style={{fontSize:'11px',fontWeight:'700',padding:'2px 6px',borderRadius:'8px',background:`${color}15`,color}}>
              D: {employee.performance_score?.toFixed(1)}
            </span>
            <span style={{fontSize:'11px',fontWeight:'700',padding:'2px 6px',borderRadius:'8px',background:`${color}15`,color}}>
              P: {employee.potential_score?.toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const NineBoxPage = () => {
  const navigate = useNavigate();
  const [matrix, setMatrix] = useState({});
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ area_id: '' });
  const [year, setYear] = useState(new Date().getFullYear());
  const [selected, setSelected] = useState(null);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await evaluationAPI.getNineBox({ ...filter, year });
      setMatrix(res.matrix || {});
      setEmployees(res.employees || []);
    } catch (err) {
      toast.error('Error al cargar la matriz');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatrix(); }, [filter, year]);
  useEffect(() => { areaAPI.getAll().then(setAreas).catch(() => {}); }, []);

  const totalEvaluated = employees.filter(e => e.ninebox_position).length;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Matriz Nine Box</h1>
          <p className="page-subtitle">{totalEvaluated} colaboradores evaluados · {year}</p>
        </div>
        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
          <select className="form-input" style={{width:'auto'}} value={filter.area_id}
            onChange={e => setFilter(f=>({...f,area_id:e.target.value}))}>
            <option value="">Todas las áreas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className="form-input" style={{width:'auto'}} value={year}
            onChange={e => setYear(parseInt(e.target.value))}>
            {[2024,2025,2026,2027,2028,2029,2030].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => navigate('/evaluaciones/nueva')}>
            + Evaluar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loader"><div className="loader-spinner"/></div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:'20px',alignItems:'start'}}>
          {/* Matrix */}
          <div className="card" style={{padding:'24px'}}>
            {/* Y axis label */}
            <div style={{display:'flex',gap:'16px'}}>
              <div style={{
                writingMode:'vertical-lr',transform:'rotate(180deg)',
                fontSize:'11px',fontWeight:'700',textTransform:'uppercase',
                letterSpacing:'0.1em',color:'var(--text-muted)',
                display:'flex',alignItems:'center',justifyContent:'center',
                minWidth:'20px'
              }}>
                ← Potencial Alto
              </div>

              <div style={{flex:1}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'4px'}}>
                  {[7,8,9,4,5,6,1,2,3].map(pos => {
                    const empInBox = (matrix[pos] || []).filter(e => e.ninebox_position);
                    return (
                      <div key={pos} style={{
                        minHeight:'160px',
                        background: QUADRANT_BG[pos],
                        border: `1px solid ${NINEBOX_COLORS[pos]}30`,
                        borderRadius:'12px',padding:'12px',
                        position:'relative',
                        transition:'background 0.2s',
                      }}>
                        {/* Box label */}
                        <div style={{marginBottom:'8px'}}>
                          <div style={{
                            display:'inline-flex',alignItems:'center',justifyContent:'center',
                            width:'24px',height:'24px',borderRadius:'6px',
                            background:`${NINEBOX_COLORS[pos]}20`,
                            color:NINEBOX_COLORS[pos],
                            fontWeight:'800',fontSize:'12px',
                            marginBottom:'4px'
                          }}>
                            {pos}
                          </div>
                          <div style={{fontSize:'10px',fontWeight:'600',color:NINEBOX_COLORS[pos],lineHeight:'1.3',whiteSpace:'pre-wrap'}}>
                            {NINEBOX_LABELS[pos]}
                          </div>
                        </div>

                        {/* Employee dots */}
                        <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                          {empInBox.map(emp => (
                            <EmployeeDot key={emp.id} employee={emp}
                              onClick={setSelected} />
                          ))}
                          {empInBox.length === 0 && (
                            <div style={{fontSize:'11px',color:'var(--text-muted)',padding:'4px 0'}}>
                              Sin colaboradores
                            </div>
                          )}
                        </div>

                        {empInBox.length > 0 && (
                          <div style={{
                            position:'absolute',top:'10px',right:'10px',
                            fontSize:'11px',fontWeight:'700',
                            background:`${NINEBOX_COLORS[pos]}20`,color:NINEBOX_COLORS[pos],
                            padding:'2px 6px',borderRadius:'8px'
                          }}>
                            {empInBox.length}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X axis */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'4px',marginTop:'8px'}}>
                  {['Bajo','Medio','Alto'].map(l => (
                    <div key={l} style={{textAlign:'center',fontSize:'11px',fontWeight:'700',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                      {l}
                    </div>
                  ))}
                </div>
                <div style={{textAlign:'center',fontSize:'11px',fontWeight:'700',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginTop:'4px'}}>
                  Desempeño →
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div>
            {/* Summary by box */}
            <div className="card" style={{padding:'20px',marginBottom:'16px'}}>
              <h3 style={{fontSize:'14px',fontWeight:'700',marginBottom:'14px'}}>Distribución</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {[9,8,6,5,7,3,4,2,1].map(pos => {
                  const count = (matrix[pos]||[]).filter(e=>e.ninebox_position).length;
                  if (count === 0) return null;
                  return (
                    <div key={pos} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div style={{
                        width:'22px',height:'22px',borderRadius:'6px',
                        background:`${NINEBOX_COLORS[pos]}20`,color:NINEBOX_COLORS[pos],
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontWeight:'800',fontSize:'11px',flexShrink:0
                      }}>{pos}</div>
                      <div style={{flex:1,height:'6px',background:'var(--bg-app)',borderRadius:'3px',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${(count/totalEvaluated)*100}%`,background:NINEBOX_COLORS[pos],borderRadius:'3px'}}/>
                      </div>
                      <span style={{fontSize:'12px',fontWeight:'700',color:NINEBOX_COLORS[pos],minWidth:'20px',textAlign:'right'}}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Without evaluation */}
            {employees.filter(e=>!e.ninebox_position).length > 0 && (
              <div className="card" style={{padding:'16px'}}>
                <div style={{fontSize:'13px',fontWeight:'700',marginBottom:'10px',color:'var(--text-muted)'}}>
                  Sin evaluar ({employees.filter(e=>!e.ninebox_position).length})
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {employees.filter(e=>!e.ninebox_position).slice(0,5).map(emp => (
                    <div key={emp.id} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px'}}>
                      <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'var(--slate-300)',color:'var(--slate-600)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'11px',flexShrink:0}}>
                        {emp.full_name[0]}
                      </div>
                      <div>
                        <div style={{fontWeight:'600',fontSize:'12px'}}>{emp.full_name}</div>
                        <div style={{fontSize:'11px',color:'var(--text-muted)'}}>{emp.position}</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" style={{marginLeft:'auto',fontSize:'11px',padding:'4px 8px'}}
                        onClick={() => navigate(`/evaluaciones/nueva?employee=${emp.id}`)}>
                        Evaluar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Employee detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{maxWidth:'480px'}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{
                  width:'48px',height:'48px',borderRadius:'50%',
                  background:NINEBOX_COLORS[selected.ninebox_position],
                  color:'white',display:'flex',alignItems:'center',justifyContent:'center',
                  fontWeight:'800',fontSize:'20px'
                }}>
                  {selected.full_name[0]}
                </div>
                <div>
                  <div style={{fontFamily:'Syne',fontSize:'18px',fontWeight:'700'}}>{selected.full_name}</div>
                  <div style={{fontSize:'13px',color:'var(--text-muted)'}}>{selected.position}</div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}>
                {[
                  ['Área', selected.area_name],
                  ['Período', selected.period],
                  ['Desempeño', `${selected.performance_score} / 5`],
                  ['Potencial', `${selected.potential_score} / 5`],
                ].map(([k,v]) => (
                  <div key={k} style={{padding:'12px',background:'var(--bg-app)',borderRadius:'10px'}}>
                    <div style={{fontSize:'11px',color:'var(--text-muted)',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.05em'}}>{k}</div>
                    <div style={{fontSize:'16px',fontWeight:'700',marginTop:'2px'}}>{v || '—'}</div>
                  </div>
                ))}
              </div>
              <div style={{
                padding:'16px',borderRadius:'12px',
                background:`${NINEBOX_COLORS[selected.ninebox_position]}10`,
                border:`1px solid ${NINEBOX_COLORS[selected.ninebox_position]}30`,
                textAlign:'center'
              }}>
                <div style={{fontSize:'11px',color:'var(--text-muted)',fontWeight:'600',textTransform:'uppercase'}}>Clasificación</div>
                <div style={{fontSize:'20px',fontWeight:'800',color:NINEBOX_COLORS[selected.ninebox_position],marginTop:'4px'}}>
                  Box {selected.ninebox_position}
                </div>
                <div style={{fontSize:'13px',color:NINEBOX_COLORS[selected.ninebox_position],marginTop:'2px'}}>
                  {selected.ninebox_label}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Cerrar</button>
              <button className="btn btn-primary" onClick={() => navigate(`/colaboradores/${selected.id}`)}>
                Ver Perfil Completo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NineBoxPage;
