const pool = require('../config/database');
const XLSX = require('xlsx');

const getByArea = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const result = await pool.query(`
      SELECT a.name as area, a.id as area_id,
             COUNT(DISTINCT e.id) as total_employees,
             COUNT(DISTINCT ev.id) as evaluated,
             ROUND(AVG(ev.performance_score)::numeric, 2) as avg_performance,
             ROUND(AVG(ev.potential_score)::numeric, 2) as avg_potential,
             COUNT(CASE WHEN ev.ninebox_position IN (9,8,6) THEN 1 END) as high_talent,
             COUNT(CASE WHEN ev.ninebox_position IN (1,2,4) THEN 1 END) as at_risk
      FROM areas a
      LEFT JOIN employees e ON e.area_id = a.id AND e.status = 'activo'
      LEFT JOIN LATERAL (
        SELECT * FROM evaluations WHERE employee_id = e.id AND period_year = $1
        ORDER BY created_at DESC LIMIT 1
      ) ev ON true
      GROUP BY a.id, a.name
      HAVING COUNT(e.id) > 0
      ORDER BY avg_performance DESC NULLS LAST`, [year]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en reporte por área' });
  }
};

const getByQuadrant = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const result = await pool.query(`
      SELECT e.id, e.full_name, e.position, e.document_number,
             a.name as area_name, e.direct_boss,
             ev.period, ev.ninebox_position, ev.ninebox_label,
             ev.performance_score, ev.potential_score,
             ev.performance_level, ev.potential_level
      FROM employees e
      LEFT JOIN areas a ON e.area_id = a.id
      JOIN LATERAL (
        SELECT * FROM evaluations WHERE employee_id = e.id AND period_year = $1
        ORDER BY created_at DESC LIMIT 1
      ) ev ON true
      WHERE e.status = 'activo'
      ORDER BY ev.ninebox_position, e.full_name`, [year]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en reporte por cuadrante' });
  }
};

const exportExcel = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), type = 'general' } = req.query;

    const result = await pool.query(`
      SELECT e.full_name as "Nombre Completo",
             e.document_number as "Documento",
             e.position as "Cargo",
             a.name as "Área",
             e.direct_boss as "Jefe Directo",
             e.hire_date as "Fecha de Ingreso",
             e.status as "Estado",
             ev.period as "Período",
             ROUND(ev.performance_score::numeric, 2) as "Puntaje Desempeño",
             ev.performance_level as "Nivel Desempeño",
             ROUND(ev.potential_score::numeric, 2) as "Puntaje Potencial",
             ev.potential_level as "Nivel Potencial",
             ev.ninebox_position as "Posición Nine Box",
             ev.ninebox_label as "Clasificación"
      FROM employees e
      LEFT JOIN areas a ON e.area_id = a.id
      LEFT JOIN LATERAL (
        SELECT * FROM evaluations WHERE employee_id = e.id AND period_year = $1
        ORDER BY created_at DESC LIMIT 1
      ) ev ON true
      WHERE e.status = 'activo'
      ORDER BY ev.ninebox_position NULLS LAST, e.full_name`, [year]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(result.rows);

    // Estilos básicos de columnas
    ws['!cols'] = [
      {wch:30},{wch:15},{wch:30},{wch:20},{wch:25},{wch:15},
      {wch:10},{wch:10},{wch:18},{wch:15},{wch:18},{wch:15},{wch:16},{wch:35}
    ];

    XLSX.utils.book_append_sheet(wb, ws, `Talento ${year}`);

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="Ardisa_TalentoHumano_${year}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al exportar Excel' });
  }
};

module.exports = { getByArea, getByQuadrant, exportExcel };
