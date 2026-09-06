const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    })
    : new Pool({
        user: "postgres",
        host: "localhost",
        database: "flood_map",
        password: "123456",
        port: 5432,
    });

module.exports = pool;