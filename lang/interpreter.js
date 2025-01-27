class Interpreter {
    constructor() {
        this.env = {
            __functions__: {},
            __parent__: null
        };
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

            case 'FunctionDecl':
                this.env.__functions__[stmt.name] = {
                    params: stmt.params,
                    body: stmt.body,
                    closure: this.env
                };
                break;

            case 'Return':
                throw { type: 'return', value: this.evalExpr(stmt.value) };

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

            case 'CallExpr':
                const func = this.env.__functions__[expr.name];
                if (!func) throw new Error(`Undefined function: ${expr.name}`);

                // Создаем новое окружение
                const localEnv = {
                    __functions__: this.env.__functions__,
                    __parent__: this.env
                };

                // Передаем аргументы
                for (let i = 0; i < func.params.length; i++) {
                    localEnv[func.params[i]] = this.evalExpr(expr.args[i]);
                }

                // Сохраняем предыдущее окружение
                const prevEnv = this.env;
                this.env = localEnv;

                // Выполняем тело функции
                let result = null;
                try {
                    this.evalBlock(func.body);
                } catch (ret) {
                    if (ret.type === 'return') result = ret.value;
                }

                // Восстанавливаем окружение
                this.env = prevEnv;
                return result;

            default:
                throw new Error(`Unknown expression: ${expr.type}`);
        }
    }

    applyOperator(op, left, right) {
        switch (op) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '^': return left ^ right;
            case '>': return left > right ? 1 : 0;
            case '<': return left < right ? 1 : 0;
            case '>=': return left >= right ? 1 : 0;
            case '<=': return left <= right ? 1 : 0;
            case '==': return left == right ? 1 : 0;
            case '!=': return left != right ? 1 : 0;
            default: throw new Error(`Unsupported operator: ${op}`);
        }
    }

    isTruthy(value) {
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value !== '';
        return !!value;
    }
}

module.exports = Interpreter;