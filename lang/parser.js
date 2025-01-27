class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    peek() {
        return this.tokens[this.pos];
    }

    consume(type, value) {
        const token = this.tokens[this.pos++];
        if (token.type !== type || (value !== undefined && token.value !== value)) {
            throw new Error(`Expected ${type}${value ? ` '${value}'` : ''}, got ${token.type} '${token.value}'`);
        }
        return token;
    }

    parseProgram() {
        this.consume('keyword', 'yeezy');
        this.consume('{');
        const body = this.parseBlock();
        this.consume('}');
        return { type: 'Program', body };
    }

    parseBlock() {
        const statements = [];
        while (this.peek() && this.peek().type !== '}') {
            statements.push(this.parseStatement());
        }
        return statements;
    }

    parseStatement() {
        const token = this.peek();
        switch (token.value) {
            case 'bleached': return this.parseVarDecl();
            case 'aldi': return this.parseVarChange();
            case 'spit': return this.parseSpit();
            case 'repeat': return this.parseRepeat();
            case 'drip': return this.parseIfStatement();
            default: throw new Error(`Unexpected statement: ${token.value}`);
        }
    }

    parseVarDecl() {
        this.consume('keyword', 'bleached');
        const name = this.consume('identifier').value;
        this.consume('keyword', 'be');
        const value = this.parseExpr();
        this.consume(';');
        return { type: 'VarDecl', name, value };
    }

    parseIfStatement() {
        this.consume('keyword', 'drip');
        this.consume('(');
        const condition = this.parseExpr();
        this.consume(')');
        this.consume('{');
        const thenBlock = this.parseBlock();
        this.consume('}');
        let elseBlock = [];
        if (this.peek()?.value === 'nah') {
            this.consume('keyword', 'nah');
            this.consume('{');
            elseBlock = this.parseBlock();
            this.consume('}');
        }
        return { type: 'IfStatement', condition, thenBlock, elseBlock };
    }

    parseVarChange() {
        this.consume('keyword', 'aldi');
        const name = this.consume('identifier').value;
        this.consume('keyword', 'to');
        const value = this.parseExpr();
        this.consume(';');
        return { type: 'VarChange', name, value };
    }

    parseSpit() {
        this.consume('keyword', 'spit');
        const expr = this.parseExpr();
        this.consume(';');
        return { type: 'Spit', expr };
    }

    parseRepeat() {
        this.consume('keyword', 'repeat');
        const count = this.parseExpr();
        this.consume('keyword', 'times');
        this.consume('{');
        const body = this.parseBlock();
        this.consume('}');
        return { type: 'Repeat', count, body };
    }

    parseExpr() {
        let left = this.parsePrimary();
        while (this.peek()?.type === 'operator') {
            const op = this.consume('operator').value;
            const right = this.parsePrimary();
            left = { type: 'BinaryOp', op, left, right };
        }
        return left;
    }

    parsePrimary() {
        const token = this.peek();
        switch (token.type) {
            case 'string':
                this.consume('string');
                return { type: 'String', value: token.value };
            case 'number':
                this.consume('number');
                return { type: 'Number', value: token.value };
            case 'identifier':
                this.consume('identifier');
                return { type: 'Var', name: token.value };
            default:
                throw new Error(`Unexpected primary: ${token.type}`);
        }
    }
}

module.exports = Parser;