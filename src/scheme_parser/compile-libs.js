"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const transpiler_1 = require("./transpiler");
const encoder_visitor_1 = require("./utils/encoder-visitor");
const escodegen = require("escodegen");
function transpile(inputFilePath, outputFilePath) {
    fs_1.default.readFile(inputFilePath, "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }
        // we transpile the file
        const transpiledAST = (0, transpiler_1.schemeParse)(data);
        const encodedAST = (0, encoder_visitor_1.estreeEncode)(transpiledAST);
        const transpiledProgram = escodegen.generate(encodedAST);
        fs_1.default.writeFile(outputFilePath, transpiledProgram, err => {
            if (err) {
                console.error(`Error writing file: ${err}`);
                return;
            }
            console.log(`${inputFilePath} has been transpiled to ${outputFilePath}`);
        });
    });
}
// get file paths from command line arguments
const inputFilePath = process.argv[2];
const outputFilePath = process.argv[3]
    ? process.argv[3]
    : inputFilePath.replace(".scm", ".js");
// validate file paths
if (!inputFilePath) {
    console.error("Please provide an input file path and an output file path");
}
if (!(path_1.default.extname(inputFilePath) === ".scm")) {
    console.error("Please provide a .scm file for compilation!");
}
// if everything is fine, we transpile the file
transpile(inputFilePath, outputFilePath);
//# sourceMappingURL=compile-libs.js.map