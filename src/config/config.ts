import fs from "fs";
import path from "path";
import type { HorizonConfig } from "./types.js";

export function loadConfig(): HorizonConfig {
    const configPath = path.join(
        process.cwd(),
        "horizon.config.json"
    );
    const raw = fs.readFileSync(configPath, "utf8");

    return JSON.parse(raw);
}