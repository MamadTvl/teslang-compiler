import { Lexer } from '../service/lexer';
import { Parser } from '../service/parser';
import { SymbolTable } from '../service/symbol-table';
import { TokenType } from '../types';

const main = () => {
    const lexer = new Lexer('test/1.teslang');
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

    lexer.readable.on('readable', () => {
        const token = lexer.dropToken();
        const parser = new Parser(token, lexer, symbolTable);
        parser.run();
    });
};

main();
