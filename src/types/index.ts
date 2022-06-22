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
export type exprResult =
    | TokenType.ArrayType
    | TokenType.NumericType
    | TokenType.None
    | undefined;
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
