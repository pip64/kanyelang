const os = require('os');
const config = require('./config');

const flags = {
    showTokens: false,
    showAST: false,
    strictMode: false,
    evalCode: null
};

const argHandlers = {
    '--info': () => {
        console.log(`${config.name} Runtime Information:
- Version:      ${config.version}
- Node.js:      ${process.version}
- Platform:     ${os.platform()} ${os.arch()}`);
        process.exit(0);
    },

    '--version': () => {
        console.log(`v${config.version}`);
        process.exit(0);
    },

    '--help': () => {
        console.log(`Usage: kanye [options] [file.kl]
    
Options:
  --info       Show runtime information
  --version    Display version
  --tokens     Show lexer tokens
  --ast        Show parsed AST
  --strict     Enable strict mode
  --eval <code> Run code directly
  --help       Show this help`);
        process.exit(0);
    },

    '--tokens': () => flags.showTokens = true,
    '--ast': () => flags.showAST = true,
    '--strict': () => flags.strictMode = true,
    '--eval': (code) => flags.evalCode = code
};

function parseArgs(args) {
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg in argHandlers) {
            if (arg === '--eval') {
                if (i + 1 >= args.length) throw new Error('Missing code for --eval');
                const code = args[++i]
                    .replace(/\\"/g, '"')
                    .replace(/^'(.*)'$/, '$1');
                argHandlers[arg](code);
            } else {
                argHandlers[arg]();
            }
        }
    }
}

module.exports = {
    flags,
    parseArgs
};