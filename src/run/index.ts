import { IR } from './../service/IR';
import { Lexer } from '../service/lexer';
import { Parser } from '../service/parser';
import { SymbolTable } from '../service/symbol-table';
import { TokenType } from '../types';
import fs from 'fs';
import { exec } from 'child_process';

const saveByteCodeAndRun = (byteCode: string[], source: string) => {
    const regex = /[.].*/;
    const byteCodeSource = source.replace(regex, '-bytecode.tes');
    fs.writeFileSync(byteCodeSource, '');
    for (const code of byteCode) {
        let out = `${code}\n`;
        if (!/proc|:/.test(out)) {
            out = '    ' + out;
        }
        fs.appendFileSync(byteCodeSource, out);
    }
    exec(`src/service/tsvm ${byteCodeSource}`, (error, stdout, stderr) => {
        error && console.log(error);
        stdout !== '' && console.log(stdout);
        stderr !== '' && console.log(stderr);
    });
};

const main = () => {
    const argv = process.argv.slice(2);
    const source = argv[0];
    console.log('running', source);
    if (!fs.existsSync(source)) {
        throw new Error('source code not found!');
    }
    const lexer = new Lexer(source);
    const symbolTable = new SymbolTable(lexer);
    symbolTable.insert('print', {
        isFunction: true,
        scope: 'print-0',
        returnType: TokenType.None,
        parameters: [
            {
                name: 'value',
                type: TokenType.NumericType,
            },
        ],
    });
    symbolTable.insert('len', {
        isFunction: true,
        scope: 'len-0',
        returnType: TokenType.NumericType,
        parameters: [
            {
                name: 'array',
                type: TokenType.ArrayType,
            },
        ],
    });
    symbolTable.insert('input', {
        isFunction: true,
        scope: 'input-0',
        returnType: TokenType.NumericType,
        parameters: [],
    });
    symbolTable.insert('exit', {
        isFunction: true,
        scope: 'exit-0',
        returnType: TokenType.None,
        parameters: [],
    });
    symbolTable.insert('Array', {
        isFunction: true,
        scope: 'Array-0',
        returnType: TokenType.ArrayType,
        parameters: [
            {
                name: 'length',
                type: TokenType.NumericType,
            },
        ],
    });

    lexer.readable.once('readable', () => {
        const ir = new IR();
        const token = lexer.dropToken();
        const parser = new Parser(token, lexer, symbolTable, ir);
        const result = parser.run();
        if (result) {
            saveByteCodeAndRun(ir.byteCode, source);
        }
    });
};

main();
