import { TokenType } from '../types';
import type { Token } from '../types';
import fs from 'fs';

export class Lexer {
    public readable: fs.ReadStream;
    private _currentToken: string | null = '';
    public column: number;
    public line: number;
    private prvChars: string[] = [];
    private tokenStack: Token[] = [];
    literalRegex = /[a-zA-Z]/;
    literalRegexNext = /[a-zA-Z0-9_]/;
    numberRegex = /[0-9]+/;
    commentRegex = /#[^\n]\n/;
    tokenStringMap: Array<{
        key: string;
        value: Token;
    }> = [
        { key: 'numeric', value: { type: TokenType.NumericType } },
        { key: 'return', value: { type: TokenType.Return } },
        { key: 'false', value: { type: TokenType.False } },
        { key: 'array', value: { type: TokenType.ArrayType } },
        { key: 'notif', value: { type: TokenType.Else } },
        { key: 'loop', value: { type: TokenType.Loop } },
        { key: 'true', value: { type: TokenType.True } },
        { key: 'none', value: { type: TokenType.None } },
        { key: 'and', value: { type: TokenType.AndOperator } },
        { key: 'or', value: { type: TokenType.OrOperator } },
        { key: 'not', value: { type: TokenType.NotOperator } },
        { key: 'for', value: { type: TokenType.For } },
        { key: 'let', value: { type: TokenType.DefineVariableOperator } },
        { key: 'if', value: { type: TokenType.If } },
        { key: 'fc', value: { type: TokenType.Function } },
        { key: '<=', value: { type: TokenType.LessThanOrEqualOperator } },
        { key: '>=', value: { type: TokenType.GreaterThanOrEqualOperator } },
        { key: '==', value: { type: TokenType.EqualOperator } },
        { key: '!=', value: { type: TokenType.NotEqualOperator } },
        { key: '->', value: { type: TokenType.Arrow } },
        { key: '<-', value: { type: TokenType.ReverseArrow } },
        { key: '\n', value: { type: TokenType.LineBreak } },
        { key: '\t', value: { type: TokenType.LineBreak } },
        { key: '\r', value: { type: TokenType.LineBreak } },
        { key: '>', value: { type: TokenType.GreaterThanOperator } },
        { key: '=', value: { type: TokenType.AssignmentOperator } },
        { key: '+', value: { type: TokenType.PlusOperator } },
        { key: '-', value: { type: TokenType.MinusOperator } },
        { key: '*', value: { type: TokenType.MultiplyOperator } },
        { key: '/', value: { type: TokenType.DivideOperator } },
        { key: '%', value: { type: TokenType.ModulusOperator } },
        { key: '<', value: { type: TokenType.LessThanOperator } },
        { key: '?', value: { type: TokenType.TernaryIfOperator } },
        { key: '(', value: { type: TokenType.OpenParen } },
        { key: ')', value: { type: TokenType.CloseParen } },
        { key: ',', value: { type: TokenType.Comma } },
        { key: ':', value: { type: TokenType.Colon } },
        { key: ';', value: { type: TokenType.SemiColon } },
        { key: '{', value: { type: TokenType.StartBlock } },
        { key: '}', value: { type: TokenType.EndBlock } },
        { key: '[', value: { type: TokenType.StartArray } },
        { key: ']', value: { type: TokenType.EndArray } },
    ];

    constructor(source: string) {
        this.column = 1;
        this.line = 1;
        this.readable = fs.createReadStream(source, {
            encoding: 'utf8',
        });
    }
    private temp = '';
    private tokenize(): Token | null | undefined {
        this._currentToken = this.read();
        if (!this._currentToken) {
            return undefined;
        }
        // don't care about white spaces
        if (this._currentToken === ' ') {
            this.column++;
            return null;
        }
        if (this._currentToken === '#') {
            this.ignoreComment();
            return null;
        }

        // dont care about line breaks
        if (
            this._currentToken === '\n' ||
            this._currentToken === '\r' ||
            this._currentToken === '\t'
        ) {
            this.line++;
            this.column = 1;
            return null;
        }
        this.unread(this._currentToken);

        for (const { key, value } of this.tokenStringMap) {
            if (!this.lookaheadString(key)) {
                continue;
            }
            return value;
        }
        if (this._currentToken && this.literalRegex.test(this._currentToken)) {
            const result = this.lookahead(
                this.literalRegex,
                this.literalRegexNext,
            );
            return {
                type: TokenType.Literal,
                value: result.join(''),
            };
        }
        // check if we get to a number
        if (this._currentToken && this.numberRegex.test(this._currentToken)) {
            const result = this.lookahead(this.numberRegex);
            return {
                type: TokenType.Number,
                value: result.join(''),
            };
        }
        return null;
    }

    private lookaheadString(key: string): boolean {
        // check key char by char if it matches return true else unread()
        let token = this.read() as string;
        if (this._currentToken) {
            for (let i = 0; i < key.length; i++) {
                if (token[i] === key[i]) {
                    if (i !== key.length - 1) {
                        token += this.read() as string;
                    }
                } else {
                    this.unread(token);
                    return false;
                }
            }
        } else {
            return false;
        }
        const nextChar = this.read();
        if (
            nextChar &&
            this.tokenStringMap.findIndex((key) => key.key === token) < 22 &&
            this.literalRegexNext.test(nextChar)
        ) {
            this.unread(token + nextChar);
            return false;
        }
        nextChar && this.unread(nextChar);
        return true;
    }

    private lookahead(match: RegExp, matchNext?: RegExp): string[] {
        const bucket: string[] = [this.read() as string];

        while (true) {
            const nextChar = this.read();
            if (!nextChar) {
                break;
            }
            let m: string | RegExp = match;
            if (matchNext && bucket.length) {
                m = matchNext;
            }
            if (m && !m.test(nextChar)) {
                this.unread(nextChar);
                break;
            }
            bucket.push(nextChar);
        }

        return bucket;
    }

    private ignoreComment(): void {
        let chunk;
        while (chunk !== '\n') {
            chunk = this.read();
        }
        this.line++;
        this.column = 1;
    }

    private calculateColumn(token: Token): void {
        // if token is in tokenStringMap use the key length
        // otherwise use the token value length
        if (
            token.type === TokenType.Literal ||
            token.type === TokenType.String ||
            token.type === TokenType.Number
        ) {
            this.column += token.value.length;
        } else {
            this.column +=
                this.tokenStringMap.find((t) => t.value.type === token.type)
                    ?.key.length ?? 1;
        }
    }

    private unread(str: string): void {
        this.prvChars.unshift(...str.split(''));
    }

    private read(): string | null {
        return this.prvChars.length > 0
            ? this.prvChars.shift()
            : this.readable.read(1);
    }

    public dropToken(): Token | undefined {
        while (true) {
            if (this.tokenStack.length > 0) {
                return this.tokenStack.shift();
            } else {
                const token = this.tokenize();
                if (token) {
                    this.calculateColumn(token);
                    return token;
                } else if (token === undefined) {
                    break;
                }
            }
        }
        return undefined;
    }

    public getBackToken(token: Token | Token[]): void {
        this.tokenStack.unshift(...(Array.isArray(token) ? token : [token]));
    }

    public debug(...args: any) {
        console.log(`${this.line}:${this.column}`, ...args);
    }
}
