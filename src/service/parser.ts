import { Token, TokenType } from '../types';
import { ParserError } from './error';
import { Lexer } from './lexer';
import { SymbolKey, SymbolValue } from './symbol-table';
type parserReturnType = Token | null | void;
// todo: remember to before call any function drop token (fix type function)
export class Parser {
    private currentToken: Token | undefined;
    private lexer: Lexer;
    private parserError;
    constructor(currentToken: Token | undefined, lexer: Lexer) {
        this.currentToken = currentToken;
        this.lexer = lexer;
        this.parserError = new ParserError(lexer);
    }

    public type(): parserReturnType {
        if (!this.currentToken) {
            return null;
        }
        if (
            [
                TokenType.ArrayType,
                TokenType.NumericType,
                TokenType.None,
            ].includes(this.currentToken.type)
        ) {
            return this.currentToken;
        } else {
            throw this.error('Expected illegal type');
        }
    }

    public clist(): parserReturnType {
        if (!this.currentToken) {
            return;
        }
        this.expr();
        this.currentToken = this.lexer.dropToken();
        if (this.currentToken?.type === TokenType.Comma) {
            this.currentToken = this.lexer.dropToken();
            this.clist();
        }
        return;
    }

    public defvar(): parserReturnType {
        if (!this.currentToken) {
            return;
        }
        if (this.currentToken.type === TokenType.Literal) {
            const value = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                throw this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            this.type();
            this.currentToken = this.lexer.dropToken();
            if (this.currentToken?.type === TokenType.Comma) {
                this.currentToken = this.lexer.dropToken();
                this.flist();
            }
            return;
        }
    }

