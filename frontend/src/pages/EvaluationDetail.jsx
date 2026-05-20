import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { evaluationAPI } from '../utils/api';
import { ChevronLeft, Edit, User, Calendar, TrendingUp, BarChart2, Star, Lightbulb, Target, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';

const NINEBOX_LABELS = {
  9: { label: 'Estrella', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  8: { label: 'Alto Potencial', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  7: { label: 'Potencial Enigma', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  6: { label: 'Desempeño Excepcional', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  5: { label: 'Pilar Sólido', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  4: { label: 'Prometedor', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  3: { label: 'Potencial Cuestionable', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  2: { label: 'Bajo Rendimiento', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  1: { label: 'En Riesgo', color: '#991b1b', bg: 'rgba(153,27,27,0.1)' },
};

function ScoreBar({ score, max = 5 }) {
  const pct = (score / max) * 100;
  const color = score >= 4 ? '#10b981' : score >= 3 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
      <div style={{
        flex: 1, height: 8, borderRadius: 99,
        background: 'var(--bg-tertiary)', overflow: 'hidden'
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 99,
          background: color, transition: 'width 0.6s ease'
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 24, textAlign: 'right' }}>
        {score}
      </span>
    </div>
  );
}

function NineBoxVisual({ position }) {
  const cells = [7, 8, 9, 4, 5, 6, 1, 2, 3];
  const cellColors = {
    9: '#10b981', 8: '#34d399', 7: '#6ee7b7',
    6: '#3b82f6', 5: '#93c5fd', 4: '#bfdbfe',
    3: '#ef4444', 2: '#fca5a5', 1: '#fecaca',
  };
  const info = NINEBOX_LABELS[position];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, width: 150, height: 150 }}>
        {cells.map(n => (
          <div key={n} style={{
            background: position === n ? cellColors[n] : 'var(--bg-tertiary)',
            borderRadius: 6,
            border: position === n ? `2px solid ${cellColors[n]}` : '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            color: position === n ? '#fff' : 'var(--text-muted)',
            transform: position === n ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.2s',
            boxShadow: position === n ? `0 4px 12px ${cellColors[n]}50` : 'none',
          }}>{n}</div>
        ))}
      </div>
      {info && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: info.color }}>#{position}</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: info.color }}>{info.label}</p>
        </div>
      )}
    </div>
  );
}

export default function EvaluationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const res = await evaluationAPI.getOne(id);
      setEvaluation(res.evaluation || res);
    } catch {
      toast.error('Error al cargar la evaluación');
      navigate('/evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: 400 }}>
      <div className="loader-ring" />
    </div>
  );

  if (!evaluation) return null;

  const { details = [] } = evaluation;
  const performanceFactors = details.filter(d => d.dimension === 'desempeño');
  const potentialFactors = details.filter(d => d.dimension === 'potencial');
  const info = NINEBOX_LABELS[evaluation.ninebox_position];

  const radarData = [...performanceFactors.slice(0, 4), ...potentialFactors.slice(0, 4)].map(f => ({
    subject: f.factor_name?.split(' ').slice(0, 2).join(' '),
    value: parseFloat(f.score),
    fullMark: 5,
  }));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/evaluaciones')} className="btn-ghost" style={{ padding: '8px 12px' }}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Detalle de Evaluación</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              {evaluation.employee_name} · {evaluation.period} {evaluation.evaluation_year}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Link to={`/evaluaciones/${id}/editar`} className="btn-primary flex items-center gap-2">
            <Edit size={16} /> Editar
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Left: summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Employee info */}
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 auto 12px',
            }}>
              {evaluation.employee_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{evaluation.employee_name}</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{evaluation.position_name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{evaluation.area_name}</p>
          </div>

          {/* Nine Box */}
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 }}>
              POSICIÓN NINE BOX
            </h3>
            <NineBoxVisual position={evaluation.ninebox_position} />
          </div>

          {/* Scores */}
          <div className="card" style={{ padding: 20 }}>
            {[
              { label: 'Desempeño', value: evaluation.performance_score, icon: BarChart2, color: '#3b82f6' },
              { label: 'Potencial', value: evaluation.potential_score, icon: TrendingUp, color: '#10b981' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0', borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${item.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <item.icon size={16} style={{ color: item.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</p>
                  <ScoreBar score={parseFloat(item.value).toFixed(1)} />
                </div>
              </div>
            ))}
            <div style={{ paddingTop: 12, display: 'flex', gap: 8 }}>
              <Calendar size={14} style={{ color: 'var(--text-muted)', marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {evaluation.created_at
                  ? format(new Date(evaluation.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Radar */}
          {radarData.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
                Distribución de Factores
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border-color)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Radar name="Score" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Factors grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { title: 'Factores de Desempeño', factors: performanceFactors, color: '#3b82f6' },
              { title: 'Factores de Potencial', factors: potentialFactors, color: '#10b981' },
            ].map(section => (
              <div key={section.title} className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
                  {section.title}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {section.factors.map(factor => (
                    <div key={factor.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {factor.factor_name}
                      </p>
                      <ScoreBar score={parseFloat(factor.score)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comments */}
          {[
            { label: 'Fortalezas', value: evaluation.strengths, icon: Star, color: '#f59e0b' },
            { label: 'Áreas de Desarrollo', value: evaluation.development_areas, icon: Lightbulb, color: '#3b82f6' },
            { label: 'Plan de Acción', value: evaluation.action_plan, icon: Target, color: '#10b981' },
            { label: 'Comentarios', value: evaluation.comments, icon: MessageSquare, color: '#8b5cf6' },
          ].filter(c => c.value).map(item => (
            <div key={item.label} className="card" style={{ padding: 18 }}>
              <div className="flex items-center gap-2 mb-3">
                <item.icon size={16} style={{ color: item.color }} />
                <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</h4>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
