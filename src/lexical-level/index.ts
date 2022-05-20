import { Lexer } from '../service/lexer';

const main = async () => {
    const lexer = new Lexer('test/index.teslang');
    lexer.readable.on('readable', () => {
        while (true) {
            const token = lexer.dropToken();
            if (!token) {
                break;
            }
            console.log(token, lexer.line, lexer.column);
        }
    });
};

main();
