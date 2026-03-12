const path = require("path");
const { spawn } = require("child_process");

const packageJsonPath =
  process.env.npm_package_json || path.join(__dirname, "..", "package.json");
const packageDir = path.dirname(packageJsonPath);
const [tool, ...toolArgs] = process.argv.slice(1);

const entryPoints = {
  next: path.join(packageDir, "node_modules", "next", "dist", "bin", "next"),
  tsc: path.join(packageDir, "node_modules", "typescript", "bin", "tsc"),
  tsx: path.join(packageDir, "node_modules", "tsx", "dist", "cli.mjs"),
};

if (!tool) {
  console.error("Missing tool name.");
  process.exit(1);
}

const entryPoint = entryPoints[tool];

if (!entryPoint) {
  console.error(`Unsupported tool: ${tool}`);
  process.exit(1);
}

const child = spawn(process.execPath, [entryPoint, ...toolArgs], {
  cwd: packageDir,
  env: process.env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
