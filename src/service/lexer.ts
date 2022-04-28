import { Token, TokenType } from '../types';

export class Lexer {
    private readonly _tokens: Token[];
    private _currentIndex: number;
    private _source: string;
    literalRegex = /[a-zA-Z]/;
    literalRegexNext = /[a-zA-Z0-9]/;
    numberRegex = /[0-9]+/;
    commentRegex = /#[^\n]\n/;
    tokenStringMap: Array<{
        key: string;
        value: Token;
    }> = [
        { key: '\n', value: { type: TokenType.LineBreak } },
        { key: '\t', value: { type: TokenType.LineBreak } },
        { key: '\r', value: { type: TokenType.LineBreak } },
        { key: '->', value: { type: TokenType.Arrow } },
        { key: '<-', value: { type: TokenType.ReverseArrow } },
        { key: '=', value: { type: TokenType.AssignmentOperator } },
        { key: '+', value: { type: TokenType.Operator } },
        { key: '-', value: { type: TokenType.Operator } },
        { key: '*', value: { type: TokenType.Operator } },
        { key: '/', value: { type: TokenType.Operator } },
        { key: '%', value: { type: TokenType.Operator } },
        { key: '<', value: { type: TokenType.Operator } },
        { key: '>', value: { type: TokenType.Operator } },
        { key: '<=', value: { type: TokenType.Operator } },
        { key: '>=', value: { type: TokenType.Operator } },
        { key: '==', value: { type: TokenType.Operator } },
        { key: '!=', value: { type: TokenType.Operator } },
        { key: 'and', value: { type: TokenType.Operator } },
        { key: 'or', value: { type: TokenType.Operator } },
        { key: 'not', value: { type: TokenType.Operator } },
        { key: '(', value: { type: TokenType.OpenParen } },
        { key: ')', value: { type: TokenType.CloseParen } },
        { key: ',', value: { type: TokenType.Comma } },
        { key: ':', value: { type: TokenType.Colon } },
        { key: ';', value: { type: TokenType.SemiColon } },
        { key: '{', value: { type: TokenType.StartBlock } },
        { key: '}', value: { type: TokenType.EndBlock } },
        { key: 'for', value: { type: TokenType.For } },
        { key: 'loop', value: { type: TokenType.Loop } },
        { key: 'if', value: { type: TokenType.If } },
        { key: 'notif', value: { type: TokenType.Else } },
        { key: 'fc', value: { type: TokenType.Function } },
        { key: 'return', value: { type: TokenType.Return } },
        { key: 'true', value: { type: TokenType.Boolean } },
        { key: 'false', value: { type: TokenType.Boolean } },
        { key: 'array', value: { type: TokenType.Array } },
        { key: 'none', value: { type: TokenType.None } },
        { key: 'numeric', value: { type: TokenType.Numeric } },
    ];

    constructor(source: string) {
        this._currentIndex = 0;
        this._source = source;
        this._tokens = this.tokenize();
    }

    private tokenize(): Token[] {
        const out: Token[] = [];
        while (this._currentIndex < this._source.length) {
            const currentToken = this._source[this._currentIndex];
            // don't care about white spaces
            if (currentToken === ' ') {
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
                console.log(bucket.join(''));

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
                console.log(bucket.join(''));

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

        for (let i = 0; i < parts.length; i++) {
            if (this._source[this._currentIndex + i] !== parts[i]) {
                return false;
            }
        }
        !['\n', '\t', '\r'].includes(str) && console.log(str);
        return true;
    }

    private lookahead(match: RegExp, matchNext?: RegExp): string[] {
        const bucket: string[] = [];

        while (true) {
            const nextIndex = this._currentIndex + bucket.length;
            const nextToken = this._source[nextIndex];
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

    public printTokens() {
        for (const token of this._tokens) {
            console.table(token);
        }
    }
}
