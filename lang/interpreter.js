class Interpreter {
    constructor() {
        this.env = {};
        this.strict = false;
    }

    run(program) {
        this.evalBlock(program.body);
    }

    evalBlock(statements) {
        for (const stmt of statements) {
            this.evalStmt(stmt);
        }
    }

    evalStmt(stmt) {
        switch (stmt.type) {
            case 'VarDecl':
                if (this.strict && this.env[stmt.name]) {
                    throw new Error(`Duplicate variable declaration in strict mode: ${stmt.name}`);
                }
                this.env[stmt.name] = this.evalExpr(stmt.value);
                break;

            case 'VarChange':
                if (this.strict && !this.env[stmt.name]) {
                    throw new Error(`Undefined variable in strict mode: ${stmt.name}`);
                }
                this.env[stmt.name] = this.evalExpr(stmt.value);
                break;

            case 'Spit':
                console.log(this.evalExpr(stmt.expr));
                break;

            case 'Repeat':
                const count = this.evalExpr(stmt.count);
                for (let i = 0; i < count; i++) {
                    this.evalBlock(stmt.body);
                }
                break;

            default:
                throw new Error(`Unknown statement: ${stmt.type}`);
        }
    }

    evalExpr(expr) {
        switch (expr.type) {
            case 'String':
                return expr.value;

            case 'Number':
                return expr.value;

            case 'Var':
                if (this.strict && !(expr.name in this.env)) {
                    throw new Error(`Undefined variable in strict mode: ${expr.name}`);
                }
                return this.env[expr.name] ?? null;

            case 'BinaryOp':
                const left = this.evalExpr(expr.left);
                const right = this.evalExpr(expr.right);
                return this.applyOperator(expr.op, left, right);

            default:
                throw new Error(`Unknown expression: ${expr.type}`);
        }
    }

    applyOperator(op, left, right) {
        switch (op) {
            case '+':
                return left + right;
            case '-':
                return left - right;
            case '/':
                return left / right;
            case '*':
                return left * right;
            case '^':
                return left ^ right;
            default:
                throw new Error(`Unsupported operator: ${op}`);
        }
    }
}

module.exports = Interpreter;