import React, { useState, useEffect } from 'react';
import { reportAPI } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const [areaData, setAreaData] = useState([]);
  const [quadrantData, setQuadrantData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState('area');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      reportAPI.getByArea({ year }),
      reportAPI.getByQuadrant({ year })
    ]).then(([areas, quadrants]) => {
      setAreaData(areas);
      setQuadrantData(quadrants);
    }).catch(() => toast.error('Error al cargar reportes'))
    .finally(() => setLoading(false));
  }, [year]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await reportAPI.exportExcel({ year });
      const url = URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ardisa_Talento_${year}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel descargado exitosamente');
    } catch { toast.error('Error al exportar'); }
    finally { setExporting(false); }
  };

  const NINEBOX_COLORS = {1:'#DC2626',2:'#F97316',3:'#EAB308',4:'#8B5CF6',5:'#6366F1',6:'#10B981',7:'#3B82F6',8:'#0EA5E9',9:'#059669'};

  const chartData = areaData.map(a => ({
    name: a.area.length > 10 ? a.area.substring(0,10)+'…' : a.area,
    Desempeño: parseFloat(a.avg_performance)||0,
    Potencial: parseFloat(a.avg_potential)||0,
    'Alto Potencial': parseInt(a.high_talent)||0,
    'En Riesgo': parseInt(a.at_risk)||0,
  }));

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Análisis ejecutivo del capital humano</p>
        </div>
        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
          <select className="form-input" style={{width:'auto'}} value={year}
            onChange={e => setYear(parseInt(e.target.value))}>
            {[2023,2024,2025].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
            {exporting ? '⏳ Exportando...' : '📥 Exportar Excel'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'4px',marginBottom:'20px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',padding:'4px',width:'fit-content'}}>
        {[['area','Por Área'],['quadrant','Por Cuadrante']].map(([key,label])=>(
          <button key={key} className={`btn ${tab===key?'btn-primary':'btn-secondary'}`} style={{border:'none',boxShadow:'none'}}
            onClick={()=>setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loader"><div className="loader-spinner"/></div>
      ) : tab === 'area' ? (
        <div>
          {/* Area chart */}
          <div className="card" style={{padding:'24px',marginBottom:'20px'}}>
            <h3 style={{fontSize:'16px',fontWeight:'700',marginBottom:'20px'}}>Promedio Desempeño y Potencial por Área</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="name" tick={{fontSize:11,fill:'var(--text-muted)'}}/>
                <YAxis domain={[0,5]} tick={{fontSize:11,fill:'var(--text-muted)'}}/>
                <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'10px'}}/>
                <Bar dataKey="Desempeño" fill="#3B82F6" radius={[4,4,0,0]}/>
                <Bar dataKey="Potencial" fill="#10B981" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Area table */}
          <div className="card">
            <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
              <h3 style={{fontSize:'15px',fontWeight:'700'}}>Detalle por Área</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Área</th>
                  <th>Empleados</th>
                  <th>Evaluados</th>
                  <th>Prom. Desempeño</th>
                  <th>Prom. Potencial</th>
                  <th>Alto Potencial</th>
                  <th>En Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {areaData.map(a => (
                  <tr key={a.area_id}>
                    <td style={{fontWeight:'600'}}>{a.area}</td>
                    <td>{a.total_employees}</td>
                    <td>{a.evaluated} <span style={{fontSize:'11px',color:'var(--text-muted)'}}>({a.total_employees>0?Math.round(a.evaluated/a.total_employees*100):0}%)</span></td>
                    <td>
                      <span style={{fontWeight:'700',color:'#3B82F6'}}>{a.avg_performance||'—'}</span>
                    </td>
                    <td>
                      <span style={{fontWeight:'700',color:'#10B981'}}>{a.avg_potential||'—'}</span>
                    </td>
                    <td><span className="badge badge-success">{a.high_talent}</span></td>
                    <td><span className="badge badge-danger">{a.at_risk}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
            <h3 style={{fontSize:'15px',fontWeight:'700'}}>Colaboradores por Cuadrante Nine Box</h3>
          </div>
          {quadrantData.length === 0 ? (
            <div style={{padding:'60px',textAlign:'center',color:'var(--text-muted)'}}>Sin datos para el período seleccionado</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Cargo</th>
                  <th>Área</th>
                  <th>Jefe</th>
                  <th>Desempeño</th>
                  <th>Potencial</th>
                  <th>Nine Box</th>
                </tr>
              </thead>
              <tbody>
                {quadrantData.map(ev => {
                  const c = NINEBOX_COLORS[ev.ninebox_position]||'#94A3B8';
                  return (
                    <tr key={ev.id}>
                      <td style={{fontWeight:'600'}}>{ev.full_name}</td>
                      <td style={{fontSize:'13px'}}>{ev.position}</td>
                      <td><span className="badge badge-blue">{ev.area_name||'—'}</span></td>
                      <td style={{fontSize:'13px',color:'var(--text-secondary)'}}>{ev.direct_boss||'—'}</td>
                      <td><span style={{fontWeight:'700',color:'#3B82F6'}}>{ev.performance_score}</span></td>
                      <td><span style={{fontWeight:'700',color:'#10B981'}}>{ev.potential_score}</span></td>
                      <td>
                        <span style={{display:'inline-flex',alignItems:'center',padding:'3px 8px',borderRadius:'12px',fontSize:'11px',fontWeight:'700',background:`${c}15`,color:c}}>
                          Box {ev.ninebox_position}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
