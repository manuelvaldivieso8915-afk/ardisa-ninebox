const pool = require('../config/database');

const getAll = async (req, res) => {
  try {
    const { search, area_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = ['1=1'];

    if (search) {
      params.push(`%${search}%`);
      where.push(`(e.full_name ILIKE $${params.length} OR e.document_number ILIKE $${params.length} OR e.position ILIKE $${params.length})`);
    }
    if (area_id) {
      params.push(area_id);
      where.push(`e.area_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      where.push(`e.status = $${params.length}`);
    }

    const whereClause = where.join(' AND ');

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM employees e WHERE ${whereClause}`,
      params
    );

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT e.*, a.name as area_name,
              ev.ninebox_position, ev.performance_score, ev.potential_score,
              ev.performance_level, ev.potential_level, ev.period as last_period
       FROM employees e
       LEFT JOIN areas a ON e.area_id = a.id
       LEFT JOIN LATERAL (
         SELECT * FROM evaluations WHERE employee_id = e.id
         ORDER BY created_at DESC LIMIT 1
       ) ev ON true
       WHERE ${whereClause}
       ORDER BY e.full_name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener colaboradores' });
  }
};

const getOne = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, a.name as area_name,
              (SELECT json_agg(ev ORDER BY ev.created_at DESC)
               FROM evaluations ev WHERE ev.employee_id = e.id) as evaluations
       FROM employees e
       LEFT JOIN areas a ON e.area_id = a.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Colaborador no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener colaborador' });
  }
};

const create = async (req, res) => {
  try {
    const {
      full_name, document_type, document_number, email, phone,
      position, area_id, direct_boss, hire_date, birth_date, notes
    } = req.body;

    if (!full_name || !document_number || !position || !hire_date) {
      return res.status(400).json({ error: 'Nombre, documento, cargo y fecha de ingreso son requeridos' });
    }

    const existing = await pool.query('SELECT id FROM employees WHERE document_number = $1', [document_number]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Ya existe un colaborador con ese número de documento' });
    }

    const result = await pool.query(
      `INSERT INTO employees (full_name, document_type, document_number, email, phone,
        position, area_id, direct_boss, hire_date, birth_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [full_name, document_type || 'CC', document_number, email, phone,
       position, area_id || null, direct_boss, hire_date, birth_date || null,
       notes, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear colaborador' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name, document_type, document_number, email, phone,
      position, area_id, direct_boss, hire_date, birth_date, status, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE employees SET
        full_name = COALESCE($1, full_name),
        document_type = COALESCE($2, document_type),
        document_number = COALESCE($3, document_number),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        position = COALESCE($6, position),
        area_id = COALESCE($7, area_id),
        direct_boss = COALESCE($8, direct_boss),
        hire_date = COALESCE($9, hire_date),
        birth_date = COALESCE($10, birth_date),
        status = COALESCE($11, status),
        notes = COALESCE($12, notes)
       WHERE id = $13 RETURNING *`,
      [full_name, document_type, document_number, email, phone,
       position, area_id, direct_boss, hire_date, birth_date, status, notes, id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Colaborador no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar colaborador' });
  }
};

const remove = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE employees SET status = $1 WHERE id = $2 RETURNING id',
      ['inactivo', req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Colaborador no encontrado' });
    res.json({ message: 'Colaborador desactivado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar colaborador' });
  }
};

module.exports = { getAll, getOne, create, update, remove };
