import {
    bodyResult,
    clistResult,
    defvarResult,
    exprResult,
    flistResult,
    funcResult,
    FunctionParameter,
    stmtResult,
    SymbolNode,
    Token,
    TokenType,
    TypeResult,
} from '../types';
import { ParserError } from './error';
import { Lexer } from './lexer';
import { SymbolTable } from './symbol-table';

type parserReturnType = Token | boolean;

export class Parser {
    private currentToken: Token | undefined;
    private currentScope = 0;
    private currentFunction = '';
    private lexer: Lexer;
    private parserError;
    private panicking = false;
    private synchronizingSet: Array<TokenType> = [
        TokenType.SemiColon,
        // TokenType.AssignmentOperator,
        // TokenType.EndBlock,
        // TokenType.CloseParen,
    ];

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

    private getScope(functionName?: string, scope?: number): string {
        return `${functionName || this.currentFunction}-${
            scope || this.currentScope
        }`;
    }

    private checkFunctionInputParams(
        funcName: string,
        func: SymbolNode,
        inputParams: Type[],
    ): void {
        const expectedParams = func.parameters as FunctionParameter[];
        if (expectedParams.length !== inputParams.length) {
            this.symbolTable.error(
                `expected ${expectedParams.length} input parameters but got ${inputParams.length} for function ${funcName}`,
            );
            return;
        }
        for (let i = 0; i < expectedParams.length; i++) {
            if (expectedParams[i].type !== inputParams[i]) {
                this.symbolTable.error(
                    `expected ${expectedParams[i].type} but got ${
                        inputParams[i] || 'undefined'
                    } for function ${funcName}`,
                );
            }
        }
    }

    public type(): TypeResult {
        if (!this.currentToken) {
            return undefined;
        }
        if (
            this.currentToken.type === TokenType.ArrayType ||
            this.currentToken.type === TokenType.NumericType ||
            this.currentToken.type === TokenType.None
        ) {
            return this.currentToken.type;
        } else {
            this.error('Expected correct type');
            return undefined;
        }
    }

    public clist(): clistResult {
        if (!this.currentToken) {
            return [];
        }
        const args: Type[] = [];
        const result = this.expr();

        if (!result) {
            this.symbolTable.error(
                'expected numeric or array or none type here',
            );
        }
        result && args.push(result);

        if (this.currentToken?.type === TokenType.Comma) {
            this.currentToken = this.lexer.dropToken();
            const thisArgs = this.clist();
            args.push(...thisArgs);
        }
        return args;
    }

