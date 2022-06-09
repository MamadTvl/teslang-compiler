import { Token, TokenType } from '../types';
import { ParserError } from './error';
import { Lexer } from './lexer';
import { SymbolTable, SymbolValue } from './symbol-table';
type parserReturnType = Token | boolean;
export class Parser {
    private currentToken: Token | undefined;
    private currentScope = 0;
    private lexer: Lexer;
    private parserError;
    constructor(
        currentToken: Token | undefined,
        lexer: Lexer,
        private symbolTable: SymbolTable,
    ) {
        this.currentToken = currentToken;
        this.lexer = lexer;
        this.symbolTable = symbolTable;
        this.parserError = new ParserError(lexer);
    }

    public type(): Type | boolean {
        if (!this.currentToken) {
            return false;
        }
        if (
            this.currentToken.type === TokenType.ArrayType ||
            this.currentToken.type === TokenType.NumericType ||
            this.currentToken.type === TokenType.None
        ) {
            return this.currentToken.type;
        } else {
            throw this.error('Expected correct type');
        }
    }

    public clist(): parserReturnType {
        if (!this.currentToken) {
            return false;
        }
        this.expr();
        // this.currentToken = this.lexer.dropToken();
        if (this.currentToken?.type === TokenType.Comma) {
            this.currentToken = this.lexer.dropToken();
            this.clist();
        }
        return true;
    }

    public defvar(): parserReturnType {
        if (!this.currentToken) {
            return false;
        }
        if (this.currentToken.type === TokenType.Literal) {
            const identifier = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                throw this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            const type = this.type() as Type;
            this.currentToken = this.lexer.dropToken();
            if (this.currentToken?.type === TokenType.AssignmentOperator) {
                this.currentToken = this.lexer.dropToken();
                this.expr();
            }
            this.symbolTable.put(
                this.currentScope,
                new Map<string, SymbolValue>().set(identifier, {
                    isFunction: false,
                    parametersCount: -1,
                    returnType: type,
                }),
            );
            return true;
        }
        return false;
    }

