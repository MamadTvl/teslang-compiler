import { TokenType } from '../types';

export class SymbolTable {
    private _root: SymbolTableNode | null;
    constructor(root: SymbolTableNode) {
        this._root = root;
    }

    public get root(): SymbolTableNode | null {
        return this._root;
    }

    public get(key: SymbolKey): SymbolTableNode | null {
        let node = this._root;
        while (node) {
            if (node.key.code === key.code) {
                return node;
            }
            if (node.key.code > key.code) {
                node = node.left;
            } else {
                node = node.right;
            }
        }
        return null;
    }

    public put(key: SymbolKey, value: any): void {
        let node = this._root;
        while (node) {
            if (node.key.code === key.code) {
                node.value = value;
                return;
            }
            if (node.key.code > key.code) {
                if (node.left) {
                    node = node.left;
                } else {
                    node.left = new SymbolTableNode(key, value, node);
                    return;
                }
            } else {
                if (node.right) {
                    node = node.right;
                } else {
                    node.right = new SymbolTableNode(key, value, node);
                    return;
                }
            }
        }
    }

    public remove(key: SymbolKey): void {
        let node = this._root;
        while (node) {
            if (node.key.code === key.code) {
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
            if (node.key.code > key.code) {
                node = node.left;
            } else {
                node = node.right;
            }
        }
    }
}

export class SymbolTableNode {
    public key: SymbolKey;
    public value: SymbolValue | null;
    public parent: SymbolTableNode;
    public left: SymbolTableNode | null;
    public right: SymbolTableNode | null;
    constructor(
        key: SymbolKey,
        value: SymbolValue | null,
        parent: SymbolTableNode,
    ) {
        this.key = key;
        this.value = value;
        this.parent = parent;
        this.left = null;
        this.right = null;
    }
}

export interface SymbolKey {
    code: number;
    name: string;
    type: TokenType;
    isFunction: boolean;
    parametersCount: number;
}

export interface SymbolValue {
    returnType?: TokenType.ArrayType | TokenType.NumericType | TokenType.None;
    parameters?: Array<
        TokenType.ArrayType | TokenType.NumericType | TokenType.None
    >;
}
