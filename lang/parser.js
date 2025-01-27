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
            case 'flex': return this.parseFunctionDecl();
            case 'bounce': return this.parseReturn();
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
        let iterator = null;
        if (this.peek().value === 'be') {
            this.consume('keyword', 'be');
            iterator = this.consume('identifier').value;
        }
        this.consume('{');
        const body = this.parseBlock();
        this.consume('}');
        return { type: 'Repeat', count, body, iterator };
    }

    parsePrimary() {
        const token = this.peek();
        if (token.type === 'identifier' && this.tokens[this.pos + 1]?.type === '(') {
            return this.parseCallExpr();
        }

        switch (token.type) {
            case 'string':
                this.consume('string');
                return { type: 'String', value: token.value };
            case 'number':
                this.consume('number');
                return { type: 'Number', value: token.value };
            case 'keyword':
                if (token.value === 'true' || token.value === 'false') {
                    const value = token.value === 'true';
                    this.consume('keyword');
                    return { type: 'Boolean', value };
                }
                throw new Error(`Unexpected keyword in expression: ${token.value}`);
            case 'identifier':
                this.consume('identifier');
                return { type: 'Var', name: token.value };
            case '(':
                this.consume('(');
                const expr = this.parseExpr();
                this.consume(')');
                return expr;
            default:
                throw new Error(`Unexpected primary: ${token.type}`);
        }
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

    parseFunctionDecl() {
        this.consume('keyword', 'flex');
        const name = this.consume('identifier').value;
        this.consume('(');
        const params = [];
        while (this.peek().type !== ')') {
            params.push(this.consume('identifier').value);
            if (this.peek().type === ',') this.consume(',');
        }
        this.consume(')');
        this.consume('{');
        const body = this.parseBlock();
        this.consume('}');
        return { type: 'FunctionDecl', name, params, body };
    }

    parseReturn() {
        this.consume('keyword', 'bounce');
        const value = this.parseExpr();
        this.consume(';');
        return { type: 'Return', value };
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
        if (token.type === 'identifier' && this.tokens[this.pos + 1]?.type === '(') {
            return this.parseCallExpr();
        }

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
            case '(':
                this.consume('(');
                const expr = this.parseExpr();
                this.consume(')');
                return expr;
            default:
                throw new Error(`Unexpected primary: ${token.type}`);
        }
    }

    parseCallExpr() {
        const name = this.consume('identifier').value;
        this.consume('(');
        const args = [];
        while (this.peek().type !== ')') {
            args.push(this.parseExpr());
            if (this.peek().type === ',') this.consume(',');
        }
        this.consume(')');
        return { type: 'CallExpr', name, args };
    }
}

module.exports = Parser;