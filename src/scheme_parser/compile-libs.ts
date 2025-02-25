import path from "path";
import fs from "fs";
import { schemeParse } from "./transpiler";
import { estreeEncode } from "./utils/encoder-visitor";
const escodegen = require("escodegen");

function transpile(inputFilePath: string, outputFilePath: string) {
  fs.readFile(inputFilePath, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err}`);
      return;
    }

    // we transpile the file
    const transpiledAST = schemeParse(data);
    const encodedAST = estreeEncode(transpiledAST);
    const transpiledProgram = escodegen.generate(encodedAST);

    fs.writeFile(outputFilePath, transpiledProgram, err => {
      if (err) {
        console.error(`Error writing file: ${err}`);
        return;
      }
      console.log(`${inputFilePath} has been transpiled to ${outputFilePath}`);
    });
  });
}

// get file paths from command line arguments
const inputFilePath: string = process.argv[2];
const outputFilePath: string = process.argv[3]
  ? process.argv[3]
  : inputFilePath.replace(".scm", ".js");

// validate file paths
if (!inputFilePath) {
  console.error("Please provide an input file path and an output file path");
}

if (!(path.extname(inputFilePath) === ".scm")) {
  console.error("Please provide a .scm file for compilation!");
}

// if everything is fine, we transpile the file
transpile(inputFilePath, outputFilePath);
