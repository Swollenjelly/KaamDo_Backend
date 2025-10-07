import { DataSource } from "typeorm";
import { env } from "./env";
export const AppDataSource = new DataSource({
   type: "postgres",
   host: "localhost",
   port: 5432,
   url: env.DATABASE_URL,
   synchronize: true,
   logging: false,
   entities: ["src/entities/*.ts"],
});