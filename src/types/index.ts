import { Lexer } from '../service/lexer';

export enum TokenType {
    VariableTypeDeclaration = 'VariableTypeDeclaration',
    AssignmentOperator = 'AssignmentOperator',
    PlusOperator = 'PlusOperator',
    MinusOperator = 'MinusOperator',
    MultiplyOperator = 'MultiplyOperator',
    DivideOperator = 'DivideOperator',
    ModulusOperator = 'ModulusOperator',
    LessThanOperator = 'LessThanOperator',
    LessThanOrEqualOperator = 'LessThanOrEqualOperator',
    GreaterThanOperator = 'GreaterThanOperator',
    GreaterThanOrEqualOperator = 'GreaterThanOrEqualOperator',
    EqualOperator = 'EqualOperator',
    NotEqualOperator = 'NotEqualOperator',
    AndOperator = 'AndOperator',
    OrOperator = 'OrOperator',
    NotOperator = 'NotOperator',
    Literal = 'Literal',
    NumericType = 'NumericType',
    ArrayType = 'ArrayType',
    None = 'None',
    LineBreak = 'LineBreak',
    FunctionDeclaration = 'FunctionDeclaration',
    StartBlock = 'StartBlock',
    EndBlock = 'EndBlock',
    StartArray = 'StartArray',
    EndArray = 'EndArray',
    OpenParen = 'OpenParen',
    CloseParen = 'CloseParen',
    Comma = 'Comma',
    Colon = 'Colon',
    For = 'For',
    Loop = 'Loop',
    SemiColon = 'SemiColon',
    If = 'If',
    Else = 'Else',
    Return = 'Return',
    Arrow = 'Arrow',
    ReverseArrow = 'ReverseArrow',
    Function = 'Function',
    True = 'True',
    False = 'False',
    String = 'String',
    Number = 'Number',
    ArrayFunction = 'ArrayFunction',
    PrintFunction = 'PrintFunction',
    InputFunction = 'InputFunction',
    LengthFunction = 'LengthFunction',
    ExitFunction = 'ExitFunction',
    TernaryIfOperator = 'TernaryIfOperator',
    DefineVariableOperator = 'DefineVariableOperator',
}

export interface TokenNode<T extends TokenType> {
    type: T;
}

export interface TokenValueNode<T extends TokenType> extends TokenNode<T> {
    value: string;
}

export type Token =
    | TokenValueNode<TokenType.Literal>
    | TokenValueNode<TokenType.String>
    | TokenValueNode<TokenType.Number>
    | TokenNode<TokenType.AssignmentOperator>
    | TokenNode<TokenType.LineBreak>
    | TokenNode<TokenType.NumericType>
    | TokenNode<TokenType.ArrayType>
    | TokenNode<TokenType.None>
    | TokenNode<TokenType.ArrayFunction>
    | TokenNode<TokenType.VariableTypeDeclaration>
    | TokenNode<TokenType.FunctionDeclaration>
    | TokenNode<TokenType.StartBlock>
    | TokenNode<TokenType.EndBlock>
    | TokenNode<TokenType.StartArray>
    | TokenNode<TokenType.EndArray>
    | TokenNode<TokenType.OpenParen>
    | TokenNode<TokenType.CloseParen>
    | TokenNode<TokenType.Comma>
    | TokenNode<TokenType.Colon>
    | TokenNode<TokenType.For>
    | TokenNode<TokenType.Loop>
    | TokenNode<TokenType.SemiColon>
    | TokenNode<TokenType.If>
    | TokenNode<TokenType.Else>
    | TokenNode<TokenType.Return>
    | TokenNode<TokenType.Arrow>
    | TokenNode<TokenType.ReverseArrow>
    | TokenNode<TokenType.AssignmentOperator>
    | TokenNode<TokenType.PlusOperator>
    | TokenNode<TokenType.MinusOperator>
    | TokenNode<TokenType.MultiplyOperator>
    | TokenNode<TokenType.DivideOperator>
    | TokenNode<TokenType.ModulusOperator>
    | TokenNode<TokenType.LessThanOperator>
    | TokenNode<TokenType.LessThanOrEqualOperator>
    | TokenNode<TokenType.GreaterThanOperator>
    | TokenNode<TokenType.GreaterThanOrEqualOperator>
    | TokenNode<TokenType.EqualOperator>
    | TokenNode<TokenType.NotEqualOperator>
    | TokenNode<TokenType.AndOperator>
    | TokenNode<TokenType.OrOperator>
    | TokenNode<TokenType.NotOperator>
    | TokenNode<TokenType.True>
    | TokenNode<TokenType.False>
    | TokenNode<TokenType.Function>
    | TokenNode<TokenType.PrintFunction>
    | TokenNode<TokenType.InputFunction>
    | TokenNode<TokenType.ExitFunction>
    | TokenNode<TokenType.LengthFunction>
    | TokenNode<TokenType.TernaryIfOperator>
    | TokenNode<TokenType.DefineVariableOperator>;

