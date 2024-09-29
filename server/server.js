import cors from "cors";
import express from "express";
import router from "./routes/router.js";

const app = express();

app.use(express.json());
app.use("/api", router);
app.use(cors());

let port = 8172;
app.listen(port, () => {
  console.log(`Server has started on ${port}...\n`);
});

export default app;
