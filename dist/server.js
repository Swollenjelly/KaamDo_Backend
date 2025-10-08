"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const data_source_1 = require("./config/data-source");
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes/routes"));
const error_1 = require("./middleware/error");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", routes_1.default);
app.use(error_1.errorHandler);
(async () => {
    await data_source_1.AppDataSource.initialize()
        .then(() => {
        console.log("Database connected");
        app.listen(env_1.env.PORT, () => console.log(`Server running on http://localhost:${env_1.env.PORT}`));
    })
        .catch((err) => {
        console.error("DB commection failed:", err);
        process.exit();
    });
})();
//# sourceMappingURL=server.js.map