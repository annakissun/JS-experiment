// test.js - Basic Node.js test
console.log("Hello from Node.js!");

// Test Node.js features
const os = require('os');
console.log("Your computer name:", os.hostname());
console.log("Node.js version:", process.version);

// Simple math
const add = (a, b) => a + b;
console.log("2 + 3 =", add(2, 3));

// File system test
const fs = require('fs');
fs.writeFileSync('test-output.txt', 'Node.js is working!');
console.log("File 'test-output.txt' created successfully!");