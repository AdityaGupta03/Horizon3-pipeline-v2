import pg from "pg";
const { Pool } = pg;

let db_pool = new Pool({});

export { db_pool };
