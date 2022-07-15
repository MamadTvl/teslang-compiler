import { IRInterface, TokenType, OperationType } from './../types/index';
export class IR implements IRInterface {
    byteCode: string[] = [];
    LabelCounter = 0;
    RegisterCounter = 0;

    setRegisterCounter(number: number): void {
        this.RegisterCounter = number;
    }

    label(): string {
        return 'Label' + this.LabelCounter++;
    }
    const(num: number): string {
        const register = 'r' + this.RegisterCounter++;
        this.assignment(register, num);
        return register;
    }
    name(variable: string): string {
        return this.temp();
    }
    temp(): string {
        return 'r' + this.RegisterCounter++;
    }
    saveCode(): void {
        throw new Error('Method not implemented.');
    }
    runCode(): void {
        throw new Error('Method not implemented.');
    }
    assignment(r1: string, r2: string | number): void {
        this.byteCode.push('mov ' + r1 + ', ' + r2);
    }
    operation(
        r1: string,
        r2: string | number,
        r3: string | number,
        type: OperationType,
    ): void {
        let operator = '';
        switch (type) {
            case TokenType.LessThanOperator:
                operator = 'cmp<';
                break;
            case TokenType.GreaterThanOperator:
                operator = 'cmp>';
                break;
            case TokenType.GreaterThanOrEqualOperator:
                operator = 'cmp=';
                break;
            case TokenType.LessThanOrEqualOperator:
                operator = 'cmp=';
                break;
            case TokenType.PlusOperator:
                operator = 'add';
                break;
            case TokenType.MinusOperator:
                operator = 'sub';
                break;
            case TokenType.MultiplyOperator:
                operator = 'mul';
                break;
            case TokenType.DivideOperator:
                operator = 'div';
                break;
        }
        this.byteCode.push(`${operator} ${r1}, ${r2}, ${r3}`);
    }
    jump(label: string): void {
        this.byteCode.push(`jmp ${label}`);
    }
    if(r1: string, label: string): void {
        this.byteCode.push(`jnz ${r1}, ${label}`);
    }
    ifNot(r1: string, label: string): void {
        this.byteCode.push(`jz ${r1}, ${label}`);
    }
    callFunction(name: string, args: string[]): void {
        let code = `call ${name}, `;
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            code += arg;
            if (i !== args.length - 1) {
                code += ', ';
            }
        }
        this.byteCode.push(code);
    }
    defineFunction(name: string): void {
        this.byteCode.push('proc ' + name);
    }
    return(): void {
        this.byteCode.push('ret');
    }
}
