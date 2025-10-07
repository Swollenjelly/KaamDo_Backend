import express from "express";
import cors from "cors";
import { AppDataSource } from './config/data-source';
import { env } from "./config/env";
import routes from "./routes/routes";
import {errorHandler} from "./middleware/error";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", routes);
app.use(errorHandler);

(async () => {
    await AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    app.listen(env.PORT, () =>
      console.log(`Server running on http://localhost:${env.PORT}`)
    );
  })
  .catch((err) => {
    console.error("DB commection failed:", err);
    process.exit();
  });

})();
  
