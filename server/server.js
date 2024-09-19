import cors from "cors";
import express from "express";
import router from "./routes/router.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

app.use(express.json());
app.use(router);

let port = 5000;
app.listen(port, () => {
  console.log(`Server has started on ${port}...\n`);
});

export default {
  app,
};