    public expr(): parserReturnType {
        if (!this.currentToken) {
            return false;
        }
        if (this.currentToken.type === TokenType.NotOperator) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            return true;
        }
        if (this.currentToken.type === TokenType.PlusOperator) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            return true;
        }
        if (this.currentToken.type === TokenType.MinusOperator) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            return true;
        }

        if (this.currentToken.type === TokenType.StartArray) {
            this.currentToken = this.lexer.dropToken();
            this.clist();
            // this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.EndArray
            ) {
                throw this.error('Expected "]"');
            }
            this.currentToken = this.lexer.dropToken();
            return true;
        }

        if (this.currentToken.type === TokenType.Literal) {
            const literalValue = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            if (this.currentToken?.type === TokenType.AssignmentOperator) {
                this.currentToken = this.lexer.dropToken();
                const symbol = this.symbolTable.get(this.currentScope);
                return this.expr();
            }
            if (this.currentToken?.type === TokenType.OpenParen) {
                this.currentToken = this.lexer.dropToken();
                this.clist();
                this.currentToken = this.lexer.dropToken();
                if (
                    !this.currentToken ||
                    this.currentToken?.type !== TokenType.CloseParen
                ) {
                    throw this.error('Expected ")"');
                }
            }
            return this.expr();
        }
        if (this.currentToken.type === TokenType.Number) {
            const value = this.currentToken.value;
            console.log(value);

            this.currentToken = this.lexer.dropToken();
            return true;
        }
        let jobIsDone = false;
        this.lexer.debug(
            this.currentToken.type === TokenType.AssignmentOperator,
        );
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
                TokenType.AssignmentOperator,
                TokenType.AndOperator,
                TokenType.OrOperator,
            ].includes(this.currentToken.type)
        ) {
            this.lexer.debug(this.currentToken.type);
            this.currentToken = this.lexer.dropToken();
            this.expr();
            jobIsDone = true;
            if (!this.currentToken) {
                break;
            }
        }
        if (this.currentToken?.type === TokenType.StartArray) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            // this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.EndArray
            ) {
                throw this.error('Expected "]"');
            }
            this.currentToken = this.lexer.dropToken();
            return true;
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
            return true;
        }
        return jobIsDone || false;
    }

    public stmt(): parserReturnType {
        if (!this.currentToken) {
            return false;
        }
        // what we do when we have a literal
        if (this.expr()) {
            if (this.currentToken.type !== TokenType.SemiColon) {
                throw this.error('Expected ";"');
            }
            this.currentToken = this.lexer.dropToken();
            return true;
        }
        if (this.currentToken.type === TokenType.DefineVariableOperator) {
            this.currentToken = this.lexer.dropToken();
            this.defvar();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.SemiColon
            ) {
                throw this.error('Expected ";"');
            }
            this.currentToken = this.lexer.dropToken();
            return true;
        }
        if (this.currentToken.type === TokenType.If) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            // this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                throw this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            if (this.stmt()) {
                return true;
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
            this.stmt();
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
            return this.stmt();
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
            // this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                throw this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            return this.stmt();
        }
        if (this.currentToken?.type === TokenType.Return) {
            this.currentToken = this.lexer.dropToken();
            this.expr();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.SemiColon
            ) {
                throw this.error('Expected ";"');
            }
            this.currentToken = this.lexer.dropToken();
            return true;
        }
        if (this.currentToken?.type === TokenType.StartBlock) {
            this.currentToken = this.lexer.dropToken();
            this.body();
            // this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken?.type !== TokenType.EndBlock
            ) {
                throw this.error('Expected "}"');
            }
            this.currentToken = this.lexer.dropToken();
            return true;
        }
        return this.func();
    }

    public body(): parserReturnType {
        if (!this.currentToken) {
            return false;
        }
        while (this.stmt()) {
            this.body();
        }
        return true;
    }

    public flist(): parserReturnType | Array<FunctionArg> {
        if (!this.currentToken) {
            return false;
        }
        let isCommaNext = false;
        const args: Array<FunctionArg> = [];
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
            args.push({
                identifier,
                type: this.type() as Type,
            });
            this.currentToken = this.lexer.dropToken();
            isCommaNext = this.currentToken?.type === TokenType.Comma;
            if (isCommaNext) {
                this.currentToken = this.lexer.dropToken();
            }
            if (!this.currentToken) {
                break;
            }
        } while (isCommaNext);
        return args;
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
            let args: FunctionArg[] = [];
            if (this.currentToken?.type !== TokenType.CloseParen) {
                args = this.flist() as FunctionArg[];
            }
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
            const returnType = this.type();
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                throw this.error('Expected ":"');
            }
            this.symbolTable.put(
                this.currentScope,
                new Map<string, SymbolValue>().set(funcName, {
                    parametersCount: args.length,
                    isFunction: true,
                    parameters: args.map((arg) => arg.type),
                    returnType: returnType as Type,
                }),
            );

            this.currentToken = this.lexer.dropToken();
            if (this.currentToken) {
                if (this.currentToken.type === TokenType.StartBlock) {
                    this.currentToken = this.lexer.dropToken();
                    this.currentScope++;
                    this.body();
                    // this.currentToken = this.lexer.dropToken();
                    if (
                        !this.currentToken ||
                        this.currentToken.type !== TokenType.EndBlock
                    ) {
                        throw this.error('Expected "}"');
                    }
                    this.currentToken = this.lexer.dropToken();
                    return true;
                } else {
                    return this.expr();
                }
            } else {
                throw this.error('Expected "{" or expression');
            }
        }
        return false;
    }

    public proc(): parserReturnType {
        if (!this.currentToken) {
            return false;
        }
        return this.func();
    }

    public run(): void {
        while (this.currentToken) {
            this.currentScope = 0;
            this.proc();
        }
    }

    public error(message: string): string {
        return `${message} on ${this.lexer.line}:${
            this.lexer.column
        } current token: ${this.currentToken?.type || 'undefined'}`;
    }
}

interface FunctionArg {
    identifier: string;
    type: Type;
}

type Type = TokenType.None | TokenType.ArrayType | TokenType.NumericType;
