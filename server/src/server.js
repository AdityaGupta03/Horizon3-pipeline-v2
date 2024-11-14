import cors from "cors";
import express from "express";
import router from "./routes/router.js";
const app = express();
app.use(express.json());
app.use("/api", router);
app.use(cors());
if (process.env.NODE_ENV !== "test") {
    let port = 6969;
    app.listen(port, () => {
        console.log(`Server has started on ${port}...\n`);
    });
}
export default app;
