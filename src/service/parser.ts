import {
    bodyResult,
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
import { IR } from './IR';
import { Lexer } from './lexer';
import { SymbolTable } from './symbol-table';
import fs from 'fs';

type parserReturnType = Token | boolean;

export class Parser {
    private currentToken: Token | undefined;
    private currentScope = 0;
    private currentFunction = '';
    private currentRegister: string | null = null;
    private lexer: Lexer;
    private parserError;
    private panicking = false;
    private ir: IR = new IR();
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
    // todo: clistResult must change -> f(1,2)  or [1,2]
    public clist(): exprResult[] {
        if (!this.currentToken) {
            return [];
        }
        const args: exprResult[] = [];
        const result = this.expr();

        if (!result?.type && this.currentToken?.type === TokenType.Comma) {
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
            const identifierRegister = this.ir.name(identifier);
            if (identifierType) {
                this.symbolTable.insert(identifier, {
                    isFunction: false,
                    scope: this.getScope(),
                    type: identifierType,
                    register: identifierRegister,
                });
            }
            if (this.currentToken?.type === TokenType.AssignmentOperator) {
                this.currentToken = this.lexer.dropToken();
                const exprResult = this.expr();
                exprResult?.register &&
                    this.ir.assignment(
                        identifierRegister,
                        exprResult?.register,
                    );
                if (identifierType !== exprResult?.type) {
                    this.symbolTable.error(
                        `cannot assign ${exprResult?.type} to ${identifierType}`,
                    );
                }
            }
            return true;
        }
        return false;
    }

    public multiplyExpr(): exprResult | undefined {
        if (!this.currentToken) {
            return undefined;
        }
        const first = this.NumericExpr();
        if (!first) {
            return undefined;
        }
        let resultRegister = first?.register;
        // this.currentToken = this.lexer.dropToken();
        while (
            this.currentToken?.type === TokenType.MultiplyOperator ||
            this.currentToken?.type === TokenType.DivideOperator
        ) {
            const operationType = this.currentToken.type;
            this.currentToken = this.lexer.dropToken();
            const second = this.NumericExpr();
            const secondRegister = second?.register;
            const tempRegister = this.ir.temp();
            resultRegister &&
                secondRegister &&
                this.ir.operation(
                    tempRegister,
                    resultRegister,
                    secondRegister,
                    operationType,
                );
            resultRegister = tempRegister;
        }
        return {
            type: TokenType.NumericType,
            register: resultRegister || null,
        };
    }

    public NumericExpr(): exprResult | undefined {
        if (!this.currentToken) {
            return undefined;
        }
        if (this.currentToken.type === TokenType.OpenParen) {
            this.currentToken = this.lexer.dropToken();
            const expr = this.expr();
            if (this.currentToken?.type !== TokenType.CloseParen) {
                this.error('Expected ")"');
            }
            this.currentToken = this.lexer.dropToken();
            return expr;
        }
        if (this.currentToken.type === TokenType.Number) {
            const value = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            return {
                type: TokenType.NumericType,
                register: this.ir.const(+value),
            };
        }
        return undefined;
    }

    public multiplyLiteralExpr(): exprResult | undefined {
        if (!this.currentToken) {
            return undefined;
        }
        const first = this.literalExpr();
        if (!first) {
            return undefined;
        }
        let resultRegister = first?.register;
        // this.currentToken = this.lexer.dropToken();
        while (
            this.currentToken?.type === TokenType.MultiplyOperator ||
            this.currentToken?.type === TokenType.DivideOperator
        ) {
            const operationType = this.currentToken.type;
            this.currentToken = this.lexer.dropToken();
            const second = this.literalExpr();
            const secondRegister = second?.register;
            const tempRegister = this.ir.temp();
            resultRegister &&
                secondRegister &&
                this.ir.operation(
                    tempRegister,
                    resultRegister,
                    secondRegister,
                    operationType,
                );
            resultRegister = tempRegister;
        }
        return {
            type: TokenType.NumericType,
            register: resultRegister,
        };
    }

    public literalExpr(): exprResult | undefined {
        if (!this.currentToken) {
            return undefined;
        }
        if (this.currentToken.type === TokenType.OpenParen) {
            this.currentToken = this.lexer.dropToken();
            const expr = this.expr();
            if (this.currentToken?.type !== TokenType.CloseParen) {
                this.error('Expected ")"');
            }
            this.currentToken = this.lexer.dropToken();
            return expr;
        }
        if (this.currentToken.type === TokenType.Number) {
            const value = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            return {
                type: TokenType.NumericType,
                register: this.ir.const(+value),
            };
        }
        if (this.currentToken.type === TokenType.Literal) {
            const name = this.currentToken.value;
            this.currentToken = this.lexer.dropToken();
            const identifier = this.symbolTable.lookup(
                name,
                this.getScope(),
                true,
            );
            return {
                type: identifier?.type,
                register: identifier?.register || null,
            };
        }
        return undefined;
    }

    public addLiteralExpr(): exprResult | undefined {
        if (!this.currentToken) {
            return undefined;
        }
        const first = this.multiplyLiteralExpr();
        if (!first) {
            return undefined;
        }
        let resultRegister = first?.register;
        // this.currentToken = this.lexer.dropToken();
        while (
            this.currentToken?.type === TokenType.PlusOperator ||
            this.currentToken?.type === TokenType.MinusOperator
        ) {
            const operationType = this.currentToken.type;
            this.currentToken = this.lexer.dropToken();
            const second = this.multiplyLiteralExpr();
            const secondRegister = second?.register;
            const tempRegister = this.ir.temp();
            resultRegister &&
                secondRegister &&
                this.ir.operation(
                    tempRegister,
                    resultRegister,
                    secondRegister,
                    operationType,
                );
            resultRegister = tempRegister;
        }
        return {
            type: TokenType.NumericType,
            register: resultRegister,
        };
    }

    public expr(): exprResult | undefined {
        if (!this.currentToken) {
            return undefined;
        }
        switch (this.currentToken.type) {
            case TokenType.NotOperator:
                this.currentToken = this.lexer.dropToken();
                return this.expr();
            // todo: do something about it
            // case TokenType.PlusOperator:
            //     this.lexer.debug();
            //     this.currentToken = this.lexer.dropToken();
            //     return this.expr();
            // // todo: do something about it
            // case TokenType.MinusOperator:
            //     this.currentToken = this.lexer.dropToken();
            //     return this.expr();
            //todo: clist related [1,2]
            case TokenType.StartArray:
                this.currentToken = this.lexer.dropToken();
                const elements = this.clist();
                const arrayLengthRegister = this.ir.const(elements.length);
                const arrayRegister = this.ir.defineArray(arrayLengthRegister);
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    if (element.type !== TokenType.NumericType) {
                        this.symbolTable.error(
                            `Expected numeric type but got ${element.type}`,
                        );
                    }
                    if (!element.register) {
                        this.symbolTable.error(
                            `Expected number but got undefined`,
                        );
                    }
                    const indexRegister = this.ir.const(i);
                    const indexAddressRegister = this.ir.findArrayIndex(
                        arrayRegister,
                        indexRegister,
                    );
                    this.ir.storeInArray(
                        indexAddressRegister,
                        element.register || '',
                    );
                }
                if (
                    !this.currentToken ||
                    this.currentToken.type !== TokenType.EndArray
                ) {
                    this.error('Expected "]"');
                }
                this.currentToken = this.lexer.dropToken();
                return {
                    type: TokenType.ArrayType,
                    register: arrayRegister,
                };
            case TokenType.Literal:
                const literalToken = this.currentToken;
                const literalValue = this.currentToken.value;
                this.currentToken = this.lexer.dropToken();
                if (this.currentToken?.type === TokenType.AssignmentOperator) {
                    const identifier = this.symbolTable.lookup(
                        literalValue,
                        this.getScope(),
                        true,
                    );
                    this.currentToken = this.lexer.dropToken();
                    const result = this.expr();
                    identifier?.register &&
                        result?.register &&
                        this.ir.assignment(
                            identifier?.register,
                            result?.register,
                        );
                    if (identifier?.type !== result?.type) {
                        this.symbolTable.error(
                            `Cannot assign ${result} to ${identifier?.type}`,
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
                            inputParams.map(
                                (item) => item.type || TokenType.None,
                            ),
                        );
                    let returnRegister = null;
                    if (literalValue === 'Array') {
                        const sizeRegister = inputParams[0].register || '';
                        returnRegister = this.ir.defineArray(sizeRegister);
                    } else if (literalValue === 'input') {
                        returnRegister = this.ir.temp();
                        this.ir.getInput(returnRegister);
                    } else {
                        this.ir.callFunction(
                            literalValue,
                            inputParams.map((param) => param.register || ''),
                        );
                        returnRegister = inputParams[0].register;
                    }
                    this.currentToken = this.lexer.dropToken();
                    return {
                        type: func?.returnType || undefined,
                        register: returnRegister,
                    };
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
                    const arrayIndex = this.expr();
                    if (arrayIndex?.type !== TokenType.NumericType) {
                        this.symbolTable.error(
                            'index of array must be typeof numeric',
                        );
                    }
                    const indexAddressRegister = this.ir.findArrayIndex(
                        identifier?.register || '',
                        arrayIndex?.register || '',
                    );
                    if (
                        !this.currentToken ||
                        this.currentToken?.type !== TokenType.EndArray
                    ) {
                        this.error('Expected "]"');
                    }
                    this.currentToken = this.lexer.dropToken();
                    if (
                        this.currentToken?.type === TokenType.AssignmentOperator
                    ) {
                        this.currentToken = this.lexer.dropToken();
                        const result = this.expr();
                        this.ir.storeInArray(
                            indexAddressRegister,
                            result?.register || '',
                        );
                        if (result?.type !== TokenType.NumericType) {
                            this.symbolTable.error(
                                `cannot assign ${result?.type} to ${TokenType.NumericType}`,
                            );
                        }
                        return result;
                    }

                    return (
                        this.expr() || {
                            type: TokenType.NumericType,
                            register:
                                this.ir.loadFromArray(indexAddressRegister),
                        }
                    );
                }
                this.currentToken && this.lexer.getBackToken(this.currentToken);
                this.currentToken = literalToken;

                return (
                    this.addLiteralExpr() || {
                        type: identifier?.type,
                        register: identifier?.register || null,
                    }
                );
            case TokenType.TernaryIfOperator:
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
        const first = this.multiplyExpr();
        if (!first) {
            return undefined;
        }
        let resultRegister = first?.register;
        // this.currentToken = this.lexer.dropToken();
        while (
            this.currentToken?.type === TokenType.PlusOperator ||
            this.currentToken?.type === TokenType.MinusOperator
        ) {
            const operationType = this.currentToken.type;
            this.currentToken = this.lexer.dropToken();
            const second = this.multiplyExpr();
            const secondRegister = second?.register;
            const tempRegister = this.ir.temp();
            resultRegister &&
                secondRegister &&
                this.ir.operation(
                    tempRegister,
                    resultRegister,
                    secondRegister,
                    operationType,
                );
            resultRegister = tempRegister;
        }
        return {
            type: TokenType.NumericType,
            register: resultRegister,
        };
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
                    register: 'null',
                });
            arrayIndexIdentifier &&
                this.symbolTable.insert(arrayIndexIdentifier, {
                    isFunction: false,
                    type: TokenType.NumericType,
                    scope: this.getScope(undefined, this.currentScope + 1),
                    register: 'null',
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
            const returnResult = this.expr();
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
            if (currentFunctionSymbol?.returnType !== returnResult?.type) {
                this.symbolTable.error(
                    `returning value from wrong type (${returnResult?.type}) from function ${this.currentFunction} [excepted ${currentFunctionSymbol?.returnType}]`,
                );
            }
            this.currentToken = this.lexer.dropToken();
            this.ir.assignment('r0', returnResult?.register || '');
            this.ir.return();
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
            this.ir.setRegisterCounter(0);
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
            this.ir.defineFunction(funcName);
            for (const arg of args) {
                this.symbolTable.insert(arg.name, {
                    isFunction: false,
                    scope: this.getScope(undefined, this.currentScope + 1),
                    type: arg.type,
                    register: this.ir.name(arg.name),
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
            this.print();
        }
    }

    public print() {
        fs.writeFileSync('./test/2-byte.tes', '');
        for (const code of this.ir.byteCode) {
            fs.appendFileSync('./test/2-byte.tes', `${code}\n`);
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
