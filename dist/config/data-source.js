"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const env_1 = require("./env");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    url: env_1.env.DATABASE_URL,
    synchronize: true,
    logging: false,
    entities: ["src/entities/*.ts"],
});
//# sourceMappingURL=data-source.js.map