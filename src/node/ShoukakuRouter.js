  
'use strict';
const noop = () => {}; // eslint-disable-line no-empty-function
const methods = ['get', 'post', 'delete', 'patch', 'put'];
const reflectors = [
    'toString',
    'valueOf',
    'inspect',
    'constructor',
    Symbol.toPrimitive,
    Symbol.for('nodejs.util.inspect.custom'),
];
/**
 * ShoukakuRouter, generates an api route for the rest manager
 * @class ShoukakuRouter
 * @param {ShoukakuRest} rest The rest manager that initialized this
 * @returns {Proxy|Object|string|void}
 * @protected
 */
function ShoukakuRouter(rest) {
    let query;
    const route = [''];
    const handler = {
        get(_, name) {
            if (reflectors.includes(name)) 
                return () => route.join('/');
            if (methods.includes(name)) 
                return options => rest.fetch(`${rest.url}${route.join('/')}${query ? `?${new URLSearchParams(query)}` : ''}`, { method: name, options });
            route.push(name);
            return new Proxy(noop, handler);
        },
        apply(_, __, args) {
            query = [...args.filter(x => x != null)].shift(); // eslint-disable-line eqeqeq
            return new Proxy(noop, handler);
        },
    };
    return new Proxy(noop, handler);
}

module.exports = ShoukakuRouter;