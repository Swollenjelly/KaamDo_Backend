"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error(err);
    const status = err?.status ?? 400;
    const msg = typeof err?.message === 'string' ? err.message : 'Server error';
    res.status(status).json({ error: msg });
}
//# sourceMappingURL=error.js.map