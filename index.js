const { readFileSync } = require('fs');
const { parseArgs, flags } = require('./cli/args');
const config = require('./cli/config');
const lex = require('./lang/lexer');
const Parser = require('./lang/parser');
const Interpreter = require('./lang/interpreter');

try {
    parseArgs(process.argv.slice(2));

    let input;
    if (flags.evalCode) {
        input = flags.evalCode;
    } else {
        const file = process.argv.slice(2).find(a => !a.startsWith('--'));
        input = file ? readFileSync(file, 'utf8')
            : `yeezy { spit "Helo kaney v${config.version} 👋"; }`;
    }

    const tokens = lex(input);
    if (flags.showTokens) {
        console.log("Tokens:", tokens);
    }

    const parser = new Parser(tokens);
    const ast = parser.parseProgram();
    if (flags.showAST) {
        console.log("AST:", JSON.stringify(ast, null, 2));
    }

    const interpreter = new Interpreter();
    interpreter.strict = flags.strictMode;
    interpreter.run(ast);

} catch (e) {
    console.error(`💥 Error: ${e.message}`);
    process.exit(1);
}