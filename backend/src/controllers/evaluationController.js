const pool = require('../config/database');

// Clasificar nivel según promedio (1-5)
const classifyLevel = (score) => {
  if (score < 2.5) return 'bajo';
  if (score < 3.75) return 'medio';
  return 'alto';
};

// Calcular posición Nine Box (1-9)
// Grilla: potencial (Y) x desempeño (X)
// 7 | 8 | 9   ← alto potencial
// 4 | 5 | 6   ← medio potencial
// 1 | 2 | 3   ← bajo potencial
//   bajo med alto  ← desempeño
const calculateNineBoxPosition = (performanceLevel, potentialLevel) => {
  const perf = { bajo: 1, medio: 2, alto: 3 }[performanceLevel] || 2;
  const pot = { bajo: 1, medio: 2, alto: 3 }[potentialLevel] || 2;
  return ((pot - 1) * 3) + perf;
};

const NINEBOX_LABELS = {
  1: 'Bajo Desempeño / Bajo Potencial',
  2: 'Desempeño en Desarrollo / Bajo Potencial',
  3: 'Alto Desempeño / Bajo Potencial',
  4: 'Bajo Desempeño / Potencial Moderado',
  5: 'Colaborador Clave',
  6: 'Alto Potencial en Desempeño',
  7: 'Enigma',
  8: 'Alto Potencial',
  9: 'Estrella',
};

const getAll = async (req, res) => {
  try {
    const { employee_id, period, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = ['1=1'];

    if (employee_id) { params.push(employee_id); where.push(`ev.employee_id = $${params.length}`); }
    if (period) { params.push(period); where.push(`ev.period = $${params.length}`); }
    if (status) { params.push(status); where.push(`ev.status = $${params.length}`); }

    const whereClause = where.join(' AND ');
    const countResult = await pool.query(`SELECT COUNT(*) FROM evaluations ev WHERE ${whereClause}`, params);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT ev.*, e.full_name, e.position, e.document_number,
              a.name as area_name, u.full_name as evaluator_name
       FROM evaluations ev
       JOIN employees e ON ev.employee_id = e.id
       LEFT JOIN areas a ON e.area_id = a.id
       LEFT JOIN users u ON ev.evaluator_id = u.id
       WHERE ${whereClause}
       ORDER BY ev.created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: { total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener evaluaciones' });
  }
};

const getOne = async (req, res) => {
  try {
    const evResult = await pool.query(
      `SELECT ev.*, e.full_name, e.position, e.document_number,
              a.name as area_name, u.full_name as evaluator_name
       FROM evaluations ev
       JOIN employees e ON ev.employee_id = e.id
       LEFT JOIN areas a ON e.area_id = a.id
       LEFT JOIN users u ON ev.evaluator_id = u.id
       WHERE ev.id = $1`, [req.params.id]
    );
    if (!evResult.rows.length) return res.status(404).json({ error: 'Evaluación no encontrada' });

    const detailsResult = await pool.query(
      `SELECT ed.*, ef.name as factor_name, ef.dimension
       FROM evaluation_details ed
       JOIN evaluation_factors ef ON ed.factor_id = ef.id
       WHERE ed.evaluation_id = $1
       ORDER BY ef.dimension, ef.order_index`, [req.params.id]
    );

    res.json({ ...evResult.rows[0], details: detailsResult.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener evaluación' });
  }
};

const create = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { employee_id, period, period_year, details, comments, strengths, development_areas, action_plan } = req.body;

    if (!employee_id || !period || !details?.length) {
      return res.status(400).json({ error: 'Empleado, período y detalles de evaluación son requeridos' });
    }

    // Verificar que no exista evaluación para ese período
    const existing = await client.query(
      'SELECT id FROM evaluations WHERE employee_id = $1 AND period = $2',
      [employee_id, period]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: `Ya existe una evaluación para ${period}` });
    }

    // Calcular scores
    const perfDetails = details.filter(d => d.dimension === 'desempeno');
    const potDetails = details.filter(d => d.dimension === 'potencial');

    const perfScore = perfDetails.reduce((s, d) => s + d.score, 0) / perfDetails.length;
    const potScore = potDetails.reduce((s, d) => s + d.score, 0) / potDetails.length;

    const perfLevel = classifyLevel(perfScore);
    const potLevel = classifyLevel(potScore);
    const nineboxPos = calculateNineBoxPosition(perfLevel, potLevel);
    const nineboxLabel = NINEBOX_LABELS[nineboxPos];

    // Insertar evaluación
    const evResult = await client.query(
      `INSERT INTO evaluations (employee_id, evaluator_id, period, period_year, status,
        performance_score, potential_score, performance_level, potential_level,
        ninebox_position, ninebox_label, comments, strengths, development_areas, action_plan)
       VALUES ($1,$2,$3,$4,'completada',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [employee_id, req.user.id, period, period_year || new Date().getFullYear(),
       perfScore.toFixed(2), potScore.toFixed(2), perfLevel, potLevel,
       nineboxPos, nineboxLabel, comments, strengths, development_areas, action_plan]
    );

    const evaluationId = evResult.rows[0].id;

    // Insertar detalles
    for (const detail of details) {
      await client.query(
        'INSERT INTO evaluation_details (evaluation_id, factor_id, score, comment) VALUES ($1,$2,$3,$4)',
        [evaluationId, detail.factor_id, detail.score, detail.comment || null]
      );
    }

    // Registrar en historial Nine Box
    await client.query(
      `INSERT INTO ninebox_history (employee_id, evaluation_id, period, ninebox_position, performance_score, potential_score)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [employee_id, evaluationId, period, nineboxPos, perfScore.toFixed(2), potScore.toFixed(2)]
    );

    await client.query('COMMIT');

    res.status(201).json({
      ...evResult.rows[0],
      ninebox_label: nineboxLabel
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al crear evaluación' });
  } finally {
    client.release();
  }
};

const update = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { details, comments, strengths, development_areas, action_plan, status } = req.body;

    if (details?.length) {
      const perfDetails = details.filter(d => d.dimension === 'desempeno');
      const potDetails = details.filter(d => d.dimension === 'potencial');
      const perfScore = perfDetails.reduce((s, d) => s + d.score, 0) / perfDetails.length;
      const potScore = potDetails.reduce((s, d) => s + d.score, 0) / potDetails.length;
      const perfLevel = classifyLevel(perfScore);
      const potLevel = classifyLevel(potScore);
      const nineboxPos = calculateNineBoxPosition(perfLevel, potLevel);

      await client.query(
        `UPDATE evaluations SET performance_score=$1, potential_score=$2, performance_level=$3,
          potential_level=$4, ninebox_position=$5, ninebox_label=$6, comments=$7, strengths=$8,
          development_areas=$9, action_plan=$10, status=COALESCE($11, status)
         WHERE id = $12`,
        [perfScore.toFixed(2), potScore.toFixed(2), perfLevel, potLevel, nineboxPos,
         NINEBOX_LABELS[nineboxPos], comments, strengths, development_areas, action_plan, status, id]
      );

      await client.query('DELETE FROM evaluation_details WHERE evaluation_id = $1', [id]);
      for (const detail of details) {
        await client.query(
          'INSERT INTO evaluation_details (evaluation_id, factor_id, score, comment) VALUES ($1,$2,$3,$4)',
          [id, detail.factor_id, detail.score, detail.comment || null]
        );
      }
    } else {
      await client.query(
        `UPDATE evaluations SET comments=$1, strengths=$2, development_areas=$3, action_plan=$4, status=COALESCE($5, status) WHERE id=$6`,
        [comments, strengths, development_areas, action_plan, status, id]
      );
    }

    const result = await client.query('SELECT * FROM evaluations WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error al actualizar evaluación' });
  } finally {
    client.release();
  }
};

