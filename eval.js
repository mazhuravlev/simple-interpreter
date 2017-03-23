define(function() {
    return function eval(expression) {
        let ast;
        try {
            ast = buildTree(tokenize(expression));
        } catch (e) {
            throw new Error(`Parsing failed: ${e.message}`);
        }
        try {
            return evalAst(ast);
        } catch (e) {
            throw new Error(`Eval failed: ${e.message}`);
        }

        function tokenize(input) {
            if (typeof input !== 'string' || input.length === 0) {
                throw new Error('Non-empty string expected');
            }
            return input.replace(/\s*(\(|\))\s*/g, ' $1 ').trim().replace(/\s+/g, ' ').split(' ');
        }

        function buildTree(tokens) {
            let pos = 0;
            return parse();

            function parse() {
                let ast = [];
                while (pos < tokens.length) {
                    let token = tokens[pos++];
                    switch (token) {
                        case '(':
                            ast.push(parse());
                            break;
                        case ')':
                            return ast;
                        default:
                            ast.push(makeNode(token));
                    }
                }
                if (ast.length !== 1) {
                    throw new Error("Syntax error");
                }
                return ast[0];
            }
        }

        function NumericNode(value) {
            this.type = 'NumericNode';
            this.value = value;
        }

        function OperatorNode(value, func, arity) {
            this.type = 'OperatorNode';
            this.value = value;
            this.func = func;
            this.arity = arity;
        }

        function makeNode(token) {
            const operators = {
                '+': {
                    func: (args) => args.reduce((a, c) => a + evalAst(c), 0),
                    arity: 1
                },
                '-': {
                    func: (args) => args.slice(1).reduce((a, c) => a - evalAst(c), evalAst(args[0])),
                    arity: 2
                },
                'max': {
                    func: (args) => args.reduce((a, c) => {
                        let currentResult = evalAst(c);
                        return a > currentResult ? a : currentResult;
                    }, evalAst(args[0])),
                    arity: 1
                },
                'min': {
                    func: (args) => args.reduce((a, c) => {
                        let currentResult = evalAst(c);
                        return a < currentResult ? a : currentResult;
                    }, evalAst(args[0])),
                    arity: 1
                }
            };

            function isNumeric(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }

            if (isNumeric(token)) {
                return new NumericNode(+token)
            }
            if (Object.keys(operators).indexOf(token) !== -1) {
                return new OperatorNode(token, operators[token].func, operators[token].arity);
            }
            throw new Error(`Unknown token: ${token}`);
        }

        function evalAst(ast) {
            if (ast instanceof Array) {
                let head = ast[0];
                let rest = ast.slice(1);
                if (head instanceof OperatorNode) {
                    if (rest.length < head.arity) throw new Error(`Not sufficient operands to apply operator`);
                    return head.func(rest);
                } else if (head instanceof NumericNode) {
                    return ast.map(n => evalAst(n));
                } else {
                    throw new Error(`Unknown node type: ${head}`);
                }
            } else if (ast instanceof NumericNode) {
                return ast.value;
            }
            throw new Error(`Unexpected node: ${ast.type}`);
        }
    }
});