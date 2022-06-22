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
        if (this.symbols.has(key)) {
            const nodes = this.symbols.get(key) as SymbolNode[];
            if (nodes.find((node) => node.scope === SymbolNode.scope)) {
                this.error(
                    `${
                        SymbolNode.isFunction ? 'Function' : 'identifier'
                    } ${key} already exists`,
                );
                return false;
            }
            nodes.push(SymbolNode);
            return true;
        }
        this.symbols.set(key, [SymbolNode]);
        return true;
    }

    lookup(
        key: string,
        scope: string,
        withError = false,
        isFunction = false,
        findNearestFunction = false,
    ): SymbolNode | null {
        const [functionName, scopeNumber] = scope.split('-');
        const findCallback = (node: SymbolNode) => {
            if (isFunction && !findNearestFunction) {
                return node.scope === `${key}-0`;
            } else {
                if (node.scope.split('-')[0] === functionName) {
                    if (+node.scope.split('-')[1] <= +scopeNumber) {
                        return node;
                    }
                }
                return undefined;
            }
        };

        if (this.symbols.has(key)) {
            const nodes = this.symbols.get(key) as SymbolNode[];
            if (findNearestFunction) {
                nodes.sort(
                    (a, b) => +b.scope.split('-')[1] - +a.scope.split('-')[1],
                );
            }
            const node = nodes.find(findCallback);
            if (node) {
                return node;
            }
        }
        withError &&
            this.error(
                `${isFunction ? 'function' : 'identifier'} ${key} not found`,
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

    error(message: string) {
        console.log(
            `Semantic Error: ${message} at ${this.lexer.line}:${this.lexer.column}`,
        );
    }
}
