#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { basename } from "node:path";
import {
  cancel,
  intro,
  isCancel,
  log,
  note,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import {
  findQasmFiles,
  loadCircuit,
  renderHistogram,
  simulate,
  sortDistribution,
  summarize,
} from "./core.ts";

const VERSION = "0.1.0";

const HELP = `parm-cli - simulate OpenQASM files

Usage:
  parm                         interactive mode
  parm --file <path> [opts]    non-interactive mode

Options:
  -f, --file <path>   .qasm file to simulate
  -s, --shots <n>     number of shots (default 1024)
      --json          print machine-readable JSON
  -h, --help          show help
  -v, --version       show version
`;

const { values } = parseArgs({
  options: {
    file: { type: "string", short: "f" },
    shots: { type: "string", short: "s" },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
    version: { type: "boolean", short: "v", default: false },
  },
});

function parseShots(raw: string | undefined): number {
  if (raw === undefined) return 1024;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Invalid shots value: "${raw}" (expected a positive integer)`);
  }
  return n;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function runNonInteractive(file: string, shots: number, json: boolean) {
  const circuit = await loadCircuit(file);
  const dist = await simulate(circuit, shots);
  if (json) {
    console.log(
      JSON.stringify({ file, shots, summary: summarize(circuit), distribution: dist }, null, 2),
    );
  } else {
    console.log(renderHistogram(dist));
  }
}

async function runInteractive() {
  intro("parm-cli");

  const dir = await text({
    message: "Directory containing .qasm files",
    initialValue: process.cwd(),
    validate: (v) => (v?.trim() ? undefined : "Please enter a path"),
  });
  if (isCancel(dir)) return cancel("Cancelled.");

  let files: string[];
  try {
    files = await findQasmFiles(dir);
  } catch (e) {
    log.error(`Cannot read directory: ${errMsg(e)}`);
    process.exit(1);
  }
  if (files.length === 0) {
    outro("No .qasm files found in that directory.");
    return;
  }

  const file = await select({
    message: "Select a file",
    options: files.map((f) => ({ value: f, label: basename(f) })),
  });
  if (isCancel(file)) return cancel("Cancelled.");

  const shotsRaw = await text({
    message: "Shots",
    initialValue: "1024",
    validate: (v) => {
      const n = Number(v);
      return Number.isInteger(n) && n > 0 ? undefined : "Enter a positive integer";
    },
  });
  if (isCancel(shotsRaw)) return cancel("Cancelled.");
  const shots = Number(shotsRaw);

  const view = await select({
    message: "Output format",
    options: [
      { value: "histogram", label: "Histogram" },
      { value: "json", label: "Raw JSON" },
    ],
  });
  if (isCancel(view)) return cancel("Cancelled.");

  const s = spinner();
  s.start("Parsing circuit");
  let circuit;
  try {
    circuit = await loadCircuit(file);
    s.stop("Circuit parsed");
  } catch (e) {
    s.stop("Parse failed");
    log.error(errMsg(e));
    process.exit(1);
  }

  note(JSON.stringify(summarize(circuit), null, 2), "Circuit summary");

  s.start(`Simulating (${shots} shots)`);
  try {
    const dist = await simulate(circuit, shots);
    s.stop("Simulation complete");
    if (view === "json") {
      note(JSON.stringify(Object.fromEntries(sortDistribution(dist)), null, 2), "Results");
    } else {
      note(renderHistogram(dist), "Results");
    }
  } catch (e) {
    s.stop("Simulation failed");
    log.error(errMsg(e));
    process.exit(1);
  }

  outro("Done");
}

async function main() {
  if (values.help) return console.log(HELP);
  if (values.version) return console.log(VERSION);

  try {
    if (values.file) {
      await runNonInteractive(values.file, parseShots(values.shots), values.json ?? false);
    } else {
      await runInteractive();
    }
  } catch (e) {
    console.error(`Error: ${errMsg(e)}`);
    process.exit(1);
  }
}

main();
