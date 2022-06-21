import { SymbolNode, SymbolTableInterface } from '../types';

export class SymbolTable implements SymbolTableInterface {
    symbols: Map<string, SymbolNode[]> = new Map();

    insert(key: string, SymbolNode: SymbolNode): boolean {
        if (this.symbols.has(key)) {
            const nodes = this.symbols.get(key) as SymbolNode[];
            if (nodes.find((node) => node.scope === SymbolNode.scope)) {
                console.log(
                    `Error: Symbol ${key} already exists at scope ${SymbolNode.scope}`,
                );
                return false;
            }
            nodes.push(SymbolNode);
            return true;
        }
        this.symbols.set(key, [SymbolNode]);
        return true;
    }

    lookup(key: string, scope: number): SymbolNode | null {
        if (this.symbols.has(key)) {
            const nodes = this.symbols.get(key) as SymbolNode[];
            const node = nodes.find((node) => node.scope === scope);
            if (node) {
                return node;
            }
        }
        return null;
    }

    remove(key: string, scope: number): boolean {
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
