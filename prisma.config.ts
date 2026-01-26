import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    migrations: {
        seed: "tsx prisma/seeds.ts",
    },
    datasource: {
        url: env("DATABASE_URL"),
    },
});
