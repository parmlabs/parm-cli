# parm-cli

Interactive CLI to simulate OpenQASM files from the terminal. Built on
[`@hviana/js-quantum`](https://jsr.io/@hviana/js-quantum) and
[`@clack/prompts`](https://github.com/bombshell-dev/clack).

## Install

```sh
npm install -g parm-cli
```

Requires Node.js 18 or newer.

## Usage

Interactive mode:

```sh
parm
```

You'll be prompted for a directory, a `.qasm` file, the number of shots, and
an output format (histogram or raw JSON).

Non-interactive mode:

```sh
parm --file bell.qasm --shots 1000
parm --file bell.qasm --json
```

## Options

| Flag                | Description                       |
| ------------------- | --------------------------------- |
| `-f, --file <path>` | `.qasm` file to simulate          |
| `-s, --shots <n>`   | Number of shots (default `1024`)  |
| `--json`            | Print machine-readable JSON       |
| `-h, --help`        | Show help                         |
| `-v, --version`     | Show version                      |

## Supported OpenQASM versions

OpenQASM 3.x is supported through js-quantum's parser. OpenQASM 2.0 support
has not been fully verified yet.

## Development

```sh
bun install
bun run start
bun run build
```

## License

MIT
