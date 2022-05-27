import { Lexer } from '../service/lexer';
import { Parser } from '../service/parser';
import {
    SymbolTable,
    SymbolTableNode,
    SymbolValue,
} from '../service/symbol-table';
import { TokenType } from '../types';

const main = async () => {
    const lexer = new Lexer('test/index.teslang');
    const rootTable = new Map<string, SymbolValue | null>();
    rootTable.set('print', {
        isFunction: true,
        parametersCount: 1,
        returnType: TokenType.None,
        parameters: [
            TokenType.ArrayType,
            TokenType.NumericType,
            TokenType.None,
        ],
    });
    rootTable.set('Array', {
        isFunction: true,
        parametersCount: 1,
        returnType: TokenType.ArrayType,
        parameters: [TokenType.NumericType],
    });
    rootTable.set('input', {
        isFunction: true,
        parametersCount: 0,
        returnType: TokenType.NumericType,
        parameters: [],
    });
    rootTable.set('len', {
        isFunction: true,
        parametersCount: 1,
        returnType: TokenType.NumericType,
        parameters: [TokenType.ArrayType],
    });
    rootTable.set('exit', {
        isFunction: true,
        parametersCount: 1,
        returnType: TokenType.None,
        parameters: [TokenType.NumericType],
    });
    const rootNode = new SymbolTableNode(0, rootTable, null, null, null);
    const symbolTable = new SymbolTable(rootNode);
    lexer.readable.on('readable', () => {
        const token = lexer.dropToken();
        const parser = new Parser(token, lexer, symbolTable);
        parser.run();
    });
};

main();
