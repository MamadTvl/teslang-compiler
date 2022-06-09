import { TokenType } from '../types';

export class SymbolTable {
    private _root: SymbolTableNode | null;
    constructor(root: SymbolTableNode | null) {
        this._root = root;
    }

    public get root(): SymbolTableNode | null {
        return this._root;
    }

    public get(key: number): SymbolTableNode | null {
        let node = this._root;
        while (node) {
            if (node.scope === key) {
                return node;
            }
            if (node.scope > key) {
                node = node.left;
            } else {
                node = node.right;
            }
        }
        return null;
    }

    private checkForDuplicateFunctionName(
        node: SymbolTableNode,
        newData: SymbolTableNode['table'],
    ) {
        let thisNode: SymbolTableNode | null = node;
        while (thisNode && thisNode.scope <= node.scope) {
            for (const [name] of newData) {
                if (
                    thisNode.table.has(name) &&
                    thisNode.table.get(name)?.isFunction
                ) {
                    console.log(`Duplicate symbol name: ${name}`);
                }
            }
            thisNode = node.parent;
        }
    }

    private checkForDuplicateVariableName(
        node: SymbolTableNode,
        newData: SymbolTableNode['table'],
    ) {
        let thisNode: SymbolTableNode | null = node;
        while (thisNode && thisNode.scope <= node.scope) {
            for (const [name, value] of newData) {
                if (
                    thisNode.table.has(name) &&
                    !thisNode.table.get(name)?.isFunction
                ) {
                    console.log(`Duplicate symbol name: ${name}`);
                }
                // if (value.isFunction) {
                //     if (value.parameters)
                // }
            }
            thisNode = node.parent;
        }
    }

    public put(key: number, data: Map<string, SymbolValue>): void {
        let node = this._root;
        while (node) {
            if (node.scope === key) {
                node.table = new Map([...node.table, ...data]);
                return;
            }
            if (node.scope > key) {
                if (node.left) {
                    node = node.left;
                } else {
                    node.left = new SymbolTableNode(
                        key,
                        data,
                        node,
                        null,
                        null,
                    );
                    return;
                }
            } else {
                if (node.right) {
                    node = node.right;
                } else {
                    node.right = new SymbolTableNode(
                        key,
                        data,
                        node,
                        null,
                        null,
                    );
                    return;
                }
            }
        }
    }

    public remove(key: number): void {
        let node = this._root;
        while (node) {
            if (node.scope === key) {
                if (node.parent) {
                    if (node.parent.left === node) {
                        node.parent.left = null;
                    } else {
                        node.parent.right = null;
                    }
                } else {
                    this._root = null;
                }
                return;
            }
            if (node.scope > key) {
                node = node.left;
            } else {
                node = node.right;
            }
        }
    }
}

export class SymbolTableNode {
    constructor(
        public scope: number,
        public table: Map<string, SymbolValue>,
        public parent: SymbolTableNode | null,
        public left: SymbolTableNode | null,
        public right: SymbolTableNode | null,
    ) {
        this.scope = scope;
        this.table = table;
        this.parent = parent;
        this.left = left;
        this.right = right;
    }
}

export interface SymbolValue {
    isFunction: boolean;
    parametersCount: number;
    returnType?: TokenType.ArrayType | TokenType.NumericType | TokenType.None;
    parameters?: Array<
        TokenType.ArrayType | TokenType.NumericType | TokenType.None
    >;
}
