import fs from 'fs';
import { Lexer } from '../service/lexer';

const source = fs.readFileSync('test/index.teslang', 'utf8');
const lexer = new Lexer(source);
lexer.printTokens();
