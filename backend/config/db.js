const { Pool } = require('pg');
require('dotenv').config();

let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.startsWith('"') && connectionString.endsWith('"')) {
    connectionString = connectionString.slice(1, -1);
}

const poolConfig = {
    connectionString,
    connectionTimeoutMillis: 2000,
    idleTimeoutMillis: 30000,
    query_timeout: 10000
};

console.log("Pool config:", poolConfig);

const pool = new Pool(poolConfig);

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;