import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardAPI } from '../utils/api';

const NINEBOX_COLORS = {
  1: '#DC2626', 2: '#EF4444', 3: '#F97316',
  4: '#F59E0B', 5: '#6366F1', 6: '#10B981',
  7: '#8B5CF6', 8: '#3B82F6', 9: '#059669',
};

const KPICard = ({ title, value, subtitle, color = 'blue', icon, trend }) => (
  <div className="kpi-card">
    <div className="kpi-icon" style={{ background: `${color}20`, color }}>
      {icon}
    </div>
    <div className="kpi-content">
      <div className="kpi-value">{value}</div>
      <div className="kpi-title">{title}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </div>
    {trend !== undefined && (
      <div className={`kpi-trend ${trend >= 0 ? 'up' : 'down'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    )}
    <style>{`
      .kpi-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
      .kpi-icon {
        width: 52px; height: 52px; border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        font-size: 22px; flex-shrink: 0;
      }
      .kpi-value {
        font-family: 'Syne', sans-serif;
        font-size: 28px; font-weight: 800;
        color: var(--text-primary); line-height: 1;
      }
      .kpi-title { font-size: 13px; color: var(--text-secondary); margin-top: 4px; font-weight: 500; }
      .kpi-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
      .kpi-trend {
        margin-left: auto; font-size: 12px; font-weight: 700;
        padding: 4px 8px; border-radius: 8px;
      }
      .kpi-trend.up { background: #D1FAE5; color: #059669; }
      .kpi-trend.down { background: #FEE2E2; color: #DC2626; }
      [data-theme="dark"] .kpi-trend.up { background: rgba(5,150,105,.15); }
      [data-theme="dark"] .kpi-trend.down { background: rgba(220,38,38,.15); }
    `}</style>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.getStats({ year: new Date().getFullYear() })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loader">
      <div className="loader-spinner" />
    </div>
  );

  if (!data) return null;

  const { summary, by_area, ninebox_distribution, top_talent, at_risk, recent_evaluations } = data;

  // Prepare chart data
  const areaData = by_area.slice(0, 6).map(a => ({
    name: a.name.length > 12 ? a.name.substring(0, 12) + '…' : a.name,
    empleados: parseInt(a.employee_count),
  }));

  const pieData = ninebox_distribution.map(n => ({
    name: `Box ${n.ninebox_position}`,
    value: parseInt(n.count),
    color: NINEBOX_COLORS[n.ninebox_position] || '#94A3B8',
  }));

  const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899','#84CC16'];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Ejecutivo</h1>
          <p className="page-subtitle">Resumen estratégico del capital humano · Año {new Date().getFullYear()}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/colaboradores/nuevo')}>
          + Nuevo Colaborador
        </button>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{marginBottom:'24px'}}>
        <KPICard
          title="Total Colaboradores"
          value={summary.total_employees}
          subtitle="Activos en el sistema"
          color="#3B82F6"
          icon="👥"
        />
        <KPICard
          title="Evaluaciones"
          value={summary.total_evaluations}
          subtitle={`Año ${new Date().getFullYear()}`}
          color="#10B981"
          icon="📊"
        />
        <KPICard
          title="Alto Potencial"
          value={summary.high_talent_count}
          subtitle="Posiciones 9, 8 y 6"
          color="#059669"
          icon="⭐"
        />
        <KPICard
          title="En Riesgo"
          value={summary.at_risk_count}
          subtitle="Requieren atención"
          color="#EF4444"
          icon="⚠️"
        />
      </div>

      {/* Score KPIs */}
      <div className="grid-2" style={{marginBottom:'24px'}}>
        <div className="card" style={{padding:'20px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <div>
              <div style={{fontSize:'13px',fontWeight:'600',color:'var(--text-secondary)'}}>Promedio Desempeño</div>
              <div style={{fontFamily:'Syne',fontSize:'36px',fontWeight:'800',color:'var(--text-primary)',lineHeight:'1'}}>
                {summary.avg_performance.toFixed(1)}<span style={{fontSize:'18px',color:'var(--text-muted'}}>/5</span>
              </div>
            </div>
            <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'rgba(59,130,246,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px'}}>📈</div>
          </div>
          <div style={{background:'var(--bg-app)',borderRadius:'8px',height:'8px',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(summary.avg_performance/5)*100}%`,background:'var(--blue-500)',borderRadius:'8px',transition:'width 1s ease'}}/>
          </div>
        </div>

        <div className="card" style={{padding:'20px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <div>
              <div style={{fontSize:'13px',fontWeight:'600',color:'var(--text-secondary)'}}>Promedio Potencial</div>
              <div style={{fontFamily:'Syne',fontSize:'36px',fontWeight:'800',color:'var(--text-primary)',lineHeight:'1'}}>
                {summary.avg_potential.toFixed(1)}<span style={{fontSize:'18px',color:'var(--text-muted'}}>/5</span>
              </div>
            </div>
            <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'rgba(16,185,129,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px'}}>🚀</div>
          </div>
          <div style={{background:'var(--bg-app)',borderRadius:'8px',height:'8px',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${(summary.avg_potential/5)*100}%`,background:'var(--success)',borderRadius:'8px',transition:'width 1s ease'}}/>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{marginBottom:'24px'}}>
        {/* Employees by area */}
        <div className="card" style={{padding:'24px'}}>
          <div style={{marginBottom:'20px'}}>
            <h3 style={{fontSize:'16px',fontWeight:'700'}}>Colaboradores por Área</h3>
            <p style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'2px'}}>Distribución organizacional</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={areaData} margin={{left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{fontSize:11,fill:'var(--text-muted)'}} />
              <YAxis tick={{fontSize:11,fill:'var(--text-muted)'}} />
              <Tooltip
                contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'10px',fontSize:'13px'}}
              />
              <Bar dataKey="empleados" fill="#3B82F6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Nine Box distribution pie */}
        <div className="card" style={{padding:'24px'}}>
          <div style={{marginBottom:'20px'}}>
            <h3 style={{fontSize:'16px',fontWeight:'700'}}>Distribución Nine Box</h3>
            <p style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'2px'}}>Por posición en la matriz</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'10px',fontSize:'13px'}}/>
                <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{fontSize:'12px',color:'var(--text-secondary)'}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{height:'220px',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)',fontSize:'14px'}}>
              Sin evaluaciones registradas
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-2">
        {/* Top talent */}
        <div className="card" style={{padding:'24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
            <div>
              <h3 style={{fontSize:'16px',fontWeight:'700'}}>⭐ Talento Destacado</h3>
              <p style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'2px'}}>Alto potencial y desempeño</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/nine-box')}>Ver matriz</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {top_talent.length === 0 && <div style={{color:'var(--text-muted)',fontSize:'14px',padding:'20px 0',textAlign:'center'}}>Sin datos</div>}
            {top_talent.slice(0,5).map(emp => (
              <div key={emp.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px',borderRadius:'10px',background:'var(--bg-app)',cursor:'pointer'}}
                onClick={() => navigate(`/colaboradores/${emp.id}`)}>
                <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'var(--blue-500)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'14px',flexShrink:0}}>
                  {emp.full_name[0]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:'600',fontSize:'13px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.full_name}</div>
                  <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{emp.position}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#059669'}}>{emp.ninebox_label?.split('/')[0]?.trim()}</div>
                  <div style={{fontSize:'11px',color:'var(--text-muted)'}}>Box {emp.ninebox_position}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent evaluations */}
        <div className="card" style={{padding:'24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
            <div>
              <h3 style={{fontSize:'16px',fontWeight:'700'}}>📋 Evaluaciones Recientes</h3>
              <p style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'2px'}}>Últimas registradas</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/evaluaciones')}>Ver todas</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {recent_evaluations.length === 0 && <div style={{color:'var(--text-muted)',fontSize:'14px',padding:'20px 0',textAlign:'center'}}>Sin evaluaciones</div>}
            {recent_evaluations.slice(0,5).map(ev => {
              const boxColor = NINEBOX_COLORS[ev.ninebox_position] || '#94A3B8';
              return (
                <div key={ev.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px',borderRadius:'10px',background:'var(--bg-app)'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'8px',background:`${boxColor}20`,color:boxColor,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'14px',flexShrink:0}}>
                    {ev.ninebox_position || '?'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:'600',fontSize:'13px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.full_name}</div>
                    <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{ev.period} · {ev.area_name}</div>
                  </div>
                  <div style={{textAlign:'right',fontSize:'12px'}}>
                    <div style={{color:'var(--blue-500)',fontWeight:'600'}}>D: {ev.performance_score}</div>
                    <div style={{color:'var(--success)',fontWeight:'600'}}>P: {ev.potential_score}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
