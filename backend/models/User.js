// models/User.js
const pool = require('../config/db');

console.log("DATABASE_URL:", process.env.DATABASE_URL); // Add this

const User = {
  async findByUsernameOrEmail(username, email) {
    try {
	console.log("DATABASE_URL inside findByUsernameOrEmail:", process.env.DATABASE_URL); // ADD THIS LINE HERE!
      const client = await pool.connect(); // Use a client from the pool
      try{
        const result = await client.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        return result.rows[0];
      } finally {
        client.release();
      }

    } catch (err) {
      console.error("Error in findByUsernameOrEmail:", err); // Log the error
      throw err; // Re-throw to be handled by the caller
    }
  },

  async findByEmail(email) {
      try {
          const client = await pool.connect();
          try {
              const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
              return result.rows[0];
          } finally {
              client.release();
          }
      } catch (error) {
          console.error("Error in findByEmail", error);
          throw error;
      }
  },

  async create(userData) {
    try {
      const { username, email, password_hash, role_id } = userData;
      const client = await pool.connect();  //Use a client from the pool
      try {
        const result = await client.query(
          'INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING *',
          [username, email, password_hash, role_id]
        );
        return result.rows[0];
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error in create:", err); // Log the error
      throw err; // Re-throw to be handled by the caller
    }
  },
    async findById(userId) {
        try {
            const client = await pool.connect();
            try {
                const result = await client.query(
                    'SELECT user_id, username, email, role_id, created_at, updated_at FROM users WHERE user_id = $1', // Select user_id
                    [userId]
                );
                return result.rows[0];
            } finally {
                client.release();
            }

        } catch (error) {
            console.error("Error in findByID", error);
            throw error;
        }
  },
    async update(userId, { username, email }) {
        try {
            const client = await pool.connect();
            try {
                const result = await client.query(
                    `UPDATE users
                    SET username = COALESCE($1, username),
                        email = COALESCE($2, email),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $3
                    RETURNING user_id, username, email, role_id, created_at, updated_at`,
                    [username, email, userId]
                );
                return result.rows[0];
            } finally {
                client.release();
            }

        } catch (error) {
            console.log("Error in update", error);
            throw error;
        }
    },
    async delete(userId) {
        try {
            const client = await pool.connect();
            try {
                const result = await client.query(
                    'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
                    [userId]
                );
                return result.rows[0];
            } finally {
                client.release();
            }
        } catch (error) {
            console.error("Error in delete", error);
            throw error;
        }
    }
};

module.exports = User;
