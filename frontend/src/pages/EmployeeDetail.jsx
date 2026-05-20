import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { employeeAPI, evaluationAPI } from '../utils/api';
import {
  User, Mail, Briefcase, Building2, Calendar, Hash,
  ChevronLeft, Edit, Plus, TrendingUp, Award, AlertTriangle,
  BarChart2, Clock, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const NINEBOX_LABELS = {
  9: { label: 'Estrella', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  8: { label: 'Alto Potencial', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  7: { label: 'Potencial Enigma', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  6: { label: 'Desempeño Excepcional', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  5: { label: 'Pilar Sólido', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  4: { label: 'Prometedor', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  3: { label: 'Potencial Cuestionable', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  2: { label: 'Bajo Rendimiento', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
  1: { label: 'En Riesgo', color: '#991b1b', bg: 'rgba(153,27,27,0.12)' },
};

function MiniNineBox({ position }) {
  const cells = [7, 8, 9, 4, 5, 6, 1, 2, 3];
  const cellColors = {
    9: '#10b981', 8: '#34d399', 7: '#6ee7b7',
    6: '#3b82f6', 5: '#93c5fd', 4: '#bfdbfe',
    3: '#ef4444', 2: '#fca5a5', 1: '#fecaca',
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3, width: 90, height: 90 }}>
      {cells.map(n => (
        <div key={n} style={{
          background: position === n ? cellColors[n] : 'var(--bg-tertiary)',
          borderRadius: 4,
          border: position === n ? `2px solid ${cellColors[n]}` : '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700, color: position === n ? '#fff' : 'var(--text-muted)',
          transition: 'all 0.2s',
          transform: position === n ? 'scale(1.05)' : 'scale(1)',
        }}>{n}</div>
      ))}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: 'var(--bg-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={16} style={{ color: 'var(--accent)' }} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{value || '—'}</p>
      </div>
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [empRes, evalRes] = await Promise.all([
        employeeAPI.getOne(id),
        evaluationAPI.getAll({ employee_id: id, per_page: 10 })
      ]);
      setEmployee(empRes.employee || empRes.data?.employee || empRes);
      setEvaluations(evalRes.evaluations || evalRes.data || evalRes.data?.evaluations || []);
    } catch {
      toast.error('Error al cargar el colaborador');
      navigate('/colaboradores');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: 400 }}>
      <div className="loader-ring" />
    </div>
  );

  if (!employee) return null;

  const latest = evaluations[0];
  const nineInfo = latest ? NINEBOX_LABELS[latest.ninebox_position] : null;

  const initials = employee.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  // Radar data from latest eval
  const radarData = latest ? [
    { subject: 'Desempeño', value: parseFloat(latest.performance_score) * 20 },
    { subject: 'Potencial', value: parseFloat(latest.potential_score) * 20 },
  ] : [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/colaboradores')} className="btn-ghost" style={{ padding: '8px 12px' }}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Perfil del Colaborador</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>Información completa e historial de evaluaciones</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/evaluaciones/nueva?employee=${id}`} className="btn-secondary flex items-center gap-2">
            <Plus size={16} /> Nueva Evaluación
          </Link>
          <Link to={`/colaboradores/${id}/editar`} className="btn-primary flex items-center gap-2">
            <Edit size={16} /> Editar
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile Card */}
          <div className="card" style={{ textAlign: 'center', padding: 28 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
            }}>{initials}</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              {employee.full_name}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {employee.position_name}
            </p>
            <span className={`badge ${employee.status === 'activo' ? 'badge-success' : 'badge-danger'}`}>
              {employee.status === 'activo' ? '● Activo' : '● Inactivo'}
            </span>

            {nineInfo && (
              <div style={{
                marginTop: 20, padding: '12px 16px', borderRadius: 10,
                background: nineInfo.bg, border: `1px solid ${nineInfo.color}30`
              }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Posición Nine Box</p>
                <div className="flex items-center justify-center gap-3">
                  <MiniNineBox position={latest.ninebox_position} />
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: nineInfo.color }}>
                      #{latest.ninebox_position}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: nineInfo.color }}>
                      {nineInfo.label}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Información Personal
            </h3>
            <InfoRow icon={Hash} label="Documento" value={employee.document_number} />
            <InfoRow icon={Mail} label="Correo" value={employee.email} />
            <InfoRow icon={Building2} label="Área" value={employee.area_name} />
            <InfoRow icon={Briefcase} label="Cargo" value={employee.position_name} />
            <InfoRow icon={User} label="Jefe Directo" value={employee.direct_boss} />
            <InfoRow icon={Calendar} label="Fecha Ingreso"
              value={employee.hire_date ? format(new Date(employee.hire_date), 'dd MMM yyyy', { locale: es }) : null}
            />
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Latest scores */}
          {latest && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {[
                { label: 'Desempeño', value: latest.performance_score, icon: BarChart2, color: '#3b82f6' },
                { label: 'Potencial', value: latest.potential_score, icon: TrendingUp, color: '#10b981' },
                { label: 'Clasificación', value: latest.ninebox_position, icon: Award, color: nineInfo?.color || '#f59e0b', isPos: true },
              ].map(item => (
                <div key={item.label} className="card" style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, margin: '0 auto 12px',
                    background: `${item.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <item.icon size={20} style={{ color: item.color }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: item.color }}>
                    {item.isPos ? `#${item.value}` : parseFloat(item.value).toFixed(1)}
                  </p>
                  {!item.isPos && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 5.0</p>}
                </div>
              ))}
            </div>
          )}

          {/* Evaluations history */}
          <div className="card" style={{ flex: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Historial de Evaluaciones
              </h3>
              <Link to={`/evaluaciones/nueva?employee=${id}`} className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
                <Plus size={14} style={{ marginRight: 4 }} /> Evaluar
              </Link>
            </div>

            {evaluations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <AlertTriangle size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sin evaluaciones registradas</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {evaluations.map((ev, i) => {
                  const info = NINEBOX_LABELS[ev.ninebox_position];
                  return (
                    <Link key={ev.id} to={`/evaluaciones/${ev.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '14px 16px', borderRadius: 10,
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: info?.bg || 'var(--bg-card)',
                          border: `1px solid ${info?.color || 'var(--border-color)'}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, color: info?.color || 'var(--text-secondary)',
                          flexShrink: 0
                        }}>#{ev.ninebox_position}</div>

                        <div style={{ flex: 1 }}>
                          <div className="flex items-center justify-between">
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {ev.period} {ev.evaluation_year}
                            </p>
                            {i === 0 && <span className="badge badge-success" style={{ fontSize: 10 }}>Reciente</span>}
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {info?.label} · Des: {parseFloat(ev.performance_score).toFixed(1)} · Pot: {parseFloat(ev.potential_score).toFixed(1)}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: 4 }}>
                          {[
                            { v: ev.performance_score, c: '#3b82f6' },
                            { v: ev.potential_score, c: '#10b981' },
                          ].map((s, j) => (
                            <div key={j} style={{ width: 32, textAlign: 'center' }}>
                              <div style={{
                                height: 28, width: '100%', background: 'var(--bg-card)',
                                borderRadius: 4, overflow: 'hidden', position: 'relative'
                              }}>
                                <div style={{
                                  position: 'absolute', bottom: 0, width: '100%',
                                  height: `${(parseFloat(s.v) / 5) * 100}%`,
                                  background: s.c, borderRadius: 4, transition: 'height 0.5s ease',
                                }} />
                              </div>
                              <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                                {parseFloat(s.v).toFixed(1)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