const getNineBoxMatrix = async (req, res) => {
  try {
    const { period, area_id, year } = req.query;
    const params = [];
    let where = ["e.status = 'activo'"];

    if (area_id) { params.push(area_id); where.push(`e.area_id = $${params.length}`); }

    const whereClause = where.join(' AND ');

    const result = await pool.query(
      `SELECT e.id, e.full_name, e.position, e.document_number,
              a.name as area_name,
              ev.ninebox_position, ev.performance_score, ev.potential_score,
              ev.performance_level, ev.potential_level, ev.ninebox_label, ev.period,
              ev.id as evaluation_id
       FROM employees e
       LEFT JOIN areas a ON e.area_id = a.id
       LEFT JOIN LATERAL (
         SELECT * FROM evaluations ev2
         WHERE ev2.employee_id = e.id
         ${year ? `AND ev2.period_year = ${parseInt(year)}` : ''}
         ORDER BY ev2.created_at DESC LIMIT 1
       ) ev ON true
       WHERE ${whereClause}
       ORDER BY ev.ninebox_position NULLS LAST, e.full_name`,
      params
    );

    // Agrupar por posición
    const matrix = {};
    for (let i = 1; i <= 9; i++) matrix[i] = [];

    result.rows.forEach(emp => {
      if (emp.ninebox_position) {
        matrix[emp.ninebox_position].push(emp);
      } else {
        if (!matrix[0]) matrix[0] = [];
        matrix[0].push(emp);
      }
    });

    res.json({ employees: result.rows, matrix, labels: NINEBOX_LABELS });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener matriz Nine Box' });
  }
};

module.exports = { getAll, getOne, create, update, getNineBoxMatrix };
