import { copyFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(root, "data"), { recursive: true });
copyFileSync(
  join(root, "assets", "example_dictionary.json"),
  join(root, "data", "dictionary.json")
);
console.log("Copied assets/example_dictionary.json → data/dictionary.json");
