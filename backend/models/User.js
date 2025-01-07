const pool = require('../config/db');

class User {
    static async findByUsernameOrEmail(username, email) {
        const result = await pool.query(
            'SELECT * FROM Users WHERE username = $1 OR email = $2',
            [username, email]
        );
        return result.rows[0];
    }

    static async create({ username, email, password_hash, role_id }) {
        const result = await pool.query(
            `INSERT INTO Users (username, email, password_hash, role_id)
            VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, role_id, created_at`,
            [username, email, password_hash, role_id]
        );
        return result.rows[0];
    }
}

module.exports = User;