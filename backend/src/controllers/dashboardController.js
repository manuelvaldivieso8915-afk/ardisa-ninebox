const pool = require('../config/database');

const getStats = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const [
      totalEmps,
      byStatus,
      byArea,
      nineboxDist,
      topTalent,
      atRisk,
      recentEvals
    ] = await Promise.all([
      // Total empleados activos
      pool.query(`SELECT COUNT(*) as total FROM employees WHERE status = 'activo'`),

      // Por estado
      pool.query(`SELECT status, COUNT(*) as count FROM employees GROUP BY status`),

      // Por área
      pool.query(`
        SELECT a.name, a.id, COUNT(e.id) as employee_count
        FROM areas a
        LEFT JOIN employees e ON e.area_id = a.id AND e.status = 'activo'
        GROUP BY a.id, a.name ORDER BY employee_count DESC`),

      // Distribución Nine Box (última evaluación por empleado)
      pool.query(`
        SELECT ev.ninebox_position, ev.ninebox_label, COUNT(*) as count
        FROM evaluations ev
        JOIN (
          SELECT employee_id, MAX(created_at) as max_date
          FROM evaluations
          WHERE period_year = $1
          GROUP BY employee_id
        ) latest ON ev.employee_id = latest.employee_id AND ev.created_at = latest.max_date
        GROUP BY ev.ninebox_position, ev.ninebox_label
        ORDER BY ev.ninebox_position`, [year]),

      // Top talento (posición 9, 8, 6)
      pool.query(`
        SELECT e.id, e.full_name, e.position, a.name as area_name,
               ev.performance_score, ev.potential_score, ev.ninebox_position, ev.ninebox_label
        FROM employees e
        JOIN areas a ON e.area_id = a.id
        JOIN LATERAL (
          SELECT * FROM evaluations WHERE employee_id = e.id
          ORDER BY created_at DESC LIMIT 1
        ) ev ON true
        WHERE ev.ninebox_position IN (9, 8, 6) AND e.status = 'activo'
        ORDER BY ev.performance_score + ev.potential_score DESC
        LIMIT 8`),

      // En riesgo (posición 1, 2, 4)
      pool.query(`
        SELECT e.id, e.full_name, e.position, a.name as area_name,
               ev.performance_score, ev.potential_score, ev.ninebox_position
        FROM employees e
        JOIN areas a ON e.area_id = a.id
        JOIN LATERAL (
          SELECT * FROM evaluations WHERE employee_id = e.id
          ORDER BY created_at DESC LIMIT 1
        ) ev ON true
        WHERE ev.ninebox_position IN (1, 2, 4) AND e.status = 'activo'
        ORDER BY ev.performance_score + ev.potential_score ASC
        LIMIT 6`),

      // Evaluaciones recientes
      pool.query(`
        SELECT ev.id, e.full_name, e.position, ev.period, ev.ninebox_position,
               ev.ninebox_label, ev.performance_score, ev.potential_score, ev.created_at,
               a.name as area_name
        FROM evaluations ev
        JOIN employees e ON ev.employee_id = e.id
        LEFT JOIN areas a ON e.area_id = a.id
        ORDER BY ev.created_at DESC LIMIT 10`)
    ]);

    // Estadísticas de scores promedio
    const avgScores = await pool.query(`
      SELECT
        ROUND(AVG(performance_score)::numeric, 2) as avg_performance,
        ROUND(AVG(potential_score)::numeric, 2) as avg_potential,
        COUNT(*) as total_evaluations
      FROM evaluations
      WHERE period_year = $1`, [year]);

    res.json({
      summary: {
        total_employees: parseInt(totalEmps.rows[0].total),
        total_evaluations: parseInt(avgScores.rows[0].total_evaluations),
        avg_performance: parseFloat(avgScores.rows[0].avg_performance) || 0,
        avg_potential: parseFloat(avgScores.rows[0].avg_potential) || 0,
        high_talent_count: topTalent.rows.length,
        at_risk_count: atRisk.rows.length
      },
      by_status: byStatus.rows,
      by_area: byArea.rows,
      ninebox_distribution: nineboxDist.rows,
      top_talent: topTalent.rows,
      at_risk: atRisk.rows,
      recent_evaluations: recentEvals.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

module.exports = { getStats };
