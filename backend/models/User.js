const pool = require('../config/db');

class User {
    static async findByUsernameOrEmail(username, email) {
        const result = await pool.query(
            'SELECT * FROM Users WHERE username = $1 OR email = $2',
            [username, email]
        );
        return result.rows[0];
    }

    static async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM Users WHERE email = $1',
            [email]
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

    static async findById(userId) {
        const result = await pool.query(
            'SELECT user_id, username, email, role_id, created_at, updated_at FROM Users WHERE user_id = $1',
            [userId]
        );
        return result.rows[0];
    }

    static async update(userId, { username, email }) {
        const result = await pool.query(
            `UPDATE Users
            SET username = COALESCE($1, username),
                email = COALESCE($2, email),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $3
            RETURNING user_id, username, email, role_id, created_at, updated_at`,
            [username, email, userId]
        );
        return result.rows[0];
    }

    static async delete(userId) {
        const result = await pool.query(
            'DELETE FROM Users WHERE user_id = $1 RETURNING user_id',
            [userId]
        );
        return result.rows[0];
    }
}

module.exports = User;