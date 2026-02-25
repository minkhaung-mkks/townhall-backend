import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("=== RESEED: Resetting and Seeding Database ===\n");

console.log("Step 1: Resetting database...\n");
try {
    execSync(`node ${join(__dirname, "reset.js")}`, { stdio: "inherit" });
} catch (error) {
    console.error("Reset failed");
    process.exit(1);
}

console.log("\nStep 2: Seeding database...\n");
try {
    execSync(`node ${join(__dirname, "seed.js")}`, { stdio: "inherit" });
} catch (error) {
    console.error("Seed failed");
    process.exit(1);
}

console.log("\n=== RESEED COMPLETE ===");
