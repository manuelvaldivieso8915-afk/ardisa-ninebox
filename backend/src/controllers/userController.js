const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const getAll = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.is_active, u.last_login,
              u.created_at, r.name as role_name
       FROM users u JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const create = async (req, res) => {
  try {
    const { username, email, full_name, password, role_id } = req.body;
    if (!username || !email || !full_name || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'El nombre de usuario o correo ya está en uso' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, full_name, password_hash, role_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, username, email, full_name, role_id, created_at`,
      [username.toLowerCase(), email.toLowerCase(), full_name, hash, role_id || 2]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role_id, is_active } = req.body;

    const result = await pool.query(
      `UPDATE users SET full_name=COALESCE($1,full_name), email=COALESCE($2,email),
        role_id=COALESCE($3,role_id), is_active=COALESCE($4,is_active)
       WHERE id=$5 RETURNING id, username, email, full_name, role_id, is_active`,
      [full_name, email, role_id, is_active, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    await pool.query('UPDATE users SET is_active = false WHERE id = $1', [id]);
    res.json({ message: 'Usuario desactivado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

module.exports = { getAll, create, update, remove };