    public defvar(): defvarResult {
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
                this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            const identifierType = this.type();
            this.currentToken = this.lexer.dropToken();
            if (this.currentToken?.type === TokenType.AssignmentOperator) {
                this.currentToken = this.lexer.dropToken();
                const assignmentType = this.expr();
                if (identifierType !== assignmentType) {
                    this.symbolTable.error(
                        `cannot assign ${assignmentType} to ${identifierType}`,
                    );
                }
            }
            if (identifierType) {
                this.symbolTable.insert(identifier, {
                    isFunction: false,
                    scope: this.getScope(),
                    type: identifierType,
                });
            }
            return true;
        }
        return false;
    }

    public expr(): exprResult {
        if (!this.currentToken) {
            return undefined;
        }
        if (this.currentToken.type === TokenType.NotOperator) {
            this.currentToken = this.lexer.dropToken();
            return this.expr();
        }
        if (this.currentToken.type === TokenType.PlusOperator) {
            this.currentToken = this.lexer.dropToken();
            return this.expr();
        }
        if (this.currentToken.type === TokenType.MinusOperator) {
            this.currentToken = this.lexer.dropToken();
            return this.expr();
        }

        if (this.currentToken.type === TokenType.StartArray) {
            this.currentToken = this.lexer.dropToken();
            this.clist();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.EndArray
            ) {
                this.error('Expected "]"');
            }
            this.currentToken = this.lexer.dropToken();
            return TokenType.ArrayType;
        }

        if (this.currentToken.type === TokenType.Literal) {
            const literalValue = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            if (this.currentToken?.type === TokenType.AssignmentOperator) {
                const identifier = this.symbolTable.lookup(
                    literalValue,
                    this.getScope(),
                    true,
                );
                this.currentToken = this.lexer.dropToken();
                // const symbol = this.symbolTable.get(this.currentScope);
                const result = this.expr();
                if (identifier?.type !== result) {
                    this.symbolTable.error(
                        `Cannot Assign ${result} to ${identifier?.type}`,
                    );
                }
                return result;
            }
            if (this.currentToken?.type === TokenType.OpenParen) {
                const func = this.symbolTable.lookup(
                    literalValue,
                    this.getScope(),
                    true,
                    true,
                );
                this.currentToken = this.lexer.dropToken();
                const inputParams = this.clist();

                if (this.currentToken?.type !== TokenType.CloseParen) {
                    this.currentToken = this.lexer.dropToken();
                }
                if (
                    !this.currentToken ||
                    this.currentToken?.type !== TokenType.CloseParen
                ) {
                    this.error('Expected ")"');
                }
                func &&
                    this.checkFunctionInputParams(
                        literalValue,
                        func,
                        inputParams,
                    );
                this.currentToken = this.lexer.dropToken();
                return func?.returnType || undefined;
            }
            const identifier = this.symbolTable.lookup(
                literalValue,
                this.getScope(),
                true,
            );
            if (this.currentToken?.type === TokenType.StartArray) {
                this.currentToken = this.lexer.dropToken();
                if (identifier?.type !== TokenType.ArrayType) {
                    this.symbolTable.error(
                        `${identifier} must be typeof Array`,
                    );
                }
                const type = this.expr();
                if (type !== TokenType.NumericType) {
                    this.symbolTable.error(
                        'index of array must be typeof numeric',
                    );
                }
                if (
                    !this.currentToken ||
                    this.currentToken?.type !== TokenType.EndArray
                ) {
                    this.error('Expected "]"');
                }
                this.currentToken = this.lexer.dropToken();
                if (this.currentToken?.type === TokenType.AssignmentOperator) {
                    this.currentToken = this.lexer.dropToken();
                    const assignmentType = this.expr();
                    if (assignmentType !== TokenType.NumericType) {
                        this.symbolTable.error(
                            `cannot assign ${assignmentType} to ${TokenType.NumericType}`,
                        );
                    }
                    return TokenType.NumericType;
                }
                return this.expr() || TokenType.NumericType;
            }

            return this.expr() || identifier?.type;
        }
        if (this.currentToken.type === TokenType.Number) {
            const value = this.currentToken.value;

            this.currentToken = this.lexer.dropToken();
            if (
                this.currentToken &&
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
                return this.expr();
            }

            return TokenType.NumericType;
        }

        let jobIsDone = false;
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
            // result must be numeric
            this.expr();
            jobIsDone = true;
            if (!this.currentToken) {
                break;
            }
        }
        // if (this.currentToken?.type === TokenType.StartArray) {
        //     this.currentToken = this.lexer.dropToken();
        //     this.expr();
        //     // this.currentToken = this.lexer.dropToken();
        //     if (
        //         !this.currentToken ||
        //         this.currentToken.type !== TokenType.EndArray
        //     ) {
        //         this.error('Expected "]"');
        //     }
        //     this.currentToken = this.lexer.dropToken();
        //     return true;
        // }

        if (this.currentToken?.type === TokenType.TernaryIfOperator) {
            this.currentToken = this.lexer.dropToken();
            const firstType = this.expr();
            // this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            const secondType = this.expr();
            return firstType || secondType;
        }
        return jobIsDone ? TokenType.NumericType : undefined;
    }

    public stmt(): stmtResult {
        if (!this.currentToken) {
            return false;
        }

        if (this.expr()) {
            if (this.currentToken.type !== TokenType.SemiColon) {
                this.error('Expected ";"');
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
                this.error('Expected ";"');
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
                this.error('Expected ":"');
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
                this.error('Expected "ifnot"');
            }
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                this.error('Expected ":"');
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
                this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            return this.stmt();
        }
        if (this.currentToken?.type === TokenType.For) {
            let arrayItemIdentifier: string | undefined;
            let arrayIndexIdentifier: string | undefined;
            let arrayIdentifier: string | undefined;
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken?.type !== TokenType.Literal
            ) {
                this.error('Expected "identifier"');
            } else {
                arrayItemIdentifier = this.currentToken.value;
            }

            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Comma
            ) {
                this.error('Expected ","');
            }
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken?.type !== TokenType.Literal
            ) {
                this.error('Expected "identifier"');
            } else {
                arrayIndexIdentifier = this.currentToken.value;
            }
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.ReverseArrow
            ) {
                this.error('Expected "<-"');
            }
            this.currentToken = this.lexer.dropToken();
            if (
                this.currentToken &&
                this.currentToken.type === TokenType.Literal
            ) {
                arrayIdentifier = this.currentToken.value;
            }
            arrayItemIdentifier &&
                this.symbolTable.insert(arrayItemIdentifier, {
                    isFunction: false,
                    type: TokenType.NumericType,
                    scope: this.getScope(undefined, this.currentScope + 1),
                });
            arrayIndexIdentifier &&
                this.symbolTable.insert(arrayIndexIdentifier, {
                    isFunction: false,
                    type: TokenType.NumericType,
                    scope: this.getScope(undefined, this.currentScope + 1),
                });
            if (arrayIdentifier) {
                // check if the array is defined
                this.symbolTable.lookup(
                    arrayIdentifier,
                    this.getScope(undefined, this.currentScope + 1),
                    true,
                );
            }
            this.expr();
            // this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            return this.stmt();
        }
        if (this.currentToken?.type === TokenType.Return) {
            this.currentToken = this.lexer.dropToken();
            const returnType = this.expr();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.SemiColon
            ) {
                this.error('Expected ";"');
            }
            const currentFunctionSymbol = this.symbolTable.lookup(
                this.currentFunction,
                this.getScope(),
                false,
                true,
                true,
            );
            // this.lexer.debug(currentFunctionSymbol, this.getScope());
            if (currentFunctionSymbol?.returnType !== returnType) {
                this.symbolTable.error(
                    `returning value from wrong type (${returnType}) from function ${this.currentFunction} [excepted ${currentFunctionSymbol?.returnType}]`,
                );
            }
            this.currentToken = this.lexer.dropToken();

            return true;
        }
        if (this.currentToken?.type === TokenType.StartBlock) {
            this.currentScope++;
            this.currentToken = this.lexer.dropToken();
            this.body();
            // this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken?.type !== TokenType.EndBlock
            ) {
                this.error('Expected "}"');
            }
            this.currentToken = this.lexer.dropToken();
            this.currentScope--;
            return true;
        }
        return this.func();
    }

    public body(): bodyResult {
        if (!this.currentToken) {
            return false;
        }
        while (this.stmt()) {
            this.body();
        }
        return true;
    }

    public flist(): flistResult {
        if (!this.currentToken) {
            return [];
        }
        let isCommaNext = false;
        const args: Array<FunctionParameter> = [];
        do {
            let identifier = '';
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Literal
            ) {
                this.error('Expected "identifier"');
            } else {
                identifier = this.currentToken.value;
            }
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                this.error('Expected ":"');
            }
            this.currentToken = this.lexer.dropToken();
            args.push({
                name: identifier,
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

    public func(): funcResult {
        if (this.currentToken?.type === TokenType.Function) {
            let funcName = '';
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Literal
            ) {
                this.error('Expected "identifier"');
            } else {
                funcName = this.currentToken.value;
            }
            this.currentFunction = funcName;
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.OpenParen
            ) {
                this.error('Expected "("');
            }
            this.currentToken = this.lexer.dropToken();
            let args: flistResult = [];
            if (this.currentToken?.type !== TokenType.CloseParen) {
                args = this.flist();
            }
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.CloseParen
            ) {
                this.error('Expected ")"');
            }
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Arrow
            ) {
                this.error('Expected "->"');
            }
            this.currentToken = this.lexer.dropToken();
            const returnType = this.type();
            this.currentToken = this.lexer.dropToken();
            if (
                !this.currentToken ||
                this.currentToken.type !== TokenType.Colon
            ) {
                this.error('Expected ":"');
            }
            this.symbolTable.insert(funcName, {
                isFunction: true,
                scope: this.getScope(),
                returnType: returnType,
                parameters: args,
            });
            for (const arg of args) {
                this.symbolTable.insert(arg.name, {
                    isFunction: false,
                    scope: this.getScope(undefined, this.currentScope + 1),
                    type: arg.type,
                });
            }
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
                        this.error('Expected "}"');
                    }
                    this.currentToken = this.lexer.dropToken();
                    return true;
                } else {
                    this.expr();
                    return true;
                }
            } else {
                this.error('Expected "{" or expression');
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

    public error(message: string): void {
        let currentToken: TokenType | string | undefined =
            this.currentToken?.type;
        if (currentToken && this.currentToken?.type === TokenType.Literal) {
            currentToken = '"' + this.currentToken.value + '"';
        }
        console.log(
            `Syntax Error: ${message} but got ${
                currentToken || 'undefined'
            } on ${this.lexer.line}:${this.lexer.column} `,
        );
        this.panicking = true;
        while (
            this.currentToken &&
            !this.synchronizingSet.includes(this.currentToken.type)
        ) {
            this.currentToken = this.lexer.dropToken();
        }
    }
}

type Type = TokenType.None | TokenType.ArrayType | TokenType.NumericType;
