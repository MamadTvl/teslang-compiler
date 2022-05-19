import { Lexer } from '../service/lexer';

const main = async () => {
    const lexer = new Lexer('test/index.teslang');
    lexer.readable.on('readable', async () => {
        while (true) {
            const token = await lexer.dropToken();
            if (!token) {
                break;
            }
            console.log(token);
        }
    });
};

main();
