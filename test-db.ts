import { AppDataSource } from "./src/config/data-source";

async function run() {
    await AppDataSource.initialize();
    const result = await AppDataSource.query(`SELECT phone, password FROM vendors LIMIT 1`);
    console.log("VENDORS:", result);
    process.exit(0);
}

run().catch(console.error);
