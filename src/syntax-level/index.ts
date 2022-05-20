import { Lexer } from '../service/lexer';
import { Parser } from '../service/parser';

const main = async () => {
    const lexer = new Lexer('test/index.teslang');
    lexer.readable.on('readable', () => {
        const token = lexer.dropToken();
        const parser = new Parser(token, lexer);
        parser.run();
    });
};

main();
