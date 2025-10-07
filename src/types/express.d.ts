// Make sure "typeRoots": ["./src/types", "./node_modules/@types"] in tsconfig.json
declare namespace Express {
  export interface Request {
    userId?: number;
  }
}
