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
            case 'IfStatement':
                const conditionResult = this.evalExpr(stmt.condition);
                if (this.isTruthy(conditionResult)) {
                    this.evalBlock(stmt.thenBlock);
                } else if (stmt.elseBlock.length > 0) {
                    this.evalBlock(stmt.elseBlock);
                }
                break;
            default:
                throw new Error(`Unknown statement: ${stmt.type}`);
        }
    }

    isTruthy(value) {
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value !== '';
        return !!value;
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
            case '+': return left + right;
            case '-': return left - right;
            case '/': return left / right;
            case '*': return left * right;
            case '^': return left ^ right;
            case '==': return left == right ? 1 : 0;
            case '!=': return left != right ? 1 : 0;
            case '>': return left > right ? 1 : 0;
            case '<': return left < right ? 1 : 0;
            case '>=': return left >= right ? 1 : 0;
            case '<=': return left <= right ? 1 : 0;
            default:
                throw new Error(`Unsupported operator: ${op}`);
        }
    }
}

module.exports = Interpreter;