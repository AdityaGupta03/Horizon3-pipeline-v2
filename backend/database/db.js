import { Pool } from "pg";

let db_pool = new Pool({});

module.exports = {
  db_pool,
};