export type TypeResult =
    | TokenType.NumericType
    | TokenType.ArrayType
    | TokenType.None
    | undefined;

export type clistResult = Type[];
export type defvarResult = boolean;
export interface exprResult {
    type: TypeResult;
    register: string | null;
}
export type stmtResult = boolean;
export type bodyResult = boolean;
export type flistResult = FunctionParameter[];
export type funcResult = boolean;
export type Type = TokenType.ArrayType | TokenType.NumericType | TokenType.None;

export interface SymbolNode {
    scope: string;
    isFunction: boolean;
    returnType?: Type;
    type?: TokenType.ArrayType | TokenType.NumericType | TokenType.None;
    parameters?: Array<FunctionParameter>;
    register?: string;
}

export interface SymbolTableInterface {
    symbols: Map<string, SymbolNode[]>;
    tables: Map<string, Map<string, SymbolNode[]>>;
    lexer: Lexer;

    insert(key: string, SymbolNode: SymbolNode, withError: boolean): boolean;

    lookup(
        key: string,
        scope: string,
        withError: boolean,
        isFunction: boolean,
        findNearestFunction: boolean,
    ): SymbolNode | null;

    remove(key: string, scope: string): boolean;

    error(message: string): void;
}

export interface FunctionParameter {
    type: TokenType.ArrayType | TokenType.NumericType | TokenType.None;
    name: string;
}

export type OperationType =
    | TokenType.GreaterThanOperator
    | TokenType.GreaterThanOrEqualOperator
    | TokenType.LessThanOperator
    | TokenType.LessThanOrEqualOperator
    | TokenType.EqualOperator
    | TokenType.PlusOperator
    | TokenType.MinusOperator
    | TokenType.DivideOperator
    | TokenType.MultiplyOperator
    | TokenType.ModulusOperator;
export interface IRInterface {
    byteCode: string[];
    LabelCounter: number;
    RegisterCounter: number;
    label(): string;
    const(num: number): string;
    name(variable: string): string;
    temp(): string;
    saveCode(): void;
    runCode(): void;
    assignment(r1: string, r2: string | number): void;
    operation(
        r1: string,
        r2: string | number,
        r3: string | number,
        type: OperationType,
    ): void;
    jump(label: string): void;
    if(r1: string, label: string): void;
    ifNot(r1: string, label: string): void;
    callFunction(name: string, args: Array<string>): void;
    defineFunction(name: string): void;
    defineArray(arrayRegister: string, sizeRegister: string): string;
    findArrayIndex(arrayRegister: string, indexRegister: string): string;
    storeInArray(arrayRegisterAddress: string, valueRegister: string): void;
    loadFromArray(arrayRegisterAddress: string): string;
    return(): void;
    setRegisterCounter(number: number): void;
    // todo: define array, store and load
}