    public expr(): parserReturnType {
        if (!this.currentToken) {
            return;
        }
        if (this.currentToken.type === TokenType.NotOperator) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            return;
        }
        if (this.currentToken.type === TokenType.PlusOperator) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            return;
        }
        if (this.currentToken.type === TokenType.MinusOperator) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            return;
        }

        if (this.currentToken.type === TokenType.StartArray) {
            this.currentToken = this.lexer.dropToken();
            this.clist();
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.EndArray
            ) {
                throw this.error('Expected "]"');
            }
            this.currentToken = this.lexer.dropToken();
            return;
        }

        if (this.currentToken.type === TokenType.Literal) {
            const literalValue = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            if (this.currentToken?.type === TokenType.AssignmentOperator) {
                this.currentToken = this.lexer.dropToken();
                this.expr();
            }
            if (this.currentToken?.type === TokenType.OpenParen) {
                this.currentToken = this.lexer.dropToken();
                this.clist();
                this.currentToken = this.lexer.dropToken();
                if (
                    !this.currentToken ||
                    this.currentToken?.type === TokenType.CloseParen
                ) {
                    throw this.error('Expected ")"');
                }
            }
            return;
        }
        if (this.currentToken.type === TokenType.Number) {
            const value = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            return;
        }
        this.expr();
        while (
            [
                TokenType.MinusOperator,
                TokenType.PlusOperator,
                TokenType.MultiplyOperator,
                TokenType.DivideOperator,
                TokenType.ModulusOperator,
                TokenType.GreaterThanOperator,
                TokenType.LessThanOperator,
                TokenType.GreaterThanOrEqualOperator,
                TokenType.LessThanOrEqualOperator,
                TokenType.EqualOperator,
                TokenType.AndOperator,
                TokenType.OrOperator,
            ].includes(this.currentToken.type)
        ) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            if (!this.currentToken) {
                break;
            }
        }
        if (this.currentToken?.type === TokenType.StartArray) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.EndArray
            ) {
                throw this.error('Expected "]"');
            }
            this.currentToken = this.lexer.dropToken();
            return;
        }
        if (this.currentToken?.type === TokenType.TernaryIfOperator) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                throw this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            this.expr();
            return;
        }
    }

    public stmt(): parserReturnType {
        if (!this.currentToken) {
            return;
        }
        if (this.expr()) {
            if (this.currentToken.type !== TokenType.SemiColon) {
                throw this.error('Expected ";"');
            }
            return;
        }
        if (this.defvar()) {
            if (this.currentToken.type !== TokenType.SemiColon) {
                throw this.error('Expected ";"');
            }
            return;
        }
        if (this.currentToken.type === TokenType.If) {
            this.expr();
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                throw this.error('Expected ":"');
            }
            if (this.stmt()) {
                return;
            }
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Else
            ) {
                throw this.error('Expected "ifnot"');
            }
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                throw this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            if (this.stmt()) {
                this.stmt();
            }
        }
        if (this.currentToken?.type === TokenType.Loop) {
            this.expr();
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                throw this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            if (this.stmt()) {
                return;
            }
        }
        if (this.currentToken?.type === TokenType.For) {
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken?.type !== TokenType.Literal
            ) {
                throw this.error('Expected "identifier"');
            }
            const arrayValueIdentifier = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Comma
            ) {
                throw this.error('Expected ","');
            }
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken?.type !== TokenType.Literal
            ) {
                throw this.error('Expected "identifier"');
            }
            const arrayIndexIdentifier = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.ReverseArrow
            ) {
                throw this.error('Expected "<-"');
            }
            this.currentToken = this.lexer.dropToken();
            this.expr();
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                throw this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            if (this.stmt()) {
                return;
            }
        }
        if (this.currentToken?.type === TokenType.Return) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.SemiColon
            ) {
                throw this.error('Expected ";"');
            }
        }
        if (this.currentToken?.type === TokenType.StartBlock) {
            this.currentToken = this.lexer.dropToken();
            this.body();
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken?.type === TokenType.EndBlock
            ) {
                throw this.error('Expected "}"');
            }
            return;
        }
        this.func();
    }

    public body(): parserReturnType {
        if (!this.currentToken) {
            return;
        }
        this.stmt();
        this.body();
        throw this.error('Expected "}"');
    }

    public flist(): parserReturnType {
        if (!this.currentToken) {
            return null;
        }
        let isCommaNext = false;
        do {
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Literal
            ) {
                throw this.error('Expected "identifier"');
            }
            const identifier = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                throw this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            console.log(identifier, this.type());
            this.currentToken = this.lexer.dropToken();
            isCommaNext = this.currentToken?.type === TokenType.Comma;
            if (isCommaNext) {
                this.currentToken = this.lexer.dropToken();
            }
            if (!this.currentToken) {
                break;
            }
        } while (isCommaNext);
        return;
    }

    public func(): parserReturnType {
        if (this.currentToken?.type === TokenType.Function) {
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Literal
            ) {
                throw this.error('Expected "identifier"');
            }
            const funcName = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.OpenParen
            ) {
                throw this.error('Expected "("');
            }
            this.currentToken = this.lexer.dropToken();
            this.flist();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.CloseParen
            ) {
                throw this.error('Expected ")"');
            }
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Arrow
            ) {
                throw this.error('Expected "->"');
            }
            this.currentToken = this.lexer.dropToken();
            this.type();
            this.currentToken = this.lexer.dropToken();
            if (this.currentToken) {
                if (this.currentToken.type === TokenType.StartBlock) {
                    this.currentToken = this.lexer.dropToken();
                    this.body();
                    this.currentToken = this.lexer.dropToken();
                    if (
                        !this.currentToken ||
                        this.currentToken.type !== TokenType.EndBlock
                    ) {
                        throw this.error('Expected "}"');
                    }
                } else {
                    this.expr();
                }
            } else {
                throw this.error('Expected "{" or expression');
            }
        }
        return null;
    }

    public proc(): parserReturnType {
        if (!this.currentToken) {
            return null;
        }
        return this.func();
    }

    public run(): void {
        this.proc();
    }

    public error(message: string): string {
        return `${message} on ${this.lexer.line}:${
            this.lexer.column
        } current token: ${this.currentToken?.type || 'undefined'}`;
    }
}
