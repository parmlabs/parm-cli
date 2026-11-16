import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { OpenQASMTranspiler, SimulatorBackend } from "@hviana/js-quantum";

export type Distribution = Record<string, number>;

/** Return the .qasm files in a directory (non-recursive), sorted by name. */
export async function findQasmFiles(dir: string): Promise<string[]> {
  const entries = await readdir(resolve(dir), { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".qasm"))
    .map((e) => join(resolve(dir), e.name))
    .sort();
}

/** Read a .qasm file and parse it into a js-quantum circuit. */
export async function loadCircuit(path: string) {
  const text = await readFile(path, "utf8");
  return new OpenQASMTranspiler().deserialize(text);
}

/** Gate counts, depth, width, etc. Shape comes from js-quantum. */
export function summarize(circuit: { complexity(): unknown }) {
  return circuit.complexity();
}

/** Run the circuit on the local simulator. Returns bitstring -> percentage. */
export async function simulate(
  circuit: any,
  shots: number,
): Promise<Distribution> {
  const sim = new SimulatorBackend();
  const result = await sim.execute(sim.transpileAndPackage(circuit, shots));
  return result as Distribution;
}

/** Sort a distribution by descending probability. */
export function sortDistribution(dist: Distribution): [string, number][] {
  return Object.entries(dist).sort((a, b) => b[1] - a[1]);
}

/** Render a simple text histogram. */
export function renderHistogram(dist: Distribution, width = 30): string {
  const rows = sortDistribution(dist);
  const labelWidth = Math.max(...rows.map(([k]) => k.length), 1);
  return rows
    .map(([bits, pct]) => {
      const bar = "█".repeat(Math.max(1, Math.round((pct / 100) * width)));
      return `${bits.padStart(labelWidth)} │ ${bar} ${pct.toFixed(1)}%`;
    })
    .join("\n");
}
