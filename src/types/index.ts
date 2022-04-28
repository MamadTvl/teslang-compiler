// export enum type {
//     numeric = 'numeric',
//     array = 'array',
//     none = 'none',
// }

// export enum token {
//     block_start = '{',
//     block_end = '}',
//     array_start = '[',
//     array_end = ']',
//     open_paren = '(',
//     close_paren = ')',
//     comma = ',',
//     colon = ':',
//     for = 'for',
//     loop = 'loop',
//     semi_colon = ';',
//     if = 'if',
//     else = 'ifnot',
//     return = 'return',
//     arrow = '->',
//     reverse_arrow = '<-',
//     plus = '+',
//     minus = '-',
//     multiply = '*',
//     divide = '/',
//     modulo = '%',
//     equal = '==',
//     not_equal = '!=',
//     greater_than = '>',
//     less_than = '<',
//     greater_than_or_equal = '>=',
//     less_than_or_equal = '<=',
//     and = 'and',
//     or = 'or',
//     not = '!',
//     true = 'true',
//     false = 'false',
//     equal_sign = '=',
//     numeric = 'numeric',
//     array = 'array',
//     none = 'none',
//     function = 'fc',
// }
export enum TokenType {
    VariableTypeDeclaration = 'VariableTypeDeclaration',
    AssignmentOperator = 'AssignmentOperator',
    Literal = 'Literal',
    Numeric = 'Numeric',
    Array = 'Array',
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
    Operator = 'Operator',
    Function = 'Function',
    Boolean = 'Boolean',
    String = 'String',
    Number = 'Number',
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
    | TokenNode<TokenType.Numeric>
    | TokenNode<TokenType.Array>
    | TokenNode<TokenType.None>
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
    | TokenNode<TokenType.Operator>
    | TokenNode<TokenType.Function>
    | TokenNode<TokenType.Boolean>;
