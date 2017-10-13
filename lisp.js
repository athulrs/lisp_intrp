var http = require('http');
var server = http.createServer(function (req, res) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end();
});
server.listen(8080);

function parse(s) 
    {
        return read_from(tokenize(s));
    }

function tokenize(s) 
    {
        return s.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').replace(/^\s+|\s+$/g, '').split(/\s+/g);
    }

function read_from(tokens) 
    {
        if (!tokens.length)
            throw new SyntaxError('unexpected EOF while reading');
        var token = tokens.shift();
        if ('(' === token) {
            var l = [];
            while (tokens[0] !== ')') 
            {
                l.push(read_from(tokens));
            }
            tokens.shift();
            return l;
        } 
        else if (')' === token) 
        {
            throw new SyntaxError('unexpected )');
        } 
        else
        {
            return atom(token);
        }
    }

function atom(token) 
    {
        var number = Number(token);
        if (!isNaN(number))
            return number;
        return String(token);
    }

function eval(x, env)
    {
        env = env || global_env;
        if (typeof x === 'string') 
            return env.find(x).get(x);
        if (!Array.isArray(x)) 
            return x;
        if (x[0] === 'quote') 
            return x[1];
        if (x[0] === 'if')
        {
            var test = x[1];
            var conseq = x[2];
            var alt = x[3];
            if (eval(test, env)) {
                return eval(conseq, env);
            } else {
                return eval(alt, env);
            }
        } 
        if (x[0] === 'set!') 
            return env.find(x[1]).set(x[1], eval(x[1], env));
        if (x[0] === 'define')
            return env.set(x[1], eval(x[2], env));
        if (x[0] === 'lambda') 
            return function () 
            { return eval(x[2], new Env(x[1], arguments, env)); };
        if (x[0] === 'begin') 
        { 
            var val;
            for (var i = 1; i < x.length; ++i)
                val = eval(x[i], env);
            return val;
        }
        var exps = x.map(function (exp) { return eval(exp, env); });
        var proc = exps.shift();
        return proc.apply(null, exps);
    }

function Env(params, args, outer) 
    {
        this.outer = outer;
        this.dict = Object.create(null);
        this.get = function (v) { return this.dict['$' + v]; };
        this.set = function (v, val) { this.dict['$' + v] = val; };
        this.find = function (v) {
            if (('$' + v) in this.dict)
                return this;
            return this.outer ? this.outer.find(v) : null;
        };

        if (params && args) {
            for (var i = 0; i < params.length; ++i)
                this.set(params[i], args[i]);
        }
    }
    var global_env = new Env();
    var glob_init = 
    {
        '+': function (a,b) { return x + y; },
        '-': function (a, b) { return a - b; },
        '*': function (a,b) { return a * b ; },
        '/': function (a, b) { return a / b; },
        'and': function (a, b) { return a && b; },
        'or': function (a, b) { return a || b; },
        'not': function (a) { return !a; },
        '>': function (a, b) { return a > b; },
        '<': function (a, b) { return a < b; },
        '>=': function (a, b) { return a >= b; },
        '<=': function (a, b) { return a <= b; },
        '=': function (a, b) { return a == b; },
        'equal?': function (a, b) { return a === b; },
        'eq?': function (a, b) { return a === b; },
        'length': function (a) { return a.length; },
        'cons': function (a, b) { return [a].concat(b); },
        'car': function (a) { return a[0]; },
        'cdr': function (a) { return a.slice(1); },
        'append': function (a, b) { return a.concat(b); },
        'list': function () { return [].slice.call(arguments); },
        'list?': function (a) { return Array.isArray(a); },
        'null?': function (a) { return Array.isArray(a) && !a.length; },
        'symbol?': function (a) { return typeof a === 'string'; }
    };
    Object.keys(glob_init).forEach(function(key) 
    {
        global_env.set(key,glob_init[key]);
    });

eval(parse("(define twice (lambda (x) (* 2 x)))"));
var ans = eval(parse("(twice 25)"));
console.log(ans);
process.exit()
   
