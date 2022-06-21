import { SymbolNode, SymbolTableInterface } from '../types';
import { Lexer } from './lexer';

export class SymbolTable implements SymbolTableInterface {
    symbols: Map<string, SymbolNode[]> = new Map();
    tables: Map<string, Map<string, SymbolNode[]>> = new Map();
    lexer: Lexer;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
    }

    insert(key: string, SymbolNode: SymbolNode): boolean {
        // if (SymbolNode.isFunction) {
        //     if (!this.tables.has(key)) {
        //         this.tables.set(key, new Map());
        //     } else {
        //         const symbols = this.tables.get(key) as Map<
        //             string,
        //             SymbolNode[]
        //         >;
        //         symbols.set(key, [SymbolNode]);
        //     }
        // }
        if (this.symbols.has(key)) {
            const nodes = this.symbols.get(key) as SymbolNode[];
            if (nodes.find((node) => node.scope === SymbolNode.scope)) {
                console.log(
                    `Semantic Error: ${
                        SymbolNode.isFunction ? 'Function' : 'identifier'
                    } ${key} already exists at ${this.lexer.line}:${
                        this.lexer.column
                    }`,
                );
                return false;
            }
            nodes.push(SymbolNode);
            return true;
        }
        this.symbols.set(key, [SymbolNode]);
        return true;
    }

    lookup(key: string, scope: string, withError = false): SymbolNode | null {
        const [functionName, scopeNumber] = scope.split('-');
        if (this.symbols.has(key)) {
            const nodes = this.symbols.get(key) as SymbolNode[];
            const node = nodes.find((node) => {
                if (node.scope.split('-')[0] === functionName) {
                    if (+node.scope.split('-')[1] <= +scopeNumber) {
                        return node;
                    }
                }
                return undefined;
            });
            if (node) {
                return node;
            }
        }
        withError &&
            console.log(
                `Semantic Error: identifier/function ${key} not found at ${this.lexer.line}:${this.lexer.column}`,
            );
        return null;
    }

    remove(key: string, scope: string): boolean {
        if (this.symbols.has(key)) {
            const nodes = this.symbols.get(key) as SymbolNode[];
            const node = nodes.find((node) => node.scope === scope);
            if (node) {
                nodes.splice(nodes.indexOf(node), 1);
                if (nodes.length === 0) {
                    this.symbols.delete(key);
                }
                return true;
            }
        }
        return false;
    }
}
