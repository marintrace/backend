//importScripts('https://unpkg.com/workbox-sw@0.0.2/build/importScripts/workbox-sw.dev.v0.0.2.js');
//importScripts('https://unpkg.com/workbox-runtime-caching@1.3.0/build/importScripts/workbox-runtime-caching.prod.v1.3.0.js');
//importScripts('https://unpkg.com/workbox-routing@1.3.0/build/importScripts/workbox-routing.prod.v1.3.0.js');

/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

var WorkboxSW = (function () {
    'use strict';

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * A simple class to make errors and to help with testing.
     */
    class ErrorFactory$1 {
        /**
         * @param {Object} errors A object containing key value pairs where the key
         * is the error name / ID and the value is the error message.
         */
        constructor(errors) {
            this._errors = errors;
        }

        /**
         * @param {string} name The error name to be generated.
         * @param {Error} [thrownError] The thrown error that resulted in this
         * message.
         * @return {Error} The generated error.
         */
        createError(name, thrownError) {
            if (!(name in this._errors)) {
                throw new Error(`Unable to generate error '${name}'.`);
            }

            let message = this._errors[name].replace(/\s+/g, ' ');
            let stack = null;
            if (thrownError) {
                message += ` [${thrownError.message}]`;
                stack = thrownError.stack;
            }

            const generatedError = new Error();
            generatedError.name = name;
            generatedError.message = message;
            generatedError.stack = stack;
            return generatedError;
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    const errors = {
        'not-in-sw': 'workbox-sw must be loaded in your service worker file.',
        'unsupported-route-type': 'Routes must be either a express style route ' +
            'string, a Regex to capture request URLs or a Route instance.',
        'empty-express-string': 'The Express style route string must have some ' +
            'characters, an empty string is invalid.',
        'bad-revisioned-cache-list': `The 'precache()' method expects` +
            `an array of revisioned urls like so: ['/example/hello.1234.txt', ` +
            `{path: 'hello.txt', revision: '1234'}]`,
        'navigation-route-url-string': `The registerNavigationRoute() method ` +
            `expects a URL string as its first parameter.`,
        'bad-cache-id': `The 'cacheId' parameter must be a string with at least ` +
            `one character`,
        'bad-clients-claim': `The 'clientsClaim' parameter must be a boolean.`,
        'bad-directory-index': `The 'directoryIndex' parameter must be a boolean.`,
    };

    var ErrorFactory = new ErrorFactory$1(errors);

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    const errors$1 = {
        'express-route-invalid-path': `When using ExpressRoute, you must
    provide a path that starts with a '/' character (to match same-origin
    requests) or that starts with 'http' (to match cross-origin requests)`,
    };

    var ErrorFactory$3 = new ErrorFactory$1(errors$1);

    var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};


    function createCommonjsModule(fn, module) {
        return module = {exports: {}}, fn(module, module.exports), module.exports;
    }

    var stackframe = createCommonjsModule(function (module, exports) {
        (function (root, factory) {
            'use strict';
            // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

            /* istanbul ignore next */
            if (typeof undefined === 'function' && undefined.amd) {
                undefined('stackframe', [], factory);
            } else {
                module.exports = factory();
            }
        }(commonjsGlobal, function () {
            'use strict';

            function _isNumber(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }

            function _capitalize(str) {
                return str[0].toUpperCase() + str.substring(1);
            }

            function _getter(p) {
                return function () {
                    return this[p];
                };
            }

            var booleanProps = ['isConstructor', 'isEval', 'isNative', 'isToplevel'];
            var numericProps = ['columnNumber', 'lineNumber'];
            var stringProps = ['fileName', 'functionName', 'source'];
            var arrayProps = ['args'];

            function StackFrame(obj) {
                if (obj instanceof Object) {
                    var props = booleanProps.concat(numericProps.concat(stringProps.concat(arrayProps)));
                    for (var i = 0; i < props.length; i++) {
                        if (obj.hasOwnProperty(props[i]) && obj[props[i]] !== undefined) {
                            this['set' + _capitalize(props[i])](obj[props[i]]);
                        }
                    }
                }
            }

            StackFrame.prototype = {
                getArgs: function () {
                    return this.args;
                },
                setArgs: function (v) {
                    if (Object.prototype.toString.call(v) !== '[object Array]') {
                        throw new TypeError('Args must be an Array');
                    }
                    this.args = v;
                },

                getEvalOrigin: function () {
                    return this.evalOrigin;
                },
                setEvalOrigin: function (v) {
                    if (v instanceof StackFrame) {
                        this.evalOrigin = v;
                    } else if (v instanceof Object) {
                        this.evalOrigin = new StackFrame(v);
                    } else {
                        throw new TypeError('Eval Origin must be an Object or StackFrame');
                    }
                },

                toString: function () {
                    var functionName = this.getFunctionName() || '{anonymous}';
                    var args = '(' + (this.getArgs() || []).join(',') + ')';
                    var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
                    var lineNumber = _isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
                    var columnNumber = _isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
                    return functionName + args + fileName + lineNumber + columnNumber;
                }
            };

            for (var i = 0; i < booleanProps.length; i++) {
                StackFrame.prototype['get' + _capitalize(booleanProps[i])] = _getter(booleanProps[i]);
                StackFrame.prototype['set' + _capitalize(booleanProps[i])] = (function (p) {
                    return function (v) {
                        this[p] = Boolean(v);
                    };
                })(booleanProps[i]);
            }

            for (var j = 0; j < numericProps.length; j++) {
                StackFrame.prototype['get' + _capitalize(numericProps[j])] = _getter(numericProps[j]);
                StackFrame.prototype['set' + _capitalize(numericProps[j])] = (function (p) {
                    return function (v) {
                        if (!_isNumber(v)) {
                            throw new TypeError(p + ' must be a Number');
                        }
                        this[p] = Number(v);
                    };
                })(numericProps[j]);
            }

            for (var k = 0; k < stringProps.length; k++) {
                StackFrame.prototype['get' + _capitalize(stringProps[k])] = _getter(stringProps[k]);
                StackFrame.prototype['set' + _capitalize(stringProps[k])] = (function (p) {
                    return function (v) {
                        this[p] = String(v);
                    };
                })(stringProps[k]);
            }

            return StackFrame;
        }));
    });

    var errorStackParser = createCommonjsModule(function (module, exports) {
        (function (root, factory) {
            'use strict';
            // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

            /* istanbul ignore next */
            if (typeof undefined === 'function' && undefined.amd) {
                undefined('error-stack-parser', ['stackframe'], factory);
            } else {
                module.exports = factory(stackframe);
            }
        }(commonjsGlobal, function ErrorStackParser(StackFrame) {
            'use strict';

            var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+\:\d+/;
            var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+\:\d+|\(native\))/m;
            var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code\])?$/;

            return {
                /**
                 * Given an Error object, extract the most information from it.
                 *
                 * @param {Error} error object
                 * @return {Array} of StackFrames
                 */
                parse: function ErrorStackParser$$parse(error) {
                    if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
                        return this.parseOpera(error);
                    } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
                        return this.parseV8OrIE(error);
                    } else if (error.stack) {
                        return this.parseFFOrSafari(error);
                    } else {
                        throw new Error('Cannot parse given Error object');
                    }
                },

                // Separate line and column numbers from a string of the form: (URI:Line:Column)
                extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
                    // Fail-fast but return locations like "(native)"
                    if (urlLike.indexOf(':') === -1) {
                        return [urlLike];
                    }

                    var regExp = /(.+?)(?:\:(\d+))?(?:\:(\d+))?$/;
                    var parts = regExp.exec(urlLike.replace(/[\(\)]/g, ''));
                    return [parts[1], parts[2] || undefined, parts[3] || undefined];
                },

                parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
                    var filtered = error.stack.split('\n').filter(function (line) {
                        return !!line.match(CHROME_IE_STACK_REGEXP);
                    }, this);

                    return filtered.map(function (line) {
                        if (line.indexOf('(eval ') > -1) {
                            // Throw away eval information until we implement stacktrace.js/stackframe#8
                            line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^\()]*)|(\)\,.*$)/g, '');
                        }
                        var tokens = line.replace(/^\s+/, '').replace(/\(eval code/g, '(').split(/\s+/).slice(1);
                        var locationParts = this.extractLocation(tokens.pop());
                        var functionName = tokens.join(' ') || undefined;
                        var fileName = ['eval', '<anonymous>'].indexOf(locationParts[0]) > -1 ? undefined : locationParts[0];

                        return new StackFrame({
                            functionName: functionName,
                            fileName: fileName,
                            lineNumber: locationParts[1],
                            columnNumber: locationParts[2],
                            source: line
                        });
                    }, this);
                },

                parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
                    var filtered = error.stack.split('\n').filter(function (line) {
                        return !line.match(SAFARI_NATIVE_CODE_REGEXP);
                    }, this);

                    return filtered.map(function (line) {
                        // Throw away eval information until we implement stacktrace.js/stackframe#8
                        if (line.indexOf(' > eval') > -1) {
                            line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval\:\d+\:\d+/g, ':$1');
                        }

                        if (line.indexOf('@') === -1 && line.indexOf(':') === -1) {
                            // Safari eval frames only have function names and nothing else
                            return new StackFrame({
                                functionName: line
                            });
                        } else {
                            var tokens = line.split('@');
                            var locationParts = this.extractLocation(tokens.pop());
                            var functionName = tokens.join('@') || undefined;

                            return new StackFrame({
                                functionName: functionName,
                                fileName: locationParts[0],
                                lineNumber: locationParts[1],
                                columnNumber: locationParts[2],
                                source: line
                            });
                        }
                    }, this);
                },

                parseOpera: function ErrorStackParser$$parseOpera(e) {
                    if (!e.stacktrace || (e.message.indexOf('\n') > -1 &&
                        e.message.split('\n').length > e.stacktrace.split('\n').length)) {
                        return this.parseOpera9(e);
                    } else if (!e.stack) {
                        return this.parseOpera10(e);
                    } else {
                        return this.parseOpera11(e);
                    }
                },

                parseOpera9: function ErrorStackParser$$parseOpera9(e) {
                    var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
                    var lines = e.message.split('\n');
                    var result = [];

                    for (var i = 2, len = lines.length; i < len; i += 2) {
                        var match = lineRE.exec(lines[i]);
                        if (match) {
                            result.push(new StackFrame({
                                fileName: match[2],
                                lineNumber: match[1],
                                source: lines[i]
                            }));
                        }
                    }

                    return result;
                },

                parseOpera10: function ErrorStackParser$$parseOpera10(e) {
                    var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
                    var lines = e.stacktrace.split('\n');
                    var result = [];

                    for (var i = 0, len = lines.length; i < len; i += 2) {
                        var match = lineRE.exec(lines[i]);
                        if (match) {
                            result.push(
                                new StackFrame({
                                    functionName: match[3] || undefined,
                                    fileName: match[2],
                                    lineNumber: match[1],
                                    source: lines[i]
                                })
                            );
                        }
                    }

                    return result;
                },

                // Opera 10.65+ Error.stack very similar to FF/Safari
                parseOpera11: function ErrorStackParser$$parseOpera11(error) {
                    var filtered = error.stack.split('\n').filter(function (line) {
                        return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) && !line.match(/^Error created at/);
                    }, this);

                    return filtered.map(function (line) {
                        var tokens = line.split('@');
                        var locationParts = this.extractLocation(tokens.pop());
                        var functionCall = (tokens.shift() || '');
                        var functionName = functionCall
                            .replace(/<anonymous function(: (\w+))?>/, '$2')
                            .replace(/\([^\)]*\)/g, '') || undefined;
                        var argsRaw;
                        if (functionCall.match(/\(([^\)]*)\)/)) {
                            argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
                        }
                        var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ?
                            undefined : argsRaw.split(',');

                        return new StackFrame({
                            functionName: functionName,
                            args: args,
                            fileName: locationParts[0],
                            lineNumber: locationParts[1],
                            columnNumber: locationParts[2],
                            source: line
                        });
                    }, this);
                }
            };
        }));
    });

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /* eslint-disable require-jsdoc */

    function atLeastOne(object) {
        const parameters = Object.keys(object);
        if (!parameters.some((parameter) => object[parameter] !== undefined)) {
            throwError('Please set at least one of the following parameters: ' +
                parameters.map((p) => `'${p}'`).join(', '));
        }
    }

    function hasMethod(object, expectedMethod) {
        const parameter = Object.keys(object).pop();
        const type = typeof object[parameter][expectedMethod];
        if (type !== 'function') {
            throwError(`The '${parameter}' parameter must be an object that exposes a
      '${expectedMethod}' method.`);
        }
    }

    function isInstance(object, expectedClass) {
        const parameter = Object.keys(object).pop();
        if (!(object[parameter] instanceof expectedClass)) {
            throwError(`The '${parameter}' parameter must be an instance of
      '${expectedClass.name}'`);
        }
    }

    function isOneOf(object, values) {
        const parameter = Object.keys(object).pop();
        if (!values.includes(object[parameter])) {
            throwError(`The '${parameter}' parameter must be set to one of the
      following: ${values}`);
        }
    }

    function isType(object, expectedType) {
        const parameter = Object.keys(object).pop();
        const actualType = typeof object[parameter];
        if (actualType !== expectedType) {
            throwError(`The '${parameter}' parameter has the wrong type. (Expected:
      ${expectedType}, actual: ${actualType})`);
        }
    }

    function isArrayOfType(object, expectedType) {
        const parameter = Object.keys(object).pop();
        const message = `The '${parameter}' parameter should be an array containing
    one or more '${expectedType}' elements.`;

        if (!Array.isArray(object[parameter])) {
            throwError(message);
        }

        for (let item of object[parameter]) {
            if (typeof item !== expectedType) {
                throwError(message);
            }
        }
    }

    function isArrayOfClass(object, expectedClass) {
        const parameter = Object.keys(object).pop();
        const message = `The '${parameter}' parameter should be an array containing
    one or more '${expectedClass.name}' instances.`;

        if (!Array.isArray(object[parameter])) {
            throwError(message);
        }

        for (let item of object[parameter]) {
            if (!(item instanceof expectedClass)) {
                throwError(message);
            }
        }
    }

    function isValue(object, expectedValue) {
        const parameter = Object.keys(object).pop();
        const actualValue = object[parameter];
        if (actualValue !== expectedValue) {
            throwError(`The '${parameter}' parameter has the wrong value. (Expected:
      ${expectedValue}, actual: ${actualValue})`);
        }
    }

    function throwError(message) {
        // Collapse any newlines or whitespace into a single space.
        message = message.replace(/\s+/g, ' ');

        const error = new Error(message);
        error.name = 'assertion-failed';
        const stackFrames = errorStackParser.parse(error);

        // If, for some reason, we don't have all the stack information we need,
        // we'll just end up throwing a basic Error.
        if (stackFrames.length >= 3) {
            // Assuming we have the stack frames, set the message to include info
            // about what the underlying method was, and set the name to reflect
            // the assertion type that failed.
            error.message = `Invalid call to ${stackFrames[2].functionName}() — ` +
                message;
        }

        throw error;
    }

    var assert = {
        atLeastOne,
        hasMethod,
        isInstance,
        isOneOf,
        isType,
        isValue,
        isArrayOfType,
        isArrayOfClass,
    };

    /**
     * @param {RouteHandler} handler The handler to normalize.
     * @return {Object} An object with a `handle` property representing the handler
     * function.
     */
    function normalizeHandler(handler) {
        if (typeof handler === 'object') {
            assert.hasMethod({handler}, 'handle');
            return handler;
        } else {
            assert.isType({handler}, 'function');
            return {handle: handler};
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * The default HTTP method, 'GET', used when there's no specific method
     * configured for a route.
     *
     * @private
     * @type {string}
     * @memberof module:workbox-routing
     */
    const defaultMethod = 'GET';

    /**
     * The list of valid HTTP methods associated with requests that could be routed.
     *
     * @private
     * @type {Array.<string>}
     * @memberof module:workbox-routing
     */
    const validMethods = [
        'DELETE',
        'GET',
        'HEAD',
        'POST',
        'PUT',
    ];

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * A `Route` allows you to tell a service worker that it should handle
     * certain network requests using a specific response strategy.
     *
     * Instead of implementing your own handlers, you can use one of the
     * pre-defined runtime caching strategies from the
     * {@link module:workbox-runtime-caching|workbox-runtime-caching} module.
     *
     * While you can use `Route` directly, the
     * {@link module:workbox-routing.RegExpRoute|RegExpRoute}
     * and {@link module:workbox-routing.ExpressRoute|ExpressRoute} subclasses
     * provide a convenient wrapper with a nicer interface for using regular
     * expressions or Express-style routes as the `match` criteria.
     *
     * @example
     * // Any navigate requests for URLs that start with /path/to/ will match.
     * const route = new workbox.routing.Route({
     *   match: ({url, event}) => {
     *     return event.request.mode === 'navigate' &&
     *            url.pathname.startsWith('/path/to/');
     *   },
     *   handler: ({event}) => {
     *     // Do something that returns a Promise.<Response>, like:
     *     return caches.match(event.request);
     *   },
     * });
     *
     * const router = new workbox.routing.Router();
     * router.registerRoute({route});
     *
     * @memberof module:workbox-routing
     */
    class Route {
        /**
         * Constructor for Route class.
         * @param {Object} input
         * @param {function} input.match The function that determines whether the
         * route matches. The function is passed an object with two properties:
         * `url`, which is a [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL),
         * and `event`, which is a [FetchEvent](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent).
         * `match` should return a truthy value when the route applies, and
         * that value is passed on to the handle function.
         * @param {module:workbox-routing.RouteHandler} input.handler The handler to
         * use to provide a response if the route matches.
         * @param {string} [input.method] Only match requests that use this
         * HTTP method. Defaults to `'GET'` if not specified.
         */
        constructor({match, handler, method} = {}) {
            this.handler = normalizeHandler(handler);

            assert.isType({match}, 'function');
            this.match = match;

            if (method) {
                assert.isOneOf({method}, validMethods);
                this.method = method;
            } else {
                this.method = defaultMethod;
            }
        }
    }

    var index$1 = Array.isArray || function (arr) {
        return Object.prototype.toString.call(arr) == '[object Array]';
    };

    /**
     * Expose `pathToRegexp`.
     */
    var index = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
        // Match escaped characters that would otherwise appear in future matches.
        // This allows the user to escape special characters that won't transform.
        '(\\\\.)',
        // Match Express-style parameters and un-named parameters with a prefix
        // and optional suffixes. Matches appear as:
        //
        // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
        // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
        // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
        '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {string}  str
     * @param  {Object=} options
     * @return {!Array}
     */
    function parse(str, options) {
        var tokens = [];
        var key = 0;
        var index = 0;
        var path = '';
        var defaultDelimiter = options && options.delimiter || '/';
        var res;

        while ((res = PATH_REGEXP.exec(str)) != null) {
            var m = res[0];
            var escaped = res[1];
            var offset = res.index;
            path += str.slice(index, offset);
            index = offset + m.length;

            // Ignore already escaped sequences.
            if (escaped) {
                path += escaped[1];
                continue
            }

            var next = str[index];
            var prefix = res[2];
            var name = res[3];
            var capture = res[4];
            var group = res[5];
            var modifier = res[6];
            var asterisk = res[7];

            // Push the current path onto the tokens.
            if (path) {
                tokens.push(path);
                path = '';
            }

            var partial = prefix != null && next != null && next !== prefix;
            var repeat = modifier === '+' || modifier === '*';
            var optional = modifier === '?' || modifier === '*';
            var delimiter = res[2] || defaultDelimiter;
            var pattern = capture || group;

            tokens.push({
                name: name || key++,
                prefix: prefix || '',
                delimiter: delimiter,
                optional: optional,
                repeat: repeat,
                partial: partial,
                asterisk: !!asterisk,
                pattern: pattern ? escapeGroup(pattern) : (asterisk ? '.*' : '[^' + escapeString(delimiter) + ']+?')
            });
        }

        // Match any characters still remaining.
        if (index < str.length) {
            path += str.substr(index);
        }

        // If the path exists, push it onto the end.
        if (path) {
            tokens.push(path);
        }

        return tokens
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {string}             str
     * @param  {Object=}            options
     * @return {!function(Object=, Object=)}
     */
    function compile(str, options) {
        return tokensToFunction(parse(str, options))
    }

    /**
     * Prettier encoding of URI path segments.
     *
     * @param  {string}
     * @return {string}
     */
    function encodeURIComponentPretty(str) {
        return encodeURI(str).replace(/[\/?#]/g, function (c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase()
        })
    }

    /**
     * Encode the asterisk parameter. Similar to `pretty`, but allows slashes.
     *
     * @param  {string}
     * @return {string}
     */
    function encodeAsterisk(str) {
        return encodeURI(str).replace(/[?#]/g, function (c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase()
        })
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction(tokens) {
        // Compile all the tokens into regexps.
        var matches = new Array(tokens.length);

        // Compile all the patterns before compilation.
        for (var i = 0; i < tokens.length; i++) {
            if (typeof tokens[i] === 'object') {
                matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
            }
        }

        return function (obj, opts) {
            var path = '';
            var data = obj || {};
            var options = opts || {};
            var encode = options.pretty ? encodeURIComponentPretty : encodeURIComponent;

            for (var i = 0; i < tokens.length; i++) {
                var token = tokens[i];

                if (typeof token === 'string') {
                    path += token;

                    continue
                }

                var value = data[token.name];
                var segment;

                if (value == null) {
                    if (token.optional) {
                        // Prepend partial segment prefixes.
                        if (token.partial) {
                            path += token.prefix;
                        }

                        continue
                    } else {
                        throw new TypeError('Expected "' + token.name + '" to be defined')
                    }
                }

                if (index$1(value)) {
                    if (!token.repeat) {
                        throw new TypeError('Expected "' + token.name + '" to not repeat, but received `' + JSON.stringify(value) + '`')
                    }

                    if (value.length === 0) {
                        if (token.optional) {
                            continue
                        } else {
                            throw new TypeError('Expected "' + token.name + '" to not be empty')
                        }
                    }

                    for (var j = 0; j < value.length; j++) {
                        segment = encode(value[j]);

                        if (!matches[i].test(segment)) {
                            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received `' + JSON.stringify(segment) + '`')
                        }

                        path += (j === 0 ? token.prefix : token.delimiter) + segment;
                    }

                    continue
                }

                segment = token.asterisk ? encodeAsterisk(value) : encode(value);

                if (!matches[i].test(segment)) {
                    throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
                }

                path += token.prefix + segment;
            }

            return path
        }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {string} str
     * @return {string}
     */
    function escapeString(str) {
        return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1')
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {string} group
     * @return {string}
     */
    function escapeGroup(group) {
        return group.replace(/([=!:$\/()])/g, '\\$1')
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {!RegExp} re
     * @param  {Array}   keys
     * @return {!RegExp}
     */
    function attachKeys(re, keys) {
        re.keys = keys;
        return re
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {string}
     */
    function flags(options) {
        return options.sensitive ? '' : 'i'
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {!RegExp} path
     * @param  {!Array}  keys
     * @return {!RegExp}
     */
    function regexpToRegexp(path, keys) {
        // Use a negative lookahead to match only capturing groups.
        var groups = path.source.match(/\((?!\?)/g);

        if (groups) {
            for (var i = 0; i < groups.length; i++) {
                keys.push({
                    name: i,
                    prefix: null,
                    delimiter: null,
                    optional: false,
                    repeat: false,
                    partial: false,
                    asterisk: false,
                    pattern: null
                });
            }
        }

        return attachKeys(path, keys)
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {!Array}  path
     * @param  {Array}   keys
     * @param  {!Object} options
     * @return {!RegExp}
     */
    function arrayToRegexp(path, keys, options) {
        var parts = [];

        for (var i = 0; i < path.length; i++) {
            parts.push(pathToRegexp(path[i], keys, options).source);
        }

        var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

        return attachKeys(regexp, keys)
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {string}  path
     * @param  {!Array}  keys
     * @param  {!Object} options
     * @return {!RegExp}
     */
    function stringToRegexp(path, keys, options) {
        return tokensToRegExp(parse(path, options), keys, options)
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {!Array}          tokens
     * @param  {(Array|Object)=} keys
     * @param  {Object=}         options
     * @return {!RegExp}
     */
    function tokensToRegExp(tokens, keys, options) {
        if (!index$1(keys)) {
            options = /** @type {!Object} */ (keys || options);
            keys = [];
        }

        options = options || {};

        var strict = options.strict;
        var end = options.end !== false;
        var route = '';

        // Iterate over the tokens and create our regexp string.
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];

            if (typeof token === 'string') {
                route += escapeString(token);
            } else {
                var prefix = escapeString(token.prefix);
                var capture = '(?:' + token.pattern + ')';

                keys.push(token);

                if (token.repeat) {
                    capture += '(?:' + prefix + capture + ')*';
                }

                if (token.optional) {
                    if (!token.partial) {
                        capture = '(?:' + prefix + '(' + capture + '))?';
                    } else {
                        capture = prefix + '(' + capture + ')?';
                    }
                } else {
                    capture = prefix + '(' + capture + ')';
                }

                route += capture;
            }
        }

        var delimiter = escapeString(options.delimiter || '/');
        var endsWithDelimiter = route.slice(-delimiter.length) === delimiter;

        // In non-strict mode we allow a slash at the end of match. If the path to
        // match already ends with a slash, we remove it for consistency. The slash
        // is valid at the end of a path match, not in the middle. This is important
        // in non-ending mode, where "/test/" shouldn't match "/test//route".
        if (!strict) {
            route = (endsWithDelimiter ? route.slice(0, -delimiter.length) : route) + '(?:' + delimiter + '(?=$))?';
        }

        if (end) {
            route += '$';
        } else {
            // In non-ending mode, we need the capturing groups to match as much as
            // possible by using a positive lookahead to the end or next path segment.
            route += strict && endsWithDelimiter ? '' : '(?=' + delimiter + '|$)';
        }

        return attachKeys(new RegExp('^' + route, flags(options)), keys)
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     *
     * @param  {(string|RegExp|Array)} path
     * @param  {(Array|Object)=}       keys
     * @param  {Object=}               options
     * @return {!RegExp}
     */
    function pathToRegexp(path, keys, options) {
        if (!index$1(keys)) {
            options = /** @type {!Object} */ (keys || options);
            keys = [];
        }

        options = options || {};

        if (path instanceof RegExp) {
            return regexpToRegexp(path, /** @type {!Array} */ (keys))
        }

        if (index$1(path)) {
            return arrayToRegexp(/** @type {!Array} */ (path), /** @type {!Array} */ (keys), options)
        }

        return stringToRegexp(/** @type {string} */ (path), /** @type {!Array} */ (keys), options)
    }

    index.parse = parse_1;
    index.compile = compile_1;
    index.tokensToFunction = tokensToFunction_1;
    index.tokensToRegExp = tokensToRegExp_1;

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * `ExpressRoute` is a helper class to make defining Express-style
     * [Routes]{@link Route} easy.
     *
     * Under the hood, it uses the [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp)
     * library to transform the `path` parameter into a regular expression, which is
     * then matched against the URL's path.
     *
     * Please note that `ExpressRoute` can match either same-origin or cross-origin
     * requests. To match only same-origin requests, use a `path` value that begins
     * with `'/'`, e.g. `'/path/to/:file'`. To match cross-origin requests, use
     * a `path` value that includes the origin, e.g.
     * `'https://example.com/path/to/:file'`.
     *
     * @example
     * // Any same-origin requests that start with /path/to and end with one
     * // additional path segment will match this route, with the last path
     * // segment passed along to the handler via params.file.
     * const route = new workbox.routing.ExpressRoute({
     *   path: '/path/to/:file',
     *   handler: ({event, params}) => {
     *     // params.file will be set based on the request URL that matched.
     *     return caches.match(params.file);
     *   },
     * });
     *
     * const router = new workbox.routing.Router();
     * router.registerRoute({route});
     *
     * @example
     * // Any cross-origin requests for https://example.com will match this route.
     * const route = new workbox.routing.ExpressRoute({
     *   path: 'https://example.com/path/to/:file',
     *   handler: ({event}) => return caches.match(event.request),
     * });
     *
     * const router = new workbox.routing.Router();
     * router.registerRoute({route});
     *
     * @memberof module:workbox-routing
     * @extends Route
     */
    class ExpressRoute extends Route {
        /**
         * Constructor for ExpressRoute.
         *
         * @param {Object} input
         * @param {String} input.path The path to use for routing.
         * If the path contains [named parameters](https://github.com/pillarjs/path-to-regexp#named-parameters),
         * then an Object that maps parameter names to their corresponding value
         * will be passed to the handler via `params`.
         * @param {module:workbox-routing.RouteHandler} input.handler The handler to
         * use to provide a response if the route matches.
         * @param {string} [input.method] Only match requests that use this
         * HTTP method. Defaults to `'GET'` if not specified.
         */
        constructor({path, handler, method}) {
            if (!(path.startsWith('/') || path.startsWith('http'))) {
                throw ErrorFactory$3.createError('express-route-invalid-path');
            }

            let keys = [];
            // keys is populated as a side effect of pathToRegExp. This isn't the nicest
            // API, but so it goes.
            // https://github.com/pillarjs/path-to-regexp#usage
            const regExp = index(path, keys);
            const match = ({url}) => {
                // A path starting with '/' is a signal that we only want to match
                // same-origin. Bail out early if needed.
                if (path.startsWith('/') && url.origin !== location.origin) {
                    return null;
                }

                // We need to match on either just the pathname or the full URL, depending
                // on whether the path parameter starts with '/' or 'http'.
                const pathNameOrHref = path.startsWith('/') ? url.pathname : url.href;
                const regexpMatches = pathNameOrHref.match(regExp);
                // Return null immediately if this route doesn't match.
                if (!regexpMatches) {
                    return null;
                }

                // If the route does match, then collect values for all the named
                // parameters that were returned in keys.
                // If there are no named parameters then this will end up returning {},
                // which is truthy, and therefore a sufficient return value.
                const namedParamsToValues = {};
                keys.forEach((key, index$$1) => {
                    namedParamsToValues[key.name] = regexpMatches[index$$1 + 1];
                });

                return namedParamsToValues;
            };

            super({match, handler, method});
        }
    }

    /* eslint-disable no-console */

    /**
     * A simple helper to manage the print of a set of logs
     */
    class LogGroup {
        /**
         * @param {object} input
         * @param {string} input.title
         * @param {boolean} input.isPrimary
         */
        constructor({title, isPrimary} = {}) {
            this._isPrimary = isPrimary || false;
            this._groupTitle = title || '';
            this._logs = [];
            this._childGroups = [];

            this._isFirefox = false;
            if (/Firefox\/\d*\.\d*/.exec(navigator.userAgent)) {
                this._isFirefox = true;
            }

            this._isEdge = false;
            if (/Edge\/\d*\.\d*/.exec(navigator.userAgent)) {
                this._isEdge = true;
            }
        }

        /**
         *@param {object} logDetails
         */
        addLog(logDetails) {
            this._logs.push(logDetails);
        }

        /**
         * @param {object} group
         */
        addChildGroup(group) {
            if (group._logs.length === 0) {
                return;
            }

            this._childGroups.push(group);
        }

        /**
         * prints out this log group to the console.
         */
        print() {
            if (this._isEdge) {
                this._printEdgeFriendly();
                return;
            }

            this._openGroup();

            this._logs.forEach((logDetails) => {
                this._printLogDetails(logDetails);
            });

            this._childGroups.forEach((group) => {
                group.print();
            });

            this._closeGroup();
        }

        /**
         * This prints a simpler log for Edge which has poor group support.
         * For more details see:
         * https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11363242/
         */
        _printEdgeFriendly() {
            // Edge has no support for colors at all and poor support for groups.
            this._logs.forEach((logDetails, index) => {
                // Message can be an object - i.e. an error.
                let message = logDetails.message;
                if (typeof message === 'string') {
                    // Replace the %c value with an empty string.
                    message = message.replace(/%c/g, '');
                }
                const logArgs = [message];
                if (logDetails.error) {
                    logArgs.push(logDetails.error);
                }
                if (logDetails.args) {
                    logArgs.push(logDetails.args);
                }
                const logFunc = logDetails.logFunc || console.log;
                logFunc(...logArgs);
            });

            this._childGroups.forEach((group, index) => {
                group.print();
            });
        }

        /**
         * Prints the specific logDetails object.
         * @param {object} logDetails
         */
        _printLogDetails(logDetails) {
            const logFunc = logDetails.logFunc ? logDetails.logFunc : console.log;
            let message = logDetails.message;
            let allArguments = [message];
            if (logDetails.colors && !this._isEdge) {
                allArguments = allArguments.concat(logDetails.colors);
            }
            if (logDetails.args) {
                allArguments = allArguments.concat(logDetails.args);
            }
            logFunc(...allArguments);
        }

        /**
         * Opens a console group - managing differences in Firefox.
         */
        _openGroup() {
            if (this._isPrimary) {
                // Only start a group is there are child groups
                if (this._childGroups.length === 0) {
                    return;
                }

                const logDetails = this._logs.shift();
                if (this._isFirefox) {
                    // Firefox doesn't support colors logs in console.group.
                    this._printLogDetails(logDetails);
                    return;
                }

                // Print the colored message with console.group
                logDetails.logFunc = console.group;
                this._printLogDetails(logDetails);
            } else {
                console.groupCollapsed(this._groupTitle);
            }
        }

        /**
         * Closes a console group
         */
        _closeGroup() {
            // Only close a group if there was a child group opened
            if (this._isPrimary && this._childGroups.length === 0) {
                return;
            }

            console.groupEnd();
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * @private
     * @return {boolean} True, if we're running in the service worker global scope.
     * False otherwise.
     */
    function isServiceWorkerGlobalScope() {
        return ('ServiceWorkerGlobalScope' in self &&
            self instanceof ServiceWorkerGlobalScope);
    }

    /**
     * @private
     * @return {boolean} True, if we're running a development bundle.
     * False otherwise.
     */
    function isDevBuild() {
        // `dev` is replaced during the build process.
        return `dev` === `dev`;
    }

    /**
     * @private
     * @return {boolean} True, if we're running on localhost or the equivalent IP
     * address. False otherwise.
     */
    function isLocalhost() {
        return Boolean(
            location.hostname === 'localhost' ||
            // [::1] is the IPv6 localhost address.
            location.hostname === '[::1]' ||
            // 127.0.0.1/8 is considered localhost for IPv4.
            location.hostname.match(
                /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
            )
        );
    }

    var environment = {
        isDevBuild,
        isLocalhost,
        isServiceWorkerGlobalScope,
    };

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /* eslint-disable no-console */

    self.goog = self.goog || {};
    self.goog.LOG_LEVEL = self.goog.LOG_LEVEL || {
        none: -1,
        verbose: 0,
        debug: 1,
        warn: 2,
        error: 3,
    };

    const LIGHT_GREY = `#bdc3c7`;
    const DARK_GREY = `#7f8c8d`;
    const LIGHT_GREEN = `#2ecc71`;
    const LIGHT_YELLOW = `#f1c40f`;
    const LIGHT_RED = `#e74c3c`;
    const LIGHT_BLUE = `#3498db`;

    /**
     * A class that will only log given the current log level
     * defined by the developer.
     *
     * Define custom log level by setting `self.goog.logLevel`.
     *
     * @example
     *
     * self.goog.logLevel = self.goog.LOG_LEVEL.verbose;
     *
     * @private
     */
    class LogHelper {
        /**
         * LogHelper constructor.
         */
        constructor() {
            this._defaultLogLevel = environment.isDevBuild() ?
                self.goog.LOG_LEVEL.debug :
                self.goog.LOG_LEVEL.warn;
        }

        /**
         * The most verbose log level.
         *
         * @param {Object} options The options of the log.
         */
        log(options) {
            this._printMessage(self.goog.LOG_LEVEL.verbose, options);
        }

        /**
         * Useful for logs that are more exceptional that log()
         * but not severe.
         *
         * @param {Object} options The options of the log.
         */
        debug(options) {
            this._printMessage(self.goog.LOG_LEVEL.debug, options);
        }

        /**
         * Warning messages.
         *
         * @param {Object} options The options of the log.
         */
        warn(options) {
            this._printMessage(self.goog.LOG_LEVEL.warn, options);
        }

        /**
         * Error logs.
         *
         * @param {Object} options The options of the log.
         */
        error(options) {
            this._printMessage(self.goog.LOG_LEVEL.error, options);
        }

        /**
         * Method to print to the console.
         * @param {number} logLevel
         * @param {Object} logOptions
         */
        _printMessage(logLevel, logOptions) {
            if (!this._shouldLogMessage(logLevel, logOptions)) {
                return;
            }

            const logGroups = this._getAllLogGroups(logLevel, logOptions);
            logGroups.print();
        }

        /**
         * Print a user friendly log to the console.
         * @param  {numer} logLevel A number from self.goog.LOG_LEVEL
         * @param  {Object} logOptions Arguments to print to the console
         * @return {LogGroup} Returns a log group to print to the console.
         */
        _getAllLogGroups(logLevel, logOptions) {
            const topLogGroup = new LogGroup({
                isPrimary: true,
                title: 'workbox log.',
            });

            const primaryMessage = this._getPrimaryMessageDetails(logLevel, logOptions);
            topLogGroup.addLog(primaryMessage);

            if (logOptions.error) {
                const errorMessage = {
                    message: logOptions.error,
                    logFunc: console.error,
                };
                topLogGroup.addLog(errorMessage);
            }

            const extraInfoGroup = new LogGroup({title: 'Extra Information.'});
            if (logOptions.that && logOptions.that.constructor &&
                logOptions.that.constructor.name) {
                const className = logOptions.that.constructor.name;
                extraInfoGroup.addLog(
                    this._getKeyValueDetails('class', className)
                );
            }

            if (logOptions.data) {
                if (typeof logOptions.data === 'object' &&
                    !(logOptions.data instanceof Array)) {
                    Object.keys(logOptions.data).forEach((keyName) => {
                        extraInfoGroup.addLog(
                            this._getKeyValueDetails(keyName, logOptions.data[keyName])
                        );
                    });
                } else {
                    extraInfoGroup.addLog(
                        this._getKeyValueDetails('additionalData', logOptions.data)
                    );
                }
            }

            topLogGroup.addChildGroup(extraInfoGroup);

            return topLogGroup;
        }

        /**
         * This is a helper function to wrap key value pairss to a colored key
         * value string.
         * @param  {string} key
         * @param  {string} value
         * @return {Object} The object containing a message, color and Arguments
         * for the console.
         */
        _getKeyValueDetails(key, value) {
            return {
                message: `%c${key}: `,
                colors: [`color: ${LIGHT_BLUE}`],
                args: value,
            };
        }

        /**
         * Helper method to color the primary message for the log
         * @param  {number} logLevel   One of self.goog.LOG_LEVEL
         * @param  {Object} logOptions Arguments to print to the console
         * @return {Object} Object containing the message and color info to print.
         */
        _getPrimaryMessageDetails(logLevel, logOptions) {
            let logLevelName;
            let logLevelColor;
            switch (logLevel) {
                case self.goog.LOG_LEVEL.verbose:
                    logLevelName = 'Info';
                    logLevelColor = LIGHT_GREY;
                    break;
                case self.goog.LOG_LEVEL.debug:
                    logLevelName = 'Debug';
                    logLevelColor = LIGHT_GREEN;
                    break;
                case self.goog.LOG_LEVEL.warn:
                    logLevelName = 'Warn';
                    logLevelColor = LIGHT_YELLOW;
                    break;
                case self.goog.LOG_LEVEL.error:
                    logLevelName = 'Error';
                    logLevelColor = LIGHT_RED;
                    break;
            }

            let primaryLogMessage = `%c🔧 %c[${logLevelName}]`;
            const primaryLogColors = [
                `color: ${LIGHT_GREY}`,
                `color: ${logLevelColor}`,
            ];

            let message;
            if (typeof logOptions === 'string') {
                message = logOptions;
            } else if (logOptions.message) {
                message = logOptions.message;
            }

            if (message) {
                message = message.replace(/\s+/g, ' ');
                primaryLogMessage += `%c ${message}`;
                primaryLogColors.push(`color: ${DARK_GREY}; font-weight: normal`);
            }

            return {
                message: primaryLogMessage,
                colors: primaryLogColors,
            };
        }

        /**
         * Test if the message should actually be logged.
         * @param {number} logLevel The level of the current log to be printed.
         * @param {Object|String} logOptions The options to log.
         * @return {boolean} Returns true of the message should be printed.
         */
        _shouldLogMessage(logLevel, logOptions) {
            if (!logOptions) {
                return false;
            }

            let minValidLogLevel = this._defaultLogLevel;
            if (self && self.goog && typeof self.goog.logLevel === 'number') {
                minValidLogLevel = self.goog.logLevel;
            }

            if (minValidLogLevel === self.goog.LOG_LEVEL.none ||
                logLevel < minValidLogLevel) {
                return false;
            }

            return true;
        }
    }

    var logHelper = new LogHelper();

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

    /**
     * NavigationRoute is a helper class to create a [`Route`]{@link Route}
     * that matches browser navigation requests, i.e. requests for a page.
     *
     * It will only match incoming requests whose [`mode`](https://fetch.spec.whatwg.org/#concept-request-mode)
     * is set to `navigate`.
     *
     * You can optionally only apply this route to a subset of navigation requests
     * by using one or both of the `blacklist` and `whitelist` parameters. If
     * both lists are provided, and there's a navigation to a URL which matches
     * both, then the blacklist will take precedence and the request will not be
     * matched by this route. The regular expressions in `whitelist` and `blacklist`
     * are matched against the [`pathname`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/pathname)
     * portion of the requested URL.
     *
     * To match all navigations, use a `whitelist` array containing a RegExp that
     * matches everything, i.e. `[/./]`.
     *
     * @memberof module:workbox-routing
     * @extends Route
     *
     * @example
     * // Any navigation requests that match the whitelist (i.e. URLs whose path
     * // starts with /article/) will be handled with the cache entry for
     * // app-shell.html.
     * const route = new workbox.routing.NavigationRoute({
     *   whitelist: [new RegExp('^/article/')],
     *   handler: {handle: () => caches.match('app-shell.html')},
     * });
     *
     * const router = new workbox.routing.Router();
     * router.registerRoute({route});
     */
    class NavigationRoute extends Route {
        /**
         * Constructor for NavigationRoute.
         *
         * @param {Object} input
         * @param {Array<RegExp>} input.whitelist If any of these patterns match,
         * the route will handle the request (assuming the blacklist doesn't match).
         * @param {Array<RegExp>} [input.blacklist] If any of these patterns match,
         * the route will not handle the request (even if a whitelist entry matches).
         * @param {module:workbox-routing.RouteHandler} input.handler The handler to
         * use to provide a response if the route matches.
         */
        constructor({whitelist, blacklist, handler} = {}) {
            assert.isArrayOfClass({whitelist}, RegExp);
            if (blacklist) {
                assert.isArrayOfClass({blacklist}, RegExp);
            } else {
                blacklist = [];
            }

            const match = ({event, url}) => {
                let matched = false;
                let message;

                if (event.request.mode === 'navigate') {
                    if (whitelist.some((regExp) => regExp.test(url.pathname))) {
                        if (blacklist.some((regExp) => regExp.test(url.pathname))) {
                            message = `The navigation route is not being used, since the ` +
                                `request URL matches both the whitelist and blacklist.`;
                        } else {
                            message = `The navigation route is being used.`;
                            matched = true;
                        }
                    } else {
                        message = `The navigation route is not being used, since the ` +
                            `URL being navigated to doesn't match the whitelist.`;
                    }

                    logHelper.debug({
                        that: this,
                        message,
                        data: {'request-url': url.href, whitelist, blacklist, handler},
                    });
                }

                return matched;
            };

            super({match, handler, method: 'GET'});
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * RegExpRoute is a helper class to make defining regular expression based
     * [Routes]{@link Route} easy.
     *
     * For same-origin requests, the route will be used if the regular expression
     * matches **any portion** (not necessarily the entirety) of the full request
     * URL.
     *
     * For cross-origin requests, the route will only be used if the regular
     * expression matches **from the start** of the full request URL.
     *
     * For example, assuming that your origin is 'https://example.com', and you use
     * the following regular expressions when constructing your `RegExpRoute`:
     *
     * - `/css$/` **will** match 'https://example.com/path/to/styles.css', but
     * **will not** match 'https://cross-origin.com/path/to/styles.css'
     *
     * - `/^https:\/\/cross-origin\.com/` **will not** match
     * 'https://example.com/path/to/styles.css', but **will** match
     * 'https://cross-origin.com/path/to/styles.css'
     *
     * - `/./` **will** match both 'https://example.com/path/to/styles.css' and
     * 'https://cross-origin.com/path/to/styles.css', because the `.` wildcard
     * matches the first character in both URLs.
     *
     * @memberof module:workbox-routing
     * @extends Route
     *
     * @example
     * // Any requests that match the regular expression will match this route, with
     * // the capture groups passed along to the handler as an array via params.
     * const route = new workbox.routing.RegExpRoute({
     *   regExp: new RegExp('^https://example.com/path/to/(\\w+)'),
     *   handler: {
     *     handle: ({event, params}) => {
     *       // params[0], etc. will be set based on the regexp capture groups.
     *       // Do something that returns a Promise.<Response>, like:
     *       return caches.match(event.request);
     *     },
     *   },
     * });
     *
     * const router = new workbox.routing.Router();
     * router.registerRoute({route});
     */
    class RegExpRoute extends Route {
        /**
         * Constructor for RegExpRoute.
         *
         * @param {Object} input
         * @param {RegExp} input.regExp The regular expression to match against URLs.
         * If the `RegExp` contains [capture groups](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#grouping-back-references),
         * then the array of captured values will be passed to the handler via
         * `params`.
         * @param {module:workbox-routing.RouteHandler} input.handler The handler to
         * use to provide a response if the route matches.
         * @param {string} [input.method] Only match requests that use this
         * HTTP method. Defaults to `'GET'` if not specified.
         */
        constructor({regExp, handler, method}) {
            assert.isInstance({regExp}, RegExp);

            const match = ({url}) => {
                const result = regExp.exec(url.href);

                // Return null immediately if this route doesn't match.
                if (!result) {
                    return null;
                }

                // If this is a cross-origin request, then confirm that the match included
                // the start of the URL. This means that regular expressions like
                // /styles.+/ will only match same-origin requests.
                // See https://github.com/GoogleChrome/workbox/issues/281#issuecomment-285130355
                if ((url.origin !== location.origin) && (result.index !== 0)) {
                    logHelper.debug({
                        that: this,
                        message: `Skipping route, because the RegExp match didn't occur ` +
                            `at the start of the URL.`,
                        data: {url: url.href, regExp},
                    });

                    return null;
                }

                // If the route matches, but there aren't any capture groups defined, then
                // this will return [], which is truthy and therefore sufficient to
                // indicate a match.
                // If there are capture groups, then it will return their values.
                return result.slice(1);
            };

            super({match, handler, method});
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * The Router takes one or more [Routes]{@link Route} and registers a [`fetch`
     * event listener](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent)
     * that will respond to network requests if there's a matching route.
     *
     * It also allows you to define a "default" handler that applies to any requests
     * that don't explicitly match a `Route`, and a "catch" handler that responds
     * to any requests that throw an exception while being routed.
     *
     * @memberof module:workbox-routing
     *
     * @example
     * // The following example sets up two routes, one to match requests with
     * // "assets" in their URL, and the other for requests with "images", along
     * // different runtime caching handlers for each.
     * // Both the routes are registered with the router, and any requests that
     * // don't match either route will be handled using the default NetworkFirst
     * // strategy.
     * const assetRoute = new RegExpRoute({
     *   regExp: /assets/,
     *   handler: new workbox.runtimeCaching.StaleWhileRevalidate(),
     * });
     * const imageRoute = new RegExpRoute({
     *   regExp: /images/,
     *   handler: new workbox.runtimeCaching.CacheFirst(),
     * });
     *
     * const router = new workbox.routing.Router();
     * router.registerRoutes({routes: [assetRoute, imageRoute]});
     * router.setDefaultHandler({
     *   handler: new workbox.runtimeCaching.NetworkFirst(),
     * });
     */
    class Router$2 {
        /**
         * Start with an empty array of routes, and set up the fetch handler.
         */
        constructor({handleFetch} = {}) {
            if (typeof handleFetch === 'undefined') {
                handleFetch = true;
            }

            // _routes will contain a mapping of HTTP method name ('GET', etc.) to an
            // array of all the corresponding Route instances that are registered.
            this._routes = new Map();

            if (handleFetch) {
                this._addFetchListener();
            }
        }

        /**
         * This method will actually add the fetch event listener.
         */
        _addFetchListener() {
            self.addEventListener('fetch', (event) => {
                const url = new URL(event.request.url);
                if (!url.protocol.startsWith('http')) {
                    logHelper.log({
                        that: this,
                        message: 'URL does not start with HTTP and so not passing ' +
                            'through the router.',
                        data: {
                            request: event.request,
                        },
                    });
                    return;
                }

                let responsePromise;
                let matchingRoute;
                for (let route of (this._routes.get(event.request.method) || [])) {
                    const matchResult = route.match({url, event});
                    if (matchResult) {
                        matchingRoute = route;

                        logHelper.log({
                            that: this,
                            message: 'The router found a matching route.',
                            data: {
                                route: matchingRoute,
                                request: event.request,
                            },
                        });

                        let params = matchResult;

                        if (Array.isArray(params) && params.length === 0) {
                            // Instead of passing an empty array in as params, use undefined.
                            params = undefined;
                        } else if (params.constructor === Object &&
                            Object.keys(params).length === 0) {
                            // Instead of passing an empty object in as params, use undefined.
                            params = undefined;
                        }

                        responsePromise = route.handler.handle({url, event, params});
                        break;
                    }
                }

                if (!responsePromise && this.defaultHandler) {
                    responsePromise = this.defaultHandler.handle({url, event});
                }

                if (responsePromise && this.catchHandler) {
                    responsePromise = responsePromise.catch((error) => {
                        return this.catchHandler.handle({url, event, error});
                    });
                }

                if (responsePromise) {
                    event.respondWith(responsePromise
                        .then((response) => {
                            logHelper.debug({
                                that: this,
                                message: 'The router is managing a route with a response.',
                                data: {
                                    route: matchingRoute,
                                    request: event.request,
                                    response: response,
                                },
                            });

                            return response;
                        }));
                }
            });
        }

        /**
         * An optional {RouteHandler} that's called by default when no routes
         * explicitly match the incoming request.
         *
         * If the default is not provided, unmatched requests will go against the
         * network as if there were no service worker present.
         *
         * @example
         * router.setDefaultHandler({
         *   handler: new workbox.runtimeCaching.NetworkFirst()
         * });
         *
         * @param {Object} input
         * @param {module:workbox-routing.RouteHandler} input.handler The handler to
         * use to provide a response.
         */
        setDefaultHandler({handler} = {}) {
            this.defaultHandler = normalizeHandler(handler);
        }

        /**
         * If a Route throws an error while handling a request, this {RouteHandler}
         * will be called and given a chance to provide a response.
         *
         * @example
         * router.setCatchHandler(({event}) => {
         *   if (event.request.mode === 'navigate') {
         *     return caches.match('/error-page.html');
         *   }
         *   return Response.error();
         * });
         *
         * @param {Object} input
         * @param {module:workbox-routing.RouteHandler} input.handler The handler to
         * use to provide a response.
         */
        setCatchHandler({handler} = {}) {
            this.catchHandler = normalizeHandler(handler);
        }

        /**
         * Register routes will take an array of Routes to register with the
         * router.
         *
         * @example
         * router.registerRoutes({
         *   routes: [
         *     new RegExpRoute({ ... }),
         *     new ExpressRoute({ ... }),
         *     new Route({ ... }),
         *   ]
         * });
         *
         * @param {Object} input
         * @param {Array<Route>} input.routes An array of routes to
         * register.
         */
        registerRoutes({routes} = {}) {
            assert.isArrayOfClass({routes}, Route);

            for (let route of routes) {
                if (!this._routes.has(route.method)) {
                    this._routes.set(route.method, []);
                }

                // Give precedence to the most recent route by listing it first.
                this._routes.get(route.method).unshift(route);
            }
        }

        /**
         * Registers a single route with the router.
         *
         * @example
         * router.registerRoute({
         *   route: new Route({ ... })
         * });
         *
         * @param {Object} input
         * @param {module:workbox-routing.Route} input.route The route to register.
         */
        registerRoute({route} = {}) {
            assert.isInstance({route}, Route);

            this.registerRoutes({routes: [route]});
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * # workbox-routing
     *
     * A service worker helper library to route request URLs to handlers.
     *
     * **Install:** `npm install --save-dev workbox-routing`
     *
     * @module workbox-routing
     */

    /**
     * A handler that can be automatically invoked by a route, and knows how to
     * respond to a request. It can either be a standalone function or a subclass of
     * {@link module:workbox-runtime-caching.Handler|Handler}.
     *
     * @callback RouteHandler
     * @param {Object} input
     * @param {URL} input.url The request's URL.
     * @param {FetchEvent} input.event The event that triggered the `fetch` handler.
     * @param {Array<Object>} input.params Any additional parameters that the
     * {@link module:workbox-routing.Route|Route} provides, such as named parameters
     * in an {@link module:workbox-routing.ExpressRoute|ExpressRoute}.
     * @return {Promise<Response>} The response that will fulfill the request.
     * @memberof module:workbox-routing
     */

    /**
     * A function that can be automatically invoked by a route to determine whether
     * or not an incoming network request should trigger the route's handler.
     *
     * @callback Matcher
     * @param {Object} input
     * @param {URL} input.url The request's URL.
     * @param {FetchEvent} input.event The event that triggered the `fetch` handler.
     * @return {Array<Object>|null} To signify a match, return a (possibly empty)
     * array of values which will be passed in a params to the
     * {@link module:workbox-routing.RouteHandler|RouteHandler}.
     * Otherwise, return null if the route shouldn't match.
     * @memberof module:workbox-routing
     */

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /* eslint-env browser, serviceworker */

    /**
     * Adds a friendly API on top of the router from the
     * {@link module:workbox-routing|workbox-routing module}.
     *
     * @example <caption>How to define a simple route with caching
     * strategy.</caption>
     *
     * const workboxSW = new WorkboxSW();
     * workboxSW.router.registerRoute('/about',
     *  workboxSW.strategies.cacheFirst());
     *
     * @example <caption>How to define a simple route with custom caching
     * strategy.</caption>
     *
     * const workboxSW = new WorkboxSW();
     * workboxSW.router.registerRoute('/about', (args) => {
     *   // The requested URL
     *   console.log(args.url);
     *
     *   // The FetchEvent to handle
     *   console.log(args.event);
     *
     *   // The parameters from the matching route (Commonly
     *   // used with Regex / Express routes).
     *   console.log(args.params);
     *
     *   // Return a promise that resolves with a Response.
     *   return fetch(args.url);
     * }));
     *
     * @memberof module:workbox-sw
     */
    class Router$$1 extends Router$2 {
        /**
         * Constructs a light wrapper on top of the underlying `Router`.
         * @param {String} revisionedCacheName The cache name used for entries cached
         *        via precache().
         * @param {boolean} handleFetch Determines if the router should handle fetch
         * events.
         */
        constructor(revisionedCacheName, handleFetch) {
            super({handleFetch});
            this._revisionedCacheName = revisionedCacheName;
        }

        /**
         * @param {String|RegExp|Route} capture The capture for a route can be one
         * of three types.
         * 1. It can be an Express style route, like '/path/to/:anything' for
         *    same-origin or 'https://cross-origin.com/path/to/:anything' for
         *    cross-origin routes.
         * 1. A regular expression that will be tested against request URLs. For
         *    cross-origin routes, you must use a RegExp that matches the start of the
         *    full URL, like `new RegExp('https://cross-origin\.com/')`.
         * 1. A [Route]{@link module:workbox-sw.SWLib#Route} instance.
         * @param {module:workbox-routing.RouteHandler} handler The handler to use to
         * provide a response if the route matches. The handler argument is ignored if
         * you pass in a Route object, otherwise it's required.
         */
        registerRoute(capture, handler) {
            if (typeof handler === 'function') {
                handler = {
                    handle: handler,
                };
            }

            if (typeof capture === 'string') {
                if (capture.length === 0) {
                    throw ErrorFactory.createError('empty-express-string');
                }

                super.registerRoute({
                    route: new ExpressRoute({path: capture, handler}),
                });
            } else if (capture instanceof RegExp) {
                super.registerRoute({
                    route: new RegExpRoute({regExp: capture, handler}),
                });
            } else if (capture instanceof Route) {
                super.registerRoute({route: capture});
            } else {
                throw ErrorFactory.createError('unsupported-route-type');
            }
        }

        /**
         * A shortcut used to register a
         * {@link module:workbox-routing.NavigationRoute} instance that will
         * respond to navigation requests using a cache entry for `url`.
         *
         * This is useful when following the [App Shell pattern](https://developers.google.com/web/fundamentals/architecture/app-shell#example-html-for-appshell),
         * in which the previously cached shell is returned for all navigations.
         *
         * The `url` value should correspond to an entry that's already in the cache,
         * perhaps a URL that is managed by
         * {@link module:workbox-sw.SWLib#precache}. Using a URL that isn't
         * already cached will lead to failed navigations.
         *
         * @param {String} url The URL of the already cached HTML resource.
         * @param {Object} [options]
         * @param {Array<RegExp>} [options.blacklist] Defaults to an empty blacklist.
         * @param {Array<RegExp>} [options.whitelist] Defaults to `[/./]`, which will
         *        match all request URLs.
         * @param {String} [options.cacheName] The name of the cache which contains
         *        the cached response for `url`. Defaults to the name of the cache
         *        used by precache().
         */
        registerNavigationRoute(url, options = {}) {
            if (typeof url !== 'string') {
                throw ErrorFactory.createError('navigation-route-url-string');
            }

            // Allow folks to explicitly pass in a null/undefined cacheName option if
            // they want that behavior.
            const cacheName = 'cacheName' in options ?
                options.cacheName :
                this._revisionedCacheName;

            super.registerRoute({
                route: new NavigationRoute({
                    handler: () => caches.match(url, {cacheName}),
                    whitelist: options.whitelist || [/./],
                    blacklist: options.blacklist || [],
                })
            });
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    const errors$2 = {
        'multiple-cache-will-update-plugins': 'You cannot register more than one ' +
            'plugin that implements cacheWillUpdate.',
        'multiple-cache-will-match-plugins': 'You cannot register more than one ' +
            'plugin that implements cacheWillMatch.',
        'invalid-response-for-caching': 'The fetched response could not be cached ' +
            'due to an invalid response code.',
        'no-response-received': 'No response received; falling back to cache.',
        'bad-cache-id': `The 'cacheId' parameter must be a string with at least ` +
            `one character.`,
    };

    var ErrorFactory$4 = new ErrorFactory$1(errors$2);

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * Use this plugin to cache responses with certain HTTP status codes or
     * header values.
     *
     * Defining both status codes and headers will cache requests with a matching
     * status code and a matching header.
     *
     * @example
     * new workbox.cacheableResponse.CacheableResponse({
     *   statuses: [0, 200, 404],
     *   headers: {
     *     'Example-Header-1': 'Header-Value-1'
     *     'Example-Header-2': 'Header-Value-2'
     *   }
     * })
     *
     * @memberof module:workbox-cacheable-response
     */
    class CacheableResponse {
        /**
         * Creates a new `Plugin` instance, which stores configuration and logic
         * to determine whether a `Response` object is cacheable or not.
         *
         * If multiple criteria are present (e.g. both `statuses` and `headers`), then
         * the `Response` needs to meet all of the criteria to be cacheable.
         *
         * @param {Object} input
         * @param {Array<Number>} [input.statuses] The status codes that are
         *        checked when determining whether a `Response` is cacheable.
         * @param {Object<String,String>} [input.headers] The header values that are
         *        checked when determining whether a `Response` is cacheable.
         */
        constructor({statuses, headers} = {}) {
            assert.atLeastOne({statuses, headers});
            if (statuses !== undefined) {
                assert.isArrayOfType({statuses}, 'number');
            }
            if (headers !== undefined) {
                assert.isType({headers}, 'object');
            }

            this.statuses = statuses;
            this.headers = headers;
        }

        /**
         * Checks a response to see whether it's cacheable or not, based on the
         * configuration of this object.
         *
         * @param {Object} input
         * @param {Response} input.response The response that might be cached.
         * @param {Request} [input.request] Optionally, the request that led to the
         *        response.
         * @return {boolean} `true` if the `Response` is cacheable, based on the
         *          configuration of this object, and `false` otherwise.
         */
        isResponseCacheable({request, response} = {}) {
            assert.isInstance({response}, Response);

            let cacheable = true;

            if (this.statuses) {
                cacheable = this.statuses.includes(response.status);
            }

            if (this.headers && cacheable) {
                cacheable = Object.keys(this.headers).some((headerName) => {
                    return response.headers.get(headerName) === this.headers[headerName];
                });
            }

            if (!cacheable) {
                const data = {response};
                if (this.statuses) {
                    data['valid-status-codes'] = JSON.stringify(this.statuses);
                }
                if (this.headers) {
                    data['valid-headers'] = JSON.stringify(this.headers);
                }
                if (request) {
                    data['request'] = request;
                }

                logHelper.debug({
                    message: `The response does not meet the criteria for being added to the
          cache.`,
                    data,
                });
            }

            return cacheable;
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * Use this plugin to cache responses with certain HTTP status codes or
     * header values.
     *
     * Defining both status codes and headers will cache requests with a matching
     * status code and a matching header.
     *
     * This class is meant to be automatically invoked as a plugin to a
     * {@link module:workbox-runtime-caching.RequestWrapper|RequestWrapper}, which
     * is used by the `workbox-sw` and `workbox-runtime-caching` modules.
     *
     * If you would like to use this functionality outside of the `RequestWrapper`
     * context, please use the `CacheableResponse` class directly.
     *
     * @example
     * new workbox.cacheableResponse.CacheableResponsePlugin({
     *   statuses: [0, 200, 404],
     *   headers: {
     *     'Example-Header-1': 'Header-Value-1'
     *     'Example-Header-2': 'Header-Value-2'
     *   }
     * });
     *
     * @memberof module:workbox-cacheable-response
     */
    class CacheableResponsePlugin extends CacheableResponse {
        /**
         * A "lifecycle" callback that will be triggered automatically by the
         * `workbox.runtimeCaching` handlers prior to an entry being added to a cache.
         *
         * @private
         * @param {Object} input
         * @param {Request} input.request The request that led to the response.
         * @param {Response} input.response The response that might be cached.
         * @return {boolean} `true` if the `Response` is cacheable, based on the
         *          configuration of this object, and `false` otherwise.
         */
        cacheWillUpdate({request, response} = {}) {
            return this.isResponseCacheable({request, response});
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * # workbox-cacheable-response
     *
     * Given a Response object this behaviour determines whether
     * it's cacheable, based on a specific configuration.
     *
     * **Install:** `npm install --save-dev workbox-cacheable-response`
     *
     * @example <caption>Used as an automatically invoked
     * "plugin".</caption>
     *
     * // The responses will be cached if the response code is 0, 200, or 404, and
     * // will not be cached otherwise.
     * const cacheablePlugin = new workbox.cacheableResponse.Plugin({
     *   statuses: [0, 200, 404]
     * });
     *
     * const requestWrapper = new workbox.runtimeCaching.RequestWrapper({
     *   cacheName: 'runtime-cache',
     *   plugins: [
     *     cacheablePlugin
     *   ]
     * });
     *
     * const route = new workbox.routing.RegExpRoute({
     *   match: ({url}) => url.domain === 'example.com',
     *   handler: new workbox.runtimeCaching.StaleWhileRevalidate({requestWrapper})
     * });
     *
     * @module workbox-cacheable-response
     */

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * The default cache name, used by
     * {@link module:workbox-runtime-caching.RequestWrapper|RequestWrapper} when
     * there's no name provided.
     *
     * It combines a constant prefix with the `registration.scope` value associated
     * with the current service worker, ensuring that multiple service workers used
     * on the same origin will have different default caches.
     *
     * Calling this method without any parameters, this will return
     * `workbox-runtime-caching-<service worker scope>`.
     *
     * If you pass in a cacheId, it will prepend this, returning:
     * `<cacheid>-workbox-runtime-caching-<service worker scope>`.
     *
     * @memberof module:workbox-runtime-caching
     * @param {Object} input
     * @param {string} input.cacheId This will be prepended to the default cache
     * name.
     * @return {string} returns the default cache name used provided these
     * parameters.
     */
    const getDefaultCacheName = ({cacheId} = {}) => {
        let cacheName = `workbox-runtime-caching`;
        if (cacheId) {
            cacheName = `${cacheId}-${cacheName}`;
        }

        if (self && self.registration) {
            cacheName += `-${self.registration.scope}`;
        }

        return cacheName;
    };

    /**
     * A list of the callback method names that the RequestWrapper might trigger.
     *
     * @private
     * @type {Array.<string>}
     * @memberof module:workbox-runtime-caching
     */
    const pluginCallbacks = [
        'cacheDidUpdate',
        'cacheWillMatch',
        'cacheWillUpdate',
        'fetchDidFail',
        'requestWillFetch',
    ];

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * Helper method to "clean" a redirected response, so that it could be used
     * to fulfill a navigation request.
     * See https://bugs.chromium.org/p/chromium/issues/detail?id=669363&desc=2#c1
     *
     * @private
     * @param {Object} input
     * @param {Response} input.response The original response. The body will not
     * be consumed.
     * @return {Promise<Response>} A clone of the response, with `redirected` false.
     */
    var cleanResponseCopy = ({response}) => {
        assert.isInstance({response}, Response);

        const clonedResponse = response.clone();

        // Not all browsers support the Response.body stream, so fall back to reading
        // the entire body into memory as a blob.
        const bodyPromise = 'body' in clonedResponse ?
            Promise.resolve(clonedResponse.body) :
            clonedResponse.blob();

        return bodyPromise.then((body) => {
            // new Response() is happy when passed either a stream or a Blob.
            return new Response(body, {
                headers: clonedResponse.headers,
                status: clonedResponse.status,
                statusText: clonedResponse.statusText,
            });
        });
    };

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * This class is used by the various subclasses of `Handler` to configure the
     * cache name and any desired plugins, which is to say classes that implement
     * request lifecycle callbacks.
     *
     * It automatically triggers any registered callbacks at the appropriate time.
     * The current set of plugin callbacks, along with the parameters they're
     * given and when they're called, is:
     *
     *   - `cacheWillUpdate({request, response})`: Called prior to writing an entry
     *   to the cache, allowing the callback to decide whether or not the cache
     *   entry should be written.
     *   - `cacheDidUpdate({cacheName, oldResponse, newResponse, url})`: Called
     *   whenever an entry is written to the cache, giving the callback a chance to
     *   notify clients about the update or implement cache expiration.
     *   - `cacheWillMatch({cachedResponse})`: Called whenever a response is read
     *   from the cache and is about to be used, giving the callback a chance to
     *   perform validity/freshness checks.
     *   - `fetchDidFail({request})`: Called whenever a network request fails.
     *
     * @memberof module:workbox-runtime-caching
     */
    class RequestWrapper {
        /**
         * Constructor for RequestWrapper.
         * @param {Object} input
         * @param {string} [input.cacheName] The name of the cache to use for Handlers
         *        that involve caching. If none is provided, a default name that
         *        includes the current service worker scope will be used.
         * @param {Array.<Object>} [input.plugins] Any plugins that should be
         *        invoked.
         * @param {Object} [input.fetchOptions] Values passed along to the
         *        [`init`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch#Parameters)
         *        of all `fetch()` requests made by this wrapper.
         * @param {Object} [input.matchOptions] Values passed along to the
         *        [`options`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/match#Parameters)
         *        of all cache `match()` requests made by this wrapper.
         */
        constructor({cacheName, cacheId, plugins, fetchOptions, matchOptions} = {}) {
            if (cacheId && (typeof cacheId !== 'string' || cacheId.length === 0)) {
                throw ErrorFactory$4.createError('bad-cache-id');
            }

            if (cacheName) {
                assert.isType({cacheName}, 'string');
                this.cacheName = cacheName;
                if (cacheId) {
                    this.cacheName = `${cacheId}-${this.cacheName}`;
                }
            } else {
                this.cacheName = getDefaultCacheName({cacheId});
            }

            if (fetchOptions) {
                assert.isType({fetchOptions}, 'object');
                this.fetchOptions = fetchOptions;
            }

            if (matchOptions) {
                assert.isType({matchOptions}, 'object');
                this.matchOptions = matchOptions;
            }

            this.plugins = new Map();

            if (plugins) {
                assert.isArrayOfType({plugins}, 'object');

                plugins.forEach((plugin) => {
                    for (let callbackName of pluginCallbacks) {
                        if (typeof plugin[callbackName] === 'function') {
                            if (!this.plugins.has(callbackName)) {
                                this.plugins.set(callbackName, []);
                            } else if (callbackName === 'cacheWillUpdate') {
                                throw ErrorFactory$4.createError(
                                    'multiple-cache-will-update-plugins');
                            } else if (callbackName === 'cacheWillMatch') {
                                throw ErrorFactory$4.createError(
                                    'multiple-cache-will-match-plugins');
                            }
                            this.plugins.get(callbackName).push(plugin);
                        }
                    }
                });
            }

            if (this.plugins.has('cacheWillUpdate')) {
                this._userSpecifiedCachableResponsePlugin =
                    this.plugins.get('cacheWillUpdate')[0];
            }
        }


        /**
         * @private
         * @return {function} The default plugin used to determine whether a
         *         response is cacheable.
         */
        getDefaultCacheableResponsePlugin() {
            // Lazy-construct the CacheableResponsePlugin instance.
            if (!this._defaultCacheableResponsePlugin) {
                this._defaultCacheableResponsePlugin =
                    new CacheableResponsePlugin({statuses: [200]});
            }
            return this._defaultCacheableResponsePlugin;
        }

        /**
         * Opens a cache and maintains a reference to that cache
         * for future use.
         *
         * @example
         * requestWrapper.getCache()
         * .then((openCache) => {
         *    ...
         * });
         *
         * @return {Promise<Cache>} An open `Cache` instance based on the configured
         * `cacheName`.
         */
        async getCache() {
            if (!this._cache) {
                this._cache = await caches.open(this.cacheName);
            }
            return this._cache;
        }

        /**
         * Wraps `cache.match()`, using the previously configured cache name and match
         * options.
         *
         * @example
         * requestWrapper.match({event.request})
         * .then((response) => {
         *   if (!response) {
         *     // No response in cache.
         *     return;
         *   }
         *   ...
         * });
         *
         * @param {Object} input
         * @param {Request|string} input.request The key for the cache lookup.
         * @return {Promise.<Response>} The cached response.
         */
        async match({request}) {
            assert.atLeastOne({request});

            const cache = await this.getCache();
            let cachedResponse = await cache.match(request, this.matchOptions);

            if (this.plugins.has('cacheWillMatch')) {
                const plugin = this.plugins.get('cacheWillMatch')[0];
                cachedResponse = plugin.cacheWillMatch({
                    request, cache, cachedResponse,
                    matchOptions: this.matchOptions
                });
            }

            return cachedResponse;
        }

        /**
         * Wraps `fetch()`, calls all `requestWillFetch` before making the network
         * request, and calls any `fetchDidFail` callbacks from the
         * registered plugins if the request fails.
         *
         * @example
         * requestWrapper.fetch({
         *   request: event.request
         * })
         * .then((response) => {
         *  ...
         * })
         * .catch((err) => {
         *   ...
         * });
         *
         * @param {Object} input
         * @param {Request|string} input.request The request or URL to be fetched.
         * @return {Promise.<Response>} The network response.
         */
        async fetch({request}) {
            if (typeof request === 'string') {
                request = new Request(request);
            } else {
                assert.isInstance({request}, Request);
            }

            // If there is a fetchDidFail plugin, we need to save a clone of the
            // original request before it's either modified by a requestWillFetch
            // plugin or before the original request's body is consumed via fetch().
            const clonedRequest = this.plugins.has('fetchDidFail') ?
                request.clone() : null;

            if (this.plugins.has('requestWillFetch')) {
                for (let plugin of this.plugins.get('requestWillFetch')) {
                    const returnedPromise = plugin.requestWillFetch({request});
                    assert.isInstance({returnedPromise}, Promise);
                    const returnedRequest = await returnedPromise;
                    assert.isInstance({returnedRequest}, Request);
                    request = returnedRequest;
                }
            }

            try {
                return await fetch(request, this.fetchOptions);
            } catch (err) {
                if (this.plugins.has('fetchDidFail')) {
                    for (let plugin of this.plugins.get('fetchDidFail')) {
                        plugin.fetchDidFail({request: clonedRequest.clone()});
                    }
                }

                throw err;
            }
        }

        /**
         * Combines both fetching and caching using the previously configured options
         * and calling the appropriate plugins.
         *
         * By default, responses with a status of [2xx](https://fetch.spec.whatwg.org/#ok-status)
         * will be considered valid and cacheable, but this could be overridden by
         * configuring one or more plugins that implement the `cacheWillUpdate`
         * lifecycle callback.
         *
         * @example
         * requestWrapper.fetchAndCache({
         *   request: event.request
         * })
         * .then((response) => {
         *  ...
         * })
         * .catch((err) => {
         *   ...
         * });
         *
         * @param {Object} input
         * @param {Request} input.request The request to fetch.
         * @param {boolean} [input.waitOnCache] `true` means the method should wait
         *        for the cache.put() to complete before returning. The default value
         *        of `false` means return without waiting. It this value is true
         *        and the response can't be cached, an error will be thrown.
         * @param {Request} [input.cacheKey] Supply a cacheKey if you wish to cache
         *        the response against an alternative request to the `request`
         *        argument.
         * @param {function} [input.cacheResponsePlugin] Allows the
         *        caller to override the default check for cacheability, for
         *        situations in which the cacheability check wasn't explicitly
         *        configured when constructing the `RequestWrapper`.
         * @param {boolean} [input.cleanRedirects] If true, a "clean" copy of any
         * redirected responses will be added to the cache, since redirected responses
         * [can't be used](https://bugs.chromium.org/p/chromium/issues/detail?id=669363&desc=2#c1)
         * to satisfy navigation requests. Defaults to false.
         * @return {Promise.<Response>} The network response.
         */
        async fetchAndCache(
            {request, waitOnCache, cacheKey, cacheResponsePlugin, cleanRedirects}) {
            assert.atLeastOne({request});

            let cachingComplete;
            const response = await this.fetch({request});

            // We need flexibility in determining whether a given response should
            // be added to the cache. There are several possible ways that this logic
            // might be specified, and they're given the following precedence:
            // 1. Passing in a `CacheableResponsePlugin` to the `RequestWrapper`
            //    constructor, which sets this._userSpecifiedCachableResponsePlugin.
            // 2. Passing in a parameter to the fetchAndCache() method (done by certain
            //    runtime handlers, like `StaleWhileRevalidate`), which sets
            //    cacheResponsePlugin.
            // 3. The default that applies to anything using the `RequestWrapper` class
            //    that doesn't specify the custom behavior, which is accessed via
            //    the this.getDefaultCacheableResponsePlugin().
            const effectiveCacheableResponsePlugin =
                this._userSpecifiedCachableResponsePlugin ||
                cacheResponsePlugin ||
                this.getDefaultCacheableResponsePlugin();

            // Whichever plugin we've decided is appropriate, we now call its
            // cacheWillUpdate() method to determine cacheability of the response.
            const cacheable = effectiveCacheableResponsePlugin.cacheWillUpdate(
                {request, response});

            if (cacheable) {
                // If cleanRedirects is set and this is a redirected response, then
                // get a "clean" copy to add to the cache.
                const newResponse = cleanRedirects && response.redirected ?
                    await cleanResponseCopy({response}) :
                    response.clone();

                // cachingComplete is a promise that may or may not be used to delay the
                // completion of this method, depending on the value of `waitOnCache`.
                cachingComplete = this.getCache().then(async (cache) => {
                    let oldResponse;
                    const cacheRequest = cacheKey || request;

                    // Only bother getting the old response if the new response isn't opaque
                    // and there's at least one cacheDidUpdate plugin. Otherwise, we don't
                    // need it.
                    if (response.type !== 'opaque' &&
                        this.plugins.has('cacheDidUpdate')) {
                        oldResponse = await this.match({request: cacheRequest});
                    }

                    // Regardless of whether or not we'll end up invoking
                    // cacheDidUpdate, wait until the cache is updated.
                    await cache.put(cacheRequest, newResponse);

                    if (this.plugins.has('cacheDidUpdate')) {
                        for (let plugin of this.plugins.get('cacheDidUpdate')) {
                            await plugin.cacheDidUpdate({
                                cacheName: this.cacheName,
                                oldResponse,
                                newResponse,
                                // cacheRequest may be a Request with a url property, or a string.
                                url: ('url' in cacheRequest) ? cacheRequest.url : cacheRequest,
                            });
                        }
                    }
                });
            } else if (!cacheable && waitOnCache) {
                // If the developer requested to wait on the cache but the response
                // isn't cacheable, throw an error.
                throw ErrorFactory$4.createError('invalid-response-for-caching');
            }

            // Only conditionally await the caching completion, giving developers the
            // option of returning early for, e.g., read-through-caching scenarios.
            if (waitOnCache && cachingComplete) {
                await cachingComplete;
            }

            return response;
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * This a base class which each caching strategy extends.
     *
     * @memberof module:workbox-runtime-caching
     */
    class Handler {
        /**
         * Constructor for a new Handler instance.
         *
         * @param {Object} input
         * @param {boolean} [input.waitOnCache] For handlers that write to the cache,
         *        `true` means the method should wait for the cache.put() to complete
         *        before returning. The default value of `false` means return without
         *        waiting. It this value is true and the response can't be cached, an
         *        error will be thrown.
         * @param {RequestWrapper} [input.requestWrapper] An optional `RequestWrapper`
         *        that is used to configure the cache name and request plugins. If
         *        not provided, a new `RequestWrapper` using the
         *        [default cache name](#getDefaultCacheName) will be used.
         */
        constructor({requestWrapper, waitOnCache} = {}) {
            if (requestWrapper) {
                this.requestWrapper = requestWrapper;
            } else {
                this.requestWrapper = new RequestWrapper();
            }

            this.waitOnCache = Boolean(waitOnCache);
        }

        /**
         * An abstract method that each subclass must implement.
         *
         * @abstract
         * @param {Object} input
         * @param {FetchEvent} input.event The event that triggered the service
         *        worker's fetch handler.
         * @param {Object} [input.params] Additional parameters that might be passed
         *        in to the method. If used in conjunction with the
         *        {@link module:workbox-routing.Route|Route} class, then the return
         *        value from the `match` function in the Route constructor
         *        will be passed in as the `params` value.
         * @return {Promise.<Response>} A promise resolving with a response.
         */
        handle({event, params} = {}) {
            throw Error('This abstract method must be implemented in a subclass.');
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * An implementation of a [cache-first](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network)
     * request strategy.
     *
     * The important thing to note with this caching strategy is that once a
     * response is cached, it will not be updated. This is useful for assets
     * that are revisioned as it caches the asset long term and doesn't waste
     * the user's data.
     *
     * @example
     * // Set up a route to match any requests made for URLs that end in .txt.
     * // The requests are handled with a cache-first strategy.
     * const route = new workbox.routing.RegExpRoute({
     *   regExp: /\.txt$/,
     *   handler: new workbox.runtimeCaching.CacheFirst(),
     * });
     *
     * const router = new workbox.routing.Router();
     * router.registerRoute({route});
     *
     * @memberof module:workbox-runtime-caching
     * @extends Handler
     */
    class CacheFirst extends Handler {
        /**
         * The handle method will be called by the
         * {@link module:workbox-routing.Route|Route} class when a route matches a
         * request.
         *
         * @param {Object} input
         * @param {FetchEvent} input.event The event that triggered the service
         *        worker's fetch handler.
         * @return {Promise.<Response>} The response, either from the cache,
         *          or if that isn't available, from the network.
         */
        async handle({event} = {}) {
            assert.isInstance({event}, FetchEvent);

            const cachedResponse = await this.requestWrapper.match({
                request: event.request,
            });

            return cachedResponse || await this.requestWrapper.fetchAndCache({
                request: event.request,
                waitOnCache: this.waitOnCache,
            });
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * An implementation of a [cache-only](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-only)
     * request strategy.
     *
     * The advantage to using this versus directly calling `caches.match()` is that
     * it will use the cache configuration and trigger the plugins defined in
     * the underlying `RequestWrapper`.
     *
     * @example
     * // Set up a route to match any requests made for URLs that end in .txt.
     * // The requests are handled with a cache-only strategy.
     * const route = new workbox.routing.RegExpRoute({
     *   regExp: /\.txt$/,
     *   handler: new workbox.runtimeCaching.CacheOnly(),
     * });
     *
     * const router = new workbox.routing.Router();
     * router.registerRoute({route});
     *
     * @memberof module:workbox-runtime-caching
     * @extends Handler
     */
    class CacheOnly extends Handler {
        /**
         * The handle method will be called by the
         * {@link module:workbox-routing.Route|Route} class when a route matches a
         * request.
         *
         * @param {Object} input
         * @param {FetchEvent} input.event The event that triggered the service
         *        worker's fetch handler.
         * @return {Promise.<Response>} The response from the cache.
         */
        async handle({event} = {}) {
            assert.isInstance({event}, FetchEvent);

            return await this.requestWrapper.match({request: event.request});
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * An implementation of a [network first](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-falling-back-to-cache)
     * request strategy.
     *
     * By default, `NetworkFirst` will cache responses with a 200 status code as
     * well as [opaque responses](http://stackoverflow.com/q/39109789)
     * (responses from cross-origin servers which don't support
     * [CORS](https://enable-cors.org/)). You can override this default by passing
     * in a `RequestWrapper` that includes an appropriately-configured
     * `CacheableResponsePlugin`.
     *
     * @example
     * // Set up a route to match any requests made for URLs that end in .txt.
     * // The requests are handled with a network-first strategy.
     * const route = new workbox.routing.RegExpRoute({
     *   regExp: /\.txt$/,
     *   handler: new workbox.runtimeCaching.NetworkFirst(),
     * });
     *
     * const router = new workbox.routing.Router();
     * router.registerRoute({route});
     *
     * @memberof module:workbox-runtime-caching
     * @extends Handler
     */
    class NetworkFirst extends Handler {
        /**
         * Constructor for a new NetworkFirst instance.
         *
         * @param {Object} input
         * @param {number} [input.networkTimeoutSeconds] If set, and a network
         *        response isn't returned timeout is reached, then the cached response
         *        will be returned instead. If there is no previously cached response,
         *        then an `null` response will be returned. This option is meant to
         *        combat "[lie-fi](https://developers.google.com/web/fundamentals/performance/poor-connectivity/#lie-fi)"
         *        scenarios.
         * @param {RequestWrapper} [input.requestWrapper] An optional `RequestWrapper`
         *        that is used to configure the cache name and request plugins. If
         *        not provided, a new `RequestWrapper` using the
         *        [default cache name](#getDefaultCacheName) will be used.
         */
        constructor(input = {}) {
            super(input);

            this._cacheablePlugin = new CacheableResponsePlugin({statuses: [0, 200]});

            const {networkTimeoutSeconds} = input;
            if (networkTimeoutSeconds) {
                assert.isType({networkTimeoutSeconds}, 'number');
                this.networkTimeoutSeconds = networkTimeoutSeconds;
            }
        }

        /**
         * The handle method will be called by the
         * {@link module:workbox-routing.Route|Route} class when a route matches a
         * request.
         *
         * @param {Object} input
         * @param {FetchEvent} input.event The event that triggered the service
         *        worker's fetch handler.
         * @return {Promise.<Response>} The response from the network, or if that's
         *          not available, a previously cached response.
         */
        async handle({event} = {}) {
            assert.isInstance({event}, FetchEvent);

            const promises = [];
            let timeoutId;

            if (this.networkTimeoutSeconds) {
                promises.push(new Promise((resolve) => {
                    timeoutId = setTimeout(() => {
                        resolve(this.requestWrapper.match({request: event.request}));
                    }, this.networkTimeoutSeconds * 1000);
                }));
            }

            const networkPromise = this.requestWrapper.fetchAndCache({
                request: event.request,
                waitOnCache: this.waitOnCache,
                cacheResponsePlugin: this._cacheablePlugin,
            }).then((response) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                return response ?
                    response :
                    Promise.reject(ErrorFactory$4.createError('no-response-received'));
            }).catch(() => this.requestWrapper.match({request: event.request}));

            promises.push(networkPromise);

            return Promise.race(promises);
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * An implementation of a [network-only](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-only)
     * request strategy.
     *
     * The advantage to using this versus directly calling `fetch()` is that it will
     * trigger the plugins defined in the underlying `RequestWrapper`.
     *
     *
     * @example
     * // Set up a route to match any requests made for URLs that end in .txt.
     * // The requests are handled with a network-only strategy.
     * const route = new workbox.routing.RegExpRoute({
     *   regExp: /\.txt$/,
     *   handler: new workbox.runtimeCaching.NetworkOnly(),
     * });
     *
     * const router = new workbox.routing.Router();
     * router.registerRoute({route});
     *
     * @memberof module:workbox-runtime-caching
     * @extends Handler
     */
    class NetworkOnly extends Handler {
        /**
         * The handle method will be called by the
         * {@link module:workbox-routing.Route|Route} class when a route matches a
         * request.
         *
         * @param {Object} input
         * @param {FetchEvent} input.event The event that triggered the service
         *        worker's fetch handler.
         * @return {Promise.<Response>} The response from the network.
         */
        async handle({event} = {}) {
            assert.isInstance({event}, FetchEvent);

            return await this.requestWrapper.fetch({request: event.request});
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * An implementation of a [stale-while-revalidate](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate)
     * request strategy.
     *
     * Resources are requested from both the cache and the network in parallel, then
     * responds with the cached version. The cache is replaced with whatever returns
     * from the network. In addition to updating the appropriate caches, it will
     * also trigger any appropriate plugins defined in the underlying
     * `RequestWrapper`.
     *
     * This strategy is the closest equivalent to the sw-toolbox
     * [fastest](https://googlechrome.github.io/sw-toolbox/api.html#toolboxfastest)
     * strategy.
     *
     * By default, `StaleWhileRevalidate` will cache responses with a 200 status
     * code as well as [opaque responses](http://stackoverflow.com/q/39109789)
     * (responses from cross-origin servers which don't support
     * [CORS](https://enable-cors.org/)). You can override this default by passing
     * in a `RequestWrapper` that includes an appropriately-configured
     * `CacheableResponsePlugin`.
     *
     * @example
     * // Set up a route to match any requests made for URLs that end in .txt.
     * // The requests are handled with a stale-while-revalidate strategy.
     * const route = new workbox.routing.RegExpRoute({
     *   regExp: /\.txt$/,
     *   handler: new workbox.runtimeCaching.StaleWhileRevalidate(),
     * });
     *
     * const router = new workbox.routing.Router();
     * router.registerRoute({route});
     *
     * @memberof module:workbox-runtime-caching
     * @extends Handler
     */
    class StaleWhileRevalidate extends Handler {
        /**
         * Constructor for a new StaleWhileRevalidate instance.
         *
         * @param {Object} input
         * @param {RequestWrapper} [input.requestWrapper] An optional `RequestWrapper`
         *        that is used to configure the cache name and request plugins. If
         *        not provided, a new `RequestWrapper` using the
         *        [default cache name](#defaultCacheName) will be used.
         */
        constructor(input = {}) {
            super(input);

            this._cacheablePlugin = new CacheableResponsePlugin({statuses: [0, 200]});
        }

        /**
         * The handle method will be called by the
         * {@link module:workbox-routing.Route|Route} class when a route matches a
         * request.
         *
         * @param {Object} input
         * @param {FetchEvent} input.event The event that triggered the service
         *        worker's fetch handler.
         * @return {Promise.<Response>} The response from the cache, if present, or
         *          from the network if not.
         */
        async handle({event} = {}) {
            assert.isInstance({event}, FetchEvent);

            const fetchAndCacheResponse = this.requestWrapper.fetchAndCache({
                request: event.request,
                waitOnCache: this.waitOnCache,
                cacheResponsePlugin: this._cacheablePlugin,
            }).catch(() => Response.error());

            const cachedResponse = await this.requestWrapper.match({
                request: event.request,
            });

            return cachedResponse || await fetchAndCacheResponse;
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * # workbox-runtime-caching
     *
     * A service worker helper library that implements various runtime caching
     * strategies.
     *
     * **Install:** `npm install --save-dev workbox-runtime-caching`
     *
     * You can learn more about each caching strategy on
     * {@link https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/|Jake Archibald's blog post}
     * which covers various ways of handling fetch events with a service worker.
     *
     * These strategies can be used as
     * {@link module:workbox-routing.RouteHandler|RouteHandlers}
     * that are automatically invoked by the lower-level
     * {@link module:workbox-routing.Router|workbox-routing Router}
     * or the higher-level {@link module:workbox-sw.Router|SWLib Router}
     * interfaces.
     *
     * @module workbox-runtime-caching
     */

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    let tmpIdbName = `workbox-cache-expiration`;
    if (self && self.registration) {
        tmpIdbName += `-${self.registration.scope}`;
    }
    const idbName = tmpIdbName;
    const idbVersion = 1;
    const urlPropertyName = 'url';
    const timestampPropertyName = 'timestamp';

    var idb = createCommonjsModule(function (module) {
        'use strict';

        (function () {
            function toArray(arr) {
                return Array.prototype.slice.call(arr);
            }

            function promisifyRequest(request) {
                return new Promise(function (resolve, reject) {
                    request.onsuccess = function () {
                        resolve(request.result);
                    };

                    request.onerror = function () {
                        reject(request.error);
                    };
                });
            }

            function promisifyRequestCall(obj, method, args) {
                var request;
                var p = new Promise(function (resolve, reject) {
                    request = obj[method].apply(obj, args);
                    promisifyRequest(request).then(resolve, reject);
                });

                p.request = request;
                return p;
            }

            function promisifyCursorRequestCall(obj, method, args) {
                var p = promisifyRequestCall(obj, method, args);
                return p.then(function (value) {
                    if (!value) return;
                    return new Cursor(value, p.request);
                });
            }

            function proxyProperties(ProxyClass, targetProp, properties) {
                properties.forEach(function (prop) {
                    Object.defineProperty(ProxyClass.prototype, prop, {
                        get: function () {
                            return this[targetProp][prop];
                        },
                        set: function (val) {
                            this[targetProp][prop] = val;
                        }
                    });
                });
            }

            function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
                properties.forEach(function (prop) {
                    if (!(prop in Constructor.prototype)) return;
                    ProxyClass.prototype[prop] = function () {
                        return promisifyRequestCall(this[targetProp], prop, arguments);
                    };
                });
            }

            function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
                properties.forEach(function (prop) {
                    if (!(prop in Constructor.prototype)) return;
                    ProxyClass.prototype[prop] = function () {
                        return this[targetProp][prop].apply(this[targetProp], arguments);
                    };
                });
            }

            function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
                properties.forEach(function (prop) {
                    if (!(prop in Constructor.prototype)) return;
                    ProxyClass.prototype[prop] = function () {
                        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
                    };
                });
            }

            function Index(index) {
                this._index = index;
            }

            proxyProperties(Index, '_index', [
                'name',
                'keyPath',
                'multiEntry',
                'unique'
            ]);

            proxyRequestMethods(Index, '_index', IDBIndex, [
                'get',
                'getKey',
                'getAll',
                'getAllKeys',
                'count'
            ]);

            proxyCursorRequestMethods(Index, '_index', IDBIndex, [
                'openCursor',
                'openKeyCursor'
            ]);

            function Cursor(cursor, request) {
                this._cursor = cursor;
                this._request = request;
            }

            proxyProperties(Cursor, '_cursor', [
                'direction',
                'key',
                'primaryKey',
                'value'
            ]);

            proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
                'update',
                'delete'
            ]);

            // proxy 'next' methods
            ['advance', 'continue', 'continuePrimaryKey'].forEach(function (methodName) {
                if (!(methodName in IDBCursor.prototype)) return;
                Cursor.prototype[methodName] = function () {
                    var cursor = this;
                    var args = arguments;
                    return Promise.resolve().then(function () {
                        cursor._cursor[methodName].apply(cursor._cursor, args);
                        return promisifyRequest(cursor._request).then(function (value) {
                            if (!value) return;
                            return new Cursor(value, cursor._request);
                        });
                    });
                };
            });

            function ObjectStore(store) {
                this._store = store;
            }

            ObjectStore.prototype.createIndex = function () {
                return new Index(this._store.createIndex.apply(this._store, arguments));
            };

            ObjectStore.prototype.index = function () {
                return new Index(this._store.index.apply(this._store, arguments));
            };

            proxyProperties(ObjectStore, '_store', [
                'name',
                'keyPath',
                'indexNames',
                'autoIncrement'
            ]);

            proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
                'put',
                'add',
                'delete',
                'clear',
                'get',
                'getAll',
                'getKey',
                'getAllKeys',
                'count'
            ]);

            proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
                'openCursor',
                'openKeyCursor'
            ]);

            proxyMethods(ObjectStore, '_store', IDBObjectStore, [
                'deleteIndex'
            ]);

            function Transaction(idbTransaction) {
                this._tx = idbTransaction;
                this.complete = new Promise(function (resolve, reject) {
                    idbTransaction.oncomplete = function () {
                        resolve();
                    };
                    idbTransaction.onerror = function () {
                        reject(idbTransaction.error);
                    };
                    idbTransaction.onabort = function () {
                        reject(idbTransaction.error);
                    };
                });
            }

            Transaction.prototype.objectStore = function () {
                return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
            };

            proxyProperties(Transaction, '_tx', [
                'objectStoreNames',
                'mode'
            ]);

            proxyMethods(Transaction, '_tx', IDBTransaction, [
                'abort'
            ]);

            function UpgradeDB(db, oldVersion, transaction) {
                this._db = db;
                this.oldVersion = oldVersion;
                this.transaction = new Transaction(transaction);
            }

            UpgradeDB.prototype.createObjectStore = function () {
                return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
            };

            proxyProperties(UpgradeDB, '_db', [
                'name',
                'version',
                'objectStoreNames'
            ]);

            proxyMethods(UpgradeDB, '_db', IDBDatabase, [
                'deleteObjectStore',
                'close'
            ]);

            function DB(db) {
                this._db = db;
            }

            DB.prototype.transaction = function () {
                return new Transaction(this._db.transaction.apply(this._db, arguments));
            };

            proxyProperties(DB, '_db', [
                'name',
                'version',
                'objectStoreNames'
            ]);

            proxyMethods(DB, '_db', IDBDatabase, [
                'close'
            ]);

            // Add cursor iterators
            // TODO: remove this once browsers do the right thing with promises
            ['openCursor', 'openKeyCursor'].forEach(function (funcName) {
                [ObjectStore, Index].forEach(function (Constructor) {
                    Constructor.prototype[funcName.replace('open', 'iterate')] = function () {
                        var args = toArray(arguments);
                        var callback = args[args.length - 1];
                        var nativeObject = this._store || this._index;
                        var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
                        request.onsuccess = function () {
                            callback(request.result);
                        };
                    };
                });
            });

            // polyfill getAll
            [Index, ObjectStore].forEach(function (Constructor) {
                if (Constructor.prototype.getAll) return;
                Constructor.prototype.getAll = function (query, count) {
                    var instance = this;
                    var items = [];

                    return new Promise(function (resolve) {
                        instance.iterateCursor(query, function (cursor) {
                            if (!cursor) {
                                resolve(items);
                                return;
                            }
                            items.push(cursor.value);

                            if (count !== undefined && items.length == count) {
                                resolve(items);
                                return;
                            }
                            cursor.continue();
                        });
                    });
                };
            });

            var exp = {
                open: function (name, version, upgradeCallback) {
                    var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
                    var request = p.request;

                    request.onupgradeneeded = function (event) {
                        if (upgradeCallback) {
                            upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
                        }
                    };

                    return p.then(function (db) {
                        return new DB(db);
                    });
                },
                delete: function (name) {
                    return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
                }
            };

            {
                module.exports = exp;
                module.exports.default = module.exports;
            }
        }());
    });

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    const errors$3 = {
        'max-entries-or-age-required': `Either the maxEntries or maxAgeSeconds
    parameters (or both) are required when constructing Plugin.`,
        'max-entries-must-be-number': `The maxEntries parameter to the Plugin
    constructor must either be a number or undefined.`,
        'max-age-seconds-must-be-number': `The maxAgeSeconds parameter to the Plugin
    constructor must either be a number or undefined.`,
    };

    var ErrorFactory$5 = new ErrorFactory$1(errors$3);

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * The `CacheExpiration` class allows you define an expiration and / or
     * limit on the responses cached.
     *
     * @example
     * const cacheExpiration = new workbox.cacheExpiration.CacheExpiration({
     *   maxEntries: 2,
     *   maxAgeSeconds: 10,
     * });
     *
     * @memberof module:workbox-cache-expiration
     */
    class CacheExpiration {
        /**
         * Creates a new `CacheExpiration` instance, which is used to remove entries
         * from a [`Cache`](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
         * once certain criteria—max number of entries, age of entry, or both—is met.
         *
         * @param {Object} input
         * @param {Number} [input.maxEntries] The maximum size of the cache. Entries
         *        will be expired using a LRU policy once the cache reaches this size.
         * @param {Number} [input.maxAgeSeconds] The maximum age for fresh entries.
         */
        constructor({maxEntries, maxAgeSeconds} = {}) {
            if (!(maxEntries || maxAgeSeconds)) {
                throw ErrorFactory$5.createError('max-entries-or-age-required');
            }

            if (maxEntries && typeof maxEntries !== 'number') {
                throw ErrorFactory$5.createError('max-entries-must-be-number');
            }

            if (maxAgeSeconds && typeof maxAgeSeconds !== 'number') {
                throw ErrorFactory$5.createError('max-age-seconds-must-be-number');
            }

            this.maxEntries = maxEntries;
            this.maxAgeSeconds = maxAgeSeconds;

            // These are used to keep track of open IndexDB and Caches for a given name.
            this._dbs = new Map();
            this._caches = new Map();

            // This is used to ensure there's one asynchronous expiration operation
            // running at a time.
            this._expirationMutex = false;
            // If another expiration request comes in, the timestamp is saved here and
            // re-run after.
            this._timestampForNextRun = null;
        }

        /**
         * Returns a promise for the IndexedDB database used to keep track of state.
         *
         * @private
         * @param {Object} input
         * @param {string} input.cacheName Name of the cache the Responses belong to.
         * @return {DB} An open DB instance.
         */
        async getDB({cacheName} = {}) {
            assert.isType({cacheName}, 'string');

            const idbId = `${idbName}-${cacheName}`;
            if (!this._dbs.has(idbId)) {
                const openDb = await idb.open(idbId, idbVersion, (upgradeDB) => {
                    const objectStore = upgradeDB.createObjectStore(cacheName,
                        {keyPath: urlPropertyName});
                    objectStore.createIndex(timestampPropertyName, timestampPropertyName,
                        {unique: false});
                });
                this._dbs.set(idbId, openDb);
            }

            return this._dbs.get(idbId);
        }

        /**
         * Returns a promise for an open Cache instance named `cacheName`.
         *
         * @private
         * @param {Object} input
         * @param {string} input.cacheName Name of the cache the Responses belong to.
         * @return {Cache} An open Cache instance.
         */
        async getCache({cacheName} = {}) {
            assert.isType({cacheName}, 'string');

            if (!this._caches.has(cacheName)) {
                const openCache = await caches.open(cacheName);
                this._caches.set(cacheName, openCache);
            }

            return this._caches.get(cacheName);
        }

        /**
         * Checks whether a `Response` is fresh, based on the `Response`'s
         * `Date` header and the configured `maxAgeSeconds`.
         *
         * If `maxAgeSeconds` or the `Date` header is not set then it will
         * default to returning `true`.
         *
         * @param {Object} input
         * @param {Response} input.cachedResponse The `Response` object that's been
         *        read from a cache and whose freshness should be checked.
         * @param {Number} [input.now] A timestamp. Defaults to the current time.
         * @return {boolean} Either the `true`, if it's fresh, or `false` if the
         *          `Response` is older than `maxAgeSeconds`.
         *
         * @example
         * expirationPlugin.isResponseFresh({
         *   cachedResponse: responseFromCache
         * });
         */
        isResponseFresh({cachedResponse, now} = {}) {
            // Only bother checking for freshness if we have a valid response and if
            // maxAgeSeconds is set. Otherwise, skip the check and always return true.
            if (cachedResponse && this.maxAgeSeconds) {
                assert.isInstance({cachedResponse}, Response);

                const dateHeader = cachedResponse.headers.get('date');
                if (dateHeader) {
                    if (typeof now === 'undefined') {
                        now = Date.now();
                    }

                    const parsedDate = new Date(dateHeader);
                    // If the Date header was invalid for some reason, parsedDate.getTime()
                    // will return NaN, and the comparison will always be false. That means
                    // that an invalid date will be treated as if the response is fresh.
                    if ((parsedDate.getTime() + (this.maxAgeSeconds * 1000)) < now) {
                        // Only return false if all the conditions are met.
                        return false;
                    }
                }
            }

            return true;
        }

        /**
         * Updates the timestamp stored in IndexedDB for `url` to be equal to `now`.
         *
         * @param {Object} input
         * @param {string} input.cacheName Name of the cache the Responses belong to.
         * @param {string} input.url The URL for the entry to update.
         * @param {Number} [input.now] A timestamp. Defaults to the current time.
         *
         * @example
         * expirationPlugin.updateTimestamp({
         *   cacheName: 'example-cache-name',
         *   url: '/example-url'
         * });
         */
        async updateTimestamp({cacheName, url, now} = {}) {
            assert.isType({url}, 'string');
            assert.isType({cacheName}, 'string');

            if (typeof now === 'undefined') {
                now = Date.now();
            }

            const db = await this.getDB({cacheName});
            const tx = db.transaction(cacheName, 'readwrite');
            tx.objectStore(cacheName).put({
                [timestampPropertyName]: now,
                [urlPropertyName]: url,
            });

            await tx.complete;
        }

        /**
         * Expires entries, both based on the the maximum age and the maximum number
         * of entries, depending on how this instance is configured.
         *
         * A mutex is used to ensure that there is only one copy of this asynchronous
         * method running at a time. If another request to this method is made while
         * it's already running, then the `now` timestamp associated with that request
         * is saved and used to recursively trigger the method after the asynchronous
         * operations are complete.
         *
         * @param {Object} input
         * @param {string} input.cacheName Name of the cache the Responses belong to.
         * @param {Number} [input.now] A timestamp. Defaults to the current time.
         * @return {Promise} Resolves when the cache expiration has been performed.
         *
         * @example
         * cacheExpiration.expireEntries({
         *   cacheName: 'example-cache-name'
         * });
         */
        async expireEntries({cacheName, now} = {}) {
            // Since there's a single shared IDB instance that's queried to find entries
            // to expire, this method doesn't need to run multiple times simultaneously.
            // Use this._expirationMutex as a concurrency lock, and save the last value
            // that it's been called with in this._timestampForNextRun as a signal
            // to run it again once complete.
            if (this._expirationMutex) {
                this._timestampForNextRun = now;
                return;
            }
            this._expirationMutex = true;

            assert.isType({cacheName}, 'string');

            if (typeof now === 'undefined') {
                now = Date.now();
            }

            // First, expire old entries, if maxAgeSeconds is set.
            const oldEntries = this.maxAgeSeconds ?
                await this.findOldEntries({cacheName, now}) :
                [];

            // Once that's done, check for the maximum size.
            const extraEntries = this.maxEntries ?
                await this.findExtraEntries({cacheName}) :
                [];

            // Use a Set to remove any duplicates following the concatenation, then
            // convert back into an array.
            const urls = [...new Set(oldEntries.concat(extraEntries))];
            await this.deleteFromCacheAndIDB({cacheName, urls});

            if (urls.length > 0) {
                logHelper.debug({
                    that: this,
                    message: 'Expired entries have been removed from the cache.',
                    data: {cacheName, urls},
                });
            }

            this._expirationMutex = false;
            // If this method has been called while it was already running, then call
            // it again now that the asynchronous operations are complete, using the
            // most recent timestamp that was passed in.
            if (this._timestampForNextRun) {
                const savedTimestamp = this._timestampForNextRun;
                this._timestampForNextRun = null;
                return this.expireEntries({cacheName, now: savedTimestamp});
            }
        }

        /**
         * Expires entries based on the the maximum age.
         *
         * @private
         * @param {Object} input
         * @param {string} input.cacheName Name of the cache the Responses belong to.
         * @param {Number} [input.now] A timestamp.
         * @return {Array<string>} A list of the URLs that were expired.
         */
        async findOldEntries({cacheName, now} = {}) {
            assert.isType({cacheName}, 'string');
            assert.isType({now}, 'number');

            const expireOlderThan = now - (this.maxAgeSeconds * 1000);
            const urls = [];
            const db = await this.getDB({cacheName});
            const tx = db.transaction(cacheName, 'readonly');
            const store = tx.objectStore(cacheName);
            const timestampIndex = store.index(timestampPropertyName);

            timestampIndex.iterateCursor((cursor) => {
                if (!cursor) {
                    return;
                }

                if (cursor.value[timestampPropertyName] < expireOlderThan) {
                    urls.push(cursor.value[urlPropertyName]);
                }

                cursor.continue();
            });

            await tx.complete;
            return urls;
        }

        /**
         * Finds the URLs that should be expired as per the current state of IndexedDB
         * and the `maxEntries` configuration. A least-recently used policy is
         * enforced, so if `maxEntries` is `N`, and there are `N + M` URLs listed in
         * IndexedDB, then this function will return the least-recently used `M` URLs.
         *
         * @private
         * @param {Object} input
         * @param {string} input.cacheName Name of the cache the Responses belong to.
         * @return {Array<string>} A list of the URLs that are candidates for
         *   expiration.
         */
        async findExtraEntries({cacheName} = {}) {
            assert.isType({cacheName}, 'string');

            const urls = [];
            const db = await this.getDB({cacheName});
            let tx = db.transaction(cacheName, 'readonly');
            let store = tx.objectStore(cacheName);
            let timestampIndex = store.index(timestampPropertyName);
            const initialCount = await timestampIndex.count();

            if (initialCount > this.maxEntries) {
                // We need to create a new transaction to make Firefox happy.
                tx = db.transaction(cacheName, 'readonly');
                store = tx.objectStore(cacheName);
                timestampIndex = store.index(timestampPropertyName);

                timestampIndex.iterateCursor((cursor) => {
                    if (!cursor) {
                        return;
                    }

                    urls.push(cursor.value[urlPropertyName]);

                    if (initialCount - urls.length > this.maxEntries) {
                        cursor.continue();
                    }
                });
            }

            await tx.complete;
            return urls;
        }

        /**
         * Removes entries corresponding to each of the URLs from both the Cache
         * Storage API and from IndexedDB.
         *
         * @private
         * @param {Object} input
         * @param {string} input.cacheName Name of the cache the Responses belong to.
         * @param {Array<string>} urls The URLs to delete.
         */
        async deleteFromCacheAndIDB({cacheName, urls} = {}) {
            assert.isType({cacheName}, 'string');
            assert.isArrayOfType({urls}, 'string');

            if (urls.length > 0) {
                const cache = await this.getCache({cacheName});
                const db = await this.getDB({cacheName});

                for (let url of urls) {
                    await cache.delete(url);
                    const tx = db.transaction(cacheName, 'readwrite');
                    const store = tx.objectStore(cacheName);
                    store.delete(url);
                    await tx.complete;
                }
            }
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * The `CacheExpirationPlugin` class allows you define an expiration and / or
     * limit on the responses cached.
     *
     * This class is meant to be automatically invoked as a plugin to a
     * {@link module:workbox-runtime-caching.RequestWrapper|RequestWrapper}, which
     * is used by the `workbox-sw` and `workbox-runtime-caching` modules.
     *
     * If you would like to use this functionality outside of the `RequestWrapper`
     * context, please use the `CacheExpiration` class directly.
     *
     * @example
     * const plugin = new workbox.cacheExpiration.CacheExpirationPlugin({
     *   maxEntries: 2,
     *   maxAgeSeconds: 10,
     * });
     *
     * @memberof module:workbox-cache-expiration
     */
    class CacheExpirationPlugin extends CacheExpiration {
        /**
         * A "lifecycle" callback that will be triggered automatically by the
         * `workbox.runtimeCaching` handlers when a `Response` is about to be returned
         * from a [Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) to
         * the handler. It allows the `Response` to be inspected for freshness and
         * prevents it from being used if the `Response`'s `Date` header value is
         * older than the configured `maxAgeSeconds`.
         *
         * @private
         * @param {Object} input
         * @param {Response} input.cachedResponse The `Response` object that's been
         *        read from a cache and whose freshness should be checked.
         * @param {Number} [input.now] A timestamp. Defaults to the current time.
         * @return {Response|null} Either the `cachedResponse`, if it's fresh, or
         *          `null` if the `Response` is older than `maxAgeSeconds`.
         */
        cacheWillMatch({cachedResponse, now} = {}) {
            if (this.isResponseFresh({cachedResponse, now})) {
                return cachedResponse;
            }

            return null;
        }

        /**
         * A "lifecycle" callback that will be triggered automatically by the
         * `workbox.runtimeCaching` handlers when an entry is added to a cache.
         *
         * @private
         * @param {Object} input
         * @param {string} input.cacheName Name of the cache the responses belong to.
         * @param {Response} input.newResponse The new value in the cache.
         * @param {string} input.url The URL for the cache entry.
         * @param {Number} [input.now] A timestamp. Defaults to the current time.
         */
        async cacheDidUpdate({cacheName, newResponse, url, now} = {}) {
            assert.isType({cacheName}, 'string');
            assert.isInstance({newResponse}, Response);

            if (typeof now === 'undefined') {
                now = Date.now();
            }

            await this.updateTimestamp({cacheName, url, now});
            await this.expireEntries({cacheName, now});
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * # workbox-cache-expiration
     *
     * The cache expiration plugin allows you define an expiration and/or
     * limit on the responses cached.
     *
     * **Install:** `npm install --save-dev workbox-cache-expiration`
     *
     * This can be used to ensure that responses aren't used when they are stale
     * and that the cache size doesn't grow endlessly.
     *
     * @example <caption>Used as an automatically invoked "plugin".</caption>
     *
     * // Add cache expiration plugin to `RequestWrapper`.
     * const requestWrapper = new workbox.runtimeCaching.RequestWrapper({
     *   cacheName: 'runtime-cache',
     *   plugins: [
     *     // The cache size will be capped at 10 entries.
     *     new workbox.cacheExpiration.Plugin({maxEntries: 10})
     *   ]
     * });
     *
     * // Add `RequestWrapper` to a runtime cache handler.
     * const route = new workbox.routing.RegExpRoute({
     *   match: ({url}) => url.domain === 'example.com',
     *   handler: new workbox.runtimeCaching.StaleWhileRevalidate({requestWrapper})
     * });
     *
     * @example <caption>To use the cache expiration as it's own module, you can
     * call the <code>expireEntries()</code> method to clean up the cache.</caption>
     * expirationPlugin.expireEntries({
     *   cacheName: 'example-cache-name'
     * });
     *
     * @module workbox-cache-expiration
     */

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    const errors$4 = {
        'channel-name-required': `The channelName parameter is required when
    constructing a new BroadcastCacheUpdate instance.`,
        'responses-are-same-parameters-required': `The first, second, and
    headersToCheck parameters must be valid when calling responsesAreSame()`,
    };

    var ErrorFactory$6 = new ErrorFactory$1(errors$4);

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * The value `'CACHE_UPDATED'`, used as the `type` field of the update message.
     *
     * @type {string}
     *
     * @example
     * // Prints 'CACHE_UPDATED'
     * console.log(workbox.broadcastCacheUpdate.cacheUpdatedMessageType);
     *
     * @memberof module:workbox-broadcast-cache-update
     */
    const cacheUpdatedMessageType = 'CACHE_UPDATED';

    /**
     * The default headers to compare when determining whether two `Response`
     * objects are different.
     *
     * @private
     * @type {Array<string>}
     *
     * @memberof module:workbox-broadcast-cache-update
     */
    const defaultHeadersToCheck = [
        'content-length',
        'etag',
        'last-modified',
    ];

    /**
     * The value `'workbox-broadcast-cache-update'`, used as the `meta` field of the
     * update message.
     *
     * @private
     * @type {string}
     *
     * @memberof module:workbox-broadcast-cache-update
     */
    const defaultSource = 'workbox-broadcast-cache-update';

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * You would not normally call this method directly; it's called automatically
     * by an instance of the {@link BroadcastCacheUpdate} class. It's exposed here
     * for the benefit of developers who would rather not use the full
     * `BroadcastCacheUpdate` implementation.
     *
     * Calling this will dispatch a message on the provided {@link https://developers.google.com/web/updates/2016/09/broadcastchannel|Broadcast Channel}
     * to notify interested subscribers about a change to a cached resource.
     *
     * The message that's posted has a formation inspired by the
     * [Flux standard action](https://github.com/acdlite/flux-standard-action#introduction)
     * format like so:
     *
     * ```
     * {
     *   type: 'CACHE_UPDATED',
     *   meta: 'workbox-broadcast-cache-update',
     *   payload: {
     *     cacheName: 'the-cache-name',
     *     updatedUrl: 'https://example.com/'
     *   }
     * }
     * ```
     *
     * (Usage of [Flux](https://facebook.github.io/flux/) itself is not at
     * all required.)
     *
     * @example
     * workbox.broadcastCacheUpdate.broadcastUpdate({
     *   channel: new BroadcastChannel('Channel Name'),
     *   cacheName: 'example-cache-name',
     *   url: '/',
     *   source: 'custom-library'
     * });
     *
     * @memberof module:workbox-broadcast-cache-update
     *
     * @param {Object} input
     * @param {BroadcastChannel} input.channel The `BroadcastChannel` to use.
     * @param {string} input.cacheName The name of the cache in which the updated
     *        `Response` was stored.
     * @param {string} input.url The URL associated with the updated `Response`.
     * @param {string} input.source A string identifying this library as the source
     *        of the update message.
     */
    function broadcastUpdate({channel, cacheName, url, source}) {
        assert.isInstance({channel}, BroadcastChannel);
        assert.isType({cacheName}, 'string');
        assert.isType({source}, 'string');
        assert.isType({url}, 'string');

        channel.postMessage({
            type: cacheUpdatedMessageType,
            meta: source,
            payload: {
                cacheName: cacheName,
                updatedUrl: url,
            },
        });
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * Given two `Response`s, compares several header values to see if they are
     * the same or not.
     *
     * @example
     * const responseIsSame = responsesAreSame({
     *   first: firstResponse,
     *   second: secondResponse,
     *   headersToCheck: [
     *     'content-length',
     *     'etag',
     *     'last-modified',
     *   ]
     * });
     *
     * @memberof module:workbox-broadcast-cache-update
     *
     * @param {Object} input
     * @param {Response} input.first One of the `Response`s.
     * @param {Response} input.second Another of the `Response`s.
     * @param {Array<string>} input.headersToCheck A list of headers that will be
     *        used to determine whether the `Response`s differ.
     * @return {boolean} Whether or not the `Response` objects are assumed to be
     *         the same.
     */
    function responsesAreSame({first, second, headersToCheck} = {}) {
        if (!(first instanceof Response &&
            second instanceof Response &&
            headersToCheck instanceof Array)) {
            throw ErrorFactory$6.createError('responses-are-same-parameters-required');
        }

        const atLeastOneHeaderAvailable = headersToCheck.some((header) => {
            return first.headers.has(header) && second.headers.has(header);
        });
        if (!atLeastOneHeaderAvailable) {
            logHelper.log({
                message: `Unable to determine whether the response has been updated
        because none of the headers that would be checked are present.`,
                data: {
                    'First Response': first,
                    'Second Response': second,
                    'Headers To Check': JSON.stringify(headersToCheck),
                },
            });

            // Just return true, indicating the that responses are the same, since we
            // can't determine otherwise.
            return true;
        }

        return headersToCheck.every((header) => {
            return (first.headers.has(header) === second.headers.has(header)) &&
                (first.headers.get(header) === second.headers.get(header));
        });
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * Can be used to compare two [Responses](https://developer.mozilla.org/en-US/docs/Web/API/Response)
     * and uses the {@link https://developers.google.com/web/updates/2016/09/broadcastchannel|Broadcast Channel API}
     * to notify interested parties when those responses differ.
     *
     * For efficiency's sake, the underlying response bodies are not compared;
     * only specific response headers are checked.
     *
     * This class can be used inside any service worker, without having to use any
     * of the other modules in this repo.
     *
     * If you'd like to use this functionality but are already using `workbox-sw` or
     * `workbox-runtime-caching`, then please see the corresponding plugin,
     * `BroadcastCacheUpdatePlugin`, for a easy integration.
     *
     * @example <caption>Using BroadcastCacheUpdate when you're handling your
     * own fetch and request logic.</caption>
     *
     * const url = '/path/to/file';
     * const cacheName = 'my-runtime-cache';
     * const bcu = new workbox.broadcastCacheUpdate.BroadcastCacheUpdate(
     *   {channelName: 'cache-updates'});
     *
     * Promise.all([
     *   caches.open(cacheName).then((cache) => cache.match(url)),
     *   fetch(url),
     * ]).then(([first, second]) => {
     *   if (first) {
     *     bcu.notifyIfUpdated({cacheName, first, second});
     *   }
     * });
     *
     * @memberof module:workbox-broadcast-cache-update
     */
    class BroadcastCacheUpdate {
        /**
         * Dispatches cache update messages when a cached response has been updated.
         * Messages will be dispatched on a broadcast channel with the name provided
         * as channelName parameter in the constructor.
         *
         * @param {Object} input
         * @param {string} input.channelName The name that will be used when creating
         *        the `BroadcastChannel`.
         * @param {Array<string>} input.headersToCheck A list of headers that will be
         *        used to determine whether the responses differ. Defaults to
         *        `['content-length', 'etag', 'last-modified']`.
         * @param {string} input.source An attribution value that indicates where
         *        the update originated. Defaults to 'workbox-broadcast-cache-update'.
         */
        constructor({channelName, headersToCheck, source} = {}) {
            if (typeof channelName !== 'string' || channelName.length === 0) {
                throw ErrorFactory$6.createError('channel-name-required');
            }

            this.channelName = channelName;
            this.headersToCheck = headersToCheck || defaultHeadersToCheck;
            this.source = source || defaultSource;
        }

        /**
         * @private
         * @return {BroadcastChannel} The underlying
         *          [`BroadcastChannel`](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel/BroadcastChannel)
         *          instance used for broadcasting updates.
         */
        get channel() {
            if (!this._channel) {
                this._channel = new BroadcastChannel(this.channelName);
            }
            return this._channel;
        }

        /**
         * An explicit method to call from your own code to trigger the comparison of
         * two [Responses](https://developer.mozilla.org/en-US/docs/Web/API/Response)
         * and fire off a notification via the
         * {@link https://developers.google.com/web/updates/2016/09/broadcastchannel|Broadcast Channel API}
         * if they differ.
         *
         * @param {Object} input The input object to this function.
         * @param {Response} input.first One of the responses to compare.
         *        This should not be an {@link http://stackoverflow.com/questions/39109789|opaque response}.
         * @param {Response} input.second Another of the respones to compare.
         *        This should not be an {@link http://stackoverflow.com/questions/39109789|opaque response}.
         * @param {string} input.cacheName Name of the cache the responses belong to.
         * @param {string} input.url The cache key URL.
         */
        notifyIfUpdated({first, second, cacheName, url}) {
            assert.isType({cacheName}, 'string');

            if (
                !responsesAreSame({first, second, headersToCheck: this.headersToCheck})) {
                broadcastUpdate({
                    cacheName, url,
                    channel: this.channel, source: this.source
                });
            }
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * Can be used to compare two [Responses](https://developer.mozilla.org/en-US/docs/Web/API/Response)
     * and uses the {@link https://developers.google.com/web/updates/2016/09/broadcastchannel|Broadcast Channel API}
     * to notify interested parties when those responses differ.
     *
     * For efficiency's sake, the underlying response bodies are not compared;
     * only specific response headers are checked.
     *
     * This class is meant to be automatically invoked as a plugin to a
     * {@link module:workbox-runtime-caching.RequestWrapper|RequestWrapper}, which
     * is used by the `workbox-sw` and `workbox-runtime-caching` modules.
     *
     * If you would like to use this functionality outside of the `RequestWrapper`
     * context, please use the `BroadcastCacheUpdate` class directly.
     *
     * @example <caption>Added as a "plugin" to a `RequestWrapper` to
     * automatically dispatch messages on a cache update</caption>
     *
     * const requestWrapper = new workbox.runtimeCaching.RequestWrapper({
     *   cacheName: 'runtime-cache',
     *   plugins: [
     *     new workbox.broadcastCacheUpdate.Plugin({channelName: 'cache-updates'})
     *   ]
     * });
     * const route = new workbox.routing.RegExpRoute({
     *   match: ({url}) => url.domain === 'example.com',
     *   handler: new workbox.runtimeCaching.StaleWhileRevalidate({requestWrapper})
     * });
     *
     * @memberof module:workbox-broadcast-cache-update
     */
    class BroadcastCacheUpdatePlugin extends BroadcastCacheUpdate {
        /**
         * A "lifecycle" callback that will be triggered automatically by the
         * `workbox-sw` and `workbox-runtime-caching` handlers when an entry is
         * added to a cache.
         *
         * @private
         * @param {Object} input The input object to this function.
         * @param {string} input.cacheName Name of the cache the responses belong to.
         * @param {Response} [input.oldResponse] The previous cached value, if any.
         * @param {Response} input.newResponse The new value in the cache.
         * @param {string} input.url The cache key URL.
         */
        cacheDidUpdate({cacheName, oldResponse, newResponse, url}) {
            assert.isType({cacheName}, 'string');
            assert.isInstance({newResponse}, Response);

            if (oldResponse) {
                this.notifyIfUpdated({
                    cacheName,
                    first: oldResponse,
                    second: newResponse,
                    url,
                });
            }
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * # workbox-broadcast-cache-update
     *
     * A helper library that uses the Broadcast Channel API to announce when
     * two Response objects differ.
     *
     * **Install:** `npm install --save-dev workbox-broadcast-cache-update`
     *
     * The main use of this module will be instantiating a new
     * `BroadcastCacheUpdatePlugin` and passing it to a
     * {@link module:workbox-runtime-caching.RequestWrapper|RequestWrapper},
     * as shown in the first example below.
     *
     * You can listen for updates from your web app by adding an event listener on
     * a `BroadcastChannel` within a page, using the same channel name as
     * what's used within the service worker, as shown in the second example below.
     *
     * @example <caption>Using the BroadcastCacheUpdatePlugin class in a
     * service worker.</caption>
     *
     * const requestWrapper = new workbox.runtimeCaching.RequestWrapper({
     *   cacheName: 'text-files',
     *   plugins: [
     *     new workbox.broadcastCacheUpdate.BroadcastCacheUpdatePlugin(
     *       {channelName: 'cache-updates'})
     *   ],
     * });
     *
     * const route = new workbox.routing.RegExpRoute({
     *   regExp: /\.txt$/,
     *   handler: new workbox.runtimeCaching.StaleWhileRevalidate({requestWrapper}),
     * });
     *
     * const router = new workbox.routing.Router();
     * router.registerRoute({route});
     *
     * @example <caption>Listening for the broadcast message in the
     * window.</caption>
     *
     * const updateChannel = new BroadcastChannel('cache-updates');
     * updateChannel.addEventListener('message', event => {
     *   console.log(`Cache updated: ${event.data.payload.updatedUrl}`);
     * });
     *
     * @module workbox-broadcast-cache-update
     */

    /**
     * This is a simple class used to namespace the supported caching strategies in
     * workbox-sw.
     *
     * You would never access this class directly but instead use with
     * `workboxSW.strategies.<Strategy Name>`.
     *
     * @memberof module:workbox-sw
     */
    class Strategies {
        /**
         * This constructor will configure shared options across each strategy.
         * @param {String} [input.cacheId] The cacheId to be applied to the run
         * time strategies cache names.
         */
        constructor({cacheId} = {}) {
            this._cacheId = cacheId;
        }

        /**
         * A [cache first](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network)
         * run-time caching strategy.
         *
         * @example
         * const = new WorkboxSW();
         * const cacheFirstStrategy = workboxSW.strategies.cacheFirst();
         *
         * workboxSW.router.registerRoute('/styles/*', cacheFirstStrategy);
         *
         * @param {module:workbox-sw.SWLib.RuntimeStrategyOptions} [options] To define
         * any additional caching or broadcast plugins pass in option values.
         * @return {module:workbox-runtime-caching.CacheFirst} A CacheFirst handler.
         */
        cacheFirst(options) {
            return this._getCachingMechanism(CacheFirst, options);
        }

        /**
         * A [cache only](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-only)
         * run-time caching strategy.
         *
         * @example
         * const workboxSW = new WorkboxSW();
         * const cacheOnlyStrategy = workboxSW.strategies.cacheOnly();
         *
         * workboxSW.router.registerRoute('/styles/*', cacheOnlyStrategy);
         *
         * @param {module:workbox-sw.SWLib.RuntimeStrategyOptions} [options] To define
         * any additional caching or broadcast plugins pass in option values.
         * @return {module:workbox-runtime-caching.CacheOnly} The caching handler
         * instance.
         */
        cacheOnly(options) {
            return this._getCachingMechanism(CacheOnly, options);
        }

        /**
         * A [network first](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-falling-back-to-cache)
         * run-time caching strategy.
         *
         * @example
         * const workboxSW = new WorkboxSW();
         * const networkFirstStrategy = workboxSW.strategies.networkFirst();
         *
         * workboxSW.router.registerRoute('/blog/', networkFirstStrategy);
         *
         * @param {module:workbox-sw.SWLib.RuntimeStrategyOptions} [options] To define
         * any additional caching or broadcast plugins pass in option values.
         * @return {module:workbox-runtime-caching.NetworkFirst} The caching handler
         * instance.
         */
        networkFirst(options) {
            return this._getCachingMechanism(NetworkFirst, options);
        }

        /**
         * A [network only](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-only)
         * run-time caching strategy.
         *
         * @example
         * const workboxSW = new WorkboxSW();
         * const networkOnlyStrategy = workboxSW.strategies.networkOnly();
         *
         * workboxSW.router.registerRoute('/admin/', networkOnlyStrategy);
         *
         * @param {module:workbox-sw.SWLib.RuntimeStrategyOptions} [options] To define
         * any additional caching or broadcast plugins pass in option values.
         * @return {module:workbox-runtime-caching.NetworkOnly} The caching handler
         * instance.
         */
        networkOnly(options) {
            return this._getCachingMechanism(NetworkOnly, options);
        }

        /**
         * A [stale while revalidate](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate)
         * run-time caching strategy.
         *
         * @example
         * const workboxSW = new WorkboxSW();
         * const staleWhileRevalidateStrategy =
         *  workboxSW.strategies.staleWhileRevalidate();
         *
         * workboxSW.router.registerRoute('/styles/*', staleWhileRevalidateStrategy);
         *
         * @param {module:workbox-sw.SWLib.RuntimeStrategyOptions} [options] To define
         * any additional caching or broadcast plugins pass in option values.
         * @return {module:workbox-runtime-caching.StaleWhileRevalidate} The caching
         * handler instance.
         */
        staleWhileRevalidate(options) {
            return this._getCachingMechanism(StaleWhileRevalidate, options);
        }

        /**
         * This method will add plugins based on options passed in by the
         * developer.
         *
         * @private
         * @param {Class} HandlerClass The class to be configured and instantiated.
         * @param {Object} [options] Options to configure the handler.
         * @return {Handler} A handler instance configured with the appropriate
         * behaviours
         */
        _getCachingMechanism(HandlerClass, options = {}) {
            const pluginParamsToClass = {
                'cacheExpiration': CacheExpirationPlugin,
                'broadcastCacheUpdate': BroadcastCacheUpdatePlugin,
                'cacheableResponse': CacheableResponsePlugin,
            };

            const wrapperOptions = {
                plugins: [],
                cacheId: this._cacheId,
            };

            if (options['cacheName']) {
                wrapperOptions['cacheName'] = options['cacheName'];
            }

            // Iterate over known plugins and add them to Request Wrapper options.
            const pluginKeys = Object.keys(pluginParamsToClass);
            pluginKeys.forEach((pluginKey) => {
                if (options[pluginKey]) {
                    const PluginClass = pluginParamsToClass[pluginKey];
                    const pluginParams = options[pluginKey];

                    wrapperOptions.plugins.push(new PluginClass(pluginParams));
                }
            });

            // Add custom plugins.
            if (options.plugins) {
                options.plugins.forEach((plugin) => {
                    wrapperOptions.plugins.push(plugin);
                });
            }

            options.requestWrapper = new RequestWrapper(wrapperOptions);
            // Pass through the initial options to the underlying Handler constructor
            // to allow for Handler-specific customization.
            return new HandlerClass(options);
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    const errors$5 = {
        'not-in-sw': 'workbox-precaching must be loaded in your service worker file.',
        'invalid-revisioned-entry': `File manifest entries must be either a ` +
            `string with revision info in the url or an object with a 'url' and ` +
            `'revision' parameters.`,
        'invalid-unrevisioned-entry': ``,
        'bad-cache-bust': `The cache bust parameter must be a boolean.`,
        'duplicate-entry-diff-revisions': `An attempt was made to cache the same ` +
            `url twice with each having different revisions. This is not supported.`,
        'request-not-cached': `A request failed the criteria to be cached. By ` +
            `default, only responses with 'response.ok = true' are cached.`,
        'should-override': 'Method should be overridden by the extending class.',
        'bad-cache-id': `The 'cacheId' parameter must be a string with at least ` +
            `one character.`,
    };

    var ErrorFactory$7 = new ErrorFactory$1(errors$5);

    /**
     * This class handles the shared logic for caching revisioned and unrevisioned
     * assets.
     * @private
     * @memberof module:workbox-precaching
     */
    class BaseCacheManager {
        /**
         * Constructor for BaseCacheManager
         *
         * @param {Object} input
         * @param {String} [input.cacheName] This is the cache name to store requested
         * assets.
         * @param {String} [input.cacheId] The cacheId can be used to ensure that
         * multiple projects sharing `http://localhost` have unique cache names.
         * @param {Array<Object>} [input.plugins] Any plugins that should be
         * invoked by the underlying `RequestWrapper`.
         */
        constructor({cacheName, cacheId, plugins} = {}) {
            if (cacheId && (typeof cacheId !== 'string' || cacheId.length === 0)) {
                throw ErrorFactory$7.createError('bad-cache-id');
            }

            this._entriesToCache = new Map();
            this._requestWrapper = new RequestWrapper({
                cacheName,
                cacheId,
                plugins,
                fetchOptions: {
                    credentials: 'same-origin',
                },
            });
        }

        /**
         * Adds entries to the install list.
         * This will manage duplicate entries and perform the caching during
         * the install step.
         *
         * @private
         * @param {Array<String|Request|Object>} rawEntries A raw entry that can be
         * parsed into a BaseCacheEntry by the inheriting CacheManager.
         */
        _addEntries(rawEntries) {
            this._parsedCacheUrls = null;

            rawEntries.forEach((rawEntry) => {
                this._addEntryToInstallList(
                    this._parseEntry(rawEntry)
                );
            });
        }

        /**
         * Gives access to the cache name used by thie caching manager.
         * @return {String} The cache name used for this manager.
         */
        getCacheName() {
            return this._requestWrapper.cacheName;
        }

        /**
         * Returns an array of fully qualified URL's that will be cached by this
         * cache manager.
         * @return {Array<String>} An array of URLs that will be cached.
         */
        getCachedUrls() {
            if (!this._parsedCacheUrls) {
                this._parsedCacheUrls = Array.from(this._entriesToCache.keys())
                    .map((url) => new URL(url, location).href);
            }

            return this._parsedCacheUrls;
        }

        /**
         * Adds an entry to the install list.
         *
         * Duplicates are filtered out and checks are made for the scenario
         * where two entries have the same URL but different revisions. For example
         * caching:
         * [
         *   {url: '/hello.txt', revision: 'abcd1234'},
         *   {url: '/hello.txt', revision: 'efgh5678'},
         * ]
         * This will throw an error as the library can't determine the correct
         * revision and this may cause issues in future when updating the service
         * worker with new revisions.
         *
         * @private
         * @param {RevisionedCacheEntry} precacheEntry The file entry to be cached
         * during the next install event.
         */
        _addEntryToInstallList(precacheEntry) {
            const entryID = precacheEntry.entryID;
            const previousEntry = this._entriesToCache.get(precacheEntry.entryID);
            if (!previousEntry) {
                // This entry isn't in the install list
                this._entriesToCache.set(entryID, precacheEntry);
                return;
            }

            this._onDuplicateInstallEntryFound(precacheEntry, previousEntry);
        }

        /**
         * Manages the service worker install event and caches the revisioned
         * assets.
         *
         * @return {Promise} The promise resolves when all the desired assets are
         * cached.
         */
        async install() {
            if (this._entriesToCache.size === 0) {
                return;
            }

            const cachePromises = [];
            this._entriesToCache.forEach((precacheEntry) => {
                cachePromises.push(
                    this._cacheEntry(precacheEntry)
                );
            });

            // Wait for all requests to be cached.
            return Promise.all(cachePromises);
        }

        /**
         * Requests the entry and saves it to the cache if the response
         * is valid.
         *
         * @private
         * @param {BaseCacheEntry} precacheEntry The entry to fetch and cache.
         * @return {Promise} Returns a promise that resolves once the entry is fetched
         * and cached.
         */
        async _cacheEntry(precacheEntry) {
            const isCached = await this._isAlreadyCached(precacheEntry);
            if (isCached) {
                return;
            }

            try {
                await this._requestWrapper.fetchAndCache({
                    request: precacheEntry.getNetworkRequest(),
                    waitOnCache: true,
                    cacheKey: precacheEntry.request,
                    cleanRedirects: true,
                });

                return this._onEntryCached(precacheEntry);
            } catch (err) {
                throw ErrorFactory$7.createError('request-not-cached', {
                    message: `Failed to get a cacheable response for ` +
                        `'${precacheEntry.request.url}': ${err.message}`,
                });
            }
        }

        /**
         * Compare the URL's and determines which assets are no longer required
         * in the cache.
         *
         * This should be called in the service worker activate event.
         *
         * @return {Promise} Promise that resolves once the cache entries have been
         * cleaned.
         */
        async cleanup() {
            if (!await caches.has(this.getCacheName())) {
                // Cache doesn't exist, so nothing to delete
                return;
            }

            const requestsCachedOnInstall = [];
            this._entriesToCache.forEach((entry) => {
                requestsCachedOnInstall.push(entry.request.url);
            });

            const openCache = await this._getCache();
            const allCachedRequests = await openCache.keys();

            const cachedRequestsToDelete = allCachedRequests.filter((cachedRequest) => {
                if (requestsCachedOnInstall.includes(cachedRequest.url)) {
                    return false;
                }
                return true;
            });

            return Promise.all(
                cachedRequestsToDelete.map((cachedRequest) => {
                    return openCache.delete(cachedRequest);
                })
            );
        }

        /**
         * A simple helper method to get the open cache used for precaching assets.
         *
         * @private
         * @return {Promise<Cache>} The cache to be used for precaching.
         */
        async _getCache() {
            if (!this._cache) {
                this._cache = await caches.open(this.getCacheName());
            }

            return this._cache;
        }

        /**
         * Ensures the file entry in the maniest is valid and
         * can be parsed as a BaseCacheEntry.
         *
         * @private
         * @abstract
         * @param {String | Request | Object} input Either a URL string, a Request
         * or an object with a `url`, `revision` and optional `cacheBust` parameter.
         * @return {BaseCacheEntry} Returns a parsed version of the file entry.
         */
        _parseEntry(input) {
            throw ErrorFactory$7.createError('should-override');
        }

        /**
         * Called in case subclasses have cache entries that are to be installed
         * but have the same "entryID".
         * This means that the user is trying to cache the same thing twice.
         * Subclasses can use this method to throw an error if there is an edge
         * case that can't be handled.
         *
         * @private
         * @abstract
         * @param {BaseCacheEntry} newEntry The entry that is to be cached.
         * @param {BaseCacheEntry} previous The entry that is currently cached.
         */
        _onDuplicateEntryFound(newEntry, previous) {
            throw ErrorFactory$7.createError('should-override');
        }

        /**
         * Confirms whether a fileEntry is already in the cache with the
         * appropriate revision or not.
         *
         * @private
         * @abstract
         * @param {BaseCacheEntry} precacheEntry A file entry with `path` and
         * `revision` parameters.
         * @return {Promise<Boolean>} Returns true is the fileEntry is already
         * cached, false otherwise.
         */
        _isAlreadyCached(precacheEntry) {
            throw ErrorFactory$7.createError('should-override');
        }

        /**
         * Subclasses can use this method for any work that needs to be done once a
         * URL has been cached.
         *
         * @private
         * @abstract
         * @param {BaseCacheEntry} precacheEntry A file entry with `path` and
         * `revision` parameters.
         * @return {Promise} Returns a Promise that resolves once it's work has
         * been done.
         */
        _onEntryCached(precacheEntry) {
            throw ErrorFactory$7.createError('should-override');
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /* eslint-disable require-jsdoc */

    /**
     * A wrapper to store for an IDB connection to a particular ObjectStore.
     *
     * @private
     */
    class IDBHelper {
        constructor(name, version, storeName) {
            if (name == undefined || version == undefined || storeName == undefined) {
                throw Error('name, version, storeName must be passed to the ' +
                    'constructor.');
            }

            this._name = name;
            this._version = version;
            this._storeName = storeName;
        }

        /**
         * Returns a promise that resolves with an open connection to IndexedDB,
         * either existing or newly opened.
         *
         * @private
         * @return {Promise<DB>}
         */
        _getDb() {
            if (this._dbPromise) {
                return this._dbPromise;
            }

            this._dbPromise = idb.open(this._name, this._version, (upgradeDB) => {
                upgradeDB.createObjectStore(this._storeName);
            })
                .then((db) => {
                    return db;
                });

            return this._dbPromise;
        }

        close() {
            if (!this._dbPromise) {
                return;
            }

            return this._dbPromise
                .then((db) => {
                    db.close();
                    this._dbPromise = null;
                });
        }

        /**
         * Wrapper on top of the idb wrapper, which simplifies saving the key/value
         * pair to the object store.
         * Returns a Promise that fulfills when the transaction completes.
         *
         * @private
         * @param {String} key
         * @param {Object} value
         * @return {Promise<T>}
         */
        put(key, value) {
            return this._getDb().then((db) => {
                const tx = db.transaction(this._storeName, 'readwrite');
                const objectStore = tx.objectStore(this._storeName);
                objectStore.put(value, key);
                return tx.complete;
            });
        }

        /**
         * Wrapper on top of the idb wrapper, which simplifies deleting an entry
         * from the object store.
         * Returns a Promise that fulfills when the transaction completes.
         *
         * @private
         * @param {String} key
         * @return {Promise<T>}
         */
        delete(key) {
            return this._getDb().then((db) => {
                const tx = db.transaction(this._storeName, 'readwrite');
                const objectStore = tx.objectStore(this._storeName);
                objectStore.delete(key);
                return tx.complete;
            });
        }

        /**
         * Wrapper on top of the idb wrapper, which simplifies getting a key's value
         * from the object store.
         * Returns a promise that fulfills with the value.
         *
         * @private
         * @param {String} key
         * @return {Promise<Object>}
         */
        get(key) {
            return this._getDb().then((db) => {
                return db.transaction(this._storeName)
                    .objectStore(this._storeName)
                    .get(key);
            });
        }

        /**
         * Wrapper on top of the idb wrapper, which simplifies getting all the values
         * in an object store.
         * Returns a promise that fulfills with all the values.
         *
         * @private
         * @return {Promise<Array<Object>>}
         */
        getAllValues() {
            return this._getDb().then((db) => {
                return db.transaction(this._storeName)
                    .objectStore(this._storeName)
                    .getAll();
            });
        }

        /**
         * Wrapper on top of the idb wrapper, which simplifies getting all the keys
         * in an object store.
         * Returns a promise that fulfills with all the keys.
         *
         * @private
         * @param {String} storeName
         * @return {Promise<Array<Object>>}
         */
        getAllKeys() {
            return this._getDb().then((db) => {
                return db.transaction(this._storeName)
                    .objectStore(this._storeName)
                    .getAllKeys();
            });
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    const cacheBustParamName = '_workbox-precaching';
    const version = 'v1';
    const dbName = 'workbox-precaching';
    const dbVersion = '1';
    const dbStorename = 'asset-revisions';

    let tmpRevisionedCacheName = `workbox-precaching-revisioned-${version}`;
    if (self && self.registration) {
        tmpRevisionedCacheName += `-${self.registration.scope}`;
    }
    const defaultRevisionedCacheName = tmpRevisionedCacheName;

    /**
     * This class is a simple model that stores EntryID's with their current
     * revision. This is used when caching revisioned assets so that only entries
     * with different revisions are downloaded and updated.
     *
     * @private
     * @memberof module:workbox-precaching
     */
    class RevisionDetailsModel {
        /**
         * Constructor for RevisionDetails Model.
         */
        constructor() {
            this._idbHelper = new IDBHelper(dbName, dbVersion, dbStorename);
        }

        /**
         * This method gets the revision details for a given entryID.
         * @param {String} entryID The ID of the revision.
         * @return {Promise<String|null>} Returns a revision string or
         * null if there is no revision information.
         */
        get(entryID) {
            return this._idbHelper.get(entryID);
        }

        /**
         * This method saves the revision details to indexedDB.
         * @param {String} entryID The ID of the revision.
         * @param {String} revision The current revision for this entryID.
         * @return {Promise} Promise that resolves once the data has been saved.
         */
        put(entryID, revision) {
            return this._idbHelper.put(entryID, revision);
        }

        /**
         * This method closes the indexdDB helper. This is only used for unit testing
         * to ensure clean state between tests.
         *
         * @private
         */
        _close() {
            this._idbHelper.close();
        }
    }

    /**
     * This class is extended by a number of classes that take different inputs
     * and generates the required fields for a BaseCacheEntry.
     *
     * @private
     * @memberof module:workbox-precaching
     */
    class BaseCacheEntry {
        /**
         * This constructor expects an object and a number or required fields.
         * You shouldn't need to use this constructor directly.
         *
         * @param {Object} input
         * @param {String} input.entryID
         * @param {String} input.revision
         * @param {Request} input.request
         * @param {boolean} input.cacheBust
         */
        constructor({entryID, revision, request, cacheBust}) {
            this.entryID = entryID;
            this.revision = revision;
            this.request = request;
            this.cacheBust = cacheBust;
        }

        /**
         * This method is required since any revisioned request needs to cache bust.
         * To ensure this is consistent, CacheManagers will make a network request
         * using this specially formatted request.
         *
         * When caching the response, it will be cached against the origin `request`,
         * removing lookup for the cachebusted URL.
         *
         * @return {Request} Returns a cache busted request if needed, otherwise
         * a normal request with credentials set to 'same-origin' and redirect set to
         * follow.
         */
        getNetworkRequest() {
            if (this.cacheBust !== true) {
                // For the RequestCacheEntry we should return it to ensure headers are
                // kept in tact and part of the request.
                return this.request;
            }

            let url = this.request.url;
            const requestOptions = {};

            if (this.cacheBust === true) {
                if ('cache' in Request.prototype) {
                    // Make use of the Request cache mode where we can.
                    // Reload skips the HTTP cache for outgoing requests and updates
                    // the cache with the returned reponse.
                    requestOptions.cache = 'reload';
                } else {
                    const parsedURL = new URL(url, location);
                    parsedURL.search += (parsedURL.search ? '&' : '') +
                        encodeURIComponent(cacheBustParamName) + '=' +
                        encodeURIComponent(this.revision);
                    url = parsedURL.toString();
                }
            }

            return new Request(url, requestOptions);
        }
    }

    /**
     * This class will take a string and parse it as a BaseCacheEntry.
     *
     * @private
     * @memberof module:workbox-precaching
     * @extends {module:workbox-precaching.BaseCacheEntry}
     */
    class StringCacheEntry extends BaseCacheEntry {
        /**
         * Cosntructor for StringCacheEntry.
         *
         * @param {String} url A URL to cache.
         */
        constructor(url) {
            assert.isType({url}, 'string');
            if (url.length === 0) {
                throw ErrorFactory$7.createError('invalid-revisioned-entry',
                    new Error('Bad url Parameter. It should be a string:' +
                        JSON.stringify(url)));
            }

            super({
                entryID: url,
                revision: url,
                request: new Request(url),
                cacheBust: false,
            });
        }
    }

    /**
     * This class will take an object of parameters, validate the input and
     * parse to be used as a BaseCacheEntry.
     *
     * @private
     * @memberof module:workbox-precaching
     * @extends {module:workbox-precaching.BaseCacheEntry}
     */
    class DefaultsCacheEntry extends BaseCacheEntry {
        /**
         * This class gives most control over configuring a cache entry.
         * @param {Object} input
         * @param {String} input.entryID The ID of the entry. This is the key used
         * with IndexDB to store the revision. Normally this is just the URL.
         * @param {String} input.revision This is the revision associated with this
         * URL.
         * @param {String} input.url The URL to cache.
         * @param {boolean} input.cacheBust A boolean to indicate if this request
         * will require cache busting (i.e. the URL is not unique between SW install).
         */
        constructor({entryID, revision, url, cacheBust}) {
            if (typeof cacheBust === 'undefined') {
                cacheBust = true;
            }
            if (typeof entryID === 'undefined') {
                entryID = new URL(url, location).toString();
            }

            assert.isType({revision}, 'string');
            if (revision.length === 0) {
                throw ErrorFactory$7.createError('invalid-revisioned-entry',
                    new Error('Bad revision Parameter. It should be a string with at ' +
                        'least one character: ' + JSON.stringify(revision)));
            }

            assert.isType({url}, 'string');
            if (url.length === 0) {
                throw ErrorFactory$7.createError('invalid-revisioned-entry',
                    new Error('Bad url Parameter. It should be a string:' +
                        JSON.stringify(url)));
            }

            assert.isType({entryID}, 'string');
            if (entryID.length === 0) {
                throw ErrorFactory$7.createError('invalid-revisioned-entry',
                    new Error('Bad entryID Parameter. It should be a string with at ' +
                        'least one character: ' + JSON.stringify(entryID)));
            }

            assert.isType({cacheBust}, 'boolean');

            super({
                entryID,
                revision,
                request: new Request(url),
                cacheBust,
            });
        }
    }

    /**
     * This class extends a lot of the internal methods from BaseCacheManager
     * to manage caching of revisioned assets.
     *
     * @private
     * @memberof module:workbox-precaching
     * @extends {module:workbox-precaching.BaseCacheManager}
     */
    class RevisionedCacheManager extends BaseCacheManager {
        /**
         * Constructor for RevisionedCacheManager
         * @param {Object} input
         * @param {String} [input.cacheName] Define the cache used to stash these
         * entries.
         * @param {String} [input.cacheId] The cacheId can be used to ensure that
         * multiple projects sharing `http://localhost` have unique cache names.
         * @param {Array<Object>} [input.plugins] Any plugins that should be
         * invoked by the underlying `RequestWrapper`.
         */
        constructor(input = {}) {
            input.cacheName = input.cacheName || defaultRevisionedCacheName;

            super(input);

            this._revisionDetailsModel = new RevisionDetailsModel();
        }

        /**
         * This method will add the entries to the install list.
         * This will manage duplicate entries and perform the caching during
         * the install step.
         *
         * @example
         *
         * revisionedManager.addToCacheList({
         *   revisionedFiles: [
         *     '/styles/hello.1234.css',
         *     {
         *       url: '/images/logo.png',
         *       revision: 'abcd1234'
         *     }
         *   ]
         * });
         *
         * @param {Array<String|Object>} rawEntries A raw entry that can be
         * parsed into a BaseCacheEntry.
         */
        addToCacheList({revisionedFiles} = {}) {
            assert.isInstance({revisionedFiles}, Array);
            super._addEntries(revisionedFiles);

            const urlsWithoutRevisionFields = revisionedFiles
                .filter((entry) => typeof entry === 'string');
            if (urlsWithoutRevisionFields.length > 0) {
                logHelper.debug({
                    that: this,
                    message: `Some precache entries are URLs without separate revision
          fields. If the URLs themselves do not contain revisioning info,
          like a hash or a version number, your users won't receive updates.`,
                    data: {
                        'URLs without revision fields':
                            JSON.stringify(urlsWithoutRevisionFields),
                        'Examples of safe, versioned URLs':
                            `'/path/file.abcd1234.css' or '/v1.0.0/file.js'`,
                        'Examples of dangerous, unversioned URLs':
                            `'index.html' or '/path/file.css' or '/latest/file.js'`,
                    },
                });
            }
        }

        /**
         * This method ensures that the file entry in the maniest is valid and
         * can be parsed as a BaseCacheEntry.
         *
         * @private
         * @abstract
         * @param {String | Object} input Either a URL string
         * or an object with a `url`, `revision` and optional `cacheBust` parameter.
         * @return {BaseCacheEntry} Returns a parsed version of the file entry.
         */
        _parseEntry(input) {
            if (typeof input === 'undefined' || input === null) {
                throw ErrorFactory$7.createError('invalid-revisioned-entry',
                    new Error('Invalid file entry: ' + JSON.stringify(input))
                );
            }

            let precacheEntry;
            switch (typeof input) {
                case 'string':
                    precacheEntry = new StringCacheEntry(input);
                    break;
                case 'object':
                    precacheEntry = new DefaultsCacheEntry(input);
                    break;
                default:
                    throw ErrorFactory$7.createError('invalid-revisioned-entry',
                        new Error('Invalid file entry: ' +
                            JSON.stringify(precacheEntry))
                    );
            }

            return precacheEntry;
        }

        /**
         * If a dupe entry exists, check the revision. If the revisions are the same
         * it's simply a duplicate entry. If they are different, we have two
         * identical requests with two different revisions which will put this
         * module into a bad state.
         *
         * @private
         * @param {BaseCacheEntry} newEntry The entry that is to be cached.
         * @param {BaseCacheEntry} previousEntry The entry that is currently cached.
         */
        _onDuplicateInstallEntryFound(newEntry, previousEntry) {
            if (previousEntry.revision !== newEntry.revision) {
                throw ErrorFactory$7.createError(
                    'duplicate-entry-diff-revisions',
                    new Error(`${JSON.stringify(previousEntry)} <=> ` +
                        `${JSON.stringify(newEntry)}`));
            }
        }

        /**
         * This method confirms with a precacheEntry is already in the cache with the
         * appropriate revision.
         * If the revision is known, the requested `precacheEntry.revision` is saved
         * and the cache entry exists for the `precacheEntry.path` this method
         * will return true.
         *
         * @private
         * @param {BaseCacheEntry} precacheEntry A entry with `path` and `revision`
         * parameters.
         * @return {Promise<Boolean>} Returns true if the precacheEntry is already
         * cached, false otherwise.
         */
        async _isAlreadyCached(precacheEntry) {
            const revisionDetails = await
                this._revisionDetailsModel.get(precacheEntry.entryID);
            if (revisionDetails !== precacheEntry.revision) {
                return false;
            }

            const openCache = await this._getCache();
            const cachedResponse = await openCache.match(precacheEntry.request);
            return cachedResponse ? true : false;
        }

        /**
         * @private
         * @param {BaseCacheEntry} precacheEntry A file entry with `path` and
         * `revision` parameters.
         */
        async _onEntryCached(precacheEntry) {
            await this._revisionDetailsModel.put(
                precacheEntry.entryID, precacheEntry.revision);
        }

        /**
         * This method closes the indexdDB helper. This is used for unit testing
         * to ensure cleanup between tests.
         * @private
         */
        _close() {
            this._revisionDetailsModel._close();
        }

        /**
         * Compare the URL's and determines which assets are no longer required
         * in the cache.
         *
         * This should be called in the service worker activate event.
         *
         * @return {Promise} Promise that resolves once the cache entries have been
         * cleaned.
         */
        cleanup() {
            return super.cleanup()
                .then(() => {
                    return this._close();
                });
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /**
     * # workbox-precaching
     *
     * The precaching module provides helpers that make it easy to cache files
     * during the install step of your service worker.
     *
     * **Install:** `npm install --save-dev workbox-precaching`
     *
     * The revisioned caching will cache bust requests where appropriate and
     * only cache assets that have a changed revision asset compared to
     * the currently cached value.
     *
     * @example
     * importScripts('/<Path to Module>/build/workbox-precaching.min.js');
     *
     * const revCacheManager = new workbox.precaching.RevisionedCacheManager();
     * revCacheManager.addToCacheList({
     *   revisionedFiles: [
     *     '/styles/main.1234.css',
     *     {
     *       url: '/',
     *       revision: '1234'
     *     }
     *   ],
     * });
     *
     * const unrevCacheManager = new workbox.precaching.UnrevisionedCacheManager();
     * unrevCacheManager.addToCacheList({
     *   unrevisionedFiles: [
     *     '/',
     *     '/images/logo.png'
     *   ]
     * });
     *
     * self.addEventListener('install', (event) => {
     *   const promiseChain = Promise.all([
     *     revCacheManager.install(),
     *     unrevCacheManager.install(),
     *   ]);
     *   event.waitUntil(promiseChain);
     * });
     *
     * self.addEventListener('activate', (event) => {
     *   const promiseChain = Promise.all([
     *     revCacheManager.cleanup(),
     *     unrevCacheManager.cleanup()
     *   ]);
     *   event.waitUntil(promiseChain);
     * });
     *
     * @module workbox-precaching
     */
    if (!environment.isServiceWorkerGlobalScope()) {
        // We are not running in a service worker, print error message
        throw ErrorFactory$7.createError('not-in-sw');
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /* eslint-env browser, serviceworker */

    /**
     * A high level library to make it as easy as possible to precache assets
     * efficiently and define run time caching strategies.
     *
     * @memberof module:workbox-sw
     */
    class WorkboxSW$1 {
        /**
         * You should instantiate this class with `new self.WorkboxSW()`.
         * @param {Object} input
         * @param {string} [input.cacheId] Defining a cacheId is useful to ensure
         * uniqueness across cache names. Useful if you have multiple sites served
         * over localhost.
         * @param {boolean} [input.clientsClaim] To claim currently open clients set
         * this value to true. (Defaults to false).
         * @param  {String} [input.directoryIndex]  The directoryIndex will
         * check cache entries for a URLs ending with '/' to see if there is a hit
         * when appending the directoryIndex (i.e. '/index.html').
         * @param {string} [input.precacheChannelName] This value will be used as
         * the `channelName` to construct a {@link BroadcastCacheUpdate} plugin. The
         * plugin sends a message whenever a precached URL is updated. To disable this
         * plugin, set `precacheChannelName` to an empty string.
         * (Defaults to `'precache-updates'`)
         * @param {Array<RegExp>} [input.ignoreUrlParametersMatching] An array of
         * regex's to remove search params when looking for a cache match.
         */
        constructor({
                        cacheId, clientsClaim, handleFetch,
                        directoryIndex = 'index.html',
                        precacheChannelName = 'precache-updates',
                        ignoreUrlParametersMatching = [/^utm_/]
                    } = {}) {
            if (!environment.isServiceWorkerGlobalScope()) {
                // If we are not running in a service worker, fail early.
                throw ErrorFactory.createError('not-in-sw');
            }

            if (environment.isDevBuild()) {
                if (environment.isLocalhost()) {
                    // If this is a dev bundle on localhost, print a welcome message.
                    logHelper.debug({
                        message: 'Welcome to Workbox!',
                        data: {
                            '📖': 'Read the guides and documentation\n' +
                                'https://googlechrome.github.io/workbox/',
                            '❓': 'Use the [workbox] tag on StackOverflow to ask questions\n' +
                                'https://stackoverflow.com/questions/ask?tags=workbox',
                            '🐛': 'Found a bug? Report it on GitHub\n' +
                                'https://github.com/GoogleChrome/workbox/issues/new',
                        },
                    });
                } else {
                    // If this is a dev bundle not on localhost, recommend the prod bundle.
                    logHelper.warn(`This appears to be a production server. Please switch
          to the smaller, optimized production build of Workbox.`);
                }
            }

            if (cacheId && (typeof cacheId !== 'string' || cacheId.length === 0)) {
                throw ErrorFactory.createError('bad-cache-id');
            }
            if (clientsClaim && (typeof clientsClaim !== 'boolean')) {
                throw ErrorFactory.createError('bad-clients-claim');
            }
            if (typeof directoryIndex !== 'undefined') {
                if (directoryIndex === false || directoryIndex === null) {
                    directoryIndex = false;
                } else if (typeof directoryIndex !== 'string' ||
                    directoryIndex.length === 0) {
                    throw ErrorFactory.createError('bad-directory-index');
                }
            }

            const plugins = [];
            if (precacheChannelName) {
                plugins.push(new BroadcastCacheUpdatePlugin({
                    channelName: precacheChannelName,
                    source: registration && registration.scope ?
                        registration.scope :
                        location,
                }));
            }

            this._runtimeCacheName = getDefaultCacheName({cacheId});
            this._revisionedCacheManager = new RevisionedCacheManager({
                cacheId,
                plugins,
            });
            this._strategies = new Strategies({
                cacheId,
            });

            this._router = new Router$$1(
                this._revisionedCacheManager.getCacheName(),
                handleFetch
            );
            this._registerInstallActivateEvents(clientsClaim);
            this._registerDefaultRoutes(ignoreUrlParametersMatching, directoryIndex);
        }

        /**
         * The router for this library is exposed via the `router` parameter.
         * This is an instance of the {@link module:workbox-sw.Router|Router}.
         *
         * @example
         * const workboxSW = new WorkboxSW();
         * workboxSW.router.registerRoute('/', workboxSW.workbox.cacheFirst());
         *
         * @type {Router}
         */
        get router() {
            return this._router;
        }

        /**
         * The supported caching strategies shipped with workbox-sw are provided via
         * the `strategies` object.
         * {@link module:workbox-sw.Strategies|See Strategies for a complete list}.
         *
         * @example
         * const workboxSW = new WorkboxSW();
         * workboxSW.router.registerRoute('/styles/*',
         *  workboxSW.strategies.cacheFirst());
         */
        get strategies() {
            return this._strategies;
        }

        /**
         * RuntimeStrategyOptions is just a JavaScript object, but the structure
         * explains the options for runtime strategies used in workbox-sw.
         *
         * See the example of how this can be used with the `cacheFirst()` caching
         * strategy.
         *
         * @example
         * const workboxSW = new WorkboxSW();
         * const cacheFirstStrategy = workboxSW.strategies.cacheFirst({
         *   cacheName: 'example-cache',
         *   cacheExpiration: {
         *     maxEntries: 10,
         *     maxAgeSeconds: 7 * 24 * 60 * 60
         *   },
         *   broadcastCacheUpdate: {
         *     channelName: 'example-channel-name'
         *   },
         *   cacheableResponse: {
         *     statuses: [0, 200, 404],
         *     headers: {
         *       'Example-Header-1': 'Header-Value-1',
         *       'Example-Header-2': 'Header-Value-2'
         *     }
         *   }
         *   plugins: [
         *     // Additional Plugins
         *   ]
         * });
         *
         * @typedef {Object} RuntimeStrategyOptions
         * @property {String} cacheName Name of cache to use
         * for caching (both lookup and updating).
         * @property {Object} cacheExpiration Defining this
         * object will add a cache expiration plugins to this strategy.
         * @property {Number} cacheExpiration.maxEntries
         * The maximum number of entries to store in a cache.
         * @property {Number} cacheExpiration.maxAgeSeconds
         * The maximum lifetime of a request to stay in the cache before it's removed.
         * @property {Object} broadcastCacheUpdate Defining
         * this object will add a broadcast cache update plugin.
         * @property {String} broadcastCacheUpdate.channelName
         * The name of the broadcast channel to dispatch messages on.
         * @property {Array<plugins>} plugins For
         * any additional plugins you wish to add, simply include them in this
         * array.
         * @property {Object} cacheableResponse Specifies types of responses to cache
         * by status codes, headers, or both.
         * @property {Array<Number>} cacheableResponse.statuses An array of status
         * codes to cache.
         * @property {Array<Object>} cacheableResponse.headers An array of
         * header-value paris for HTTP headers to cache. See the example, above.
         * @memberof module:workbox-sw.SWLib
         */

        /**
         * The name of the cache used by default by the runtime caching strategies.
         *
         * Entries that are managed via `precache()` are stored in a separate cache
         * with a different name.
         *
         * You can override the default cache name when constructing a strategy if
         * you'd prefer, via
         * `workboxSW.strategies.cacheFirst({cacheName: 'my-cache-name'});`
         *
         * If you would like to explicitly add to, remove, or check the contents of
         * the default cache, you can use the [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
         * to pass in the default cache name to `caches.open()`. This can be useful if
         * you want to "prime" your cache with remote resources that can't be properly
         * managed via `precache()`.
         *
         * @example
         * const cache = await caches.open(workboxSW.runtimeCacheName);
         * await cache.add('https://third-party.com/path/to/file');
         * const contentsOfRuntimeCache = await cache.keys();
         */
        get runtimeCacheName() {
            return this._runtimeCacheName;
        }

        /**
         * Revisioned assets can be cached intelligently
         * during the install (i.e. old files are cleared from the cache, new files
         * are added to the cache and unchanged files are left as is).
         *
         * The input needs to be an array of URL strings which having revisioning
         * details in them otherwise the entry should be an object with `url` and
         * `revision` parameters.
         *
         * In addition to maintaining the cache, this method will also set up the
         * necessary routes to serve the precached assets using a cache-first
         * strategy.
         *
         * @example <caption>Cache revisioned assets.</caption>
         * // Cache a set of revisioned URLs
         * const workboxSW = new WorkboxSW();
         * workboxSW.precache([
         *     '/styles/main.613e6c7332dd83e848a8b00c403827ed.css',
         *     '/images/logo.59a325f32baad11bd47a8c515ec44ae5.jpg'
         * ]);
         *
         * // ...precache() can also take objects to cache
         * // non-revisioned URLs.
         * // Please use workbox-build or workbox-cli to generate the manifest for
         * // you.
         * workboxSW.precache([
         *     {
         *       url: '/index.html',
         *       revision: '613e6c7332dd83e848a8b00c403827ed'
         *     },
         *     {
         *       url: '/about.html',
         *       revision: '59a325f32baad11bd47a8c515ec44ae5'
         *     }
         * ]);
         *
         * @param {Array<String|Object>} revisionedFiles A set of urls to cache
         * when the service worker is installed.
         */
        precache(revisionedFiles) {
            // Add a more helpful error message than assertion error.
            if (!Array.isArray(revisionedFiles)) {
                throw ErrorFactory.createError('bad-revisioned-cache-list');
            }

            this._revisionedCacheManager.addToCacheList({
                revisionedFiles,
            });
        }

        /**
         * This method will register listeners for the install and activate events.
         * @private
         * @param {boolean} clientsClaim Whether to claim clients in activate or not.
         */
        _registerInstallActivateEvents(clientsClaim) {
            self.addEventListener('install', (event) => {
                const cachedUrls = this._revisionedCacheManager.getCachedUrls();
                if (cachedUrls.length > 0) {
                    logHelper.debug({
                        that: this,
                        message: `The precached URLs will automatically be served using a
            cache-first strategy.`,
                        data: {'Precached URLs': JSON.stringify(cachedUrls)},
                    });
                }

                event.waitUntil(this._revisionedCacheManager.install());
            });

            self.addEventListener('activate', (event) => {
                event.waitUntil(
                    this._revisionedCacheManager.cleanup()
                        .then(() => {
                            if (clientsClaim) {
                                return self.clients.claim();
                            }
                        })
                );
            });
        }

        /**
         * This method will register any default routes the library will need.
         * @private
         * @param {Array<RegExp>} ignoreUrlParametersMatching An array of regex's
         * used to remove search parameters which match on of them.
         * @param {string} directoryIndex The directory index is appended to URLs
         * ending with '/'.
         */
        _registerDefaultRoutes(ignoreUrlParametersMatching, directoryIndex) {
            const plugins = [];

            // Add custom directory index plugin.
            if (ignoreUrlParametersMatching || directoryIndex) {
                plugins.push(
                    this._getCacheMatchPlugin(ignoreUrlParametersMatching, directoryIndex)
                );
            }

            const cacheFirstHandler = this.strategies.cacheFirst({
                cacheName: this._revisionedCacheManager.getCacheName(),
                plugins,
            });

            const route = new Route({
                match: ({url}) => {
                    const cachedUrls = this._revisionedCacheManager.getCachedUrls();
                    if (cachedUrls.indexOf(url.href) !== -1) {
                        return true;
                    }

                    let strippedUrl =
                        this._removeIgnoreUrlParams(url.href, ignoreUrlParametersMatching);
                    if (cachedUrls.indexOf(strippedUrl.href) !== -1) {
                        return true;
                    }

                    if (directoryIndex && strippedUrl.pathname.endsWith('/')) {
                        url.pathname += directoryIndex;
                        return cachedUrls.indexOf(url.href) !== -1;
                    }

                    return false;
                },
                handler: cacheFirstHandler,
            });
            this.router.registerRoute(route);
        }

        /**
         * @private
         * @param  {Array<RegExp>} ignoreUrlParametersMatching An array of regex's to
         * define which search parameters should be removed before looking for cache
         * match.
         * @param {string} directoryIndex The directory index is appended to URLs
         * ending with '/'.
         * @return {Promise<Object>} Returns a plugin that attempts to match the
         * URL with /index.html
         */
        _getCacheMatchPlugin(ignoreUrlParametersMatching, directoryIndex) {
            const cacheMatchFunction = async (
                {request, cache, cachedResponse, matchOptions}) => {
                // If we already have a cache hit, then just return that.
                if (cachedResponse) {
                    return cachedResponse;
                }

                let strippedUrl =
                    this._removeIgnoreUrlParams(request.url, ignoreUrlParametersMatching);
                return cache.match(strippedUrl.toString(), matchOptions)
                    .then((response) => {
                        if (!response) {
                            // Otherwise, try again with the indexHtmlString value.
                            if (strippedUrl.pathname.endsWith('/')) {
                                strippedUrl.pathname += directoryIndex;
                                return cache.match(strippedUrl.toString(), matchOptions);
                            }
                        }

                        return response;
                    });
            };

            return {cacheWillMatch: cacheMatchFunction};
        }

        /**
         * @param {string} originalUrl The original url to remove the search params.
         * @param  {Array<RegExp>} ignoreUrlParametersMatching An array of regex's to
         * define which search parameters should be removed before looking for cache
         * match.
         * @return {string} An object that can be used as a plugin within a
         * RequestWrapper.
         */
        _removeIgnoreUrlParams(originalUrl, ignoreUrlParametersMatching) {
            const url = new URL(originalUrl);

            // Exclude initial '?'
            const searchString = url.search.slice(1);

            // Split into an array of 'key=value' strings
            const keyValueStrings = searchString.split('&');
            const keyValuePairs = keyValueStrings.map((keyValueString) => {
                // Split each 'key=value' string into a [key, value] array
                return keyValueString.split('=');
            });

            const filteredKeyValuesPairs = keyValuePairs.filter((keyValuePair) => {
                return ignoreUrlParametersMatching
                    .every((ignoredRegex) => {
                        // Return true iff the key doesn't match any of the regexes.
                        return !ignoredRegex.test(keyValuePair[0]);
                    });
            });
            const filteredStrings = filteredKeyValuesPairs.map((keyValuePair) => {
                // Join each [key, value] array into a 'key=value' string
                return keyValuePair.join('=');
            });

            // Join the array of 'key=value' strings into a string with '&' in
            // between each
            url.search = filteredStrings.join('&');

            return url;
        }
    }

    /*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

    /* eslint-env browser */

    return WorkboxSW$1;

}());
//# sourceMappingURL=workbox-sw.dev.v0.0.2.js.map

/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

this.workbox = this.workbox || {};
(function (exports) {
    'use strict';

    class ErrorFactory$1 {
        constructor(a) {
            this._errors = a;
        }

        createError(a, b) {
            if (!(a in this._errors)) throw new Error(`Unable to generate error '${a}'.`);
            let c = this._errors[a].replace(/\s+/g, ' '), d = null;
            b && (c += ` [${b.message}]`, d = b.stack);
            const e = new Error;
            return e.name = a, e.message = c, e.stack = d, e
        }
    }

    const errors = {
        "multiple-cache-will-update-plugins": 'You cannot register more than one plugin that implements cacheWillUpdate.',
        "multiple-cache-will-match-plugins": 'You cannot register more than one plugin that implements cacheWillMatch.',
        "invalid-response-for-caching": 'The fetched response could not be cached due to an invalid response code.',
        "no-response-received": 'No response received; falling back to cache.',
        "bad-cache-id": `The 'cacheId' parameter must be a string with at least ` + `one character.`
    };
    var ErrorFactory = new ErrorFactory$1(errors);

    var ErrorStackParser = {parse: () => []};

    function atLeastOne(a) {
        const b = Object.keys(a);
        b.some((c) => a[c] !== void 0) || throwError('Please set at least one of the following parameters: ' + b.map((c) => `'${c}'`).join(', '));
    }

    function isInstance(a, b) {
        const c = Object.keys(a).pop();
        a[c] instanceof b || throwError(`The '${c}' parameter must be an instance of
      '${b.name}'`);
    }

    function isType(a, b) {
        const c = Object.keys(a).pop(), d = typeof a[c];
        d !== b && throwError(`The '${c}' parameter has the wrong type. (Expected:
      ${b}, actual: ${d})`);
    }

    function isArrayOfType(a, b) {
        const c = Object.keys(a).pop(), d = `The '${c}' parameter should be an array containing
    one or more '${b}' elements.`;
        Array.isArray(a[c]) || throwError(d);
        for (let e of a[c]) typeof e !== b && throwError(d);
    }

    function throwError(a) {
        a = a.replace(/\s+/g, ' ');
        const b = new Error(a);
        b.name = 'assertion-failed';
        const c = ErrorStackParser.parse(b);
        throw 3 <= c.length && (b.message = `Invalid call to ${c[2].functionName}() — ` + a), b
    }

    class LogGroup {
        constructor() {
            this._logs = [], this._childGroups = [], this._isFallbackMode = !1;
            const a = /Firefox\/(\d*)\.\d*/.exec(navigator.userAgent);
            if (a) try {
                const b = parseInt(a[1], 10);
                55 > b && (this._isFallbackMode = !0);
            } catch (b) {
                this._isFallbackMode = !0;
            }
            /Edge\/\d*\.\d*/.exec(navigator.userAgent) && (this._isFallbackMode = !0);
        }

        addPrimaryLog(a) {
            this._primaryLog = a;
        }

        addLog(a) {
            this._logs.push(a);
        }

        addChildGroup(a) {
            0 === a._logs.length || this._childGroups.push(a);
        }

        print() {
            return 0 === this._logs.length && 0 === this._childGroups.length ? void this._printLogDetails(this._primaryLog) : void (this._primaryLog && (this._isFallbackMode ? this._printLogDetails(this._primaryLog) : console.groupCollapsed(...this._getLogContent(this._primaryLog))), this._logs.forEach((a) => {
                this._printLogDetails(a);
            }), this._childGroups.forEach((a) => {
                a.print();
            }), this._primaryLog && !this._isFallbackMode && console.groupEnd())
        }

        _printLogDetails(a) {
            const b = a.logFunc ? a.logFunc : console.log;
            b(...this._getLogContent(a));
        }

        _getLogContent(a) {
            let b = a.message;
            this._isFallbackMode && 'string' == typeof b && (b = b.replace(/%c/g, ''));
            let c = [b];
            return !this._isFallbackMode && a.colors && (c = c.concat(a.colors)), a.args && (c = c.concat(a.args)), c
        }
    }

    function isDevBuild() {
        return `dev` == `prod`
    }

    self.workbox = self.workbox || {}, self.workbox.LOG_LEVEL = self.workbox.LOG_LEVEL || {
        none: -1,
        verbose: 0,
        debug: 1,
        warn: 2,
        error: 3
    };
    const LIGHT_GREY = `#bdc3c7`;
    const DARK_GREY = `#7f8c8d`;
    const LIGHT_GREEN = `#2ecc71`;
    const LIGHT_YELLOW = `#f1c40f`;
    const LIGHT_RED = `#e74c3c`;
    const LIGHT_BLUE = `#3498db`;

    class LogHelper {
        constructor() {
            this._defaultLogLevel = isDevBuild() ? self.workbox.LOG_LEVEL.debug : self.workbox.LOG_LEVEL.warn;
        }

        log(a) {
            this._printMessage(self.workbox.LOG_LEVEL.verbose, a);
        }

        debug(a) {
            this._printMessage(self.workbox.LOG_LEVEL.debug, a);
        }

        warn(a) {
            this._printMessage(self.workbox.LOG_LEVEL.warn, a);
        }

        error(a) {
            this._printMessage(self.workbox.LOG_LEVEL.error, a);
        }

        _printMessage(a, b) {
            if (this._shouldLogMessage(a, b)) {
                const c = this._getAllLogGroups(a, b);
                c.print();
            }
        }

        _getAllLogGroups(a, b) {
            const c = new LogGroup, d = this._getPrimaryMessageDetails(a, b);
            if (c.addPrimaryLog(d), b.error) {
                const f = {message: b.error, logFunc: console.error};
                c.addLog(f);
            }
            const e = new LogGroup;
            if (b.that && b.that.constructor && b.that.constructor.name) {
                const f = b.that.constructor.name;
                e.addLog(this._getKeyValueDetails('class', f));
            }
            return b.data && ('object' != typeof b.data || b.data instanceof Array ? e.addLog(this._getKeyValueDetails('additionalData', b.data)) : Object.keys(b.data).forEach((f) => {
                e.addLog(this._getKeyValueDetails(f, b.data[f]));
            })), c.addChildGroup(e), c
        }

        _getKeyValueDetails(a, b) {
            return {message: `%c${a}: `, colors: [`color: ${LIGHT_BLUE}`], args: b}
        }

        _getPrimaryMessageDetails(a, b) {
            let c, d;
            a === self.workbox.LOG_LEVEL.verbose ? (c = 'Info', d = LIGHT_GREY) : a === self.workbox.LOG_LEVEL.debug ? (c = 'Debug', d = LIGHT_GREEN) : a === self.workbox.LOG_LEVEL.warn ? (c = 'Warn', d = LIGHT_YELLOW) : a === self.workbox.LOG_LEVEL.error ? (c = 'Error', d = LIGHT_RED) : void 0;
            let e = `%c🔧 %c[${c}]`;
            const f = [`color: ${LIGHT_GREY}`, `color: ${d}`];
            let g;
            return 'string' == typeof b ? g = b : b.message && (g = b.message), g && (g = g.replace(/\s+/g, ' '), e += `%c ${g}`, f.push(`color: ${DARK_GREY}; font-weight: normal`)), {
                message: e,
                colors: f
            }
        }

        _shouldLogMessage(a, b) {
            if (!b) return !1;
            let c = this._defaultLogLevel;
            return self && self.workbox && 'number' == typeof self.workbox.logLevel && (c = self.workbox.logLevel), c === self.workbox.LOG_LEVEL.none || a < c ? !1 : !0
        }
    }

    var logHelper = new LogHelper;

    class CacheableResponse {
        constructor({statuses: a, headers: b} = {}) {
            atLeastOne({
                statuses: a,
                headers: b
            }), a !== void 0 && isArrayOfType({statuses: a}, 'number'), b !== void 0 && isType({headers: b}, 'object'), this.statuses = a, this.headers = b;
        }

        isResponseCacheable({request: a, response: b} = {}) {
            isInstance({response: b}, Response);
            let c = !0;
            if (this.statuses && (c = this.statuses.includes(b.status)), this.headers && c && (c = Object.keys(this.headers).some((d) => {
                return b.headers.get(d) === this.headers[d]
            })), !c) {
                const d = {response: b};
                this.statuses && (d['valid-status-codes'] = JSON.stringify(this.statuses)), this.headers && (d['valid-headers'] = JSON.stringify(this.headers)), a && (d.request = a), logHelper.debug({
                    message: `The response does not meet the criteria for being added to the
          cache.`, data: d
                });
            }
            return c
        }
    }

    class CacheableResponsePlugin extends CacheableResponse {
        cacheWillUpdate({request: a, response: b} = {}) {
            return this.isResponseCacheable({request: a, response: b})
        }
    }

    const getDefaultCacheName = ({cacheId: a} = {}) => {
        let b = `workbox-runtime-caching`;
        return a && (b = `${a}-${b}`), self && self.registration && (b += `-${self.registration.scope}`), b
    };
    const pluginCallbacks = ['cacheDidUpdate', 'cacheWillMatch', 'cacheWillUpdate', 'fetchDidFail', 'requestWillFetch'];

    var cleanResponseCopy = (({response: a}) => {
        isInstance({response: a}, Response);
        const b = a.clone(), c = 'body' in b ? Promise.resolve(b.body) : b.blob();
        return c.then((d) => {
            return new Response(d, {headers: b.headers, status: b.status, statusText: b.statusText})
        })
    });

    class RequestWrapper {
        constructor({cacheName: a, cacheId: b, plugins: c, fetchOptions: d, matchOptions: e} = {}) {
            if (b && ('string' != typeof b || 0 === b.length)) throw ErrorFactory.createError('bad-cache-id');
            a ? (isType({cacheName: a}, 'string'), this.cacheName = a, b && (this.cacheName = `${b}-${this.cacheName}`)) : this.cacheName = getDefaultCacheName({cacheId: b}), d && (isType({fetchOptions: d}, 'object'), this.fetchOptions = d), e && (isType({matchOptions: e}, 'object'), this.matchOptions = e), this.plugins = new Map, c && (isArrayOfType({plugins: c}, 'object'), c.forEach((f) => {
                for (let g of pluginCallbacks) if ('function' == typeof f[g]) {
                    if (!this.plugins.has(g)) this.plugins.set(g, []); else if ('cacheWillUpdate' === g) throw ErrorFactory.createError('multiple-cache-will-update-plugins'); else if ('cacheWillMatch' === g) throw ErrorFactory.createError('multiple-cache-will-match-plugins');
                    this.plugins.get(g).push(f);
                }
            })), this.plugins.has('cacheWillUpdate') && (this._userSpecifiedCachableResponsePlugin = this.plugins.get('cacheWillUpdate')[0]);
        }

        getDefaultCacheableResponsePlugin() {
            return this._defaultCacheableResponsePlugin || (this._defaultCacheableResponsePlugin = new CacheableResponsePlugin({statuses: [200]})), this._defaultCacheableResponsePlugin
        }

        async getCache() {
            return this._cache || (this._cache = await caches.open(this.cacheName)), this._cache
        }

        async match({request: a}) {
            atLeastOne({request: a});
            const b = await this.getCache();
            let c = await b.match(a, this.matchOptions);
            if (this.plugins.has('cacheWillMatch')) {
                const d = this.plugins.get('cacheWillMatch')[0];
                c = d.cacheWillMatch({
                    request: a,
                    cache: b,
                    cachedResponse: c,
                    matchOptions: this.matchOptions,
                    cacheName: this.cacheName
                });
            }
            return c
        }

        async fetch({request: a}) {
            'string' == typeof a ? a = new Request(a) : isInstance({request: a}, Request);
            const b = this.plugins.has('fetchDidFail') ? a.clone() : null;
            if (this.plugins.has('requestWillFetch')) for (let c of this.plugins.get('requestWillFetch')) {
                const d = c.requestWillFetch({request: a});
                isInstance({returnedPromise: d}, Promise);
                const e = await d;
                isInstance({returnedRequest: e}, Request), a = e;
            }
            try {
                return await fetch(a, this.fetchOptions)
            } catch (c) {
                if (this.plugins.has('fetchDidFail')) for (let d of this.plugins.get('fetchDidFail')) d.fetchDidFail({request: b.clone()});
                throw c
            }
        }

        async fetchAndCache({request: a, waitOnCache: b, cacheKey: c, cacheResponsePlugin: d, cleanRedirects: e}) {
            atLeastOne({request: a});
            let f;
            const g = await this.fetch({request: a}),
                h = this._userSpecifiedCachableResponsePlugin || d || this.getDefaultCacheableResponsePlugin(),
                i = h.cacheWillUpdate({request: a, response: g});
            if (i) {
                const j = e && g.redirected ? await cleanResponseCopy({response: g}) : g.clone();
                f = this.getCache().then(async (k) => {
                    let l;
                    const m = c || a;
                    if ('opaque' !== g.type && this.plugins.has('cacheDidUpdate') && (l = await this.match({request: m})), await k.put(m, j), this.plugins.has('cacheDidUpdate')) for (let n of this.plugins.get('cacheDidUpdate')) await n.cacheDidUpdate({
                        cacheName: this.cacheName,
                        oldResponse: l,
                        newResponse: j,
                        url: 'url' in m ? m.url : m
                    });
                });
            } else if (!i && b) throw ErrorFactory.createError('invalid-response-for-caching');
            return b && f && (await f), g
        }
    }

    class Handler {
        constructor({requestWrapper: a, waitOnCache: b} = {}) {
            this.requestWrapper = a ? a : new RequestWrapper, this.waitOnCache = !!b;
        }

        handle({event: a, params: b} = {}) {
            throw Error('This abstract method must be implemented in a subclass.')
        }
    }

    class CacheFirst extends Handler {
        async handle({event: a} = {}) {
            isInstance({event: a}, FetchEvent);
            const b = await this.requestWrapper.match({request: a.request});
            return b || (await this.requestWrapper.fetchAndCache({request: a.request, waitOnCache: this.waitOnCache}))
        }
    }

    class CacheOnly extends Handler {
        async handle({event: a} = {}) {
            return isInstance({event: a}, FetchEvent), await this.requestWrapper.match({request: a.request})
        }
    }

    class NetworkFirst extends Handler {
        constructor(a = {}) {
            super(a), this._cacheablePlugin = new CacheableResponsePlugin({statuses: [0, 200]});
            const {networkTimeoutSeconds: b} = a;
            b && (isType({networkTimeoutSeconds: b}, 'number'), this.networkTimeoutSeconds = b);
        }

        async handle({event: a} = {}) {
            isInstance({event: a}, FetchEvent);
            const b = [];
            let c;
            this.networkTimeoutSeconds && b.push(new Promise((e) => {
                c = setTimeout(() => {
                    e(this.requestWrapper.match({request: a.request}));
                }, 1e3 * this.networkTimeoutSeconds);
            }));
            const d = this.requestWrapper.fetchAndCache({
                request: a.request,
                waitOnCache: this.waitOnCache,
                cacheResponsePlugin: this._cacheablePlugin
            }).then((e) => {
                return c && clearTimeout(c), e ? e : Promise.reject(ErrorFactory.createError('no-response-received'))
            }).catch(() => this.requestWrapper.match({request: a.request}));
            return b.push(d), Promise.race(b)
        }
    }

    class NetworkOnly extends Handler {
        async handle({event: a} = {}) {
            return isInstance({event: a}, FetchEvent), await this.requestWrapper.fetch({request: a.request})
        }
    }

    class StaleWhileRevalidate extends Handler {
        constructor(a = {}) {
            super(a), this._cacheablePlugin = new CacheableResponsePlugin({statuses: [0, 200]});
        }

        async handle({event: a} = {}) {
            isInstance({event: a}, FetchEvent);
            const b = this.requestWrapper.fetchAndCache({
                request: a.request,
                waitOnCache: this.waitOnCache,
                cacheResponsePlugin: this._cacheablePlugin
            }).catch(() => Response.error()), c = await this.requestWrapper.match({request: a.request});
            return c || (await b)
        }
    }

    exports.CacheFirst = CacheFirst;
    exports.CacheOnly = CacheOnly;
    exports.Handler = Handler;
    exports.NetworkFirst = NetworkFirst;
    exports.NetworkOnly = NetworkOnly;
    exports.RequestWrapper = RequestWrapper;
    exports.StaleWhileRevalidate = StaleWhileRevalidate;
    exports.getDefaultCacheName = getDefaultCacheName;

}((this.workbox.runtimeCaching = this.workbox.runtimeCaching || {})));
//# sourceMappingURL=workbox-runtime-caching.prod.v1.3.0.js.map

/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

this.workbox = this.workbox || {};
(function (exports) {
    'use strict';

    class ErrorFactory$1 {
        constructor(a) {
            this._errors = a;
        }

        createError(a, b) {
            if (!(a in this._errors)) throw new Error(`Unable to generate error '${a}'.`);
            let c = this._errors[a].replace(/\s+/g, ' '), d = null;
            b && (c += ` [${b.message}]`, d = b.stack);
            const e = new Error;
            return e.name = a, e.message = c, e.stack = d, e
        }
    }

    const errors = {
        "express-route-invalid-path": `When using ExpressRoute, you must
    provide a path that starts with a '/' character (to match same-origin
    requests) or that starts with 'http' (to match cross-origin requests)`
    };
    var ErrorFactory = new ErrorFactory$1(errors);

    var ErrorStackParser = {parse: () => []};

    function hasMethod(a, b) {
        const c = Object.keys(a).pop(), d = typeof a[c][b];
        'function' != d && throwError(`The '${c}' parameter must be an object that exposes a
      '${b}' method.`);
    }

    function isInstance(a, b) {
        const c = Object.keys(a).pop();
        a[c] instanceof b || throwError(`The '${c}' parameter must be an instance of
      '${b.name}'`);
    }

    function isOneOf(a, b) {
        const c = Object.keys(a).pop();
        b.includes(a[c]) || throwError(`The '${c}' parameter must be set to one of the
      following: ${b}`);
    }

    function isType(a, b) {
        const c = Object.keys(a).pop(), d = typeof a[c];
        d !== b && throwError(`The '${c}' parameter has the wrong type. (Expected:
      ${b}, actual: ${d})`);
    }

    function isArrayOfClass(a, b) {
        const c = Object.keys(a).pop(), d = `The '${c}' parameter should be an array containing
    one or more '${b.name}' instances.`;
        Array.isArray(a[c]) || throwError(d);
        for (let e of a[c]) e instanceof b || throwError(d);
    }

    function throwError(a) {
        a = a.replace(/\s+/g, ' ');
        const b = new Error(a);
        b.name = 'assertion-failed';
        const c = ErrorStackParser.parse(b);
        throw 3 <= c.length && (b.message = `Invalid call to ${c[2].functionName}() — ` + a), b
    }

    function normalizeHandler(a) {
        return 'object' == typeof a ? (hasMethod({handler: a}, 'handle'), a) : (isType({handler: a}, 'function'), {handle: a})
    }

    const defaultMethod = 'GET';
    const validMethods = ['DELETE', 'GET', 'HEAD', 'POST', 'PUT'];

    class Route {
        constructor({match: a, handler: b, method: c} = {}) {
            this.handler = normalizeHandler(b), isType({match: a}, 'function'), this.match = a, c ? (isOneOf({method: c}, validMethods), this.method = c) : this.method = defaultMethod;
        }
    }

    var index$1 = Array.isArray || function (a) {
        return '[object Array]' == Object.prototype.toString.call(a)
    };

    var index = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;
    var PATH_REGEXP = new RegExp(['(\\\\.)', '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'].join('|'), 'g');

    function parse(a, b) {
        for (var k, d = [], e = 0, f = 0, g = '', h = b && b.delimiter || '/'; null != (k = PATH_REGEXP.exec(a));) {
            var l = k[0], n = k[1], o = k.index;
            if (g += a.slice(f, o), f = o + l.length, n) {
                g += n[1];
                continue
            }
            var p = a[f], q = k[2], r = k[3], s = k[4], t = k[5], u = k[6], v = k[7];
            g && (d.push(g), g = '');
            var z = k[2] || h, A = s || t;
            d.push({
                name: r || e++,
                prefix: q || '',
                delimiter: z,
                optional: '?' === u || '*' === u,
                repeat: '+' === u || '*' === u,
                partial: null != q && null != p && p !== q,
                asterisk: !!v,
                pattern: A ? escapeGroup(A) : v ? '.*' : '[^' + escapeString(z) + ']+?'
            });
        }
        return f < a.length && (g += a.substr(f)), g && d.push(g), d
    }

    function compile(a, b) {
        return tokensToFunction(parse(a, b))
    }

    function encodeURIComponentPretty(a) {
        return encodeURI(a).replace(/[\/?#]/g, function (b) {
            return '%' + b.charCodeAt(0).toString(16).toUpperCase()
        })
    }

    function encodeAsterisk(a) {
        return encodeURI(a).replace(/[?#]/g, function (b) {
            return '%' + b.charCodeAt(0).toString(16).toUpperCase()
        })
    }

    function tokensToFunction(a) {
        for (var b = Array(a.length), d = 0; d < a.length; d++) 'object' == typeof a[d] && (b[d] = new RegExp('^(?:' + a[d].pattern + ')$'));
        return function (e, f) {
            for (var o, g = '', h = e || {}, k = f || {}, l = k.pretty ? encodeURIComponentPretty : encodeURIComponent, n = 0; n < a.length; n++) {
                if (o = a[n], 'string' == typeof o) {
                    g += o;
                    continue
                }
                var q, p = h[o.name];
                if (null == p) if (o.optional) {
                    o.partial && (g += o.prefix);
                    continue
                } else throw new TypeError('Expected "' + o.name + '" to be defined');
                if (index$1(p)) {
                    if (!o.repeat) throw new TypeError('Expected "' + o.name + '" to not repeat, but received `' + JSON.stringify(p) + '`');
                    if (0 === p.length) if (o.optional) continue; else throw new TypeError('Expected "' + o.name + '" to not be empty');
                    for (var r = 0; r < p.length; r++) {
                        if (q = l(p[r]), !b[n].test(q)) throw new TypeError('Expected all "' + o.name + '" to match "' + o.pattern + '", but received `' + JSON.stringify(q) + '`');
                        g += (0 === r ? o.prefix : o.delimiter) + q;
                    }
                    continue
                }
                if (q = o.asterisk ? encodeAsterisk(p) : l(p), !b[n].test(q)) throw new TypeError('Expected "' + o.name + '" to match "' + o.pattern + '", but received "' + q + '"');
                g += o.prefix + q;
            }
            return g
        }
    }

    function escapeString(a) {
        return a.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1')
    }

    function escapeGroup(a) {
        return a.replace(/([=!:$\/()])/g, '\\$1')
    }

    function attachKeys(a, b) {
        return a.keys = b, a
    }

    function flags(a) {
        return a.sensitive ? '' : 'i'
    }

    function regexpToRegexp(a, b) {
        var d = a.source.match(/\((?!\?)/g);
        if (d) for (var e = 0; e < d.length; e++) b.push({
            name: e,
            prefix: null,
            delimiter: null,
            optional: !1,
            repeat: !1,
            partial: !1,
            asterisk: !1,
            pattern: null
        });
        return attachKeys(a, b)
    }

    function arrayToRegexp(a, b, d) {
        for (var e = [], f = 0; f < a.length; f++) e.push(pathToRegexp(a[f], b, d).source);
        var g = new RegExp('(?:' + e.join('|') + ')', flags(d));
        return attachKeys(g, b)
    }

    function stringToRegexp(a, b, d) {
        return tokensToRegExp(parse(a, d), b, d)
    }

    function tokensToRegExp(a, b, d) {
        index$1(b) || (d = b || d, b = []), d = d || {};
        for (var k, e = d.strict, f = !1 !== d.end, g = '', h = 0; h < a.length; h++) if (k = a[h], 'string' == typeof k) g += escapeString(k); else {
            var l = escapeString(k.prefix), n = '(?:' + k.pattern + ')';
            b.push(k), k.repeat && (n += '(?:' + l + n + ')*'), n = k.optional ? k.partial ? l + '(' + n + ')?' : '(?:' + l + '(' + n + '))?' : l + '(' + n + ')', g += n;
        }
        var o = escapeString(d.delimiter || '/'), p = g.slice(-o.length) === o;
        return e || (g = (p ? g.slice(0, -o.length) : g) + '(?:' + o + '(?=$))?'), g += f ? '$' : e && p ? '' : '(?=' + o + '|$)', attachKeys(new RegExp('^' + g, flags(d)), b)
    }

    function pathToRegexp(a, b, d) {
        return index$1(b) || (d = b || d, b = []), d = d || {}, a instanceof RegExp ? regexpToRegexp(a, b) : index$1(a) ? arrayToRegexp(a, b, d) : stringToRegexp(a, b, d)
    }

    index.parse = parse_1, index.compile = compile_1, index.tokensToFunction = tokensToFunction_1, index.tokensToRegExp = tokensToRegExp_1;

    class ExpressRoute extends Route {
        constructor({path: a, handler: b, method: c}) {
            if (!(a.startsWith('/') || a.startsWith('http'))) throw ErrorFactory.createError('express-route-invalid-path');
            let d = [];
            const e = index(a, d);
            super({
                match: ({url: g}) => {
                    if (a.startsWith('/') && g.origin !== location.origin) return null;
                    const h = a.startsWith('/') ? g.pathname : g.href, i = h.match(e);
                    if (!i) return null;
                    const j = {};
                    return d.forEach((k, l) => {
                        j[k.name] = i[l + 1];
                    }), j
                }, handler: b, method: c
            });
        }
    }

    class LogGroup {
        constructor() {
            this._logs = [], this._childGroups = [], this._isFallbackMode = !1;
            const a = /Firefox\/(\d*)\.\d*/.exec(navigator.userAgent);
            if (a) try {
                const b = parseInt(a[1], 10);
                55 > b && (this._isFallbackMode = !0);
            } catch (b) {
                this._isFallbackMode = !0;
            }
            /Edge\/\d*\.\d*/.exec(navigator.userAgent) && (this._isFallbackMode = !0);
        }

        addPrimaryLog(a) {
            this._primaryLog = a;
        }

        addLog(a) {
            this._logs.push(a);
        }

        addChildGroup(a) {
            0 === a._logs.length || this._childGroups.push(a);
        }

        print() {
            return 0 === this._logs.length && 0 === this._childGroups.length ? void this._printLogDetails(this._primaryLog) : void (this._primaryLog && (this._isFallbackMode ? this._printLogDetails(this._primaryLog) : console.groupCollapsed(...this._getLogContent(this._primaryLog))), this._logs.forEach((a) => {
                this._printLogDetails(a);
            }), this._childGroups.forEach((a) => {
                a.print();
            }), this._primaryLog && !this._isFallbackMode && console.groupEnd())
        }

        _printLogDetails(a) {
            const b = a.logFunc ? a.logFunc : console.log;
            b(...this._getLogContent(a));
        }

        _getLogContent(a) {
            let b = a.message;
            this._isFallbackMode && 'string' == typeof b && (b = b.replace(/%c/g, ''));
            let c = [b];
            return !this._isFallbackMode && a.colors && (c = c.concat(a.colors)), a.args && (c = c.concat(a.args)), c
        }
    }

    function isDevBuild() {
        return `dev` == `prod`
    }

    self.workbox = self.workbox || {}, self.workbox.LOG_LEVEL = self.workbox.LOG_LEVEL || {
        none: -1,
        verbose: 0,
        debug: 1,
        warn: 2,
        error: 3
    };
    const LIGHT_GREY = `#bdc3c7`;
    const DARK_GREY = `#7f8c8d`;
    const LIGHT_GREEN = `#2ecc71`;
    const LIGHT_YELLOW = `#f1c40f`;
    const LIGHT_RED = `#e74c3c`;
    const LIGHT_BLUE = `#3498db`;

    class LogHelper {
        constructor() {
            this._defaultLogLevel = isDevBuild() ? self.workbox.LOG_LEVEL.debug : self.workbox.LOG_LEVEL.warn;
        }

        log(a) {
            this._printMessage(self.workbox.LOG_LEVEL.verbose, a);
        }

        debug(a) {
            this._printMessage(self.workbox.LOG_LEVEL.debug, a);
        }

        warn(a) {
            this._printMessage(self.workbox.LOG_LEVEL.warn, a);
        }

        error(a) {
            this._printMessage(self.workbox.LOG_LEVEL.error, a);
        }

        _printMessage(a, b) {
            if (this._shouldLogMessage(a, b)) {
                const c = this._getAllLogGroups(a, b);
                c.print();
            }
        }

        _getAllLogGroups(a, b) {
            const c = new LogGroup, d = this._getPrimaryMessageDetails(a, b);
            if (c.addPrimaryLog(d), b.error) {
                const f = {message: b.error, logFunc: console.error};
                c.addLog(f);
            }
            const e = new LogGroup;
            if (b.that && b.that.constructor && b.that.constructor.name) {
                const f = b.that.constructor.name;
                e.addLog(this._getKeyValueDetails('class', f));
            }
            return b.data && ('object' != typeof b.data || b.data instanceof Array ? e.addLog(this._getKeyValueDetails('additionalData', b.data)) : Object.keys(b.data).forEach((f) => {
                e.addLog(this._getKeyValueDetails(f, b.data[f]));
            })), c.addChildGroup(e), c
        }

        _getKeyValueDetails(a, b) {
            return {message: `%c${a}: `, colors: [`color: ${LIGHT_BLUE}`], args: b}
        }

        _getPrimaryMessageDetails(a, b) {
            let c, d;
            a === self.workbox.LOG_LEVEL.verbose ? (c = 'Info', d = LIGHT_GREY) : a === self.workbox.LOG_LEVEL.debug ? (c = 'Debug', d = LIGHT_GREEN) : a === self.workbox.LOG_LEVEL.warn ? (c = 'Warn', d = LIGHT_YELLOW) : a === self.workbox.LOG_LEVEL.error ? (c = 'Error', d = LIGHT_RED) : void 0;
            let e = `%c🔧 %c[${c}]`;
            const f = [`color: ${LIGHT_GREY}`, `color: ${d}`];
            let g;
            return 'string' == typeof b ? g = b : b.message && (g = b.message), g && (g = g.replace(/\s+/g, ' '), e += `%c ${g}`, f.push(`color: ${DARK_GREY}; font-weight: normal`)), {
                message: e,
                colors: f
            }
        }

        _shouldLogMessage(a, b) {
            if (!b) return !1;
            let c = this._defaultLogLevel;
            return self && self.workbox && 'number' == typeof self.workbox.logLevel && (c = self.workbox.logLevel), c === self.workbox.LOG_LEVEL.none || a < c ? !1 : !0
        }
    }

    var logHelper = new LogHelper;

    class NavigationRoute extends Route {
        constructor({whitelist: a, blacklist: b, handler: c} = {}) {
            isArrayOfClass({whitelist: a}, RegExp), b ? isArrayOfClass({blacklist: b}, RegExp) : b = [];
            super({
                match: ({event: e, url: f}) => {
                    let g = !1, h;
                    if ('navigate' === e.request.mode) {
                        const i = f.pathname + f.search;
                        a.some((j) => j.test(i)) ? b.some((j) => j.test(i)) ? h = `The navigation route is not being used, since the ` + `request URL matches both the whitelist and blacklist.` : (h = `The navigation route is being used.`, g = !0) : h = `The navigation route is not being used, since the ` + `URL being navigated to doesn't match the whitelist.`, logHelper.debug({
                            that: this,
                            message: h,
                            data: {"request-url": f.href, whitelist: a, blacklist: b, handler: c}
                        });
                    }
                    return g
                }, handler: c, method: 'GET'
            });
        }
    }

    class RegExpRoute extends Route {
        constructor({regExp: a, handler: b, method: c}) {
            isInstance({regExp: a}, RegExp);
            super({
                match: ({url: e}) => {
                    const f = a.exec(e.href);
                    return f ? e.origin !== location.origin && 0 !== f.index ? (logHelper.debug({
                        that: this,
                        message: `Skipping route, because the RegExp match didn't occur ` + `at the start of the URL.`,
                        data: {url: e.href, regExp: a}
                    }), null) : f.slice(1) : null
                }, handler: b, method: c
            });
        }
    }

    class Router {
        constructor({handleFetch: a} = {}) {
            'undefined' == typeof a && (a = !0), this._routes = new Map, a && this._addFetchListener();
        }

        _addFetchListener() {
            self.addEventListener('fetch', (a) => {
                const b = new URL(a.request.url);
                if (!b.protocol.startsWith('http')) return void logHelper.log({
                    that: this,
                    message: 'URL does not start with HTTP and so not passing through the router.',
                    data: {request: a.request}
                });
                let c, d;
                for (let e of this._routes.get(a.request.method) || []) {
                    const f = e.match({url: b, event: a});
                    if (f) {
                        d = e, logHelper.log({
                            that: this,
                            message: 'The router found a matching route.',
                            data: {route: d, request: a.request}
                        });
                        let g = f;
                        Array.isArray(g) && 0 === g.length ? g = void 0 : g.constructor === Object && 0 === Object.keys(g).length && (g = void 0), c = e.handler.handle({
                            url: b,
                            event: a,
                            params: g
                        });
                        break
                    }
                }
                !c && this.defaultHandler && (c = this.defaultHandler.handle({
                    url: b,
                    event: a
                })), c && this.catchHandler && (c = c.catch((e) => {
                    return this.catchHandler.handle({url: b, event: a, error: e})
                })), c && a.respondWith(c.then((e) => {
                    return logHelper.debug({
                        that: this,
                        message: 'The router is managing a route with a response.',
                        data: {route: d, request: a.request, response: e}
                    }), e
                }));
            });
        }

        setDefaultHandler({handler: a} = {}) {
            this.defaultHandler = normalizeHandler(a);
        }

        setCatchHandler({handler: a} = {}) {
            this.catchHandler = normalizeHandler(a);
        }

        registerRoutes({routes: a} = {}) {
            isArrayOfClass({routes: a}, Route);
            for (let b of a) this._routes.has(b.method) || this._routes.set(b.method, []), this._routes.get(b.method).unshift(b);
        }

        registerRoute({route: a} = {}) {
            isInstance({route: a}, Route), this.registerRoutes({routes: [a]});
        }

        unregisterRoutes({routes: a} = {}) {
            isArrayOfClass({routes: a}, Route);
            for (let b of a) {
                this._routes.has(b.method) || logHelper.error({
                    that: this, message: `Can't unregister route; there are no ${b.method}
            routes registered.`, data: {route: b}
                });
                const c = this._routes.get(b.method).indexOf(b);
                -1 < c ? this._routes.get(b.method).splice(c, 1) : logHelper.error({
                    that: this, message: `Can't unregister route; the route wasn't previously
            registered.`, data: {route: b}
                });
            }
        }

        unregisterRoute({route: a} = {}) {
            isInstance({route: a}, Route), this.unregisterRoutes({routes: [a]});
        }
    }

    exports.ExpressRoute = ExpressRoute;
    exports.NavigationRoute = NavigationRoute;
    exports.RegExpRoute = RegExpRoute;
    exports.Route = Route;
    exports.Router = Router;

}((this.workbox.routing = this.workbox.routing || {})));
//# sourceMappingURL=workbox-routing.prod.v1.3.0.js.map
