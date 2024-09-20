import pg from "pg";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Extract database connection details from environment variables
const { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD } = process.env;

// Create connection to pg database
let db_pool = new pg.Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
});

export { db_pool };
