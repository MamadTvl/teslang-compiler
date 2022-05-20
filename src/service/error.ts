import { Token } from '../types';
import { Lexer } from './lexer';

export class ParserError {
    constructor(public lexer: Lexer) {}

    throw(message: string) {
        return `${message} at ${this.lexer.line}:${this.lexer.column}`;
    }
}
