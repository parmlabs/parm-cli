OPENQASM 2.0;
include "qelib1.inc";

qreg q[2];
creg c[2];

// Apply Hadamard gate to qubit 0 to create a superposition
h q[0];

// Apply CNOT gate with qubit 0 as control and qubit 1 as target to entangle them
cx q[0], q[1];

// Measure both qubits into classical bits
measure q[0] -> c[0];
measure q[1] -> c[1];
