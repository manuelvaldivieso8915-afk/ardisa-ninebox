import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { evaluationAPI, factorAPI, employeeAPI } from '../utils/api';
import toast from 'react-hot-toast';

const PERIODS = ['2025-S1','2025-S2','2025-Q1','2025-Q2','2025-Q3','2025-Q4','2026-S1','2026-S2','2026-Q1','2026-Q2','2026-Q3','2026-Q4','2027-S1','2027-S2'];

const ScoreButton = ({ value, selected, onClick }) => {
  const labels = {1:'Insuficiente',2:'Básico',3:'Satisfactorio',4:'Destacado',5:'Sobresaliente'};
  const colors = {1:'#EF4444',2:'#F97316',3:'#F59E0B',4:'#10B981',5:'#059669'};
  return (
    <button type="button" onClick={() => onClick(value)}
      style={{
        padding:'8px 12px', borderRadius:'8px', border:'2px solid',
        borderColor: selected ? colors[value] : 'var(--border)',
        background: selected ? `${colors[value]}15` : 'var(--bg-input)',
        color: selected ? colors[value] : 'var(--text-muted)',
        fontWeight: selected ? '700' : '500',
        fontSize:'13px', cursor:'pointer', transition:'all 0.2s',
        minWidth:'36px'
      }}
      title={labels[value]}
    >
      {value}
    </button>
  );
};

const FactorRow = ({ factor, score, onChange }) => {
  const levelLabel = score < 2.5 ? 'Bajo' : score < 3.75 ? 'Medio' : 'Alto';
  const levelColor = score < 2.5 ? '#EF4444' : score < 3.75 ? '#F59E0B' : '#10B981';
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'16px',
      padding:'14px 16px', borderRadius:'10px',
      background:'var(--bg-app)', marginBottom:'8px'
    }}>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontWeight:'600', fontSize:'14px'}}>{factor.name}</div>
        {factor.description && <div style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'2px'}}>{factor.description}</div>}
      </div>
      <div style={{display:'flex', gap:'6px'}}>
        {[1,2,3,4,5].map(v => (
          <ScoreButton key={v} value={v} selected={score === v} onClick={onChange} />
        ))}
      </div>
      {score > 0 && (
        <span style={{
          minWidth:'60px', textAlign:'center',
          fontSize:'11px', fontWeight:'700',
          padding:'3px 8px', borderRadius:'12px',
          background:`${levelColor}15`, color:levelColor
        }}>
          {levelLabel}
        </span>
      )}
    </div>
  );
};

const EvaluationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEmployee = searchParams.get('employee');

  const [employees, setEmployees] = useState([]);
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({});
  const [form, setForm] = useState({
    employee_id: preselectedEmployee || '',
    period: PERIODS[0],
    period_year: new Date().getFullYear(),
    comments: '',
    strengths: '',
    development_areas: '',
    action_plan: ''
  });

  useEffect(() => {
    Promise.all([
      employeeAPI.getAll({ status: 'activo', limit: 100 }),
      factorAPI.getAll()
    ]).then(([empRes, factRes]) => {
      setEmployees(empRes.data);
      setFactors(factRes);
      // Initialize scores
      const initScores = {};
      factRes.forEach(f => { initScores[f.id] = 0; });
      setScores(initScores);
    }).catch(() => toast.error('Error al cargar datos'));
  }, []);

  const perfFactors = factors.filter(f => f.dimension === 'desempeno');
  const potFactors = factors.filter(f => f.dimension === 'potencial');

  const perfScores = perfFactors.map(f => scores[f.id] || 0).filter(s => s > 0);
  const potScores = potFactors.map(f => scores[f.id] || 0).filter(s => s > 0);
  const avgPerf = perfScores.length ? perfScores.reduce((a,b)=>a+b,0)/perfScores.length : 0;
  const avgPot = potScores.length ? potScores.reduce((a,b)=>a+b,0)/potScores.length : 0;

  const getLevel = (avg) => avg < 2.5 ? 'bajo' : avg < 3.75 ? 'medio' : 'alto';
  const perfLevel = getLevel(avgPerf);
  const potLevel = getLevel(avgPot);

  const nineboxPos = avgPerf === 0 && avgPot === 0 ? null : (() => {
    const p = {bajo:1,medio:2,alto:3}[perfLevel];
    const q = {bajo:1,medio:2,alto:3}[potLevel];
    return ((q-1)*3)+p;
  })();

  const NINEBOX_LABELS = {
    1:'Bajo Desempeño / Bajo Potencial',2:'En Desarrollo',3:'Alto Desempeño / Bajo Potencial',
    4:'Enigma',5:'Colaborador Clave',6:'Fuerte Desempeño',
    7:'Diamante en Bruto',8:'Alto Potencial',9:'Estrella ⭐'
  };
  const NINEBOX_COLORS_MAP = {
    1:'#DC2626',2:'#EF4444',3:'#F97316',4:'#8B5CF6',5:'#6366F1',6:'#10B981',7:'#3B82F6',8:'#0EA5E9',9:'#059669'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_id) { toast.error('Selecciona un colaborador'); return; }

    const allFactors = [...perfFactors, ...potFactors];
    const unanswered = allFactors.filter(f => !scores[f.id]);
    if (unanswered.length > 0) {
      toast.error(`Faltan ${unanswered.length} factores por calificar`);
      return;
    }

    setLoading(true);
    try {
      const details = allFactors.map(f => ({
        factor_id: f.id,
        score: scores[f.id],
        dimension: f.dimension
      }));
      await evaluationAPI.create({ ...form, details });
      toast.success('✅ Evaluación registrada exitosamente');
      navigate('/evaluaciones');
    } catch (err) {
      toast.error(err.error || 'Error al guardar evaluación');
    } finally {
      setLoading(false);
    }
  };

  const completedPerf = perfFactors.filter(f => scores[f.id] > 0).length;
  const completedPot = potFactors.filter(f => scores[f.id] > 0).length;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nueva Evaluación Nine Box</h1>
          <p className="page-subtitle">Evaluación de desempeño y potencial</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/evaluaciones')}>← Volver</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:'20px',alignItems:'start'}}>
          <div>
            {/* Header info */}
            <div className="card" style={{padding:'20px',marginBottom:'20px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px'}}>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Colaborador *</label>
                  <select className="form-input" value={form.employee_id}
                    onChange={e => setForm(f=>({...f,employee_id:e.target.value}))} required>
                    <option value="">Seleccionar...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.position}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Período *</label>
                  <select className="form-input" value={form.period}
                    onChange={e => setForm(f=>({...f,period:e.target.value}))}>
                    {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Año</label>
                  <select className="form-input" value={form.period_year}
                    onChange={e => setForm(f=>({...f,period_year:parseInt(e.target.value)}))}>
                    {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Performance factors */}
            <div className="card" style={{padding:'24px',marginBottom:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',paddingBottom:'12px',borderBottom:'1px solid var(--border)'}}>
                <div>
                  <h3 style={{fontSize:'16px',fontWeight:'700'}}>📊 Desempeño</h3>
                  <p style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'2px'}}>{completedPerf}/{perfFactors.length} factores evaluados</p>
                </div>
                {avgPerf > 0 && (
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'24px',fontWeight:'800',fontFamily:'Syne',color:'var(--text-primary)'}}>{avgPerf.toFixed(2)}</div>
                    <div style={{fontSize:'12px',color:'var(--text-muted)'}}>promedio</div>
                  </div>
                )}
              </div>
              {perfFactors.map(f => (
                <FactorRow key={f.id} factor={f} score={scores[f.id]||0}
                  onChange={v => setScores(s=>({...s,[f.id]:v}))} />
              ))}
            </div>

            {/* Potential factors */}
            <div className="card" style={{padding:'24px',marginBottom:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',paddingBottom:'12px',borderBottom:'1px solid var(--border)'}}>
                <div>
                  <h3 style={{fontSize:'16px',fontWeight:'700'}}>🚀 Potencial</h3>
                  <p style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'2px'}}>{completedPot}/{potFactors.length} factores evaluados</p>
                </div>
                {avgPot > 0 && (
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'24px',fontWeight:'800',fontFamily:'Syne',color:'var(--text-primary)'}}>{avgPot.toFixed(2)}</div>
                    <div style={{fontSize:'12px',color:'var(--text-muted)'}}>promedio</div>
                  </div>
                )}
              </div>
              {potFactors.map(f => (
                <FactorRow key={f.id} factor={f} score={scores[f.id]||0}
                  onChange={v => setScores(s=>({...s,[f.id]:v}))} />
              ))}
            </div>

            {/* Comments */}
            <div className="card" style={{padding:'24px',marginBottom:'20px'}}>
              <h3 style={{fontSize:'15px',fontWeight:'700',marginBottom:'16px'}}>📝 Observaciones</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                {[['strengths','Fortalezas Identificadas'],['development_areas','Áreas de Desarrollo'],['action_plan','Plan de Acción'],['comments','Comentarios Generales']].map(([key,label]) => (
                  <div className="form-group" key={key} style={{marginBottom:0}}>
                    <label className="form-label">{label}</label>
                    <textarea className="form-input" rows={3}
                      value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))}
                      style={{resize:'vertical'}} placeholder={`${label}...`}/>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Nine Box Preview */}
          <div style={{position:'sticky',top:'90px'}}>
            <div className="card" style={{padding:'24px',marginBottom:'16px'}}>
              <h3 style={{fontSize:'15px',fontWeight:'700',marginBottom:'16px',textAlign:'center'}}>Vista Previa Nine Box</h3>

              {nineboxPos ? (
                <>
                  <div style={{
                    width:'80px',height:'80px',borderRadius:'50%',
                    background:`${NINEBOX_COLORS_MAP[nineboxPos]}20`,
                    border:`3px solid ${NINEBOX_COLORS_MAP[nineboxPos]}`,
                    margin:'0 auto 12px',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontFamily:'Syne',fontSize:'32px',fontWeight:'800',
                    color:NINEBOX_COLORS_MAP[nineboxPos]
                  }}>
                    {nineboxPos}
                  </div>
                  <div style={{textAlign:'center',fontWeight:'700',fontSize:'15px',marginBottom:'16px'}}>
                    {NINEBOX_LABELS[nineboxPos]}
                  </div>
                </>
              ) : (
                <div style={{textAlign:'center',padding:'24px 0',color:'var(--text-muted)',fontSize:'14px'}}>
                  Complete la evaluación para ver la posición
                </div>
              )}

              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {[['Desempeño', avgPerf, perfLevel, '#3B82F6'],['Potencial', avgPot, potLevel, '#10B981']].map(([label,val,level,color]) => (
                  <div key={label}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                      <span style={{fontSize:'12px',fontWeight:'600',color:'var(--text-secondary)'}}>{label}</span>
                      <span style={{fontSize:'12px',fontWeight:'700',color}}>{val > 0 ? val.toFixed(2) : '—'}/5</span>
                    </div>
                    <div style={{height:'6px',background:'var(--border)',borderRadius:'3px',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${(val/5)*100}%`,background:color,borderRadius:'3px',transition:'width 0.5s'}}/>
                    </div>
                    {val > 0 && <div style={{fontSize:'11px',color,marginTop:'2px',fontWeight:'600',textTransform:'capitalize'}}>{level}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Mini Nine Box Grid */}
            <div className="card" style={{padding:'16px'}}>
              <h4 style={{fontSize:'12px',fontWeight:'700',textAlign:'center',marginBottom:'10px',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Matriz 3×3</h4>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'3px'}}>
                {[7,8,9,4,5,6,1,2,3].map(pos => (
                  <div key={pos} style={{
                    aspectRatio:'1',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',
                    background: nineboxPos === pos ? `${NINEBOX_COLORS_MAP[pos]}30` : 'var(--bg-app)',
                    border: nineboxPos === pos ? `2px solid ${NINEBOX_COLORS_MAP[pos]}` : '1px solid var(--border)',
                    fontWeight:'700',fontSize:'13px',
                    color: nineboxPos === pos ? NINEBOX_COLORS_MAP[pos] : 'var(--text-muted)',
                    transition:'all 0.3s'
                  }}>
                    {pos}
                  </div>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:'6px'}}>
                <span style={{fontSize:'10px',color:'var(--text-muted)'}}>← Bajo Desempeño</span>
                <span style={{fontSize:'10px',color:'var(--text-muted)'}}>Alto →</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{width:'100%',justifyContent:'center',marginTop:'16px',padding:'14px',fontSize:'15px'}}>
              {loading ? 'Guardando...' : '✓ Registrar Evaluación'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EvaluationForm;
