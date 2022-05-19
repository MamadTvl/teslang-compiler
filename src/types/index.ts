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
    ArrayConstructor = 'ArrayConstructor',
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
    | TokenNode<TokenType.ArrayConstructor>
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
    | TokenNode<TokenType.Function>;
