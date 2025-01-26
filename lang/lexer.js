const { readFileSync } = require('fs');

function lex(input) {
    const tokens = [];
    let pos = 0;

    const processString = (str) =>
        str.replace(/\\(.)/g, (_, char) => {
            switch (char) {
                case 'n': return '\n';
                case 't': return '\t';
                case 'r': return '\r';
                case '"': return '"';
                case '\\': return '\\';
                default: return char;
            }
        });

    while (pos < input.length) {
        let match;

        if ((match = input.slice(pos).match(/^\s+/))) {
            pos += match[0].length;
            continue;
        }

        if ((match = input.slice(pos).match(/^#.*/))) {
            pos += match[0].length;
            continue;
        }

        if ((match = input.slice(pos).match(/^(yeezy|bleached|aldi|spit|repeat|times|be|to)\b/))) {
            tokens.push({ type: 'keyword', value: match[0] });
            pos += match[0].length;
            continue;
        }

        if ((match = input.slice(pos).match(/^"(\\.|[^"])*"/))) {
            const rawValue = match[0].slice(1, -1);
            tokens.push({
                type: 'string',
                value: processString(rawValue)
            });
            pos += match[0].length;
            continue;
        }

        if ((match = input.slice(pos).match(/^\d+/))) {
            tokens.push({ type: 'number', value: parseInt(match[0], 10) });
            pos += match[0].length;
            continue;
        }

        if ((match = input.slice(pos).match(/^[a-zA-Z_][a-zA-Z0-9_]*/))) {
            tokens.push({ type: 'identifier', value: match[0] });
            pos += match[0].length;
            continue;
        }

        const math_operators = ['+', '-', '/', '*', '^']
        const symbols = [...math_operators, '{', '}', ';'];
        for (const sym of symbols) {
            if (input.startsWith(sym, pos)) {
                tokens.push({ type: math_operators.includes(sym) ? 'operator' : sym, value: sym });
                pos += sym.length;
                match = true;
                break;
            }
        }
        if (match) continue;

        throw new Error(`Unexpected token at position ${pos}: '${input[pos]}'`);
    }

    return tokens;
}

module.exports = lex;