import { TokenType } from '../types';
import type { Token } from '../types';
import fs from 'fs';

export class Lexer {
    private _currentIndex: number;
    public readable: fs.ReadStream;
    private _currentToken = '';
    public column: number;
    public line: number;
    literalRegex = /[a-zA-Z]/;
    literalRegexNext = /[a-zA-Z0-9]/;
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
        { key: 'Array', value: { type: TokenType.ArrayFunction } },
        { key: 'notif', value: { type: TokenType.Else } },
        { key: 'print', value: { type: TokenType.PrintFunction } },
        { key: 'input', value: { type: TokenType.InputFunction } },
        { key: 'loop', value: { type: TokenType.Loop } },
        { key: 'true', value: { type: TokenType.True } },
        { key: 'none', value: { type: TokenType.None } },
        { key: 'exit', value: { type: TokenType.ExitFunction } },
        { key: 'and', value: { type: TokenType.AndOperator } },
        { key: 'or', value: { type: TokenType.OrOperator } },
        { key: 'not', value: { type: TokenType.NotOperator } },
        { key: 'for', value: { type: TokenType.For } },
        { key: 'len', value: { type: TokenType.LengthFunction } },
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
        this._currentIndex = 0;
        this.column = 1;
        this.line = 1;
        this.readable = fs.createReadStream(source, {
            encoding: 'utf8',
        });
    }

    private tokenize(): Token[] {
        const out: Token[] = [];
        this._currentIndex = 0;
        while (this._currentIndex < this._currentToken.length) {
            const currentToken = this._currentToken[this._currentIndex];
            // don't care about white spaces
            if (currentToken === ' ') {
                this.column++;
                this._currentIndex++;
                continue;
            }

            // dont care about line breaks
            if (['\n', '\r', '\t'].includes(currentToken)) {
                this.line++;
                this.column = 1;
                this._currentIndex++;
                continue;
            }

            let didMatch = false;
            for (const { key, value } of this.tokenStringMap) {
                if (!this.lookaheadString(key)) {
                    continue;
                }
                out.push(value);
                this._currentIndex += key.length;

                didMatch = true;
            }

            if (didMatch) continue;

            // check if we get to a string with '
            if (currentToken === "'") {
                this._currentIndex++;

                const bucket = this.lookahead(/[^']/);

                out.push({
                    type: TokenType.String,
                    value: bucket.join(''),
                });

                this._currentIndex += bucket.length + 1;

                continue;
            }
            // check if we get to a literal
            if (this.literalRegex.test(currentToken)) {
                const bucket = this.lookahead(
                    this.literalRegex,
                    this.literalRegexNext,
                );

                out.push({
                    type: TokenType.Literal,
                    value: bucket.join(''),
                });

                this._currentIndex += bucket.length;

                continue;
            }
            // check if we get to a number
            if (this.numberRegex.test(currentToken)) {
                const bucket = this.lookahead(this.numberRegex);

                out.push({
                    type: TokenType.Number,
                    value: bucket.join(''),
                });
                this._currentIndex += bucket.length;

                continue;
            }
            // check if we get to a comment
            if (this.commentRegex.test(currentToken)) {
                const bucket = this.lookahead(this.commentRegex);

                this._currentIndex += bucket.length;

                continue;
            }
            // if we get to this point, we have a syntax error
            throw new Error(`Syntax Error: ${currentToken}`);
        }
        return out;
    }

    private lookaheadString(str: string): boolean {
        const parts = str.split('');
        if (parts.length !== str.length) {
            return false;
        }
        for (let i = 0; i < parts.length; i++) {
            if (this._currentToken[this._currentIndex + i] !== parts[i]) {
                return false;
            }
        }
        return true;
    }

    private lookahead(match: RegExp, matchNext?: RegExp): string[] {
        const bucket: string[] = [];

        while (true) {
            const nextIndex = this._currentIndex + bucket.length;
            const nextToken = this._currentToken[nextIndex];
            if (!nextToken) {
                break;
            }
            let m: string | RegExp = match;
            if (matchNext && bucket.length) {
                m = matchNext;
            }
            if (m && !m.test(nextToken)) {
                break;
            }
            bucket.push(nextToken);
        }

        return bucket;
    }

    private ignoreComment(): void {
        let chunk;
        while (chunk !== '\n') {
            chunk = this.readable.read(1);
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

    private tempTokens: Token[] = [];
    public dropToken(): Token | undefined {
        let tokens: Token[] = [];
        while (true) {
            let pointer;
            let currentToken = '';
            while (pointer !== ' ' && pointer !== null) {
                pointer = this.readable.read(1);
                if (pointer === '#') {
                    this.ignoreComment();
                } else {
                    pointer && (currentToken += pointer);
                }
            }
            this._currentToken = currentToken;
            tokens = this.tokenize();
            if (tokens.length > 0 || pointer === null) {
                break;
            }
        }
        const token = this.tempTokens.shift() || tokens.shift();
        this.tempTokens.push(...tokens);
        token && this.calculateColumn(token);
        return token;
    }
}
