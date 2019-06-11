(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/* globals jQuery, prettyPrint */
(function($, prettyPrint) {
  'use strict';
  var jsdoctypeparser = require('jsdoctypeparser');
  var events = require('events');
  var util = require('util');

  var INITIAL_TYPE_EXPR = '?TypeExpression=';



  function TypeExpressionModel() {
    events.EventEmitter.call(this);
  }
  util.inherits(TypeExpressionModel, events.EventEmitter);


  TypeExpressionModel.EventType = {
    CHANGE: 'change',
  };


  TypeExpressionModel.prototype.parse = function(typeExpr) {
    try {
      var ast = jsdoctypeparser.parse(typeExpr);

      this.ast = ast;
      this.hasSyntaxError = false;
      this.errorMessage = '';
    }
    catch (err) {
      if (!(err instanceof jsdoctypeparser.SyntaxError)) throw err;

      this.ast = null;
      this.hasSyntaxError = true;
      this.errorMessage = err.message;
    }

    this.emit(TypeExpressionModel.EventType.CHANGE);
  };



  function ParseResultView(model, $jsonView, $stringView) {
    this.typeExprModel = model;

    this.$jsonView = $jsonView;
    this.$stringView = $stringView;

    var self = this;
    this.typeExprModel.on(TypeExpressionModel.EventType.CHANGE, function() {
      self.render(self.typeExprModel);
    });
  }


  ParseResultView.prototype.render = function(model) {
    var $allViews = $([
      this.$jsonView[0],
      this.$stringView[0],
    ]);

    if (model.hasSyntaxError) {
      $allViews.text('ERROR');
    }
    else {
      var ast = model.ast;
      this.$jsonView.text(JSON.stringify(ast, null, 2));
      this.$stringView.text(jsdoctypeparser.publish(ast));
    }

    $allViews.removeClass('prettyprinted');
    prettyPrint();
  };



  function ParseSuccessfulAlert(model, $alertElement) {
    this.typeExprModel = model;

    this.$alertElement = $alertElement;

    var self = this;

    this.typeExprModel.on(TypeExpressionModel.EventType.CHANGE, function() {
      self.setVisibility(!self.typeExprModel.hasSyntaxError);
    });
  }


  ParseSuccessfulAlert.prototype.setVisibility = function(isVisible) {
    this.$alertElement.toggle(isVisible);
  };



  function ParseErrorAlert(model, $alertElement, $messageElement, $closeButton) {
    this.typeExprModel = model;

    this.$alertElement = $alertElement;
    this.$messageElement = $messageElement;
    this.$closeButton = $closeButton;

    var self = this;

    this.typeExprModel.on(TypeExpressionModel.EventType.CHANGE, function() {
      self.render(self.typeExprModel);
    });

    this.$closeButton.on('click', function() {
      self.setVisibility(true);
    });
  }


  ParseErrorAlert.prototype.render = function(model) {
    this.setVisibility(model.hasSyntaxError);
    this.setMessage(model.errorMessage);
  };


  ParseErrorAlert.prototype.setVisibility = function(isVisible) {
    this.$alertElement.toggle(isVisible);
  };


  ParseErrorAlert.prototype.setMessage = function(msg) {
    this.$messageElement.text(msg);
  };


  function bootstrap() {
    var typeExprModel = new TypeExpressionModel();

    createParseSuccessfulAlert(typeExprModel);
    createParseErrorAlert(typeExprModel);
    createParseResultView(typeExprModel);

    var $input = $('#input');
    $input.on('change', function() {
      var typeExprStr = $input.val();
      typeExprModel.parse(typeExprStr);
    });

    var $form = $('#form');
    $form.on('submit', function(e) {
      // Prevent page reloading when form submitted.
      e.preventDefault();
    });

    typeExprModel.parse(INITIAL_TYPE_EXPR, true);
  }



  function createParseSuccessfulAlert(model) {
    var $alertElement = $('#success');
    return new ParseSuccessfulAlert(model, $alertElement);
  }



  function createParseErrorAlert(model) {
    var $alertElement = $('#err');
    var $messageElement = $('#err-msg');
    var $closeButton = $('#err-close');
    return new ParseErrorAlert(model, $alertElement, $messageElement, $closeButton);
  }



  function createParseResultView(model) {
    var $jsonView = $('#output-obj');
    var $stringView = $('#output-str');
    return new ParseResultView(model, $jsonView, $stringView);
  }


  bootstrap();
})(jQuery, prettyPrint);

},{"events":2,"jsdoctypeparser":4,"util":13}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
'use strict';

const {parse, SyntaxError} = require('./lib/parsing.js');
const {publish, createDefaultPublisher} = require('./lib/publishing.js');
const {traverse} = require('./lib/traversing.js');
const NodeType = require('./lib/NodeType.js');
const SyntaxType = require('./lib/SyntaxType.js');


/**
 * Namespace for jsdoctypeparser.
 * @namespace
 * @exports jsdoctypeparser
 */
module.exports = {
  parse,
  SyntaxError,
  publish,
  createDefaultPublisher,
  traverse,
  NodeType,
  SyntaxType,
};

},{"./lib/NodeType.js":5,"./lib/SyntaxType.js":6,"./lib/parsing.js":7,"./lib/publishing.js":8,"./lib/traversing.js":9}],5:[function(require,module,exports){
'use strict';

const NodeType = {
  NAME: 'NAME',
  MEMBER: 'MEMBER',
  UNION: 'UNION',
  VARIADIC: 'VARIADIC',
  RECORD: 'RECORD',
  RECORD_ENTRY: 'RECORD_ENTRY',
  TUPLE: 'TUPLE',
  GENERIC: 'GENERIC',
  MODULE: 'MODULE',
  OPTIONAL: 'OPTIONAL',
  NULLABLE: 'NULLABLE',
  NOT_NULLABLE: 'NOT_NULLABLE',
  FUNCTION: 'FUNCTION',
  ARROW: 'ARROW',
  NAMED_PARAMETER: 'NAMED_PARAMETER',
  ANY: 'ANY',
  UNKNOWN: 'UNKNOWN',
  INNER_MEMBER: 'INNER_MEMBER',
  INSTANCE_MEMBER: 'INSTANCE_MEMBER',
  STRING_VALUE: 'STRING_VALUE',
  NUMBER_VALUE: 'NUMBER_VALUE',
  EXTERNAL: 'EXTERNAL',
  FILE_PATH: 'FILE_PATH',
  PARENTHESIS: 'PARENTHESIS',
  TYPE_QUERY: 'TYPE_QUERY',
  IMPORT: 'IMPORT',
};

module.exports = NodeType;

},{}],6:[function(require,module,exports){
'use strict';

/**
 * Syntax types for generic types.
 * @enum {string}
 */
const GenericTypeSyntax = {
  /**
   * From TypeScript and Closure Library.
   * Example: {@code Array<string>}
   */
  ANGLE_BRACKET: 'ANGLE_BRACKET',

  /**
   * From JSDoc and Legacy Closure Library.
   * Example: {@code Array.<string>}
   */
  ANGLE_BRACKET_WITH_DOT: 'ANGLE_BRACKET_WITH_DOT',

  /**
   * From JSDoc and JSDuck.
   * Example: {@code String[]}
   */
  SQUARE_BRACKET: 'SQUARE_BRACKET',
};

/**
 * Syntax types for union types.
 * @enum {string}
 */
const UnionTypeSyntax = {
  /**
   * From Closure Library.
   * Example: {@code Left|Right}
   */
  PIPE: 'PIPE',

  /**
   * From JSDuck.
   * Example: {@code Left/Right}
   */
  SLASH: 'SLASH',
};


const VariadicTypeSyntax = {
  /**
   * From Closure Library.
   * Example: {@code ...Type}
   */
  PREFIX_DOTS: 'PREFIX_DOTS',

  /**
   * From JSDuck.
   * Example: {@code Type...}
   */
  SUFFIX_DOTS: 'SUFFIX_DOTS',

  /**
   * From Closure Library.
   * Example: {@code ...}
   */
  ONLY_DOTS: 'ONLY_DOTS',
};

const OptionalTypeSyntax = {
  PREFIX_EQUALS_SIGN: 'PREFIX_EQUALS_SIGN',
  SUFFIX_EQUALS_SIGN: 'SUFFIX_EQUALS_SIGN',
};

const NullableTypeSyntax = {
  PREFIX_QUESTION_MARK: 'PREFIX_QUESTION_MARK',
  SUFFIX_QUESTION_MARK: 'SUFFIX_QUESTION_MARK',
};

const NotNullableTypeSyntax = {
  PREFIX_BANG: 'PREFIX_BANG',
  SUFFIX_BANG: 'SUFFIX_BANG',
};

module.exports = {
  GenericTypeSyntax,
  UnionTypeSyntax,
  VariadicTypeSyntax,
  OptionalTypeSyntax,
  NullableTypeSyntax,
  NotNullableTypeSyntax,
};

},{}],7:[function(require,module,exports){
'use strict';

const {SyntaxError, parse} = require('../peg_lib/jsdoctype.js');

module.exports = {

  /** * A class for JSDoc type expression syntax errors.
   * @constructor
   * @extends {Error}
   */
  SyntaxError,


  /**
   * Parse the specified type expression string.
   * @param {string} typeExprStr Type expression string.
   * @return {Object} AST.
   */
  parse,
};

},{"../peg_lib/jsdoctype.js":10}],8:[function(require,module,exports){
'use strict';

const {format} = require('util');

function publish(node, opt_publisher) {
  const publisher = opt_publisher || createDefaultPublisher();
  return publisher[node.type](node, function(childNode) {
    return publish(childNode, publisher);
  });
}


function createDefaultPublisher() {
  return {
    NAME (nameNode) {
      return nameNode.name;
    },
    MEMBER (memberNode, concretePublish) {
      return format('%s.%s%s', concretePublish(memberNode.owner),
                    memberNode.hasEventPrefix ? 'event:' : '',
                    memberNode.name);
    },
    UNION (unionNode, concretePublish) {
      return format('%s|%s', concretePublish(unionNode.left),
                    concretePublish(unionNode.right));
    },
    VARIADIC (variadicNode, concretePublish) {
      return format('...%s', concretePublish(variadicNode.value));
    },
    RECORD (recordNode, concretePublish) {
      const concretePublishedEntries = recordNode.entries.map(concretePublish);
      return format('{%s}', concretePublishedEntries.join(', '));
    },
    RECORD_ENTRY (entryNode, concretePublish) {
      if (!entryNode.value) return entryNode.key;
      return format('%s: %s', entryNode.key, concretePublish(entryNode.value));
    },
    TUPLE (tupleNode, concretePublish) {
      const concretePublishedEntries = tupleNode.entries.map(concretePublish);
      return format('[%s]', concretePublishedEntries.join(', '));
    },
    GENERIC (genericNode, concretePublish) {
      const concretePublishedObjects = genericNode.objects.map(concretePublish);
      if (genericNode.meta) {
        switch (genericNode.meta.syntax) {
        case 'SQUARE_BRACKET':
          if (genericNode.subject && genericNode.subject.name === 'Array') {
            return format('%s[]', concretePublishedObjects.join(', '));
          }
          break;
        case 'ANGLE_BRACKET_WITH_DOT':
          return format('%s.<%s>', concretePublish(genericNode.subject),
                        concretePublishedObjects.join(', '));
        }
      }
      return format('%s<%s>', concretePublish(genericNode.subject),
                    concretePublishedObjects.join(', '));
    },
    MODULE (moduleNode, concretePublish) {
      return format('module:%s', concretePublish(moduleNode.value));
    },
    FILE_PATH (filePathNode) {
      return filePathNode.path;
    },
    OPTIONAL (optionalNode, concretePublish) {
      return format('%s=', concretePublish(optionalNode.value));
    },
    NULLABLE (nullableNode, concretePublish) {
      return format('?%s', concretePublish(nullableNode.value));
    },
    NOT_NULLABLE (notNullableNode, concretePublish) {
      return format('!%s', concretePublish(notNullableNode.value));
    },
    FUNCTION (functionNode, concretePublish) {
      const publidshedParams = functionNode.params.map(concretePublish);

      if (functionNode.new) {
        publidshedParams.unshift(format('new: %s',
          concretePublish(functionNode.new)));
      }

      if (functionNode.this) {
        publidshedParams.unshift(format('this: %s',
          concretePublish(functionNode.this)));
      }

      if (functionNode.returns) {
        return format('function(%s): %s', publidshedParams.join(', '),
                           concretePublish(functionNode.returns));
      }

      return format('function(%s)', publidshedParams.join(', '));
    },
    ARROW (functionNode, concretePublish) {
      const publishedParams = functionNode.params.map(concretePublish);
      return (functionNode.new ? 'new ' : '') + format('(%s) => %s', publishedParams.join(', '), concretePublish(functionNode.returns));
    },
    NAMED_PARAMETER (parameterNode, concretePublish) {
      return parameterNode.name + (parameterNode.typeName ? ': ' + concretePublish(parameterNode.typeName) : '');
    },
    ANY () {
      return '*';
    },
    UNKNOWN () {
      return '?';
    },
    INNER_MEMBER (memberNode, concretePublish) {
      return concretePublish(memberNode.owner) + '~' +
        (memberNode.hasEventPrefix ? 'event:' : '') + memberNode.name;
    },
    INSTANCE_MEMBER (memberNode, concretePublish) {
      return concretePublish(memberNode.owner) + '#' +
        (memberNode.hasEventPrefix ? 'event:' : '') + memberNode.name;
    },
    STRING_VALUE (stringValueNode) {
      return format('"%s"', stringValueNode.string);
    },
    NUMBER_VALUE (numberValueNode) {
      return numberValueNode.number;
    },
    EXTERNAL (externalNode, concretePublish) {
      return format('external:%s', concretePublish(externalNode.value));
    },
    PARENTHESIS (parenthesizedNode, concretePublish) {
      return format('(%s)', concretePublish(parenthesizedNode.value));
    },
    TYPE_QUERY (typeQueryNode, concretePublish) {
      return format('typeof %s', concretePublish(typeQueryNode.name));
    },
    IMPORT (importNode, concretePublish) {
      return format('import(%s)', concretePublish(importNode.path));
    },
  };
}


module.exports = {
  publish: publish,
  createDefaultPublisher: createDefaultPublisher,
};

},{"util":13}],9:[function(require,module,exports){
'use strict';

/**
 * Traverse the specified AST.
 * @param {{ type: NodeType }} node AST to traverse.
 * @param {function({ type: NodeType })?} opt_onEnter Callback for onEnter.
 * @param {function({ type: NodeType })?} opt_onLeave Callback for onLeave.
 */
function traverse(node, opt_onEnter, opt_onLeave) {
  if (opt_onEnter) opt_onEnter(node, null, null);

  const childNodeInfo = _collectChildNodeInfo(node);
  childNodeInfo.forEach(function([childNode, parentPropName, parentNode]) {
    traverse(childNode, opt_onEnter ? (node, pn, pNode) => {
      opt_onEnter(node, pn || parentPropName, pNode || parentNode);
    } : null, opt_onLeave ? (node, pn, pNode) => {
      opt_onLeave(node, pn || parentPropName, pNode || parentNode);
    } : null);
  });

  if (opt_onLeave) opt_onLeave(node, null, null);
}


/**
 * @private
 */
const _PropertyAccessor = {
  NODE (fn, node, parentPropName, parentNode) {
    fn(node, parentPropName, parentNode);
  },
  NODE_LIST (fn, nodes, parentPropName, parentNode) {
    nodes.forEach(function(node) {
      fn(node, parentPropName, parentNode);
    });
  },
  NULLABLE_NODE (fn, opt_node, parentPropName, parentNode) {
    if (opt_node) fn(opt_node, parentPropName, parentNode);
  },
};


/** @private */
const _childNodesMap = {
  NAME: {},
  NAMED_PARAMETER: {
    typeName: _PropertyAccessor.NULLABLE_NODE,
  },
  MEMBER: {
    owner: _PropertyAccessor.NODE,
  },
  UNION: {
    left: _PropertyAccessor.NODE,
    right: _PropertyAccessor.NODE,
  },
  VARIADIC: {
    value: _PropertyAccessor.NODE,
  },
  RECORD: {
    entries: _PropertyAccessor.NODE_LIST,
  },
  RECORD_ENTRY: {
    value: _PropertyAccessor.NULLABLE_NODE,
  },
  TUPLE: {
    entries: _PropertyAccessor.NODE_LIST,
  },
  GENERIC: {
    subject: _PropertyAccessor.NODE,
    objects: _PropertyAccessor.NODE_LIST,
  },
  MODULE: {
    value: _PropertyAccessor.NODE,
  },
  OPTIONAL: {
    value: _PropertyAccessor.NODE,
  },
  NULLABLE: {
    value: _PropertyAccessor.NODE,
  },
  NOT_NULLABLE: {
    value: _PropertyAccessor.NODE,
  },
  FUNCTION: {
    params: _PropertyAccessor.NODE_LIST,
    returns: _PropertyAccessor.NULLABLE_NODE,
    this: _PropertyAccessor.NULLABLE_NODE,
    new: _PropertyAccessor.NULLABLE_NODE,
  },
  ARROW: {
    params: _PropertyAccessor.NODE_LIST,
    returns: _PropertyAccessor.NULLABLE_NODE,
    new: _PropertyAccessor.NULLABLE_NODE,
  },
  ANY: {},
  UNKNOWN: {},
  INNER_MEMBER: {
    owner: _PropertyAccessor.NODE,
  },
  INSTANCE_MEMBER: {
    owner: _PropertyAccessor.NODE,
  },
  STRING_VALUE: {},
  NUMBER_VALUE: {},
  EXTERNAL: {
    value: _PropertyAccessor.NODE,
  },
  FILE_PATH: {},
  PARENTHESIS: {
    value: _PropertyAccessor.NODE,
  },
  TYPE_QUERY: {
    name: _PropertyAccessor.NODE,
  },
  IMPORT: {
    path: _PropertyAccessor.NODE,
  },
};


/** @private */
function _collectChildNodeInfo(node) {
  const childNodeInfo = [];
  const propAccessorMap = _childNodesMap[node.type];

  Object.keys(propAccessorMap).forEach(function(propName) {
    const propAccessor = propAccessorMap[propName];
    propAccessor((node, propName, parentNode) => {
      childNodeInfo.push([node, propName, parentNode]);
    }, node[propName], propName, node);
  });

  return childNodeInfo;
}

module.exports = {
  traverse,
};

},{}],10:[function(require,module,exports){
/*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */

"use strict";

function peg$subclass(child, parent) {
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
}

function peg$SyntaxError(message, expected, found, location) {
  this.message  = message;
  this.expected = expected;
  this.found    = found;
  this.location = location;
  this.name     = "SyntaxError";

  if (typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(this, peg$SyntaxError);
  }
}

peg$subclass(peg$SyntaxError, Error);

peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
          return "\"" + literalEscape(expectation.text) + "\"";
        },

        "class": function(expectation) {
          var escapedParts = "",
              i;

          for (i = 0; i < expectation.parts.length; i++) {
            escapedParts += expectation.parts[i] instanceof Array
              ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
              : classEscape(expectation.parts[i]);
          }

          return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
        },

        any: function(expectation) {
          return "any character";
        },

        end: function(expectation) {
          return "end of input";
        },

        other: function(expectation) {
          return expectation.description;
        }
      };

  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/"/g,  '\\"')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/\]/g, '\\]')
      .replace(/\^/g, '\\^')
      .replace(/-/g,  '\\-')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = new Array(expected.length),
        i, j;

    for (i = 0; i < expected.length; i++) {
      descriptions[i] = describeExpectation(expected[i]);
    }

    descriptions.sort();

    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + " or " + descriptions[1];

      default:
        return descriptions.slice(0, -1).join(", ")
          + ", or "
          + descriptions[descriptions.length - 1];
    }
  }

  function describeFound(found) {
    return found ? "\"" + literalEscape(found) + "\"" : "end of input";
  }

  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};

function peg$parse(input, options) {
  options = options !== void 0 ? options : {};

  var peg$FAILED = {},

      peg$startRuleFunctions = { TopTypeExpr: peg$parseTopTypeExpr },
      peg$startRuleFunction  = peg$parseTopTypeExpr,

      peg$c0 = function(expr) {
                 return expr;
               },
      peg$c1 = /^[ \t\r\n ]/,
      peg$c2 = peg$classExpectation([" ", "\t", "\r", "\n", " "], false, false),
      peg$c3 = /^[a-zA-Z_$]/,
      peg$c4 = peg$classExpectation([["a", "z"], ["A", "Z"], "_", "$"], false, false),
      peg$c5 = /^[a-zA-Z0-9_$]/,
      peg$c6 = peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_", "$"], false, false),
      peg$c7 = "event:",
      peg$c8 = peg$literalExpectation("event:", false),
      peg$c9 = function(rootOwner, memberPartWithOperators) {
                     return memberPartWithOperators.reduce(function(owner, tokens) {
                       var operatorType = tokens[1];
                       var eventNamespace = tokens[3];
                       var memberName = tokens[5];

                       switch (operatorType) {
                         case NamepathOperatorType.MEMBER:
                           return {
                             type: NodeType.MEMBER,
                             owner: owner,
                             name: memberName,
                             hasEventPrefix: Boolean(eventNamespace),
                           };
                         case NamepathOperatorType.INSTANCE_MEMBER:
                           return {
                             type: NodeType.INSTANCE_MEMBER,
                             owner: owner,
                             name: memberName,
                             hasEventPrefix: Boolean(eventNamespace),
                           };
                         case NamepathOperatorType.INNER_MEMBER:
                           return {
                             type: NodeType.INNER_MEMBER,
                             owner: owner,
                             name: memberName,
                             hasEventPrefix: Boolean(eventNamespace),
                           };
                         default:
                           throw new Error('Unexpected operator type: "' + operatorType + '"');
                       }
                     }, rootOwner);
                   },
      peg$c10 = function(name) {
                           return {
                             type: NodeType.NAME,
                             name: name
                           };
                         },
      peg$c11 = /^[a-zA-Z0-9_$\-]/,
      peg$c12 = peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_", "$", "-"], false, false),
      peg$c13 = function(name) {
                                  return {
                                    type: NodeType.NAME,
                                    name: name
                                  };
                                },
      peg$c14 = "'",
      peg$c15 = peg$literalExpectation("'", false),
      peg$c16 = /^[^']/,
      peg$c17 = peg$classExpectation(["'"], true, false),
      peg$c18 = function(name) {
                     return name;
                   },
      peg$c19 = "\"",
      peg$c20 = peg$literalExpectation("\"", false),
      peg$c21 = /^[^"]/,
      peg$c22 = peg$classExpectation(["\""], true, false),
      peg$c23 = ".",
      peg$c24 = peg$literalExpectation(".", false),
      peg$c25 = function(rootOwner, memberPart) {
                            return memberPart.reduce(function(owner, tokens) {
                              return {
                                type: NodeType.MEMBER,
                                owner: owner,
                                name: tokens[3]
                              }
                            }, rootOwner);
                          },
      peg$c26 = function() {
                           return NamepathOperatorType.MEMBER;
                         },
      peg$c27 = "~",
      peg$c28 = peg$literalExpectation("~", false),
      peg$c29 = function() {
                                return NamepathOperatorType.INNER_MEMBER;
                              },
      peg$c30 = "#",
      peg$c31 = peg$literalExpectation("#", false),
      peg$c32 = function() {
                                   return NamepathOperatorType.INSTANCE_MEMBER;
                                 },
      peg$c33 = "external",
      peg$c34 = peg$literalExpectation("external", false),
      peg$c35 = ":",
      peg$c36 = peg$literalExpectation(":", false),
      peg$c37 = function(value) {
                         return {
                           type: NodeType.EXTERNAL,
                           value: value
                         };
                       },
      peg$c38 = "module",
      peg$c39 = peg$literalExpectation("module", false),
      peg$c40 = function(value) {
                       return {
                         type: NodeType.MODULE,
                         value: value,
                       };
                     },
      peg$c41 = function(rootOwner, memberPartWithOperators) {
                       return memberPartWithOperators.reduce(function(owner, tokens) {
                         var operatorType = tokens[1];
                         var eventNamespace = tokens[3];
                         var memberName = tokens[5];

                         switch (operatorType) {
                           case NamepathOperatorType.MEMBER:
                             return {
                               type: NodeType.MEMBER,
                               owner: owner,
                               name: memberName,
                               hasEventPrefix: Boolean(eventNamespace),
                             };
                           case NamepathOperatorType.INSTANCE_MEMBER:
                             return {
                               type: NodeType.INSTANCE_MEMBER,
                               owner: owner,
                               name: memberName,
                               hasEventPrefix: Boolean(eventNamespace),
                             };
                           case NamepathOperatorType.INNER_MEMBER:
                             return {
                               type: NodeType.INNER_MEMBER,
                               owner: owner,
                               name: memberName,
                               hasEventPrefix: Boolean(eventNamespace),
                             };
                           default:
                             throw new Error('Unexpected operator type: "' + operatorType + '"');
                         }
                       }, rootOwner);
                     },
      peg$c42 = /^[a-zA-Z0-9_$\/\-]/,
      peg$c43 = peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_", "$", "/", "-"], false, false),
      peg$c44 = function(filePath) {
                     return {
                       type: NodeType.FILE_PATH,
                       path: filePath,
                     };
                   },
      peg$c45 = "*",
      peg$c46 = peg$literalExpectation("*", false),
      peg$c47 = function() {
                    return { type: NodeType.ANY };
                  },
      peg$c48 = "?",
      peg$c49 = peg$literalExpectation("?", false),
      peg$c50 = function() {
                        return { type: NodeType.UNKNOWN };
                      },
      peg$c51 = /^[^\\"]/,
      peg$c52 = peg$classExpectation(["\\", "\""], true, false),
      peg$c53 = "\\",
      peg$c54 = peg$literalExpectation("\\", false),
      peg$c55 = peg$anyExpectation(),
      peg$c56 = function(value) {
                            return {
                              type: NodeType.STRING_VALUE,
                              string: value.replace(/\\"/g, '"')
                            };
                          },
      peg$c57 = /^[^\\']/,
      peg$c58 = peg$classExpectation(["\\", "'"], true, false),
      peg$c59 = function(value) {
                            return {
                              type: NodeType.STRING_VALUE,
                              string: value.replace(/\\'/g, "'")
                            };
                          },
      peg$c60 = function(value) {
                          return {
                            type: NodeType.NUMBER_VALUE,
                            number: value
                          };
                        },
      peg$c61 = "-",
      peg$c62 = peg$literalExpectation("-", false),
      peg$c63 = /^[0-9]/,
      peg$c64 = peg$classExpectation([["0", "9"]], false, false),
      peg$c65 = "0b",
      peg$c66 = peg$literalExpectation("0b", false),
      peg$c67 = /^[01]/,
      peg$c68 = peg$classExpectation(["0", "1"], false, false),
      peg$c69 = "0o",
      peg$c70 = peg$literalExpectation("0o", false),
      peg$c71 = /^[0-7]/,
      peg$c72 = peg$classExpectation([["0", "7"]], false, false),
      peg$c73 = "0x",
      peg$c74 = peg$literalExpectation("0x", false),
      peg$c75 = /^[0-9a-fA-F]/,
      peg$c76 = peg$classExpectation([["0", "9"], ["a", "f"], ["A", "F"]], false, false),
      peg$c77 = function(left, syntax, right) {
                      return {
                          type: NodeType.UNION,
                          left: left,
                          right: right,
                          meta: { syntax: syntax },
                      };
                    },
      peg$c78 = "|",
      peg$c79 = peg$literalExpectation("|", false),
      peg$c80 = function() {
                                                return UnionTypeSyntax.PIPE;
                                              },
      peg$c81 = "/",
      peg$c82 = peg$literalExpectation("/", false),
      peg$c83 = function() {
                                        return UnionTypeSyntax.SLASH;
                                      },
      peg$c84 = "typeof",
      peg$c85 = peg$literalExpectation("typeof", false),
      peg$c86 = function(operator, name) {
                      return {
                          type: NodeType.TYPE_QUERY,
                          name: name,
                      };
                    },
      peg$c87 = "import",
      peg$c88 = peg$literalExpectation("import", false),
      peg$c89 = "(",
      peg$c90 = peg$literalExpectation("(", false),
      peg$c91 = ")",
      peg$c92 = peg$literalExpectation(")", false),
      peg$c93 = function(operator, path) {
                       return { type: NodeType.IMPORT, path: path };
                     },
      peg$c94 = function(operator, operand) {
                               return {
                                 type: NodeType.NULLABLE,
                                 value: operand,
                                 meta: { syntax: NullableTypeSyntax.PREFIX_QUESTION_MARK },
                               };
                             },
      peg$c95 = "!",
      peg$c96 = peg$literalExpectation("!", false),
      peg$c97 = function(operator, operand) {
                                  return {
                                    type: NodeType.NOT_NULLABLE,
                                    value: operand,
                                    meta: { syntax: NotNullableTypeSyntax.PREFIX_BANG },
                                  };
                                },
      peg$c98 = "=",
      peg$c99 = peg$literalExpectation("=", false),
      peg$c100 = function(operator, operand) {
                               return {
                                 type: NodeType.OPTIONAL,
                                 value: operand,
                                 meta: { syntax: OptionalTypeSyntax.PREFIX_EQUALS_SIGN },
                               };
                             },
      peg$c101 = function(operand, operator) {
                               return {
                                 type: NodeType.NULLABLE,
                                 value: operand,
                                 meta: { syntax: NullableTypeSyntax.SUFFIX_QUESTION_MARK },
                               };
                             },
      peg$c102 = function(operand, operator) {
                                  return {
                                    type: NodeType.NOT_NULLABLE,
                                    value: operand,
                                    meta: { syntax: NotNullableTypeSyntax.SUFFIX_BANG },
                                  };
                                },
      peg$c103 = function(operand, operator) {
                               return {
                                 type: NodeType.OPTIONAL,
                                 value: operand,
                                 meta: { syntax: OptionalTypeSyntax.SUFFIX_EQUALS_SIGN },
                               };
                             },
      peg$c104 = function(operand, syntax, params) {
                        return {
                          type: NodeType.GENERIC,
                          subject: operand,
                          objects: params,
                          meta: { syntax: syntax },
                        };
                      },
      peg$c105 = ",",
      peg$c106 = peg$literalExpectation(",", false),
      peg$c107 = function(first, restsWithComma) {
                                     return restsWithComma.reduce(function(params, tokens) {
                                       return params.concat([tokens[3]]);
                                     }, [first]);
                                   },
      peg$c108 = ".<",
      peg$c109 = peg$literalExpectation(".<", false),
      peg$c110 = function() {
                                                return GenericTypeSyntax.ANGLE_BRACKET_WITH_DOT;
                                              },
      peg$c111 = "<",
      peg$c112 = peg$literalExpectation("<", false),
      peg$c113 = function() {
                                                return GenericTypeSyntax.ANGLE_BRACKET;
                                              },
      peg$c114 = ">",
      peg$c115 = peg$literalExpectation(">", false),
      peg$c116 = "[",
      peg$c117 = peg$literalExpectation("[", false),
      peg$c118 = "]",
      peg$c119 = peg$literalExpectation("]", false),
      peg$c120 = function(operand, brackets) {
                      return brackets.reduce(function(operand) {
                        return {
                          type: NodeType.GENERIC,
                          subject: {
                            type: NodeType.NAME,
                            name: 'Array'
                          },
                          objects: [ operand ],
                          meta: { syntax: GenericTypeSyntax.SQUARE_BRACKET },
                        };
                      }, operand);
                    },
      peg$c121 = "new",
      peg$c122 = peg$literalExpectation("new", false),
      peg$c123 = "=>",
      peg$c124 = peg$literalExpectation("=>", false),
      peg$c125 = function(newModifier, paramsPart, returnedTypeNode) {
                         return {
                           type: NodeType.ARROW,
                           params: paramsPart,
                           returns: returnedTypeNode,
                           new: newModifier
                         };
      },
      peg$c126 = function(params) {
                                  return params;
                                },
      peg$c127 = function() {
                                  return [];
                                },
      peg$c128 = function(paramsWithComma, lastParam) {
        return paramsWithComma.reduceRight(function(params, tokens) {
          var param = { type: NodeType.NAMED_PARAMETER, name: tokens[0], typeName: tokens[4] };
          return [param].concat(params);
        }, [lastParam]);
      },
      peg$c129 = "...",
      peg$c130 = peg$literalExpectation("...", false),
      peg$c131 = function(spread, id, type) {
        var operand = { type: NodeType.NAMED_PARAMETER, name: id, typeName: type };
        if (spread) {
        return {
          type: NodeType.VARIADIC,
          value: operand,
          meta: { syntax: VariadicTypeSyntax.PREFIX_DOTS },
        };
        }
        else {
          return operand;
        }
      },
      peg$c132 = "function",
      peg$c133 = peg$literalExpectation("function", false),
      peg$c134 = function(paramsPart, returnedTypePart) {
                         var returnedTypeNode = returnedTypePart ? returnedTypePart[2] : null;

                         return {
                           type: NodeType.FUNCTION,
                           params: paramsPart.params,
                           returns: returnedTypeNode,
                           this: paramsPart.modifier.nodeThis,
                           new: paramsPart.modifier.nodeNew,
                         };
                       },
      peg$c135 = function(modifier, params) {
                                     return { params: params, modifier: modifier };
                                   },
      peg$c136 = function(modifier) {
                                     return { params: [], modifier: modifier };
                                   },
      peg$c137 = function(params) {
                                     return { params: params, modifier: { nodeThis: null, nodeNew: null } };
                                   },
      peg$c138 = function() {
                                     return { params: [], modifier: { nodeThis: null, nodeNew: null } };
                                   },
      peg$c139 = "this",
      peg$c140 = peg$literalExpectation("this", false),
      peg$c141 = function(modifierThis) {
                                   return { nodeThis: modifierThis[4], nodeNew: null };
                                 },
      peg$c142 = function(modifierNew) {
                                   return { nodeThis: null, nodeNew: modifierNew[4] };
                                 },
      peg$c143 = function(paramsWithComma, lastParam) {
                               return paramsWithComma.reduceRight(function(params, tokens) {
                                 var param = tokens[0];
                                 return [param].concat(params);
                               }, [lastParam]);
                             },
      peg$c144 = "{",
      peg$c145 = peg$literalExpectation("{", false),
      peg$c146 = "}",
      peg$c147 = peg$literalExpectation("}", false),
      peg$c148 = function(entries) {
                       return {
                         type: NodeType.RECORD,
                         entries: entries || [],
                       };
                     },
      peg$c149 = function(first, restWithComma) {
                              return restWithComma.reduce(function(entries, tokens) {
                                var entry = tokens[3];
                                return entries.concat([entry]);
                              }, [first]);
                            },
      peg$c150 = function(key, value) {
                              return {
                                type: NodeType.RECORD_ENTRY,
                                key: key,
                                value: value
                              };
                            },
      peg$c151 = function(key) {
                              return {
                                type: NodeType.RECORD_ENTRY,
                                key: key,
                                value: null,
                              };
                            },
      peg$c152 = function(key) {
                                 return key;
                               },
      peg$c153 = function(entries) {
        return {
          type: NodeType.TUPLE,
          entries: entries || [],
        }
      },
      peg$c154 = function(restWithComma, last) {
        return restWithComma.reduceRight((entries, tokens) => {
          let entry = tokens[0];
          return [entry].concat(entries);
        }, [last]);
      },
      peg$c155 = function(wrapped) {
                          return {
                            type: NodeType.PARENTHESIS,
                            value: wrapped,
                          };
                        },
      peg$c156 = function(operand) {
                               return {
                                 type: NodeType.VARIADIC,
                                 value: operand,
                                 meta: { syntax: VariadicTypeSyntax.PREFIX_DOTS },
                               };
                             },
      peg$c157 = function(operand) {
                               return {
                                 type: NodeType.VARIADIC,
                                 value: operand,
                                 meta: { syntax: VariadicTypeSyntax.SUFFIX_DOTS },
                               };
                             },
      peg$c158 = function() {
                            return {
                              type: NodeType.VARIADIC,
                              value: null,
                              meta: { syntax: VariadicTypeSyntax.ONLY_DOTS },
                            };
                          },

      peg$currPos          = 0,
      peg$savedPos         = 0,
      peg$posDetailsCache  = [{ line: 1, column: 1 }],
      peg$maxFailPos       = 0,
      peg$maxFailExpected  = [],
      peg$silentFails      = 0,

      peg$resultsCache = {},

      peg$result;

  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  function expected(description, location) {
    location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location
    );
  }

  function error(message, location) {
    location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

    throw peg$buildSimpleError(message, location);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: "literal", text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
  }

  function peg$anyExpectation() {
    return { type: "any" };
  }

  function peg$endExpectation() {
    return { type: "end" };
  }

  function peg$otherExpectation(description) {
    return { type: "other", description: description };
  }

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos], p;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line:   details.line,
        column: details.column
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;
      return details;
    }
  }

  function peg$computeLocation(startPos, endPos) {
    var startPosDetails = peg$computePosDetails(startPos),
        endPosDetails   = peg$computePosDetails(endPos);

    return {
      start: {
        offset: startPos,
        line:   startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line:   endPosDetails.line,
        column: endPosDetails.column
      }
    };
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) { return; }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildSimpleError(message, location) {
    return new peg$SyntaxError(message, null, null, location);
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location
    );
  }

  function peg$parseTopTypeExpr() {
    var s0, s1, s2, s3;

    var key    = peg$currPos * 81 + 0,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parse_();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseVariadicTypeExpr();
      if (s2 === peg$FAILED) {
        s2 = peg$parseUnionTypeExpr();
        if (s2 === peg$FAILED) {
          s2 = peg$parseUnaryUnionTypeExpr();
          if (s2 === peg$FAILED) {
            s2 = peg$parseArrayTypeExpr();
            if (s2 === peg$FAILED) {
              s2 = peg$parseGenericTypeExpr();
              if (s2 === peg$FAILED) {
                s2 = peg$parseRecordTypeExpr();
                if (s2 === peg$FAILED) {
                  s2 = peg$parseTupleTypeExpr();
                  if (s2 === peg$FAILED) {
                    s2 = peg$parseArrowTypeExpr();
                    if (s2 === peg$FAILED) {
                      s2 = peg$parseFunctionTypeExpr();
                      if (s2 === peg$FAILED) {
                        s2 = peg$parseTypeQueryExpr();
                        if (s2 === peg$FAILED) {
                          s2 = peg$parseBroadNamepathExpr();
                          if (s2 === peg$FAILED) {
                            s2 = peg$parseParenthesizedExpr();
                            if (s2 === peg$FAILED) {
                              s2 = peg$parseValueExpr();
                              if (s2 === peg$FAILED) {
                                s2 = peg$parseAnyTypeExpr();
                                if (s2 === peg$FAILED) {
                                  s2 = peg$parseUnknownTypeExpr();
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c0(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseTopLevel() {
    var s0, s1, s2, s3;

    var key    = peg$currPos * 81 + 1,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parse_();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseVariadicTypeExpr();
      if (s2 === peg$FAILED) {
        s2 = peg$parseUnionTypeExpr();
        if (s2 === peg$FAILED) {
          s2 = peg$parseUnaryUnionTypeExpr();
          if (s2 === peg$FAILED) {
            s2 = peg$parseArrayTypeExpr();
            if (s2 === peg$FAILED) {
              s2 = peg$parseGenericTypeExpr();
              if (s2 === peg$FAILED) {
                s2 = peg$parseRecordTypeExpr();
                if (s2 === peg$FAILED) {
                  s2 = peg$parseTupleTypeExpr();
                  if (s2 === peg$FAILED) {
                    s2 = peg$parseArrowTypeExpr();
                    if (s2 === peg$FAILED) {
                      s2 = peg$parseFunctionTypeExpr();
                      if (s2 === peg$FAILED) {
                        s2 = peg$parseTypeQueryExpr();
                        if (s2 === peg$FAILED) {
                          s2 = peg$parseBroadNamepathExpr();
                          if (s2 === peg$FAILED) {
                            s2 = peg$parseParenthesizedExpr();
                            if (s2 === peg$FAILED) {
                              s2 = peg$parseValueExpr();
                              if (s2 === peg$FAILED) {
                                s2 = peg$parseAnyTypeExpr();
                                if (s2 === peg$FAILED) {
                                  s2 = peg$parseUnknownTypeExpr();
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c0(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parse_() {
    var s0, s1;

    var key    = peg$currPos * 81 + 2,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = [];
    if (peg$c1.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c2); }
    }
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      if (peg$c1.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c2); }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseJsIdentifier() {
    var s0, s1, s2, s3, s4;

    var key    = peg$currPos * 81 + 3,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (peg$c3.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c4); }
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      if (peg$c5.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c6); }
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        if (peg$c5.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c6); }
        }
      }
      if (s3 !== peg$FAILED) {
        s2 = [s2, s3];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseNamepathExpr() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

    var key    = peg$currPos * 81 + 4,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseParenthesizedExpr();
    if (s1 === peg$FAILED) {
      s1 = peg$parseImportTypeExpr();
      if (s1 === peg$FAILED) {
        s1 = peg$parseTypeNameExpr();
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse_();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseInfixNamepathOperator();
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          if (s6 !== peg$FAILED) {
            if (input.substr(peg$currPos, 6) === peg$c7) {
              s7 = peg$c7;
              peg$currPos += 6;
            } else {
              s7 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c8); }
            }
            if (s7 === peg$FAILED) {
              s7 = null;
            }
            if (s7 !== peg$FAILED) {
              s8 = peg$parse_();
              if (s8 !== peg$FAILED) {
                s9 = peg$parseMemberName();
                if (s9 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7, s8, s9];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse_();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseInfixNamepathOperator();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse_();
            if (s6 !== peg$FAILED) {
              if (input.substr(peg$currPos, 6) === peg$c7) {
                s7 = peg$c7;
                peg$currPos += 6;
              } else {
                s7 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c8); }
              }
              if (s7 === peg$FAILED) {
                s7 = null;
              }
              if (s7 !== peg$FAILED) {
                s8 = peg$parse_();
                if (s8 !== peg$FAILED) {
                  s9 = peg$parseMemberName();
                  if (s9 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7, s8, s9];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c9(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseTypeNameExpr() {
    var s0;

    var key    = peg$currPos * 81 + 5,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseTypeNameExprJsDocFlavored();
    if (s0 === peg$FAILED) {
      s0 = peg$parseTypeNameExprStrict();
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseTypeNameExprStrict() {
    var s0, s1;

    var key    = peg$currPos * 81 + 6,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseJsIdentifier();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c10(s1);
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseTypeNameExprJsDocFlavored() {
    var s0, s1, s2, s3, s4, s5;

    var key    = peg$currPos * 81 + 7,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$currPos;
    if (peg$c3.test(input.charAt(peg$currPos))) {
      s3 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c4); }
    }
    if (s3 !== peg$FAILED) {
      s4 = [];
      if (peg$c11.test(input.charAt(peg$currPos))) {
        s5 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c12); }
      }
      while (s5 !== peg$FAILED) {
        s4.push(s5);
        if (peg$c11.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c12); }
        }
      }
      if (s4 !== peg$FAILED) {
        s3 = [s3, s4];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s1 = input.substring(s1, peg$currPos);
    } else {
      s1 = s2;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c13(s1);
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseMemberName() {
    var s0, s1, s2, s3, s4;

    var key    = peg$currPos * 81 + 8,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 39) {
      s1 = peg$c14;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c15); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = [];
      if (peg$c16.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c17); }
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        if (peg$c16.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c17); }
        }
      }
      if (s3 !== peg$FAILED) {
        s2 = input.substring(s2, peg$currPos);
      } else {
        s2 = s3;
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 39) {
          s3 = peg$c14;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c15); }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c18(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
        s1 = peg$c19;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c20); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = [];
        if (peg$c21.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c22); }
        }
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          if (peg$c21.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c22); }
          }
        }
        if (s3 !== peg$FAILED) {
          s2 = input.substring(s2, peg$currPos);
        } else {
          s2 = s3;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s3 = peg$c19;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c20); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c18(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseJsIdentifier();
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseInfixNamepathOperator() {
    var s0;

    var key    = peg$currPos * 81 + 9,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseMemberTypeOperator();
    if (s0 === peg$FAILED) {
      s0 = peg$parseInstanceMemberTypeOperator();
      if (s0 === peg$FAILED) {
        s0 = peg$parseInnerMemberTypeOperator();
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseQualifiedMemberName() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    var key    = peg$currPos * 81 + 10,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseTypeNameExpr();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse_();
      if (s4 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s5 = peg$c23;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c24); }
        }
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          if (s6 !== peg$FAILED) {
            s7 = peg$parseTypeNameExpr();
            if (s7 !== peg$FAILED) {
              s4 = [s4, s5, s6, s7];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse_();
        if (s4 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 46) {
            s5 = peg$c23;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c24); }
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parse_();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseTypeNameExpr();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c25(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseMemberTypeOperator() {
    var s0, s1;

    var key    = peg$currPos * 81 + 11,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      s1 = peg$c23;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c24); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c26();
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseInnerMemberTypeOperator() {
    var s0, s1;

    var key    = peg$currPos * 81 + 12,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 126) {
      s1 = peg$c27;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c28); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c29();
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseInstanceMemberTypeOperator() {
    var s0, s1;

    var key    = peg$currPos * 81 + 13,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 35) {
      s1 = peg$c30;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c31); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c32();
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseBroadNamepathExpr() {
    var s0;

    var key    = peg$currPos * 81 + 14,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseExternalNameExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseModuleNameExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseNamepathExpr();
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseExternalNameExpr() {
    var s0, s1, s2, s3, s4, s5;

    var key    = peg$currPos * 81 + 15,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c33) {
      s1 = peg$c33;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c34); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 58) {
          s3 = peg$c35;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c36); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseNamepathExpr();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c37(s5);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseModuleNameExpr() {
    var s0, s1, s2, s3, s4, s5;

    var key    = peg$currPos * 81 + 16,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c38) {
      s1 = peg$c38;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c39); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 58) {
          s3 = peg$c35;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c36); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseModulePathExpr();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c40(s5);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseModulePathExpr() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

    var key    = peg$currPos * 81 + 17,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseFilePathExpr();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse_();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseInfixNamepathOperator();
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          if (s6 !== peg$FAILED) {
            if (input.substr(peg$currPos, 6) === peg$c7) {
              s7 = peg$c7;
              peg$currPos += 6;
            } else {
              s7 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c8); }
            }
            if (s7 === peg$FAILED) {
              s7 = null;
            }
            if (s7 !== peg$FAILED) {
              s8 = peg$parse_();
              if (s8 !== peg$FAILED) {
                s9 = peg$parseMemberName();
                if (s9 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7, s8, s9];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse_();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseInfixNamepathOperator();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse_();
            if (s6 !== peg$FAILED) {
              if (input.substr(peg$currPos, 6) === peg$c7) {
                s7 = peg$c7;
                peg$currPos += 6;
              } else {
                s7 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c8); }
              }
              if (s7 === peg$FAILED) {
                s7 = null;
              }
              if (s7 !== peg$FAILED) {
                s8 = peg$parse_();
                if (s8 !== peg$FAILED) {
                  s9 = peg$parseMemberName();
                  if (s9 !== peg$FAILED) {
                    s4 = [s4, s5, s6, s7, s8, s9];
                    s3 = s4;
                  } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c41(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseFilePathExpr() {
    var s0, s1, s2, s3;

    var key    = peg$currPos * 81 + 18,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = [];
    if (peg$c42.test(input.charAt(peg$currPos))) {
      s3 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c43); }
    }
    if (s3 !== peg$FAILED) {
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        if (peg$c42.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c43); }
        }
      }
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s1 = input.substring(s1, peg$currPos);
    } else {
      s1 = s2;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c44(s1);
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseAnyTypeExpr() {
    var s0, s1;

    var key    = peg$currPos * 81 + 19,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 42) {
      s1 = peg$c45;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c46); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c47();
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseUnknownTypeExpr() {
    var s0, s1;

    var key    = peg$currPos * 81 + 20,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 63) {
      s1 = peg$c48;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c49); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c50();
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseValueExpr() {
    var s0;

    var key    = peg$currPos * 81 + 21,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseStringLiteralExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseNumberLiteralExpr();
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseStringLiteralExpr() {
    var s0, s1, s2, s3, s4, s5, s6;

    var key    = peg$currPos * 81 + 22,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 34) {
      s1 = peg$c19;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c20); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = [];
      if (peg$c51.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c52); }
      }
      if (s4 === peg$FAILED) {
        s4 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 92) {
          s5 = peg$c53;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }
        if (s5 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s6 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c55); }
          }
          if (s6 !== peg$FAILED) {
            s5 = [s5, s6];
            s4 = s5;
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        if (peg$c51.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c52); }
        }
        if (s4 === peg$FAILED) {
          s4 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 92) {
            s5 = peg$c53;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c54); }
          }
          if (s5 !== peg$FAILED) {
            if (input.length > peg$currPos) {
              s6 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c55); }
            }
            if (s6 !== peg$FAILED) {
              s5 = [s5, s6];
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
        }
      }
      if (s3 !== peg$FAILED) {
        s2 = input.substring(s2, peg$currPos);
      } else {
        s2 = s3;
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 34) {
          s3 = peg$c19;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c20); }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c56(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        s1 = peg$c14;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c15); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = [];
        if (peg$c57.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c58); }
        }
        if (s4 === peg$FAILED) {
          s4 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 92) {
            s5 = peg$c53;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c54); }
          }
          if (s5 !== peg$FAILED) {
            if (input.length > peg$currPos) {
              s6 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c55); }
            }
            if (s6 !== peg$FAILED) {
              s5 = [s5, s6];
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
        }
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          if (peg$c57.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c58); }
          }
          if (s4 === peg$FAILED) {
            s4 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 92) {
              s5 = peg$c53;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c54); }
            }
            if (s5 !== peg$FAILED) {
              if (input.length > peg$currPos) {
                s6 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c55); }
              }
              if (s6 !== peg$FAILED) {
                s5 = [s5, s6];
                s4 = s5;
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          }
        }
        if (s3 !== peg$FAILED) {
          s2 = input.substring(s2, peg$currPos);
        } else {
          s2 = s3;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s3 = peg$c14;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c15); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c59(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseNumberLiteralExpr() {
    var s0, s1;

    var key    = peg$currPos * 81 + 23,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseBinNumberLiteralExpr();
    if (s1 === peg$FAILED) {
      s1 = peg$parseOctNumberLiteralExpr();
      if (s1 === peg$FAILED) {
        s1 = peg$parseHexNumberLiteralExpr();
        if (s1 === peg$FAILED) {
          s1 = peg$parseDecimalNumberLiteralExpr();
        }
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c60(s1);
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseDecimalNumberLiteralExpr() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    var key    = peg$currPos * 81 + 24,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 45) {
      s2 = peg$c61;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c62); }
    }
    if (s2 === peg$FAILED) {
      s2 = null;
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      if (peg$c63.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c64); }
      }
      if (s4 !== peg$FAILED) {
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          if (peg$c63.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c64); }
          }
        }
      } else {
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s5 = peg$c23;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c24); }
        }
        if (s5 !== peg$FAILED) {
          s6 = [];
          if (peg$c63.test(input.charAt(peg$currPos))) {
            s7 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s7 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c64); }
          }
          if (s7 !== peg$FAILED) {
            while (s7 !== peg$FAILED) {
              s6.push(s7);
              if (peg$c63.test(input.charAt(peg$currPos))) {
                s7 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s7 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c64); }
              }
            }
          } else {
            s6 = peg$FAILED;
          }
          if (s6 !== peg$FAILED) {
            s5 = [s5, s6];
            s4 = s5;
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        if (s4 !== peg$FAILED) {
          s2 = [s2, s3, s4];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseBinNumberLiteralExpr() {
    var s0, s1, s2, s3, s4, s5;

    var key    = peg$currPos * 81 + 25,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 45) {
      s2 = peg$c61;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c62); }
    }
    if (s2 === peg$FAILED) {
      s2 = null;
    }
    if (s2 !== peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c65) {
        s3 = peg$c65;
        peg$currPos += 2;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c66); }
      }
      if (s3 !== peg$FAILED) {
        s4 = [];
        if (peg$c67.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c68); }
        }
        if (s5 !== peg$FAILED) {
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            if (peg$c67.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c68); }
            }
          }
        } else {
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s2 = [s2, s3, s4];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseOctNumberLiteralExpr() {
    var s0, s1, s2, s3, s4, s5;

    var key    = peg$currPos * 81 + 26,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 45) {
      s2 = peg$c61;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c62); }
    }
    if (s2 === peg$FAILED) {
      s2 = null;
    }
    if (s2 !== peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c69) {
        s3 = peg$c69;
        peg$currPos += 2;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c70); }
      }
      if (s3 !== peg$FAILED) {
        s4 = [];
        if (peg$c71.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c72); }
        }
        if (s5 !== peg$FAILED) {
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            if (peg$c71.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c72); }
            }
          }
        } else {
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s2 = [s2, s3, s4];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseHexNumberLiteralExpr() {
    var s0, s1, s2, s3, s4, s5;

    var key    = peg$currPos * 81 + 27,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 45) {
      s2 = peg$c61;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c62); }
    }
    if (s2 === peg$FAILED) {
      s2 = null;
    }
    if (s2 !== peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c73) {
        s3 = peg$c73;
        peg$currPos += 2;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c74); }
      }
      if (s3 !== peg$FAILED) {
        s4 = [];
        if (peg$c75.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c76); }
        }
        if (s5 !== peg$FAILED) {
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            if (peg$c75.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c76); }
            }
          }
        } else {
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s2 = [s2, s3, s4];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s0 = input.substring(s0, peg$currPos);
    } else {
      s0 = s1;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseUnionTypeExpr() {
    var s0, s1, s2, s3, s4, s5;

    var key    = peg$currPos * 81 + 28,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseUnionTypeExprOperand();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseUnionTypeOperator();
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseUnionTypeExpr();
            if (s5 === peg$FAILED) {
              s5 = peg$parseUnionTypeExprOperand();
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c77(s1, s3, s5);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseUnionTypeOperator() {
    var s0;

    var key    = peg$currPos * 81 + 29,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseUnionTypeOperatorClosureLibraryFlavored();
    if (s0 === peg$FAILED) {
      s0 = peg$parseUnionTypeOperatorJSDuckFlavored();
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseUnionTypeOperatorClosureLibraryFlavored() {
    var s0, s1;

    var key    = peg$currPos * 81 + 30,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 124) {
      s1 = peg$c78;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c79); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c80();
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseUnionTypeOperatorJSDuckFlavored() {
    var s0, s1;

    var key    = peg$currPos * 81 + 31,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 47) {
      s1 = peg$c81;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c82); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c83();
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseUnionTypeExprOperand() {
    var s0;

    var key    = peg$currPos * 81 + 32,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseUnaryUnionTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseRecordTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseTupleTypeExpr();
        if (s0 === peg$FAILED) {
          s0 = peg$parseArrowTypeExpr();
          if (s0 === peg$FAILED) {
            s0 = peg$parseFunctionTypeExpr();
            if (s0 === peg$FAILED) {
              s0 = peg$parseParenthesizedExpr();
              if (s0 === peg$FAILED) {
                s0 = peg$parseTypeQueryExpr();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseGenericTypeExpr();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseArrayTypeExpr();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseBroadNamepathExpr();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseValueExpr();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseAnyTypeExpr();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseUnknownTypeExpr();
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseUnaryUnionTypeExpr() {
    var s0;

    var key    = peg$currPos * 81 + 33,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseSuffixUnaryUnionTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parsePrefixUnaryUnionTypeExpr();
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parsePrefixUnaryUnionTypeExpr() {
    var s0;

    var key    = peg$currPos * 81 + 34,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parsePrefixOptionalTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parsePrefixNotNullableTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parsePrefixNullableTypeExpr();
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parsePrefixUnaryUnionTypeExprOperand() {
    var s0;

    var key    = peg$currPos * 81 + 35,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseGenericTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseRecordTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseTupleTypeExpr();
        if (s0 === peg$FAILED) {
          s0 = peg$parseArrowTypeExpr();
          if (s0 === peg$FAILED) {
            s0 = peg$parseFunctionTypeExpr();
            if (s0 === peg$FAILED) {
              s0 = peg$parseParenthesizedExpr();
              if (s0 === peg$FAILED) {
                s0 = peg$parseBroadNamepathExpr();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseValueExpr();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseAnyTypeExpr();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseUnknownTypeExpr();
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseTypeQueryExpr() {
    var s0, s1, s2, s3;

    var key    = peg$currPos * 81 + 36,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c84) {
      s1 = peg$c84;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c85); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseQualifiedMemberName();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c86(s1, s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseImportTypeExpr() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    var key    = peg$currPos * 81 + 37,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c87) {
      s1 = peg$c87;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c88); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 40) {
          s3 = peg$c89;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c90); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseStringLiteralExpr();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_();
              if (s6 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 41) {
                  s7 = peg$c91;
                  peg$currPos++;
                } else {
                  s7 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c92); }
                }
                if (s7 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c93(s1, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parsePrefixNullableTypeExpr() {
    var s0, s1, s2, s3;

    var key    = peg$currPos * 81 + 38,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 63) {
      s1 = peg$c48;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c49); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsePrefixUnaryUnionTypeExprOperand();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c94(s1, s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parsePrefixNotNullableTypeExpr() {
    var s0, s1, s2, s3;

    var key    = peg$currPos * 81 + 39,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 33) {
      s1 = peg$c95;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c96); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsePrefixUnaryUnionTypeExprOperand();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c97(s1, s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parsePrefixOptionalTypeExpr() {
    var s0, s1, s2, s3;

    var key    = peg$currPos * 81 + 40,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 61) {
      s1 = peg$c98;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c99); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsePrefixUnaryUnionTypeExprOperand();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c100(s1, s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseSuffixUnaryUnionTypeExpr() {
    var s0;

    var key    = peg$currPos * 81 + 41,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseSuffixOptionalTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseSuffixNullableTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseSuffixNotNullableTypeExpr();
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseSuffixUnaryUnionTypeExprOperand() {
    var s0;

    var key    = peg$currPos * 81 + 42,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parsePrefixUnaryUnionTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseGenericTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseRecordTypeExpr();
        if (s0 === peg$FAILED) {
          s0 = peg$parseTupleTypeExpr();
          if (s0 === peg$FAILED) {
            s0 = peg$parseArrowTypeExpr();
            if (s0 === peg$FAILED) {
              s0 = peg$parseFunctionTypeExpr();
              if (s0 === peg$FAILED) {
                s0 = peg$parseParenthesizedExpr();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseBroadNamepathExpr();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseValueExpr();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseAnyTypeExpr();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseUnknownTypeExpr();
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseSuffixNullableTypeExpr() {
    var s0, s1, s2, s3;

    var key    = peg$currPos * 81 + 43,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseSuffixUnaryUnionTypeExprOperand();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 63) {
          s3 = peg$c48;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c49); }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c101(s1, s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseSuffixNotNullableTypeExpr() {
    var s0, s1, s2, s3;

    var key    = peg$currPos * 81 + 44,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseSuffixUnaryUnionTypeExprOperand();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 33) {
          s3 = peg$c95;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c96); }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c102(s1, s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseSuffixOptionalTypeExpr() {
    var s0, s1, s2, s3;

    var key    = peg$currPos * 81 + 45,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseSuffixNullableTypeExpr();
    if (s1 === peg$FAILED) {
      s1 = peg$parseSuffixNotNullableTypeExpr();
      if (s1 === peg$FAILED) {
        s1 = peg$parseSuffixUnaryUnionTypeExprOperand();
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c98;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c99); }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c103(s1, s3);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseGenericTypeExpr() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    var key    = peg$currPos * 81 + 46,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseGenericTypeExprOperand();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseGenericTypeStartToken();
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseGenericTypeExprTypeParamList();
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseGenericTypeEndToken();
                if (s7 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c104(s1, s3, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseGenericTypeExprOperand() {
    var s0;

    var key    = peg$currPos * 81 + 47,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseParenthesizedExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseBroadNamepathExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseValueExpr();
        if (s0 === peg$FAILED) {
          s0 = peg$parseAnyTypeExpr();
          if (s0 === peg$FAILED) {
            s0 = peg$parseUnknownTypeExpr();
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseGenericTypeExprTypeParamOperand() {
    var s0;

    var key    = peg$currPos * 81 + 48,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseUnionTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseUnaryUnionTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseRecordTypeExpr();
        if (s0 === peg$FAILED) {
          s0 = peg$parseTupleTypeExpr();
          if (s0 === peg$FAILED) {
            s0 = peg$parseArrowTypeExpr();
            if (s0 === peg$FAILED) {
              s0 = peg$parseFunctionTypeExpr();
              if (s0 === peg$FAILED) {
                s0 = peg$parseParenthesizedExpr();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseArrayTypeExpr();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseGenericTypeExpr();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseTypeQueryExpr();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseBroadNamepathExpr();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseValueExpr();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseAnyTypeExpr();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parseUnknownTypeExpr();
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseGenericTypeExprTypeParamList() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    var key    = peg$currPos * 81 + 49,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseGenericTypeExprTypeParamOperand();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse_();
      if (s4 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 44) {
          s5 = peg$c105;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c106); }
        }
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          if (s6 !== peg$FAILED) {
            s7 = peg$parseGenericTypeExprTypeParamOperand();
            if (s7 !== peg$FAILED) {
              s4 = [s4, s5, s6, s7];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse_();
        if (s4 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s5 = peg$c105;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c106); }
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parse_();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseGenericTypeExprTypeParamOperand();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c107(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseGenericTypeStartToken() {
    var s0;

    var key    = peg$currPos * 81 + 50,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseGenericTypeEcmaScriptFlavoredStartToken();
    if (s0 === peg$FAILED) {
      s0 = peg$parseGenericTypeTypeScriptFlavoredStartToken();
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseGenericTypeEcmaScriptFlavoredStartToken() {
    var s0, s1;

    var key    = peg$currPos * 81 + 51,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c108) {
      s1 = peg$c108;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c109); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c110();
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseGenericTypeTypeScriptFlavoredStartToken() {
    var s0, s1;

    var key    = peg$currPos * 81 + 52,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 60) {
      s1 = peg$c111;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c112); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c113();
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseGenericTypeEndToken() {
    var s0;

    var key    = peg$currPos * 81 + 53,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    if (input.charCodeAt(peg$currPos) === 62) {
      s0 = peg$c114;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c115); }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseArrayTypeExpr() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    var key    = peg$currPos * 81 + 54,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseArrayTypeExprOperand();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse_();
      if (s4 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 91) {
          s5 = peg$c116;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c117); }
        }
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          if (s6 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s7 = peg$c118;
              peg$currPos++;
            } else {
              s7 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c119); }
            }
            if (s7 !== peg$FAILED) {
              s4 = [s4, s5, s6, s7];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 91) {
              s5 = peg$c116;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c117); }
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_();
              if (s6 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 93) {
                  s7 = peg$c118;
                  peg$currPos++;
                } else {
                  s7 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c119); }
                }
                if (s7 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c120(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseArrayTypeExprOperand() {
    var s0;

    var key    = peg$currPos * 81 + 55,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseUnaryUnionTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseRecordTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseTupleTypeExpr();
        if (s0 === peg$FAILED) {
          s0 = peg$parseArrowTypeExpr();
          if (s0 === peg$FAILED) {
            s0 = peg$parseFunctionTypeExpr();
            if (s0 === peg$FAILED) {
              s0 = peg$parseParenthesizedExpr();
              if (s0 === peg$FAILED) {
                s0 = peg$parseGenericTypeExpr();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseTypeQueryExpr();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseBroadNamepathExpr();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseValueExpr();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseAnyTypeExpr();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseUnknownTypeExpr();
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseArrowTypeExpr() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    var key    = peg$currPos * 81 + 56,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c121) {
      s1 = peg$c121;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c122); }
    }
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseArrowTypeExprParamsList();
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c123) {
              s5 = peg$c123;
              peg$currPos += 2;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c124); }
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseFunctionTypeExprReturnableOperand();
                if (s7 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c125(s1, s3, s7);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseArrowTypeExprParamsList() {
    var s0, s1, s2, s3, s4, s5;

    var key    = peg$currPos * 81 + 57,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c89;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c90); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseArrowTypeExprParams();
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s5 = peg$c91;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c92); }
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c126(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c89;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c90); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 41) {
            s3 = peg$c91;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c92); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c127();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseArrowTypeExprParams() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

    var key    = peg$currPos * 81 + 58,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$currPos;
    s3 = peg$parseJsIdentifier();
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (s4 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 58) {
          s5 = peg$c35;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c36); }
        }
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          if (s6 !== peg$FAILED) {
            s7 = peg$parseFunctionTypeExprParamOperand();
            if (s7 === peg$FAILED) {
              s7 = null;
            }
            if (s7 !== peg$FAILED) {
              s8 = peg$parse_();
              if (s8 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 44) {
                  s9 = peg$c105;
                  peg$currPos++;
                } else {
                  s9 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c106); }
                }
                if (s9 !== peg$FAILED) {
                  s10 = peg$parse_();
                  if (s10 !== peg$FAILED) {
                    s3 = [s3, s4, s5, s6, s7, s8, s9, s10];
                    s2 = s3;
                  } else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$FAILED;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$FAILED;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$currPos;
      s3 = peg$parseJsIdentifier();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        if (s4 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 58) {
            s5 = peg$c35;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c36); }
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parse_();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseFunctionTypeExprParamOperand();
              if (s7 === peg$FAILED) {
                s7 = null;
              }
              if (s7 !== peg$FAILED) {
                s8 = peg$parse_();
                if (s8 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 44) {
                    s9 = peg$c105;
                    peg$currPos++;
                  } else {
                    s9 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c106); }
                  }
                  if (s9 !== peg$FAILED) {
                    s10 = peg$parse_();
                    if (s10 !== peg$FAILED) {
                      s3 = [s3, s4, s5, s6, s7, s8, s9, s10];
                      s2 = s3;
                    } else {
                      peg$currPos = s2;
                      s2 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$FAILED;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$FAILED;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseVariadicNameExpr();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c128(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseVariadicNameExpr() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

    var key    = peg$currPos * 81 + 59,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c129) {
      s1 = peg$c129;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c130); }
    }
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseJsIdentifier();
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 58) {
              s5 = peg$c35;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c36); }
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseFunctionTypeExprParamOperand();
                if (s7 === peg$FAILED) {
                  s7 = null;
                }
                if (s7 !== peg$FAILED) {
                  s8 = peg$parse_();
                  if (s8 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 44) {
                      s9 = peg$c105;
                      peg$currPos++;
                    } else {
                      s9 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c106); }
                    }
                    if (s9 === peg$FAILED) {
                      s9 = null;
                    }
                    if (s9 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c131(s1, s3, s7);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseFunctionTypeExpr() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8;

    var key    = peg$currPos * 81 + 60,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c132) {
      s1 = peg$c132;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c133); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseFunctionTypeExprParamsList();
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 58) {
              s6 = peg$c35;
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c36); }
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$parse_();
              if (s7 !== peg$FAILED) {
                s8 = peg$parseFunctionTypeExprReturnableOperand();
                if (s8 !== peg$FAILED) {
                  s6 = [s6, s7, s8];
                  s5 = s6;
                } else {
                  peg$currPos = s5;
                  s5 = peg$FAILED;
                }
              } else {
                peg$currPos = s5;
                s5 = peg$FAILED;
              }
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
            if (s5 === peg$FAILED) {
              s5 = null;
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c134(s3, s5);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseFunctionTypeExprParamsList() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

    var key    = peg$currPos * 81 + 61,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c89;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c90); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseFunctionTypeExprModifier();
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 44) {
              s5 = peg$c105;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c106); }
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_();
              if (s6 !== peg$FAILED) {
                s7 = peg$parseFunctionTypeExprParams();
                if (s7 !== peg$FAILED) {
                  s8 = peg$parse_();
                  if (s8 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 41) {
                      s9 = peg$c91;
                      peg$currPos++;
                    } else {
                      s9 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c92); }
                    }
                    if (s9 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c135(s3, s7);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c89;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c90); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseFunctionTypeExprModifier();
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 41) {
                s5 = peg$c91;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c92); }
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c136(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 40) {
          s1 = peg$c89;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c90); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseFunctionTypeExprParams();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_();
              if (s4 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 41) {
                  s5 = peg$c91;
                  peg$currPos++;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c92); }
                }
                if (s5 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c137(s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 40) {
            s1 = peg$c89;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c90); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 41) {
                s3 = peg$c91;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c92); }
              }
              if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c138();
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseFunctionTypeExprModifier() {
    var s0, s1, s2, s3, s4, s5, s6;

    var key    = peg$currPos * 81 + 62,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c139) {
      s2 = peg$c139;
      peg$currPos += 4;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c140); }
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parse_();
      if (s3 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 58) {
          s4 = peg$c35;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c36); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parse_();
          if (s5 !== peg$FAILED) {
            s6 = peg$parseFunctionTypeExprParamOperand();
            if (s6 !== peg$FAILED) {
              s2 = [s2, s3, s4, s5, s6];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c141(s1);
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c121) {
        s2 = peg$c121;
        peg$currPos += 3;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c122); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 58) {
            s4 = peg$c35;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c36); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_();
            if (s5 !== peg$FAILED) {
              s6 = peg$parseFunctionTypeExprParamOperand();
              if (s6 !== peg$FAILED) {
                s2 = [s2, s3, s4, s5, s6];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c142(s1);
      }
      s0 = s1;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseFunctionTypeExprParams() {
    var s0, s1, s2, s3, s4, s5, s6;

    var key    = peg$currPos * 81 + 63,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$currPos;
    s3 = peg$parseFunctionTypeExprParamOperand();
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (s4 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 44) {
          s5 = peg$c105;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c106); }
        }
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          if (s6 !== peg$FAILED) {
            s3 = [s3, s4, s5, s6];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$currPos;
      s3 = peg$parseFunctionTypeExprParamOperand();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        if (s4 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s5 = peg$c105;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c106); }
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parse_();
            if (s6 !== peg$FAILED) {
              s3 = [s3, s4, s5, s6];
              s2 = s3;
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseVariadicTypeExpr();
      if (s2 === peg$FAILED) {
        s2 = peg$parseVariadicTypeExprOperand();
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c143(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseFunctionTypeExprParamOperand() {
    var s0;

    var key    = peg$currPos * 81 + 64,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseUnionTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseTypeQueryExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseUnaryUnionTypeExpr();
        if (s0 === peg$FAILED) {
          s0 = peg$parseRecordTypeExpr();
          if (s0 === peg$FAILED) {
            s0 = peg$parseTupleTypeExpr();
            if (s0 === peg$FAILED) {
              s0 = peg$parseArrowTypeExpr();
              if (s0 === peg$FAILED) {
                s0 = peg$parseFunctionTypeExpr();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseParenthesizedExpr();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseArrayTypeExpr();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseGenericTypeExpr();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseBroadNamepathExpr();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseValueExpr();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseAnyTypeExpr();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parseUnknownTypeExpr();
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseFunctionTypeExprReturnableOperand() {
    var s0;

    var key    = peg$currPos * 81 + 65,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parsePrefixUnaryUnionTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseRecordTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseTupleTypeExpr();
        if (s0 === peg$FAILED) {
          s0 = peg$parseArrowTypeExpr();
          if (s0 === peg$FAILED) {
            s0 = peg$parseFunctionTypeExpr();
            if (s0 === peg$FAILED) {
              s0 = peg$parseParenthesizedExpr();
              if (s0 === peg$FAILED) {
                s0 = peg$parseArrayTypeExpr();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseTypeQueryExpr();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseGenericTypeExpr();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseBroadNamepathExpr();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseValueExpr();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseAnyTypeExpr();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseUnknownTypeExpr();
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseRecordTypeExpr() {
    var s0, s1, s2, s3, s4, s5;

    var key    = peg$currPos * 81 + 66,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 123) {
      s1 = peg$c144;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c145); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseRecordTypeExprEntries();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 125) {
              s5 = peg$c146;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c147); }
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c148(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseRecordTypeExprEntries() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    var key    = peg$currPos * 81 + 67,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseRecordTypeExprEntry();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse_();
      if (s4 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 44) {
          s5 = peg$c105;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c106); }
        }
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          if (s6 !== peg$FAILED) {
            s7 = peg$parseRecordTypeExprEntry();
            if (s7 !== peg$FAILED) {
              s4 = [s4, s5, s6, s7];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse_();
        if (s4 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s5 = peg$c105;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c106); }
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parse_();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseRecordTypeExprEntry();
              if (s7 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c149(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseRecordTypeExprEntry() {
    var s0, s1, s2, s3, s4, s5;

    var key    = peg$currPos * 81 + 68,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseRecordTypeExprEntryKey();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 58) {
          s3 = peg$c35;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c36); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseRecordTypeExprEntryOperand();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c150(s1, s5);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseRecordTypeExprEntryKey();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c151(s1);
      }
      s0 = s1;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseRecordTypeExprEntryKey() {
    var s0, s1, s2, s3, s4;

    var key    = peg$currPos * 81 + 69,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 34) {
      s1 = peg$c19;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c20); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = [];
      if (peg$c21.test(input.charAt(peg$currPos))) {
        s4 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c22); }
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        if (peg$c21.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c22); }
        }
      }
      if (s3 !== peg$FAILED) {
        s2 = input.substring(s2, peg$currPos);
      } else {
        s2 = s3;
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 34) {
          s3 = peg$c19;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c20); }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c152(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        s1 = peg$c14;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c15); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = [];
        if (peg$c16.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c17); }
        }
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          if (peg$c16.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c17); }
          }
        }
        if (s3 !== peg$FAILED) {
          s2 = input.substring(s2, peg$currPos);
        } else {
          s2 = s3;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s3 = peg$c14;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c15); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c152(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = [];
        if (peg$c5.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c6); }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (peg$c5.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c6); }
            }
          }
        } else {
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          s0 = input.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseRecordTypeExprEntryOperand() {
    var s0;

    var key    = peg$currPos * 81 + 70,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseUnionTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseUnaryUnionTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseRecordTypeExpr();
        if (s0 === peg$FAILED) {
          s0 = peg$parseTupleTypeExpr();
          if (s0 === peg$FAILED) {
            s0 = peg$parseArrowTypeExpr();
            if (s0 === peg$FAILED) {
              s0 = peg$parseFunctionTypeExpr();
              if (s0 === peg$FAILED) {
                s0 = peg$parseParenthesizedExpr();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseArrayTypeExpr();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseGenericTypeExpr();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseBroadNamepathExpr();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseValueExpr();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseAnyTypeExpr();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseUnknownTypeExpr();
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseTupleTypeExpr() {
    var s0, s1, s2, s3, s4, s5;

    var key    = peg$currPos * 81 + 71,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 91) {
      s1 = peg$c116;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c117); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseTupleTypeExprEntries();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s5 = peg$c118;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c119); }
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c153(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseTupleTypeExprEntries() {
    var s0, s1, s2, s3, s4, s5, s6;

    var key    = peg$currPos * 81 + 72,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$currPos;
    s3 = peg$parseTupleTypeExprOperand();
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (s4 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 44) {
          s5 = peg$c105;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c106); }
        }
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          if (s6 !== peg$FAILED) {
            s3 = [s3, s4, s5, s6];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$currPos;
      s3 = peg$parseTupleTypeExprOperand();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        if (s4 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s5 = peg$c105;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c106); }
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parse_();
            if (s6 !== peg$FAILED) {
              s3 = [s3, s4, s5, s6];
              s2 = s3;
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseVariadicTypeExpr();
      if (s2 === peg$FAILED) {
        s2 = peg$parseVariadicTypeExprOperand();
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c154(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseTupleTypeExprOperand() {
    var s0;

    var key    = peg$currPos * 81 + 73,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseUnionTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseUnaryUnionTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseRecordTypeExpr();
        if (s0 === peg$FAILED) {
          s0 = peg$parseTupleTypeExpr();
          if (s0 === peg$FAILED) {
            s0 = peg$parseArrowTypeExpr();
            if (s0 === peg$FAILED) {
              s0 = peg$parseFunctionTypeExpr();
              if (s0 === peg$FAILED) {
                s0 = peg$parseParenthesizedExpr();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseTypeQueryExpr();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseArrayTypeExpr();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseGenericTypeExpr();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseBroadNamepathExpr();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseValueExpr();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseAnyTypeExpr();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parseUnknownTypeExpr();
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseParenthesizedExpr() {
    var s0, s1, s2, s3, s4, s5;

    var key    = peg$currPos * 81 + 74,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c89;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c90); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseParenthesizedExprOperand();
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s5 = peg$c91;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c92); }
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c155(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseParenthesizedExprOperand() {
    var s0;

    var key    = peg$currPos * 81 + 75,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseUnionTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseUnaryUnionTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseRecordTypeExpr();
        if (s0 === peg$FAILED) {
          s0 = peg$parseTupleTypeExpr();
          if (s0 === peg$FAILED) {
            s0 = peg$parseArrowTypeExpr();
            if (s0 === peg$FAILED) {
              s0 = peg$parseFunctionTypeExpr();
              if (s0 === peg$FAILED) {
                s0 = peg$parseArrayTypeExpr();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseTypeQueryExpr();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseGenericTypeExpr();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseBroadNamepathExpr();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseValueExpr();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseAnyTypeExpr();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseUnknownTypeExpr();
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseVariadicTypeExpr() {
    var s0;

    var key    = peg$currPos * 81 + 76,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parsePrefixVariadicTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseSuffixVariadicTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseAnyVariadicTypeExpr();
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parsePrefixVariadicTypeExpr() {
    var s0, s1, s2;

    var key    = peg$currPos * 81 + 77,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c129) {
      s1 = peg$c129;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c130); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseVariadicTypeExprOperand();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c156(s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseSuffixVariadicTypeExpr() {
    var s0, s1, s2;

    var key    = peg$currPos * 81 + 78,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    s1 = peg$parseVariadicTypeExprOperand();
    if (s1 !== peg$FAILED) {
      if (input.substr(peg$currPos, 3) === peg$c129) {
        s2 = peg$c129;
        peg$currPos += 3;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c130); }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c157(s1);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseAnyVariadicTypeExpr() {
    var s0, s1;

    var key    = peg$currPos * 81 + 79,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c129) {
      s1 = peg$c129;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c130); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c158();
    }
    s0 = s1;

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }

  function peg$parseVariadicTypeExprOperand() {
    var s0;

    var key    = peg$currPos * 81 + 80,
        cached = peg$resultsCache[key];

    if (cached) {
      peg$currPos = cached.nextPos;

      return cached.result;
    }

    s0 = peg$parseUnionTypeExpr();
    if (s0 === peg$FAILED) {
      s0 = peg$parseUnaryUnionTypeExpr();
      if (s0 === peg$FAILED) {
        s0 = peg$parseRecordTypeExpr();
        if (s0 === peg$FAILED) {
          s0 = peg$parseTupleTypeExpr();
          if (s0 === peg$FAILED) {
            s0 = peg$parseArrowTypeExpr();
            if (s0 === peg$FAILED) {
              s0 = peg$parseFunctionTypeExpr();
              if (s0 === peg$FAILED) {
                s0 = peg$parseParenthesizedExpr();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseTypeQueryExpr();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseArrayTypeExpr();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseGenericTypeExpr();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseBroadNamepathExpr();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseValueExpr();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseAnyTypeExpr();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parseUnknownTypeExpr();
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    peg$resultsCache[key] = { nextPos: peg$currPos, result: s0 };

    return s0;
  }


    var meta = require('../lib/SyntaxType.js');
    var GenericTypeSyntax = meta.GenericTypeSyntax;
    var UnionTypeSyntax = meta.UnionTypeSyntax;
    var VariadicTypeSyntax = meta.VariadicTypeSyntax;
    var OptionalTypeSyntax = meta.OptionalTypeSyntax;
    var NullableTypeSyntax = meta.NullableTypeSyntax;
    var NotNullableTypeSyntax = meta.NotNullableTypeSyntax;
    var NodeType = require('../lib/NodeType.js');

    var NamepathOperatorType = {
      MEMBER: 'MEMBER',
      INNER_MEMBER: 'INNER_MEMBER',
      INSTANCE_MEMBER: 'INSTANCE_MEMBER',
    };

    function reverse(array) {
      var reversed = [].concat(array);
      reversed.reverse();
      return reversed;
    }


  peg$result = peg$startRuleFunction();

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}

module.exports = {
  SyntaxError: peg$SyntaxError,
  parse:       peg$parse
};

},{"../lib/NodeType.js":5,"../lib/SyntaxType.js":6}],11:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],12:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],13:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":12,"_process":11,"inherits":3}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIiwibm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvanNkb2N0eXBlcGFyc2VyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2pzZG9jdHlwZXBhcnNlci9saWIvTm9kZVR5cGUuanMiLCJub2RlX21vZHVsZXMvanNkb2N0eXBlcGFyc2VyL2xpYi9TeW50YXhUeXBlLmpzIiwibm9kZV9tb2R1bGVzL2pzZG9jdHlwZXBhcnNlci9saWIvcGFyc2luZy5qcyIsIm5vZGVfbW9kdWxlcy9qc2RvY3R5cGVwYXJzZXIvbGliL3B1Ymxpc2hpbmcuanMiLCJub2RlX21vZHVsZXMvanNkb2N0eXBlcGFyc2VyL2xpYi90cmF2ZXJzaW5nLmpzIiwibm9kZV9tb2R1bGVzL2pzZG9jdHlwZXBhcnNlci9wZWdfbGliL2pzZG9jdHlwZS5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoaE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qIGdsb2JhbHMgalF1ZXJ5LCBwcmV0dHlQcmludCAqL1xuKGZ1bmN0aW9uKCQsIHByZXR0eVByaW50KSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdmFyIGpzZG9jdHlwZXBhcnNlciA9IHJlcXVpcmUoJ2pzZG9jdHlwZXBhcnNlcicpO1xuICB2YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG4gIHZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG4gIHZhciBJTklUSUFMX1RZUEVfRVhQUiA9ICc/VHlwZUV4cHJlc3Npb249JztcblxuXG5cbiAgZnVuY3Rpb24gVHlwZUV4cHJlc3Npb25Nb2RlbCgpIHtcbiAgICBldmVudHMuRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG4gIH1cbiAgdXRpbC5pbmhlcml0cyhUeXBlRXhwcmVzc2lvbk1vZGVsLCBldmVudHMuRXZlbnRFbWl0dGVyKTtcblxuXG4gIFR5cGVFeHByZXNzaW9uTW9kZWwuRXZlbnRUeXBlID0ge1xuICAgIENIQU5HRTogJ2NoYW5nZScsXG4gIH07XG5cblxuICBUeXBlRXhwcmVzc2lvbk1vZGVsLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKHR5cGVFeHByKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBhc3QgPSBqc2RvY3R5cGVwYXJzZXIucGFyc2UodHlwZUV4cHIpO1xuXG4gICAgICB0aGlzLmFzdCA9IGFzdDtcbiAgICAgIHRoaXMuaGFzU3ludGF4RXJyb3IgPSBmYWxzZTtcbiAgICAgIHRoaXMuZXJyb3JNZXNzYWdlID0gJyc7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgIGlmICghKGVyciBpbnN0YW5jZW9mIGpzZG9jdHlwZXBhcnNlci5TeW50YXhFcnJvcikpIHRocm93IGVycjtcblxuICAgICAgdGhpcy5hc3QgPSBudWxsO1xuICAgICAgdGhpcy5oYXNTeW50YXhFcnJvciA9IHRydWU7XG4gICAgICB0aGlzLmVycm9yTWVzc2FnZSA9IGVyci5tZXNzYWdlO1xuICAgIH1cblxuICAgIHRoaXMuZW1pdChUeXBlRXhwcmVzc2lvbk1vZGVsLkV2ZW50VHlwZS5DSEFOR0UpO1xuICB9O1xuXG5cblxuICBmdW5jdGlvbiBQYXJzZVJlc3VsdFZpZXcobW9kZWwsICRqc29uVmlldywgJHN0cmluZ1ZpZXcpIHtcbiAgICB0aGlzLnR5cGVFeHByTW9kZWwgPSBtb2RlbDtcblxuICAgIHRoaXMuJGpzb25WaWV3ID0gJGpzb25WaWV3O1xuICAgIHRoaXMuJHN0cmluZ1ZpZXcgPSAkc3RyaW5nVmlldztcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnR5cGVFeHByTW9kZWwub24oVHlwZUV4cHJlc3Npb25Nb2RlbC5FdmVudFR5cGUuQ0hBTkdFLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYucmVuZGVyKHNlbGYudHlwZUV4cHJNb2RlbCk7XG4gICAgfSk7XG4gIH1cblxuXG4gIFBhcnNlUmVzdWx0Vmlldy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgJGFsbFZpZXdzID0gJChbXG4gICAgICB0aGlzLiRqc29uVmlld1swXSxcbiAgICAgIHRoaXMuJHN0cmluZ1ZpZXdbMF0sXG4gICAgXSk7XG5cbiAgICBpZiAobW9kZWwuaGFzU3ludGF4RXJyb3IpIHtcbiAgICAgICRhbGxWaWV3cy50ZXh0KCdFUlJPUicpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhciBhc3QgPSBtb2RlbC5hc3Q7XG4gICAgICB0aGlzLiRqc29uVmlldy50ZXh0KEpTT04uc3RyaW5naWZ5KGFzdCwgbnVsbCwgMikpO1xuICAgICAgdGhpcy4kc3RyaW5nVmlldy50ZXh0KGpzZG9jdHlwZXBhcnNlci5wdWJsaXNoKGFzdCkpO1xuICAgIH1cblxuICAgICRhbGxWaWV3cy5yZW1vdmVDbGFzcygncHJldHR5cHJpbnRlZCcpO1xuICAgIHByZXR0eVByaW50KCk7XG4gIH07XG5cblxuXG4gIGZ1bmN0aW9uIFBhcnNlU3VjY2Vzc2Z1bEFsZXJ0KG1vZGVsLCAkYWxlcnRFbGVtZW50KSB7XG4gICAgdGhpcy50eXBlRXhwck1vZGVsID0gbW9kZWw7XG5cbiAgICB0aGlzLiRhbGVydEVsZW1lbnQgPSAkYWxlcnRFbGVtZW50O1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy50eXBlRXhwck1vZGVsLm9uKFR5cGVFeHByZXNzaW9uTW9kZWwuRXZlbnRUeXBlLkNIQU5HRSwgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnNldFZpc2liaWxpdHkoIXNlbGYudHlwZUV4cHJNb2RlbC5oYXNTeW50YXhFcnJvcik7XG4gICAgfSk7XG4gIH1cblxuXG4gIFBhcnNlU3VjY2Vzc2Z1bEFsZXJ0LnByb3RvdHlwZS5zZXRWaXNpYmlsaXR5ID0gZnVuY3Rpb24oaXNWaXNpYmxlKSB7XG4gICAgdGhpcy4kYWxlcnRFbGVtZW50LnRvZ2dsZShpc1Zpc2libGUpO1xuICB9O1xuXG5cblxuICBmdW5jdGlvbiBQYXJzZUVycm9yQWxlcnQobW9kZWwsICRhbGVydEVsZW1lbnQsICRtZXNzYWdlRWxlbWVudCwgJGNsb3NlQnV0dG9uKSB7XG4gICAgdGhpcy50eXBlRXhwck1vZGVsID0gbW9kZWw7XG5cbiAgICB0aGlzLiRhbGVydEVsZW1lbnQgPSAkYWxlcnRFbGVtZW50O1xuICAgIHRoaXMuJG1lc3NhZ2VFbGVtZW50ID0gJG1lc3NhZ2VFbGVtZW50O1xuICAgIHRoaXMuJGNsb3NlQnV0dG9uID0gJGNsb3NlQnV0dG9uO1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy50eXBlRXhwck1vZGVsLm9uKFR5cGVFeHByZXNzaW9uTW9kZWwuRXZlbnRUeXBlLkNIQU5HRSwgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnJlbmRlcihzZWxmLnR5cGVFeHByTW9kZWwpO1xuICAgIH0pO1xuXG4gICAgdGhpcy4kY2xvc2VCdXR0b24ub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnNldFZpc2liaWxpdHkodHJ1ZSk7XG4gICAgfSk7XG4gIH1cblxuXG4gIFBhcnNlRXJyb3JBbGVydC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLnNldFZpc2liaWxpdHkobW9kZWwuaGFzU3ludGF4RXJyb3IpO1xuICAgIHRoaXMuc2V0TWVzc2FnZShtb2RlbC5lcnJvck1lc3NhZ2UpO1xuICB9O1xuXG5cbiAgUGFyc2VFcnJvckFsZXJ0LnByb3RvdHlwZS5zZXRWaXNpYmlsaXR5ID0gZnVuY3Rpb24oaXNWaXNpYmxlKSB7XG4gICAgdGhpcy4kYWxlcnRFbGVtZW50LnRvZ2dsZShpc1Zpc2libGUpO1xuICB9O1xuXG5cbiAgUGFyc2VFcnJvckFsZXJ0LnByb3RvdHlwZS5zZXRNZXNzYWdlID0gZnVuY3Rpb24obXNnKSB7XG4gICAgdGhpcy4kbWVzc2FnZUVsZW1lbnQudGV4dChtc2cpO1xuICB9O1xuXG5cbiAgZnVuY3Rpb24gYm9vdHN0cmFwKCkge1xuICAgIHZhciB0eXBlRXhwck1vZGVsID0gbmV3IFR5cGVFeHByZXNzaW9uTW9kZWwoKTtcblxuICAgIGNyZWF0ZVBhcnNlU3VjY2Vzc2Z1bEFsZXJ0KHR5cGVFeHByTW9kZWwpO1xuICAgIGNyZWF0ZVBhcnNlRXJyb3JBbGVydCh0eXBlRXhwck1vZGVsKTtcbiAgICBjcmVhdGVQYXJzZVJlc3VsdFZpZXcodHlwZUV4cHJNb2RlbCk7XG5cbiAgICB2YXIgJGlucHV0ID0gJCgnI2lucHV0Jyk7XG4gICAgJGlucHV0Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0eXBlRXhwclN0ciA9ICRpbnB1dC52YWwoKTtcbiAgICAgIHR5cGVFeHByTW9kZWwucGFyc2UodHlwZUV4cHJTdHIpO1xuICAgIH0pO1xuXG4gICAgdmFyICRmb3JtID0gJCgnI2Zvcm0nKTtcbiAgICAkZm9ybS5vbignc3VibWl0JywgZnVuY3Rpb24oZSkge1xuICAgICAgLy8gUHJldmVudCBwYWdlIHJlbG9hZGluZyB3aGVuIGZvcm0gc3VibWl0dGVkLlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0pO1xuXG4gICAgdHlwZUV4cHJNb2RlbC5wYXJzZShJTklUSUFMX1RZUEVfRVhQUiwgdHJ1ZSk7XG4gIH1cblxuXG5cbiAgZnVuY3Rpb24gY3JlYXRlUGFyc2VTdWNjZXNzZnVsQWxlcnQobW9kZWwpIHtcbiAgICB2YXIgJGFsZXJ0RWxlbWVudCA9ICQoJyNzdWNjZXNzJyk7XG4gICAgcmV0dXJuIG5ldyBQYXJzZVN1Y2Nlc3NmdWxBbGVydChtb2RlbCwgJGFsZXJ0RWxlbWVudCk7XG4gIH1cblxuXG5cbiAgZnVuY3Rpb24gY3JlYXRlUGFyc2VFcnJvckFsZXJ0KG1vZGVsKSB7XG4gICAgdmFyICRhbGVydEVsZW1lbnQgPSAkKCcjZXJyJyk7XG4gICAgdmFyICRtZXNzYWdlRWxlbWVudCA9ICQoJyNlcnItbXNnJyk7XG4gICAgdmFyICRjbG9zZUJ1dHRvbiA9ICQoJyNlcnItY2xvc2UnKTtcbiAgICByZXR1cm4gbmV3IFBhcnNlRXJyb3JBbGVydChtb2RlbCwgJGFsZXJ0RWxlbWVudCwgJG1lc3NhZ2VFbGVtZW50LCAkY2xvc2VCdXR0b24pO1xuICB9XG5cblxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVBhcnNlUmVzdWx0Vmlldyhtb2RlbCkge1xuICAgIHZhciAkanNvblZpZXcgPSAkKCcjb3V0cHV0LW9iaicpO1xuICAgIHZhciAkc3RyaW5nVmlldyA9ICQoJyNvdXRwdXQtc3RyJyk7XG4gICAgcmV0dXJuIG5ldyBQYXJzZVJlc3VsdFZpZXcobW9kZWwsICRqc29uVmlldywgJHN0cmluZ1ZpZXcpO1xuICB9XG5cblxuICBib290c3RyYXAoKTtcbn0pKGpRdWVyeSwgcHJldHR5UHJpbnQpO1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBvYmplY3RDcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IG9iamVjdENyZWF0ZVBvbHlmaWxsXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IG9iamVjdEtleXNQb2x5ZmlsbFxudmFyIGJpbmQgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCB8fCBmdW5jdGlvbkJpbmRQb2x5ZmlsbFxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcywgJ19ldmVudHMnKSkge1xuICAgIHRoaXMuX2V2ZW50cyA9IG9iamVjdENyZWF0ZShudWxsKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG52YXIgaGFzRGVmaW5lUHJvcGVydHk7XG50cnkge1xuICB2YXIgbyA9IHt9O1xuICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KSBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgJ3gnLCB7IHZhbHVlOiAwIH0pO1xuICBoYXNEZWZpbmVQcm9wZXJ0eSA9IG8ueCA9PT0gMDtcbn0gY2F0Y2ggKGVycikgeyBoYXNEZWZpbmVQcm9wZXJ0eSA9IGZhbHNlIH1cbmlmIChoYXNEZWZpbmVQcm9wZXJ0eSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLCAnZGVmYXVsdE1heExpc3RlbmVycycsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAvLyBjaGVjayB3aGV0aGVyIHRoZSBpbnB1dCBpcyBhIHBvc2l0aXZlIG51bWJlciAod2hvc2UgdmFsdWUgaXMgemVybyBvclxuICAgICAgLy8gZ3JlYXRlciBhbmQgbm90IGEgTmFOKS5cbiAgICAgIGlmICh0eXBlb2YgYXJnICE9PSAnbnVtYmVyJyB8fCBhcmcgPCAwIHx8IGFyZyAhPT0gYXJnKVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImRlZmF1bHRNYXhMaXN0ZW5lcnNcIiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gICAgICBkZWZhdWx0TWF4TGlzdGVuZXJzID0gYXJnO1xuICAgIH1cbiAgfSk7XG59IGVsc2Uge1xuICBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG59XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycyhuKSB7XG4gIGlmICh0eXBlb2YgbiAhPT0gJ251bWJlcicgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJuXCIgYXJndW1lbnQgbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbmZ1bmN0aW9uICRnZXRNYXhMaXN0ZW5lcnModGhhdCkge1xuICBpZiAodGhhdC5fbWF4TGlzdGVuZXJzID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICByZXR1cm4gdGhhdC5fbWF4TGlzdGVuZXJzO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmdldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuICRnZXRNYXhMaXN0ZW5lcnModGhpcyk7XG59O1xuXG4vLyBUaGVzZSBzdGFuZGFsb25lIGVtaXQqIGZ1bmN0aW9ucyBhcmUgdXNlZCB0byBvcHRpbWl6ZSBjYWxsaW5nIG9mIGV2ZW50XG4vLyBoYW5kbGVycyBmb3IgZmFzdCBjYXNlcyBiZWNhdXNlIGVtaXQoKSBpdHNlbGYgb2Z0ZW4gaGFzIGEgdmFyaWFibGUgbnVtYmVyIG9mXG4vLyBhcmd1bWVudHMgYW5kIGNhbiBiZSBkZW9wdGltaXplZCBiZWNhdXNlIG9mIHRoYXQuIFRoZXNlIGZ1bmN0aW9ucyBhbHdheXMgaGF2ZVxuLy8gdGhlIHNhbWUgbnVtYmVyIG9mIGFyZ3VtZW50cyBhbmQgdGh1cyBkbyBub3QgZ2V0IGRlb3B0aW1pemVkLCBzbyB0aGUgY29kZVxuLy8gaW5zaWRlIHRoZW0gY2FuIGV4ZWN1dGUgZmFzdGVyLlxuZnVuY3Rpb24gZW1pdE5vbmUoaGFuZGxlciwgaXNGbiwgc2VsZikge1xuICBpZiAoaXNGbilcbiAgICBoYW5kbGVyLmNhbGwoc2VsZik7XG4gIGVsc2Uge1xuICAgIHZhciBsZW4gPSBoYW5kbGVyLmxlbmd0aDtcbiAgICB2YXIgbGlzdGVuZXJzID0gYXJyYXlDbG9uZShoYW5kbGVyLCBsZW4pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpXG4gICAgICBsaXN0ZW5lcnNbaV0uY2FsbChzZWxmKTtcbiAgfVxufVxuZnVuY3Rpb24gZW1pdE9uZShoYW5kbGVyLCBpc0ZuLCBzZWxmLCBhcmcxKSB7XG4gIGlmIChpc0ZuKVxuICAgIGhhbmRsZXIuY2FsbChzZWxmLCBhcmcxKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHNlbGYsIGFyZzEpO1xuICB9XG59XG5mdW5jdGlvbiBlbWl0VHdvKGhhbmRsZXIsIGlzRm4sIHNlbGYsIGFyZzEsIGFyZzIpIHtcbiAgaWYgKGlzRm4pXG4gICAgaGFuZGxlci5jYWxsKHNlbGYsIGFyZzEsIGFyZzIpO1xuICBlbHNlIHtcbiAgICB2YXIgbGVuID0gaGFuZGxlci5sZW5ndGg7XG4gICAgdmFyIGxpc3RlbmVycyA9IGFycmF5Q2xvbmUoaGFuZGxlciwgbGVuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKVxuICAgICAgbGlzdGVuZXJzW2ldLmNhbGwoc2VsZiwgYXJnMSwgYXJnMik7XG4gIH1cbn1cbmZ1bmN0aW9uIGVtaXRUaHJlZShoYW5kbGVyLCBpc0ZuLCBzZWxmLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gIGlmIChpc0ZuKVxuICAgIGhhbmRsZXIuY2FsbChzZWxmLCBhcmcxLCBhcmcyLCBhcmczKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHNlbGYsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGVtaXRNYW55KGhhbmRsZXIsIGlzRm4sIHNlbGYsIGFyZ3MpIHtcbiAgaWYgKGlzRm4pXG4gICAgaGFuZGxlci5hcHBseShzZWxmLCBhcmdzKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGV2ZW50cztcbiAgdmFyIGRvRXJyb3IgPSAodHlwZSA9PT0gJ2Vycm9yJyk7XG5cbiAgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuICBpZiAoZXZlbnRzKVxuICAgIGRvRXJyb3IgPSAoZG9FcnJvciAmJiBldmVudHMuZXJyb3IgPT0gbnVsbCk7XG4gIGVsc2UgaWYgKCFkb0Vycm9yKVxuICAgIHJldHVybiBmYWxzZTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmIChkb0Vycm9yKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKVxuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmhhbmRsZWQgXCJlcnJvclwiIGV2ZW50LiAoJyArIGVyICsgJyknKTtcbiAgICAgIGVyci5jb250ZXh0ID0gZXI7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGhhbmRsZXIgPSBldmVudHNbdHlwZV07XG5cbiAgaWYgKCFoYW5kbGVyKVxuICAgIHJldHVybiBmYWxzZTtcblxuICB2YXIgaXNGbiA9IHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nO1xuICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICBzd2l0Y2ggKGxlbikge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgIGNhc2UgMTpcbiAgICAgIGVtaXROb25lKGhhbmRsZXIsIGlzRm4sIHRoaXMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgICAgZW1pdE9uZShoYW5kbGVyLCBpc0ZuLCB0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzOlxuICAgICAgZW1pdFR3byhoYW5kbGVyLCBpc0ZuLCB0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICBlbWl0VGhyZWUoaGFuZGxlciwgaXNGbiwgdGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0sIGFyZ3VtZW50c1szXSk7XG4gICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgIGRlZmF1bHQ6XG4gICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGVtaXRNYW55KGhhbmRsZXIsIGlzRm4sIHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5mdW5jdGlvbiBfYWRkTGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgcHJlcGVuZCkge1xuICB2YXIgbTtcbiAgdmFyIGV2ZW50cztcbiAgdmFyIGV4aXN0aW5nO1xuXG4gIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuICBpZiAoIWV2ZW50cykge1xuICAgIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgIHRhcmdldC5fZXZlbnRzQ291bnQgPSAwO1xuICB9IGVsc2Uge1xuICAgIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gICAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICAgIGlmIChldmVudHMubmV3TGlzdGVuZXIpIHtcbiAgICAgIHRhcmdldC5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgPyBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICAgICAgLy8gUmUtYXNzaWduIGBldmVudHNgIGJlY2F1c2UgYSBuZXdMaXN0ZW5lciBoYW5kbGVyIGNvdWxkIGhhdmUgY2F1c2VkIHRoZVxuICAgICAgLy8gdGhpcy5fZXZlbnRzIHRvIGJlIGFzc2lnbmVkIHRvIGEgbmV3IG9iamVjdFxuICAgICAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHM7XG4gICAgfVxuICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdO1xuICB9XG5cbiAgaWYgKCFleGlzdGluZykge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gICAgKyt0YXJnZXQuX2V2ZW50c0NvdW50O1xuICB9IGVsc2Uge1xuICAgIGlmICh0eXBlb2YgZXhpc3RpbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV0gPVxuICAgICAgICAgIHByZXBlbmQgPyBbbGlzdGVuZXIsIGV4aXN0aW5nXSA6IFtleGlzdGluZywgbGlzdGVuZXJdO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgICBpZiAocHJlcGVuZCkge1xuICAgICAgICBleGlzdGluZy51bnNoaWZ0KGxpc3RlbmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV4aXN0aW5nLnB1c2gobGlzdGVuZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgaWYgKCFleGlzdGluZy53YXJuZWQpIHtcbiAgICAgIG0gPSAkZ2V0TWF4TGlzdGVuZXJzKHRhcmdldCk7XG4gICAgICBpZiAobSAmJiBtID4gMCAmJiBleGlzdGluZy5sZW5ndGggPiBtKSB7XG4gICAgICAgIGV4aXN0aW5nLndhcm5lZCA9IHRydWU7XG4gICAgICAgIHZhciB3ID0gbmV3IEVycm9yKCdQb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5IGxlYWsgZGV0ZWN0ZWQuICcgK1xuICAgICAgICAgICAgZXhpc3RpbmcubGVuZ3RoICsgJyBcIicgKyBTdHJpbmcodHlwZSkgKyAnXCIgbGlzdGVuZXJzICcgK1xuICAgICAgICAgICAgJ2FkZGVkLiBVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byAnICtcbiAgICAgICAgICAgICdpbmNyZWFzZSBsaW1pdC4nKTtcbiAgICAgICAgdy5uYW1lID0gJ01heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZyc7XG4gICAgICAgIHcuZW1pdHRlciA9IHRhcmdldDtcbiAgICAgICAgdy50eXBlID0gdHlwZTtcbiAgICAgICAgdy5jb3VudCA9IGV4aXN0aW5nLmxlbmd0aDtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlID09PSAnb2JqZWN0JyAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJyVzOiAlcycsIHcubmFtZSwgdy5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICByZXR1cm4gX2FkZExpc3RlbmVyKHRoaXMsIHR5cGUsIGxpc3RlbmVyLCBmYWxzZSk7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHByZXBlbmRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgcmV0dXJuIF9hZGRMaXN0ZW5lcih0aGlzLCB0eXBlLCBsaXN0ZW5lciwgdHJ1ZSk7XG4gICAgfTtcblxuZnVuY3Rpb24gb25jZVdyYXBwZXIoKSB7XG4gIGlmICghdGhpcy5maXJlZCkge1xuICAgIHRoaXMudGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHRoaXMudHlwZSwgdGhpcy53cmFwRm4pO1xuICAgIHRoaXMuZmlyZWQgPSB0cnVlO1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgY2FzZSAwOlxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0KTtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXIuY2FsbCh0aGlzLnRhcmdldCwgYXJndW1lbnRzWzBdKTtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXIuY2FsbCh0aGlzLnRhcmdldCwgYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pO1xuICAgICAgY2FzZSAzOlxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0LCBhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSxcbiAgICAgICAgICAgIGFyZ3VtZW50c1syXSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKVxuICAgICAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIHRoaXMubGlzdGVuZXIuYXBwbHkodGhpcy50YXJnZXQsIGFyZ3MpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBfb25jZVdyYXAodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgc3RhdGUgPSB7IGZpcmVkOiBmYWxzZSwgd3JhcEZuOiB1bmRlZmluZWQsIHRhcmdldDogdGFyZ2V0LCB0eXBlOiB0eXBlLCBsaXN0ZW5lcjogbGlzdGVuZXIgfTtcbiAgdmFyIHdyYXBwZWQgPSBiaW5kLmNhbGwob25jZVdyYXBwZXIsIHN0YXRlKTtcbiAgd3JhcHBlZC5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICBzdGF0ZS53cmFwRm4gPSB3cmFwcGVkO1xuICByZXR1cm4gd3JhcHBlZDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZSh0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdGVuZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgdGhpcy5vbih0eXBlLCBfb25jZVdyYXAodGhpcywgdHlwZSwgbGlzdGVuZXIpKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRPbmNlTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHByZXBlbmRPbmNlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdGVuZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgIHRoaXMucHJlcGVuZExpc3RlbmVyKHR5cGUsIF9vbmNlV3JhcCh0aGlzLCB0eXBlLCBsaXN0ZW5lcikpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuLy8gRW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmIGFuZCBvbmx5IGlmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICB2YXIgbGlzdCwgZXZlbnRzLCBwb3NpdGlvbiwgaSwgb3JpZ2luYWxMaXN0ZW5lcjtcblxuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoIWV2ZW50cylcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIGxpc3QgPSBldmVudHNbdHlwZV07XG4gICAgICBpZiAoIWxpc3QpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHwgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApXG4gICAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdC5saXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcG9zaXRpb24gPSAtMTtcblxuICAgICAgICBmb3IgKGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8IGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBvcmlnaW5hbExpc3RlbmVyID0gbGlzdFtpXS5saXN0ZW5lcjtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSAwKVxuICAgICAgICAgIGxpc3Quc2hpZnQoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNwbGljZU9uZShsaXN0LCBwb3NpdGlvbik7XG5cbiAgICAgICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKVxuICAgICAgICAgIGV2ZW50c1t0eXBlXSA9IGxpc3RbMF07XG5cbiAgICAgICAgaWYgKGV2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgb3JpZ2luYWxMaXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID1cbiAgICBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnModHlwZSkge1xuICAgICAgdmFyIGxpc3RlbmVycywgZXZlbnRzLCBpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoIWV2ZW50cylcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgICAgIGlmICghZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudHNbdHlwZV0pIHtcbiAgICAgICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMClcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IG9iamVjdENyZWF0ZShudWxsKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHZhciBrZXlzID0gb2JqZWN0S2V5cyhldmVudHMpO1xuICAgICAgICB2YXIga2V5O1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICBsaXN0ZW5lcnMgPSBldmVudHNbdHlwZV07XG5cbiAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgICAgIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgICAgIC8vIExJRk8gb3JkZXJcbiAgICAgICAgZm9yIChpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbmZ1bmN0aW9uIF9saXN0ZW5lcnModGFyZ2V0LCB0eXBlLCB1bndyYXApIHtcbiAgdmFyIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuXG4gIGlmICghZXZlbnRzKVxuICAgIHJldHVybiBbXTtcblxuICB2YXIgZXZsaXN0ZW5lciA9IGV2ZW50c1t0eXBlXTtcbiAgaWYgKCFldmxpc3RlbmVyKVxuICAgIHJldHVybiBbXTtcblxuICBpZiAodHlwZW9mIGV2bGlzdGVuZXIgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIHVud3JhcCA/IFtldmxpc3RlbmVyLmxpc3RlbmVyIHx8IGV2bGlzdGVuZXJdIDogW2V2bGlzdGVuZXJdO1xuXG4gIHJldHVybiB1bndyYXAgPyB1bndyYXBMaXN0ZW5lcnMoZXZsaXN0ZW5lcikgOiBhcnJheUNsb25lKGV2bGlzdGVuZXIsIGV2bGlzdGVuZXIubGVuZ3RoKTtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnModHlwZSkge1xuICByZXR1cm4gX2xpc3RlbmVycyh0aGlzLCB0eXBlLCB0cnVlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmF3TGlzdGVuZXJzID0gZnVuY3Rpb24gcmF3TGlzdGVuZXJzKHR5cGUpIHtcbiAgcmV0dXJuIF9saXN0ZW5lcnModGhpcywgdHlwZSwgZmFsc2UpO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIGlmICh0eXBlb2YgZW1pdHRlci5saXN0ZW5lckNvdW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbGlzdGVuZXJDb3VudC5jYWxsKGVtaXR0ZXIsIHR5cGUpO1xuICB9XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBsaXN0ZW5lckNvdW50O1xuZnVuY3Rpb24gbGlzdGVuZXJDb3VudCh0eXBlKSB7XG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHM7XG5cbiAgaWYgKGV2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKHR5cGVvZiBldmxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9IGVsc2UgaWYgKGV2bGlzdGVuZXIpIHtcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gMDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgcmV0dXJuIHRoaXMuX2V2ZW50c0NvdW50ID4gMCA/IFJlZmxlY3Qub3duS2V5cyh0aGlzLl9ldmVudHMpIDogW107XG59O1xuXG4vLyBBYm91dCAxLjV4IGZhc3RlciB0aGFuIHRoZSB0d28tYXJnIHZlcnNpb24gb2YgQXJyYXkjc3BsaWNlKCkuXG5mdW5jdGlvbiBzcGxpY2VPbmUobGlzdCwgaW5kZXgpIHtcbiAgZm9yICh2YXIgaSA9IGluZGV4LCBrID0gaSArIDEsIG4gPSBsaXN0Lmxlbmd0aDsgayA8IG47IGkgKz0gMSwgayArPSAxKVxuICAgIGxpc3RbaV0gPSBsaXN0W2tdO1xuICBsaXN0LnBvcCgpO1xufVxuXG5mdW5jdGlvbiBhcnJheUNsb25lKGFyciwgbikge1xuICB2YXIgY29weSA9IG5ldyBBcnJheShuKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpXG4gICAgY29weVtpXSA9IGFycltpXTtcbiAgcmV0dXJuIGNvcHk7XG59XG5cbmZ1bmN0aW9uIHVud3JhcExpc3RlbmVycyhhcnIpIHtcbiAgdmFyIHJldCA9IG5ldyBBcnJheShhcnIubGVuZ3RoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXQubGVuZ3RoOyArK2kpIHtcbiAgICByZXRbaV0gPSBhcnJbaV0ubGlzdGVuZXIgfHwgYXJyW2ldO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIG9iamVjdENyZWF0ZVBvbHlmaWxsKHByb3RvKSB7XG4gIHZhciBGID0gZnVuY3Rpb24oKSB7fTtcbiAgRi5wcm90b3R5cGUgPSBwcm90bztcbiAgcmV0dXJuIG5ldyBGO1xufVxuZnVuY3Rpb24gb2JqZWN0S2V5c1BvbHlmaWxsKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrIGluIG9iaikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGspKSB7XG4gICAga2V5cy5wdXNoKGspO1xuICB9XG4gIHJldHVybiBrO1xufVxuZnVuY3Rpb24gZnVuY3Rpb25CaW5kUG9seWZpbGwoY29udGV4dCkge1xuICB2YXIgZm4gPSB0aGlzO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICB9O1xufVxuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IHtwYXJzZSwgU3ludGF4RXJyb3J9ID0gcmVxdWlyZSgnLi9saWIvcGFyc2luZy5qcycpO1xuY29uc3Qge3B1Ymxpc2gsIGNyZWF0ZURlZmF1bHRQdWJsaXNoZXJ9ID0gcmVxdWlyZSgnLi9saWIvcHVibGlzaGluZy5qcycpO1xuY29uc3Qge3RyYXZlcnNlfSA9IHJlcXVpcmUoJy4vbGliL3RyYXZlcnNpbmcuanMnKTtcbmNvbnN0IE5vZGVUeXBlID0gcmVxdWlyZSgnLi9saWIvTm9kZVR5cGUuanMnKTtcbmNvbnN0IFN5bnRheFR5cGUgPSByZXF1aXJlKCcuL2xpYi9TeW50YXhUeXBlLmpzJyk7XG5cblxuLyoqXG4gKiBOYW1lc3BhY2UgZm9yIGpzZG9jdHlwZXBhcnNlci5cbiAqIEBuYW1lc3BhY2VcbiAqIEBleHBvcnRzIGpzZG9jdHlwZXBhcnNlclxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcGFyc2UsXG4gIFN5bnRheEVycm9yLFxuICBwdWJsaXNoLFxuICBjcmVhdGVEZWZhdWx0UHVibGlzaGVyLFxuICB0cmF2ZXJzZSxcbiAgTm9kZVR5cGUsXG4gIFN5bnRheFR5cGUsXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBOb2RlVHlwZSA9IHtcbiAgTkFNRTogJ05BTUUnLFxuICBNRU1CRVI6ICdNRU1CRVInLFxuICBVTklPTjogJ1VOSU9OJyxcbiAgVkFSSUFESUM6ICdWQVJJQURJQycsXG4gIFJFQ09SRDogJ1JFQ09SRCcsXG4gIFJFQ09SRF9FTlRSWTogJ1JFQ09SRF9FTlRSWScsXG4gIFRVUExFOiAnVFVQTEUnLFxuICBHRU5FUklDOiAnR0VORVJJQycsXG4gIE1PRFVMRTogJ01PRFVMRScsXG4gIE9QVElPTkFMOiAnT1BUSU9OQUwnLFxuICBOVUxMQUJMRTogJ05VTExBQkxFJyxcbiAgTk9UX05VTExBQkxFOiAnTk9UX05VTExBQkxFJyxcbiAgRlVOQ1RJT046ICdGVU5DVElPTicsXG4gIEFSUk9XOiAnQVJST1cnLFxuICBOQU1FRF9QQVJBTUVURVI6ICdOQU1FRF9QQVJBTUVURVInLFxuICBBTlk6ICdBTlknLFxuICBVTktOT1dOOiAnVU5LTk9XTicsXG4gIElOTkVSX01FTUJFUjogJ0lOTkVSX01FTUJFUicsXG4gIElOU1RBTkNFX01FTUJFUjogJ0lOU1RBTkNFX01FTUJFUicsXG4gIFNUUklOR19WQUxVRTogJ1NUUklOR19WQUxVRScsXG4gIE5VTUJFUl9WQUxVRTogJ05VTUJFUl9WQUxVRScsXG4gIEVYVEVSTkFMOiAnRVhURVJOQUwnLFxuICBGSUxFX1BBVEg6ICdGSUxFX1BBVEgnLFxuICBQQVJFTlRIRVNJUzogJ1BBUkVOVEhFU0lTJyxcbiAgVFlQRV9RVUVSWTogJ1RZUEVfUVVFUlknLFxuICBJTVBPUlQ6ICdJTVBPUlQnLFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBOb2RlVHlwZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBTeW50YXggdHlwZXMgZm9yIGdlbmVyaWMgdHlwZXMuXG4gKiBAZW51bSB7c3RyaW5nfVxuICovXG5jb25zdCBHZW5lcmljVHlwZVN5bnRheCA9IHtcbiAgLyoqXG4gICAqIEZyb20gVHlwZVNjcmlwdCBhbmQgQ2xvc3VyZSBMaWJyYXJ5LlxuICAgKiBFeGFtcGxlOiB7QGNvZGUgQXJyYXk8c3RyaW5nPn1cbiAgICovXG4gIEFOR0xFX0JSQUNLRVQ6ICdBTkdMRV9CUkFDS0VUJyxcblxuICAvKipcbiAgICogRnJvbSBKU0RvYyBhbmQgTGVnYWN5IENsb3N1cmUgTGlicmFyeS5cbiAgICogRXhhbXBsZToge0Bjb2RlIEFycmF5LjxzdHJpbmc+fVxuICAgKi9cbiAgQU5HTEVfQlJBQ0tFVF9XSVRIX0RPVDogJ0FOR0xFX0JSQUNLRVRfV0lUSF9ET1QnLFxuXG4gIC8qKlxuICAgKiBGcm9tIEpTRG9jIGFuZCBKU0R1Y2suXG4gICAqIEV4YW1wbGU6IHtAY29kZSBTdHJpbmdbXX1cbiAgICovXG4gIFNRVUFSRV9CUkFDS0VUOiAnU1FVQVJFX0JSQUNLRVQnLFxufTtcblxuLyoqXG4gKiBTeW50YXggdHlwZXMgZm9yIHVuaW9uIHR5cGVzLlxuICogQGVudW0ge3N0cmluZ31cbiAqL1xuY29uc3QgVW5pb25UeXBlU3ludGF4ID0ge1xuICAvKipcbiAgICogRnJvbSBDbG9zdXJlIExpYnJhcnkuXG4gICAqIEV4YW1wbGU6IHtAY29kZSBMZWZ0fFJpZ2h0fVxuICAgKi9cbiAgUElQRTogJ1BJUEUnLFxuXG4gIC8qKlxuICAgKiBGcm9tIEpTRHVjay5cbiAgICogRXhhbXBsZToge0Bjb2RlIExlZnQvUmlnaHR9XG4gICAqL1xuICBTTEFTSDogJ1NMQVNIJyxcbn07XG5cblxuY29uc3QgVmFyaWFkaWNUeXBlU3ludGF4ID0ge1xuICAvKipcbiAgICogRnJvbSBDbG9zdXJlIExpYnJhcnkuXG4gICAqIEV4YW1wbGU6IHtAY29kZSAuLi5UeXBlfVxuICAgKi9cbiAgUFJFRklYX0RPVFM6ICdQUkVGSVhfRE9UUycsXG5cbiAgLyoqXG4gICAqIEZyb20gSlNEdWNrLlxuICAgKiBFeGFtcGxlOiB7QGNvZGUgVHlwZS4uLn1cbiAgICovXG4gIFNVRkZJWF9ET1RTOiAnU1VGRklYX0RPVFMnLFxuXG4gIC8qKlxuICAgKiBGcm9tIENsb3N1cmUgTGlicmFyeS5cbiAgICogRXhhbXBsZToge0Bjb2RlIC4uLn1cbiAgICovXG4gIE9OTFlfRE9UUzogJ09OTFlfRE9UUycsXG59O1xuXG5jb25zdCBPcHRpb25hbFR5cGVTeW50YXggPSB7XG4gIFBSRUZJWF9FUVVBTFNfU0lHTjogJ1BSRUZJWF9FUVVBTFNfU0lHTicsXG4gIFNVRkZJWF9FUVVBTFNfU0lHTjogJ1NVRkZJWF9FUVVBTFNfU0lHTicsXG59O1xuXG5jb25zdCBOdWxsYWJsZVR5cGVTeW50YXggPSB7XG4gIFBSRUZJWF9RVUVTVElPTl9NQVJLOiAnUFJFRklYX1FVRVNUSU9OX01BUksnLFxuICBTVUZGSVhfUVVFU1RJT05fTUFSSzogJ1NVRkZJWF9RVUVTVElPTl9NQVJLJyxcbn07XG5cbmNvbnN0IE5vdE51bGxhYmxlVHlwZVN5bnRheCA9IHtcbiAgUFJFRklYX0JBTkc6ICdQUkVGSVhfQkFORycsXG4gIFNVRkZJWF9CQU5HOiAnU1VGRklYX0JBTkcnLFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEdlbmVyaWNUeXBlU3ludGF4LFxuICBVbmlvblR5cGVTeW50YXgsXG4gIFZhcmlhZGljVHlwZVN5bnRheCxcbiAgT3B0aW9uYWxUeXBlU3ludGF4LFxuICBOdWxsYWJsZVR5cGVTeW50YXgsXG4gIE5vdE51bGxhYmxlVHlwZVN5bnRheCxcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IHtTeW50YXhFcnJvciwgcGFyc2V9ID0gcmVxdWlyZSgnLi4vcGVnX2xpYi9qc2RvY3R5cGUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgLyoqICogQSBjbGFzcyBmb3IgSlNEb2MgdHlwZSBleHByZXNzaW9uIHN5bnRheCBlcnJvcnMuXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAZXh0ZW5kcyB7RXJyb3J9XG4gICAqL1xuICBTeW50YXhFcnJvcixcblxuXG4gIC8qKlxuICAgKiBQYXJzZSB0aGUgc3BlY2lmaWVkIHR5cGUgZXhwcmVzc2lvbiBzdHJpbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlRXhwclN0ciBUeXBlIGV4cHJlc3Npb24gc3RyaW5nLlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEFTVC5cbiAgICovXG4gIHBhcnNlLFxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3Qge2Zvcm1hdH0gPSByZXF1aXJlKCd1dGlsJyk7XG5cbmZ1bmN0aW9uIHB1Ymxpc2gobm9kZSwgb3B0X3B1Ymxpc2hlcikge1xuICBjb25zdCBwdWJsaXNoZXIgPSBvcHRfcHVibGlzaGVyIHx8IGNyZWF0ZURlZmF1bHRQdWJsaXNoZXIoKTtcbiAgcmV0dXJuIHB1Ymxpc2hlcltub2RlLnR5cGVdKG5vZGUsIGZ1bmN0aW9uKGNoaWxkTm9kZSkge1xuICAgIHJldHVybiBwdWJsaXNoKGNoaWxkTm9kZSwgcHVibGlzaGVyKTtcbiAgfSk7XG59XG5cblxuZnVuY3Rpb24gY3JlYXRlRGVmYXVsdFB1Ymxpc2hlcigpIHtcbiAgcmV0dXJuIHtcbiAgICBOQU1FIChuYW1lTm9kZSkge1xuICAgICAgcmV0dXJuIG5hbWVOb2RlLm5hbWU7XG4gICAgfSxcbiAgICBNRU1CRVIgKG1lbWJlck5vZGUsIGNvbmNyZXRlUHVibGlzaCkge1xuICAgICAgcmV0dXJuIGZvcm1hdCgnJXMuJXMlcycsIGNvbmNyZXRlUHVibGlzaChtZW1iZXJOb2RlLm93bmVyKSxcbiAgICAgICAgICAgICAgICAgICAgbWVtYmVyTm9kZS5oYXNFdmVudFByZWZpeCA/ICdldmVudDonIDogJycsXG4gICAgICAgICAgICAgICAgICAgIG1lbWJlck5vZGUubmFtZSk7XG4gICAgfSxcbiAgICBVTklPTiAodW5pb25Ob2RlLCBjb25jcmV0ZVB1Ymxpc2gpIHtcbiAgICAgIHJldHVybiBmb3JtYXQoJyVzfCVzJywgY29uY3JldGVQdWJsaXNoKHVuaW9uTm9kZS5sZWZ0KSxcbiAgICAgICAgICAgICAgICAgICAgY29uY3JldGVQdWJsaXNoKHVuaW9uTm9kZS5yaWdodCkpO1xuICAgIH0sXG4gICAgVkFSSUFESUMgKHZhcmlhZGljTm9kZSwgY29uY3JldGVQdWJsaXNoKSB7XG4gICAgICByZXR1cm4gZm9ybWF0KCcuLi4lcycsIGNvbmNyZXRlUHVibGlzaCh2YXJpYWRpY05vZGUudmFsdWUpKTtcbiAgICB9LFxuICAgIFJFQ09SRCAocmVjb3JkTm9kZSwgY29uY3JldGVQdWJsaXNoKSB7XG4gICAgICBjb25zdCBjb25jcmV0ZVB1Ymxpc2hlZEVudHJpZXMgPSByZWNvcmROb2RlLmVudHJpZXMubWFwKGNvbmNyZXRlUHVibGlzaCk7XG4gICAgICByZXR1cm4gZm9ybWF0KCd7JXN9JywgY29uY3JldGVQdWJsaXNoZWRFbnRyaWVzLmpvaW4oJywgJykpO1xuICAgIH0sXG4gICAgUkVDT1JEX0VOVFJZIChlbnRyeU5vZGUsIGNvbmNyZXRlUHVibGlzaCkge1xuICAgICAgaWYgKCFlbnRyeU5vZGUudmFsdWUpIHJldHVybiBlbnRyeU5vZGUua2V5O1xuICAgICAgcmV0dXJuIGZvcm1hdCgnJXM6ICVzJywgZW50cnlOb2RlLmtleSwgY29uY3JldGVQdWJsaXNoKGVudHJ5Tm9kZS52YWx1ZSkpO1xuICAgIH0sXG4gICAgVFVQTEUgKHR1cGxlTm9kZSwgY29uY3JldGVQdWJsaXNoKSB7XG4gICAgICBjb25zdCBjb25jcmV0ZVB1Ymxpc2hlZEVudHJpZXMgPSB0dXBsZU5vZGUuZW50cmllcy5tYXAoY29uY3JldGVQdWJsaXNoKTtcbiAgICAgIHJldHVybiBmb3JtYXQoJ1slc10nLCBjb25jcmV0ZVB1Ymxpc2hlZEVudHJpZXMuam9pbignLCAnKSk7XG4gICAgfSxcbiAgICBHRU5FUklDIChnZW5lcmljTm9kZSwgY29uY3JldGVQdWJsaXNoKSB7XG4gICAgICBjb25zdCBjb25jcmV0ZVB1Ymxpc2hlZE9iamVjdHMgPSBnZW5lcmljTm9kZS5vYmplY3RzLm1hcChjb25jcmV0ZVB1Ymxpc2gpO1xuICAgICAgaWYgKGdlbmVyaWNOb2RlLm1ldGEpIHtcbiAgICAgICAgc3dpdGNoIChnZW5lcmljTm9kZS5tZXRhLnN5bnRheCkge1xuICAgICAgICBjYXNlICdTUVVBUkVfQlJBQ0tFVCc6XG4gICAgICAgICAgaWYgKGdlbmVyaWNOb2RlLnN1YmplY3QgJiYgZ2VuZXJpY05vZGUuc3ViamVjdC5uYW1lID09PSAnQXJyYXknKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0KCclc1tdJywgY29uY3JldGVQdWJsaXNoZWRPYmplY3RzLmpvaW4oJywgJykpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnQU5HTEVfQlJBQ0tFVF9XSVRIX0RPVCc6XG4gICAgICAgICAgcmV0dXJuIGZvcm1hdCgnJXMuPCVzPicsIGNvbmNyZXRlUHVibGlzaChnZW5lcmljTm9kZS5zdWJqZWN0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmNyZXRlUHVibGlzaGVkT2JqZWN0cy5qb2luKCcsICcpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZvcm1hdCgnJXM8JXM+JywgY29uY3JldGVQdWJsaXNoKGdlbmVyaWNOb2RlLnN1YmplY3QpLFxuICAgICAgICAgICAgICAgICAgICBjb25jcmV0ZVB1Ymxpc2hlZE9iamVjdHMuam9pbignLCAnKSk7XG4gICAgfSxcbiAgICBNT0RVTEUgKG1vZHVsZU5vZGUsIGNvbmNyZXRlUHVibGlzaCkge1xuICAgICAgcmV0dXJuIGZvcm1hdCgnbW9kdWxlOiVzJywgY29uY3JldGVQdWJsaXNoKG1vZHVsZU5vZGUudmFsdWUpKTtcbiAgICB9LFxuICAgIEZJTEVfUEFUSCAoZmlsZVBhdGhOb2RlKSB7XG4gICAgICByZXR1cm4gZmlsZVBhdGhOb2RlLnBhdGg7XG4gICAgfSxcbiAgICBPUFRJT05BTCAob3B0aW9uYWxOb2RlLCBjb25jcmV0ZVB1Ymxpc2gpIHtcbiAgICAgIHJldHVybiBmb3JtYXQoJyVzPScsIGNvbmNyZXRlUHVibGlzaChvcHRpb25hbE5vZGUudmFsdWUpKTtcbiAgICB9LFxuICAgIE5VTExBQkxFIChudWxsYWJsZU5vZGUsIGNvbmNyZXRlUHVibGlzaCkge1xuICAgICAgcmV0dXJuIGZvcm1hdCgnPyVzJywgY29uY3JldGVQdWJsaXNoKG51bGxhYmxlTm9kZS52YWx1ZSkpO1xuICAgIH0sXG4gICAgTk9UX05VTExBQkxFIChub3ROdWxsYWJsZU5vZGUsIGNvbmNyZXRlUHVibGlzaCkge1xuICAgICAgcmV0dXJuIGZvcm1hdCgnISVzJywgY29uY3JldGVQdWJsaXNoKG5vdE51bGxhYmxlTm9kZS52YWx1ZSkpO1xuICAgIH0sXG4gICAgRlVOQ1RJT04gKGZ1bmN0aW9uTm9kZSwgY29uY3JldGVQdWJsaXNoKSB7XG4gICAgICBjb25zdCBwdWJsaWRzaGVkUGFyYW1zID0gZnVuY3Rpb25Ob2RlLnBhcmFtcy5tYXAoY29uY3JldGVQdWJsaXNoKTtcblxuICAgICAgaWYgKGZ1bmN0aW9uTm9kZS5uZXcpIHtcbiAgICAgICAgcHVibGlkc2hlZFBhcmFtcy51bnNoaWZ0KGZvcm1hdCgnbmV3OiAlcycsXG4gICAgICAgICAgY29uY3JldGVQdWJsaXNoKGZ1bmN0aW9uTm9kZS5uZXcpKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChmdW5jdGlvbk5vZGUudGhpcykge1xuICAgICAgICBwdWJsaWRzaGVkUGFyYW1zLnVuc2hpZnQoZm9ybWF0KCd0aGlzOiAlcycsXG4gICAgICAgICAgY29uY3JldGVQdWJsaXNoKGZ1bmN0aW9uTm9kZS50aGlzKSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZnVuY3Rpb25Ob2RlLnJldHVybnMpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdCgnZnVuY3Rpb24oJXMpOiAlcycsIHB1YmxpZHNoZWRQYXJhbXMuam9pbignLCAnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmNyZXRlUHVibGlzaChmdW5jdGlvbk5vZGUucmV0dXJucykpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZm9ybWF0KCdmdW5jdGlvbiglcyknLCBwdWJsaWRzaGVkUGFyYW1zLmpvaW4oJywgJykpO1xuICAgIH0sXG4gICAgQVJST1cgKGZ1bmN0aW9uTm9kZSwgY29uY3JldGVQdWJsaXNoKSB7XG4gICAgICBjb25zdCBwdWJsaXNoZWRQYXJhbXMgPSBmdW5jdGlvbk5vZGUucGFyYW1zLm1hcChjb25jcmV0ZVB1Ymxpc2gpO1xuICAgICAgcmV0dXJuIChmdW5jdGlvbk5vZGUubmV3ID8gJ25ldyAnIDogJycpICsgZm9ybWF0KCcoJXMpID0+ICVzJywgcHVibGlzaGVkUGFyYW1zLmpvaW4oJywgJyksIGNvbmNyZXRlUHVibGlzaChmdW5jdGlvbk5vZGUucmV0dXJucykpO1xuICAgIH0sXG4gICAgTkFNRURfUEFSQU1FVEVSIChwYXJhbWV0ZXJOb2RlLCBjb25jcmV0ZVB1Ymxpc2gpIHtcbiAgICAgIHJldHVybiBwYXJhbWV0ZXJOb2RlLm5hbWUgKyAocGFyYW1ldGVyTm9kZS50eXBlTmFtZSA/ICc6ICcgKyBjb25jcmV0ZVB1Ymxpc2gocGFyYW1ldGVyTm9kZS50eXBlTmFtZSkgOiAnJyk7XG4gICAgfSxcbiAgICBBTlkgKCkge1xuICAgICAgcmV0dXJuICcqJztcbiAgICB9LFxuICAgIFVOS05PV04gKCkge1xuICAgICAgcmV0dXJuICc/JztcbiAgICB9LFxuICAgIElOTkVSX01FTUJFUiAobWVtYmVyTm9kZSwgY29uY3JldGVQdWJsaXNoKSB7XG4gICAgICByZXR1cm4gY29uY3JldGVQdWJsaXNoKG1lbWJlck5vZGUub3duZXIpICsgJ34nICtcbiAgICAgICAgKG1lbWJlck5vZGUuaGFzRXZlbnRQcmVmaXggPyAnZXZlbnQ6JyA6ICcnKSArIG1lbWJlck5vZGUubmFtZTtcbiAgICB9LFxuICAgIElOU1RBTkNFX01FTUJFUiAobWVtYmVyTm9kZSwgY29uY3JldGVQdWJsaXNoKSB7XG4gICAgICByZXR1cm4gY29uY3JldGVQdWJsaXNoKG1lbWJlck5vZGUub3duZXIpICsgJyMnICtcbiAgICAgICAgKG1lbWJlck5vZGUuaGFzRXZlbnRQcmVmaXggPyAnZXZlbnQ6JyA6ICcnKSArIG1lbWJlck5vZGUubmFtZTtcbiAgICB9LFxuICAgIFNUUklOR19WQUxVRSAoc3RyaW5nVmFsdWVOb2RlKSB7XG4gICAgICByZXR1cm4gZm9ybWF0KCdcIiVzXCInLCBzdHJpbmdWYWx1ZU5vZGUuc3RyaW5nKTtcbiAgICB9LFxuICAgIE5VTUJFUl9WQUxVRSAobnVtYmVyVmFsdWVOb2RlKSB7XG4gICAgICByZXR1cm4gbnVtYmVyVmFsdWVOb2RlLm51bWJlcjtcbiAgICB9LFxuICAgIEVYVEVSTkFMIChleHRlcm5hbE5vZGUsIGNvbmNyZXRlUHVibGlzaCkge1xuICAgICAgcmV0dXJuIGZvcm1hdCgnZXh0ZXJuYWw6JXMnLCBjb25jcmV0ZVB1Ymxpc2goZXh0ZXJuYWxOb2RlLnZhbHVlKSk7XG4gICAgfSxcbiAgICBQQVJFTlRIRVNJUyAocGFyZW50aGVzaXplZE5vZGUsIGNvbmNyZXRlUHVibGlzaCkge1xuICAgICAgcmV0dXJuIGZvcm1hdCgnKCVzKScsIGNvbmNyZXRlUHVibGlzaChwYXJlbnRoZXNpemVkTm9kZS52YWx1ZSkpO1xuICAgIH0sXG4gICAgVFlQRV9RVUVSWSAodHlwZVF1ZXJ5Tm9kZSwgY29uY3JldGVQdWJsaXNoKSB7XG4gICAgICByZXR1cm4gZm9ybWF0KCd0eXBlb2YgJXMnLCBjb25jcmV0ZVB1Ymxpc2godHlwZVF1ZXJ5Tm9kZS5uYW1lKSk7XG4gICAgfSxcbiAgICBJTVBPUlQgKGltcG9ydE5vZGUsIGNvbmNyZXRlUHVibGlzaCkge1xuICAgICAgcmV0dXJuIGZvcm1hdCgnaW1wb3J0KCVzKScsIGNvbmNyZXRlUHVibGlzaChpbXBvcnROb2RlLnBhdGgpKTtcbiAgICB9LFxuICB9O1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBwdWJsaXNoOiBwdWJsaXNoLFxuICBjcmVhdGVEZWZhdWx0UHVibGlzaGVyOiBjcmVhdGVEZWZhdWx0UHVibGlzaGVyLFxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUcmF2ZXJzZSB0aGUgc3BlY2lmaWVkIEFTVC5cbiAqIEBwYXJhbSB7eyB0eXBlOiBOb2RlVHlwZSB9fSBub2RlIEFTVCB0byB0cmF2ZXJzZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeyB0eXBlOiBOb2RlVHlwZSB9KT99IG9wdF9vbkVudGVyIENhbGxiYWNrIGZvciBvbkVudGVyLlxuICogQHBhcmFtIHtmdW5jdGlvbih7IHR5cGU6IE5vZGVUeXBlIH0pP30gb3B0X29uTGVhdmUgQ2FsbGJhY2sgZm9yIG9uTGVhdmUuXG4gKi9cbmZ1bmN0aW9uIHRyYXZlcnNlKG5vZGUsIG9wdF9vbkVudGVyLCBvcHRfb25MZWF2ZSkge1xuICBpZiAob3B0X29uRW50ZXIpIG9wdF9vbkVudGVyKG5vZGUsIG51bGwsIG51bGwpO1xuXG4gIGNvbnN0IGNoaWxkTm9kZUluZm8gPSBfY29sbGVjdENoaWxkTm9kZUluZm8obm9kZSk7XG4gIGNoaWxkTm9kZUluZm8uZm9yRWFjaChmdW5jdGlvbihbY2hpbGROb2RlLCBwYXJlbnRQcm9wTmFtZSwgcGFyZW50Tm9kZV0pIHtcbiAgICB0cmF2ZXJzZShjaGlsZE5vZGUsIG9wdF9vbkVudGVyID8gKG5vZGUsIHBuLCBwTm9kZSkgPT4ge1xuICAgICAgb3B0X29uRW50ZXIobm9kZSwgcG4gfHwgcGFyZW50UHJvcE5hbWUsIHBOb2RlIHx8IHBhcmVudE5vZGUpO1xuICAgIH0gOiBudWxsLCBvcHRfb25MZWF2ZSA/IChub2RlLCBwbiwgcE5vZGUpID0+IHtcbiAgICAgIG9wdF9vbkxlYXZlKG5vZGUsIHBuIHx8IHBhcmVudFByb3BOYW1lLCBwTm9kZSB8fCBwYXJlbnROb2RlKTtcbiAgICB9IDogbnVsbCk7XG4gIH0pO1xuXG4gIGlmIChvcHRfb25MZWF2ZSkgb3B0X29uTGVhdmUobm9kZSwgbnVsbCwgbnVsbCk7XG59XG5cblxuLyoqXG4gKiBAcHJpdmF0ZVxuICovXG5jb25zdCBfUHJvcGVydHlBY2Nlc3NvciA9IHtcbiAgTk9ERSAoZm4sIG5vZGUsIHBhcmVudFByb3BOYW1lLCBwYXJlbnROb2RlKSB7XG4gICAgZm4obm9kZSwgcGFyZW50UHJvcE5hbWUsIHBhcmVudE5vZGUpO1xuICB9LFxuICBOT0RFX0xJU1QgKGZuLCBub2RlcywgcGFyZW50UHJvcE5hbWUsIHBhcmVudE5vZGUpIHtcbiAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIGZuKG5vZGUsIHBhcmVudFByb3BOYW1lLCBwYXJlbnROb2RlKTtcbiAgICB9KTtcbiAgfSxcbiAgTlVMTEFCTEVfTk9ERSAoZm4sIG9wdF9ub2RlLCBwYXJlbnRQcm9wTmFtZSwgcGFyZW50Tm9kZSkge1xuICAgIGlmIChvcHRfbm9kZSkgZm4ob3B0X25vZGUsIHBhcmVudFByb3BOYW1lLCBwYXJlbnROb2RlKTtcbiAgfSxcbn07XG5cblxuLyoqIEBwcml2YXRlICovXG5jb25zdCBfY2hpbGROb2Rlc01hcCA9IHtcbiAgTkFNRToge30sXG4gIE5BTUVEX1BBUkFNRVRFUjoge1xuICAgIHR5cGVOYW1lOiBfUHJvcGVydHlBY2Nlc3Nvci5OVUxMQUJMRV9OT0RFLFxuICB9LFxuICBNRU1CRVI6IHtcbiAgICBvd25lcjogX1Byb3BlcnR5QWNjZXNzb3IuTk9ERSxcbiAgfSxcbiAgVU5JT046IHtcbiAgICBsZWZ0OiBfUHJvcGVydHlBY2Nlc3Nvci5OT0RFLFxuICAgIHJpZ2h0OiBfUHJvcGVydHlBY2Nlc3Nvci5OT0RFLFxuICB9LFxuICBWQVJJQURJQzoge1xuICAgIHZhbHVlOiBfUHJvcGVydHlBY2Nlc3Nvci5OT0RFLFxuICB9LFxuICBSRUNPUkQ6IHtcbiAgICBlbnRyaWVzOiBfUHJvcGVydHlBY2Nlc3Nvci5OT0RFX0xJU1QsXG4gIH0sXG4gIFJFQ09SRF9FTlRSWToge1xuICAgIHZhbHVlOiBfUHJvcGVydHlBY2Nlc3Nvci5OVUxMQUJMRV9OT0RFLFxuICB9LFxuICBUVVBMRToge1xuICAgIGVudHJpZXM6IF9Qcm9wZXJ0eUFjY2Vzc29yLk5PREVfTElTVCxcbiAgfSxcbiAgR0VORVJJQzoge1xuICAgIHN1YmplY3Q6IF9Qcm9wZXJ0eUFjY2Vzc29yLk5PREUsXG4gICAgb2JqZWN0czogX1Byb3BlcnR5QWNjZXNzb3IuTk9ERV9MSVNULFxuICB9LFxuICBNT0RVTEU6IHtcbiAgICB2YWx1ZTogX1Byb3BlcnR5QWNjZXNzb3IuTk9ERSxcbiAgfSxcbiAgT1BUSU9OQUw6IHtcbiAgICB2YWx1ZTogX1Byb3BlcnR5QWNjZXNzb3IuTk9ERSxcbiAgfSxcbiAgTlVMTEFCTEU6IHtcbiAgICB2YWx1ZTogX1Byb3BlcnR5QWNjZXNzb3IuTk9ERSxcbiAgfSxcbiAgTk9UX05VTExBQkxFOiB7XG4gICAgdmFsdWU6IF9Qcm9wZXJ0eUFjY2Vzc29yLk5PREUsXG4gIH0sXG4gIEZVTkNUSU9OOiB7XG4gICAgcGFyYW1zOiBfUHJvcGVydHlBY2Nlc3Nvci5OT0RFX0xJU1QsXG4gICAgcmV0dXJuczogX1Byb3BlcnR5QWNjZXNzb3IuTlVMTEFCTEVfTk9ERSxcbiAgICB0aGlzOiBfUHJvcGVydHlBY2Nlc3Nvci5OVUxMQUJMRV9OT0RFLFxuICAgIG5ldzogX1Byb3BlcnR5QWNjZXNzb3IuTlVMTEFCTEVfTk9ERSxcbiAgfSxcbiAgQVJST1c6IHtcbiAgICBwYXJhbXM6IF9Qcm9wZXJ0eUFjY2Vzc29yLk5PREVfTElTVCxcbiAgICByZXR1cm5zOiBfUHJvcGVydHlBY2Nlc3Nvci5OVUxMQUJMRV9OT0RFLFxuICAgIG5ldzogX1Byb3BlcnR5QWNjZXNzb3IuTlVMTEFCTEVfTk9ERSxcbiAgfSxcbiAgQU5ZOiB7fSxcbiAgVU5LTk9XTjoge30sXG4gIElOTkVSX01FTUJFUjoge1xuICAgIG93bmVyOiBfUHJvcGVydHlBY2Nlc3Nvci5OT0RFLFxuICB9LFxuICBJTlNUQU5DRV9NRU1CRVI6IHtcbiAgICBvd25lcjogX1Byb3BlcnR5QWNjZXNzb3IuTk9ERSxcbiAgfSxcbiAgU1RSSU5HX1ZBTFVFOiB7fSxcbiAgTlVNQkVSX1ZBTFVFOiB7fSxcbiAgRVhURVJOQUw6IHtcbiAgICB2YWx1ZTogX1Byb3BlcnR5QWNjZXNzb3IuTk9ERSxcbiAgfSxcbiAgRklMRV9QQVRIOiB7fSxcbiAgUEFSRU5USEVTSVM6IHtcbiAgICB2YWx1ZTogX1Byb3BlcnR5QWNjZXNzb3IuTk9ERSxcbiAgfSxcbiAgVFlQRV9RVUVSWToge1xuICAgIG5hbWU6IF9Qcm9wZXJ0eUFjY2Vzc29yLk5PREUsXG4gIH0sXG4gIElNUE9SVDoge1xuICAgIHBhdGg6IF9Qcm9wZXJ0eUFjY2Vzc29yLk5PREUsXG4gIH0sXG59O1xuXG5cbi8qKiBAcHJpdmF0ZSAqL1xuZnVuY3Rpb24gX2NvbGxlY3RDaGlsZE5vZGVJbmZvKG5vZGUpIHtcbiAgY29uc3QgY2hpbGROb2RlSW5mbyA9IFtdO1xuICBjb25zdCBwcm9wQWNjZXNzb3JNYXAgPSBfY2hpbGROb2Rlc01hcFtub2RlLnR5cGVdO1xuXG4gIE9iamVjdC5rZXlzKHByb3BBY2Nlc3Nvck1hcCkuZm9yRWFjaChmdW5jdGlvbihwcm9wTmFtZSkge1xuICAgIGNvbnN0IHByb3BBY2Nlc3NvciA9IHByb3BBY2Nlc3Nvck1hcFtwcm9wTmFtZV07XG4gICAgcHJvcEFjY2Vzc29yKChub2RlLCBwcm9wTmFtZSwgcGFyZW50Tm9kZSkgPT4ge1xuICAgICAgY2hpbGROb2RlSW5mby5wdXNoKFtub2RlLCBwcm9wTmFtZSwgcGFyZW50Tm9kZV0pO1xuICAgIH0sIG5vZGVbcHJvcE5hbWVdLCBwcm9wTmFtZSwgbm9kZSk7XG4gIH0pO1xuXG4gIHJldHVybiBjaGlsZE5vZGVJbmZvO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgdHJhdmVyc2UsXG59O1xuIiwiLypcbiAqIEdlbmVyYXRlZCBieSBQRUcuanMgMC4xMC4wLlxuICpcbiAqIGh0dHA6Ly9wZWdqcy5vcmcvXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIHBlZyRzdWJjbGFzcyhjaGlsZCwgcGFyZW50KSB7XG4gIGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfVxuICBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7XG4gIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7XG59XG5cbmZ1bmN0aW9uIHBlZyRTeW50YXhFcnJvcihtZXNzYWdlLCBleHBlY3RlZCwgZm91bmQsIGxvY2F0aW9uKSB7XG4gIHRoaXMubWVzc2FnZSAgPSBtZXNzYWdlO1xuICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWQ7XG4gIHRoaXMuZm91bmQgICAgPSBmb3VuZDtcbiAgdGhpcy5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICB0aGlzLm5hbWUgICAgID0gXCJTeW50YXhFcnJvclwiO1xuXG4gIGlmICh0eXBlb2YgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHBlZyRTeW50YXhFcnJvcik7XG4gIH1cbn1cblxucGVnJHN1YmNsYXNzKHBlZyRTeW50YXhFcnJvciwgRXJyb3IpO1xuXG5wZWckU3ludGF4RXJyb3IuYnVpbGRNZXNzYWdlID0gZnVuY3Rpb24oZXhwZWN0ZWQsIGZvdW5kKSB7XG4gIHZhciBERVNDUklCRV9FWFBFQ1RBVElPTl9GTlMgPSB7XG4gICAgICAgIGxpdGVyYWw6IGZ1bmN0aW9uKGV4cGVjdGF0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIFwiXFxcIlwiICsgbGl0ZXJhbEVzY2FwZShleHBlY3RhdGlvbi50ZXh0KSArIFwiXFxcIlwiO1xuICAgICAgICB9LFxuXG4gICAgICAgIFwiY2xhc3NcIjogZnVuY3Rpb24oZXhwZWN0YXRpb24pIHtcbiAgICAgICAgICB2YXIgZXNjYXBlZFBhcnRzID0gXCJcIixcbiAgICAgICAgICAgICAgaTtcblxuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBleHBlY3RhdGlvbi5wYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZXNjYXBlZFBhcnRzICs9IGV4cGVjdGF0aW9uLnBhcnRzW2ldIGluc3RhbmNlb2YgQXJyYXlcbiAgICAgICAgICAgICAgPyBjbGFzc0VzY2FwZShleHBlY3RhdGlvbi5wYXJ0c1tpXVswXSkgKyBcIi1cIiArIGNsYXNzRXNjYXBlKGV4cGVjdGF0aW9uLnBhcnRzW2ldWzFdKVxuICAgICAgICAgICAgICA6IGNsYXNzRXNjYXBlKGV4cGVjdGF0aW9uLnBhcnRzW2ldKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gXCJbXCIgKyAoZXhwZWN0YXRpb24uaW52ZXJ0ZWQgPyBcIl5cIiA6IFwiXCIpICsgZXNjYXBlZFBhcnRzICsgXCJdXCI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYW55OiBmdW5jdGlvbihleHBlY3RhdGlvbikge1xuICAgICAgICAgIHJldHVybiBcImFueSBjaGFyYWN0ZXJcIjtcbiAgICAgICAgfSxcblxuICAgICAgICBlbmQ6IGZ1bmN0aW9uKGV4cGVjdGF0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIFwiZW5kIG9mIGlucHV0XCI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb3RoZXI6IGZ1bmN0aW9uKGV4cGVjdGF0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIGV4cGVjdGF0aW9uLmRlc2NyaXB0aW9uO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gIGZ1bmN0aW9uIGhleChjaCkge1xuICAgIHJldHVybiBjaC5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gbGl0ZXJhbEVzY2FwZShzKSB7XG4gICAgcmV0dXJuIHNcbiAgICAgIC5yZXBsYWNlKC9cXFxcL2csICdcXFxcXFxcXCcpXG4gICAgICAucmVwbGFjZSgvXCIvZywgICdcXFxcXCInKVxuICAgICAgLnJlcGxhY2UoL1xcMC9nLCAnXFxcXDAnKVxuICAgICAgLnJlcGxhY2UoL1xcdC9nLCAnXFxcXHQnKVxuICAgICAgLnJlcGxhY2UoL1xcbi9nLCAnXFxcXG4nKVxuICAgICAgLnJlcGxhY2UoL1xcci9nLCAnXFxcXHInKVxuICAgICAgLnJlcGxhY2UoL1tcXHgwMC1cXHgwRl0vZywgICAgICAgICAgZnVuY3Rpb24oY2gpIHsgcmV0dXJuICdcXFxceDAnICsgaGV4KGNoKTsgfSlcbiAgICAgIC5yZXBsYWNlKC9bXFx4MTAtXFx4MUZcXHg3Ri1cXHg5Rl0vZywgZnVuY3Rpb24oY2gpIHsgcmV0dXJuICdcXFxceCcgICsgaGV4KGNoKTsgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGFzc0VzY2FwZShzKSB7XG4gICAgcmV0dXJuIHNcbiAgICAgIC5yZXBsYWNlKC9cXFxcL2csICdcXFxcXFxcXCcpXG4gICAgICAucmVwbGFjZSgvXFxdL2csICdcXFxcXScpXG4gICAgICAucmVwbGFjZSgvXFxeL2csICdcXFxcXicpXG4gICAgICAucmVwbGFjZSgvLS9nLCAgJ1xcXFwtJylcbiAgICAgIC5yZXBsYWNlKC9cXDAvZywgJ1xcXFwwJylcbiAgICAgIC5yZXBsYWNlKC9cXHQvZywgJ1xcXFx0JylcbiAgICAgIC5yZXBsYWNlKC9cXG4vZywgJ1xcXFxuJylcbiAgICAgIC5yZXBsYWNlKC9cXHIvZywgJ1xcXFxyJylcbiAgICAgIC5yZXBsYWNlKC9bXFx4MDAtXFx4MEZdL2csICAgICAgICAgIGZ1bmN0aW9uKGNoKSB7IHJldHVybiAnXFxcXHgwJyArIGhleChjaCk7IH0pXG4gICAgICAucmVwbGFjZSgvW1xceDEwLVxceDFGXFx4N0YtXFx4OUZdL2csIGZ1bmN0aW9uKGNoKSB7IHJldHVybiAnXFxcXHgnICArIGhleChjaCk7IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzY3JpYmVFeHBlY3RhdGlvbihleHBlY3RhdGlvbikge1xuICAgIHJldHVybiBERVNDUklCRV9FWFBFQ1RBVElPTl9GTlNbZXhwZWN0YXRpb24udHlwZV0oZXhwZWN0YXRpb24pO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzY3JpYmVFeHBlY3RlZChleHBlY3RlZCkge1xuICAgIHZhciBkZXNjcmlwdGlvbnMgPSBuZXcgQXJyYXkoZXhwZWN0ZWQubGVuZ3RoKSxcbiAgICAgICAgaSwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBleHBlY3RlZC5sZW5ndGg7IGkrKykge1xuICAgICAgZGVzY3JpcHRpb25zW2ldID0gZGVzY3JpYmVFeHBlY3RhdGlvbihleHBlY3RlZFtpXSk7XG4gICAgfVxuXG4gICAgZGVzY3JpcHRpb25zLnNvcnQoKTtcblxuICAgIGlmIChkZXNjcmlwdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChpID0gMSwgaiA9IDE7IGkgPCBkZXNjcmlwdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGRlc2NyaXB0aW9uc1tpIC0gMV0gIT09IGRlc2NyaXB0aW9uc1tpXSkge1xuICAgICAgICAgIGRlc2NyaXB0aW9uc1tqXSA9IGRlc2NyaXB0aW9uc1tpXTtcbiAgICAgICAgICBqKys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlc2NyaXB0aW9ucy5sZW5ndGggPSBqO1xuICAgIH1cblxuICAgIHN3aXRjaCAoZGVzY3JpcHRpb25zLmxlbmd0aCkge1xuICAgICAgY2FzZSAxOlxuICAgICAgICByZXR1cm4gZGVzY3JpcHRpb25zWzBdO1xuXG4gICAgICBjYXNlIDI6XG4gICAgICAgIHJldHVybiBkZXNjcmlwdGlvbnNbMF0gKyBcIiBvciBcIiArIGRlc2NyaXB0aW9uc1sxXTtcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGRlc2NyaXB0aW9ucy5zbGljZSgwLCAtMSkuam9pbihcIiwgXCIpXG4gICAgICAgICAgKyBcIiwgb3IgXCJcbiAgICAgICAgICArIGRlc2NyaXB0aW9uc1tkZXNjcmlwdGlvbnMubGVuZ3RoIC0gMV07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVzY3JpYmVGb3VuZChmb3VuZCkge1xuICAgIHJldHVybiBmb3VuZCA/IFwiXFxcIlwiICsgbGl0ZXJhbEVzY2FwZShmb3VuZCkgKyBcIlxcXCJcIiA6IFwiZW5kIG9mIGlucHV0XCI7XG4gIH1cblxuICByZXR1cm4gXCJFeHBlY3RlZCBcIiArIGRlc2NyaWJlRXhwZWN0ZWQoZXhwZWN0ZWQpICsgXCIgYnV0IFwiICsgZGVzY3JpYmVGb3VuZChmb3VuZCkgKyBcIiBmb3VuZC5cIjtcbn07XG5cbmZ1bmN0aW9uIHBlZyRwYXJzZShpbnB1dCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyAhPT0gdm9pZCAwID8gb3B0aW9ucyA6IHt9O1xuXG4gIHZhciBwZWckRkFJTEVEID0ge30sXG5cbiAgICAgIHBlZyRzdGFydFJ1bGVGdW5jdGlvbnMgPSB7IFRvcFR5cGVFeHByOiBwZWckcGFyc2VUb3BUeXBlRXhwciB9LFxuICAgICAgcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uICA9IHBlZyRwYXJzZVRvcFR5cGVFeHByLFxuXG4gICAgICBwZWckYzAgPSBmdW5jdGlvbihleHByKSB7XG4gICAgICAgICAgICAgICAgIHJldHVybiBleHByO1xuICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMSA9IC9eWyBcXHRcXHJcXG4gXS8sXG4gICAgICBwZWckYzIgPSBwZWckY2xhc3NFeHBlY3RhdGlvbihbXCIgXCIsIFwiXFx0XCIsIFwiXFxyXCIsIFwiXFxuXCIsIFwiIFwiXSwgZmFsc2UsIGZhbHNlKSxcbiAgICAgIHBlZyRjMyA9IC9eW2EtekEtWl8kXS8sXG4gICAgICBwZWckYzQgPSBwZWckY2xhc3NFeHBlY3RhdGlvbihbW1wiYVwiLCBcInpcIl0sIFtcIkFcIiwgXCJaXCJdLCBcIl9cIiwgXCIkXCJdLCBmYWxzZSwgZmFsc2UpLFxuICAgICAgcGVnJGM1ID0gL15bYS16QS1aMC05XyRdLyxcbiAgICAgIHBlZyRjNiA9IHBlZyRjbGFzc0V4cGVjdGF0aW9uKFtbXCJhXCIsIFwielwiXSwgW1wiQVwiLCBcIlpcIl0sIFtcIjBcIiwgXCI5XCJdLCBcIl9cIiwgXCIkXCJdLCBmYWxzZSwgZmFsc2UpLFxuICAgICAgcGVnJGM3ID0gXCJldmVudDpcIixcbiAgICAgIHBlZyRjOCA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJldmVudDpcIiwgZmFsc2UpLFxuICAgICAgcGVnJGM5ID0gZnVuY3Rpb24ocm9vdE93bmVyLCBtZW1iZXJQYXJ0V2l0aE9wZXJhdG9ycykge1xuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lbWJlclBhcnRXaXRoT3BlcmF0b3JzLnJlZHVjZShmdW5jdGlvbihvd25lciwgdG9rZW5zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHZhciBvcGVyYXRvclR5cGUgPSB0b2tlbnNbMV07XG4gICAgICAgICAgICAgICAgICAgICAgIHZhciBldmVudE5hbWVzcGFjZSA9IHRva2Vuc1szXTtcbiAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1lbWJlck5hbWUgPSB0b2tlbnNbNV07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChvcGVyYXRvclR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIE5hbWVwYXRoT3BlcmF0b3JUeXBlLk1FTUJFUjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLk1FTUJFUixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3duZXI6IG93bmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBtZW1iZXJOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNFdmVudFByZWZpeDogQm9vbGVhbihldmVudE5hbWVzcGFjZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgTmFtZXBhdGhPcGVyYXRvclR5cGUuSU5TVEFOQ0VfTUVNQkVSOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogTm9kZVR5cGUuSU5TVEFOQ0VfTUVNQkVSLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvd25lcjogb3duZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG1lbWJlck5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc0V2ZW50UHJlZml4OiBCb29sZWFuKGV2ZW50TmFtZXNwYWNlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBOYW1lcGF0aE9wZXJhdG9yVHlwZS5JTk5FUl9NRU1CRVI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5JTk5FUl9NRU1CRVIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG93bmVyOiBvd25lcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbWVtYmVyTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRXZlbnRQcmVmaXg6IEJvb2xlYW4oZXZlbnROYW1lc3BhY2UpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIG9wZXJhdG9yIHR5cGU6IFwiJyArIG9wZXJhdG9yVHlwZSArICdcIicpO1xuICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICB9LCByb290T3duZXIpO1xuICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzEwID0gZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogTm9kZVR5cGUuTkFNRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGMxMSA9IC9eW2EtekEtWjAtOV8kXFwtXS8sXG4gICAgICBwZWckYzEyID0gcGVnJGNsYXNzRXhwZWN0YXRpb24oW1tcImFcIiwgXCJ6XCJdLCBbXCJBXCIsIFwiWlwiXSwgW1wiMFwiLCBcIjlcIl0sIFwiX1wiLCBcIiRcIiwgXCItXCJdLCBmYWxzZSwgZmFsc2UpLFxuICAgICAgcGVnJGMxMyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogTm9kZVR5cGUuTkFNRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGMxNCA9IFwiJ1wiLFxuICAgICAgcGVnJGMxNSA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCInXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjMTYgPSAvXlteJ10vLFxuICAgICAgcGVnJGMxNyA9IHBlZyRjbGFzc0V4cGVjdGF0aW9uKFtcIidcIl0sIHRydWUsIGZhbHNlKSxcbiAgICAgIHBlZyRjMTggPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmFtZTtcbiAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGMxOSA9IFwiXFxcIlwiLFxuICAgICAgcGVnJGMyMCA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJcXFwiXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjMjEgPSAvXlteXCJdLyxcbiAgICAgIHBlZyRjMjIgPSBwZWckY2xhc3NFeHBlY3RhdGlvbihbXCJcXFwiXCJdLCB0cnVlLCBmYWxzZSksXG4gICAgICBwZWckYzIzID0gXCIuXCIsXG4gICAgICBwZWckYzI0ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIi5cIiwgZmFsc2UpLFxuICAgICAgcGVnJGMyNSA9IGZ1bmN0aW9uKHJvb3RPd25lciwgbWVtYmVyUGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtZW1iZXJQYXJ0LnJlZHVjZShmdW5jdGlvbihvd25lciwgdG9rZW5zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5NRU1CRVIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG93bmVyOiBvd25lcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdG9rZW5zWzNdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcm9vdE93bmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMjYgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBOYW1lcGF0aE9wZXJhdG9yVHlwZS5NRU1CRVI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMjcgPSBcIn5cIixcbiAgICAgIHBlZyRjMjggPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiflwiLCBmYWxzZSksXG4gICAgICBwZWckYzI5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBOYW1lcGF0aE9wZXJhdG9yVHlwZS5JTk5FUl9NRU1CRVI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGMzMCA9IFwiI1wiLFxuICAgICAgcGVnJGMzMSA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCIjXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjMzIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE5hbWVwYXRoT3BlcmF0b3JUeXBlLklOU1RBTkNFX01FTUJFUjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzMzID0gXCJleHRlcm5hbFwiLFxuICAgICAgcGVnJGMzNCA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJleHRlcm5hbFwiLCBmYWxzZSksXG4gICAgICBwZWckYzM1ID0gXCI6XCIsXG4gICAgICBwZWckYzM2ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIjpcIiwgZmFsc2UpLFxuICAgICAgcGVnJGMzNyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLkVYVEVSTkFMLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMzggPSBcIm1vZHVsZVwiLFxuICAgICAgcGVnJGMzOSA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJtb2R1bGVcIiwgZmFsc2UpLFxuICAgICAgcGVnJGM0MCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogTm9kZVR5cGUuTU9EVUxFLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzQxID0gZnVuY3Rpb24ocm9vdE93bmVyLCBtZW1iZXJQYXJ0V2l0aE9wZXJhdG9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWVtYmVyUGFydFdpdGhPcGVyYXRvcnMucmVkdWNlKGZ1bmN0aW9uKG93bmVyLCB0b2tlbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3BlcmF0b3JUeXBlID0gdG9rZW5zWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBldmVudE5hbWVzcGFjZSA9IHRva2Vuc1szXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWVtYmVyTmFtZSA9IHRva2Vuc1s1XTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAob3BlcmF0b3JUeXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIE5hbWVwYXRoT3BlcmF0b3JUeXBlLk1FTUJFUjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5NRU1CRVIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3duZXI6IG93bmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG1lbWJlck5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRXZlbnRQcmVmaXg6IEJvb2xlYW4oZXZlbnROYW1lc3BhY2UpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBOYW1lcGF0aE9wZXJhdG9yVHlwZS5JTlNUQU5DRV9NRU1CRVI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogTm9kZVR5cGUuSU5TVEFOQ0VfTUVNQkVSLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG93bmVyOiBvd25lcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBtZW1iZXJOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc0V2ZW50UHJlZml4OiBCb29sZWFuKGV2ZW50TmFtZXNwYWNlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgTmFtZXBhdGhPcGVyYXRvclR5cGUuSU5ORVJfTUVNQkVSOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLklOTkVSX01FTUJFUixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvd25lcjogb3duZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbWVtYmVyTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNFdmVudFByZWZpeDogQm9vbGVhbihldmVudE5hbWVzcGFjZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgb3BlcmF0b3IgdHlwZTogXCInICsgb3BlcmF0b3JUeXBlICsgJ1wiJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICB9LCByb290T3duZXIpO1xuICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjNDIgPSAvXlthLXpBLVowLTlfJFxcL1xcLV0vLFxuICAgICAgcGVnJGM0MyA9IHBlZyRjbGFzc0V4cGVjdGF0aW9uKFtbXCJhXCIsIFwielwiXSwgW1wiQVwiLCBcIlpcIl0sIFtcIjBcIiwgXCI5XCJdLCBcIl9cIiwgXCIkXCIsIFwiL1wiLCBcIi1cIl0sIGZhbHNlLCBmYWxzZSksXG4gICAgICBwZWckYzQ0ID0gZnVuY3Rpb24oZmlsZVBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLkZJTEVfUEFUSCxcbiAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzQ1ID0gXCIqXCIsXG4gICAgICBwZWckYzQ2ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIipcIiwgZmFsc2UpLFxuICAgICAgcGVnJGM0NyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0eXBlOiBOb2RlVHlwZS5BTlkgfTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzQ4ID0gXCI/XCIsXG4gICAgICBwZWckYzQ5ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIj9cIiwgZmFsc2UpLFxuICAgICAgcGVnJGM1MCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogTm9kZVR5cGUuVU5LTk9XTiB9O1xuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzUxID0gL15bXlxcXFxcIl0vLFxuICAgICAgcGVnJGM1MiA9IHBlZyRjbGFzc0V4cGVjdGF0aW9uKFtcIlxcXFxcIiwgXCJcXFwiXCJdLCB0cnVlLCBmYWxzZSksXG4gICAgICBwZWckYzUzID0gXCJcXFxcXCIsXG4gICAgICBwZWckYzU0ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIlxcXFxcIiwgZmFsc2UpLFxuICAgICAgcGVnJGM1NSA9IHBlZyRhbnlFeHBlY3RhdGlvbigpLFxuICAgICAgcGVnJGM1NiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLlNUUklOR19WQUxVRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZzogdmFsdWUucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjNTcgPSAvXlteXFxcXCddLyxcbiAgICAgIHBlZyRjNTggPSBwZWckY2xhc3NFeHBlY3RhdGlvbihbXCJcXFxcXCIsIFwiJ1wiXSwgdHJ1ZSwgZmFsc2UpLFxuICAgICAgcGVnJGM1OSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLlNUUklOR19WQUxVRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZzogdmFsdWUucmVwbGFjZSgvXFxcXCcvZywgXCInXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjNjAgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLk5VTUJFUl9WQUxVRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1iZXI6IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGM2MSA9IFwiLVwiLFxuICAgICAgcGVnJGM2MiA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCItXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjNjMgPSAvXlswLTldLyxcbiAgICAgIHBlZyRjNjQgPSBwZWckY2xhc3NFeHBlY3RhdGlvbihbW1wiMFwiLCBcIjlcIl1dLCBmYWxzZSwgZmFsc2UpLFxuICAgICAgcGVnJGM2NSA9IFwiMGJcIixcbiAgICAgIHBlZyRjNjYgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiMGJcIiwgZmFsc2UpLFxuICAgICAgcGVnJGM2NyA9IC9eWzAxXS8sXG4gICAgICBwZWckYzY4ID0gcGVnJGNsYXNzRXhwZWN0YXRpb24oW1wiMFwiLCBcIjFcIl0sIGZhbHNlLCBmYWxzZSksXG4gICAgICBwZWckYzY5ID0gXCIwb1wiLFxuICAgICAgcGVnJGM3MCA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCIwb1wiLCBmYWxzZSksXG4gICAgICBwZWckYzcxID0gL15bMC03XS8sXG4gICAgICBwZWckYzcyID0gcGVnJGNsYXNzRXhwZWN0YXRpb24oW1tcIjBcIiwgXCI3XCJdXSwgZmFsc2UsIGZhbHNlKSxcbiAgICAgIHBlZyRjNzMgPSBcIjB4XCIsXG4gICAgICBwZWckYzc0ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIjB4XCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjNzUgPSAvXlswLTlhLWZBLUZdLyxcbiAgICAgIHBlZyRjNzYgPSBwZWckY2xhc3NFeHBlY3RhdGlvbihbW1wiMFwiLCBcIjlcIl0sIFtcImFcIiwgXCJmXCJdLCBbXCJBXCIsIFwiRlwiXV0sIGZhbHNlLCBmYWxzZSksXG4gICAgICBwZWckYzc3ID0gZnVuY3Rpb24obGVmdCwgc3ludGF4LCByaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLlVOSU9OLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBsZWZ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICByaWdodDogcmlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGE6IHsgc3ludGF4OiBzeW50YXggfSxcbiAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGM3OCA9IFwifFwiLFxuICAgICAgcGVnJGM3OSA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJ8XCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjODAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBVbmlvblR5cGVTeW50YXguUElQRTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGM4MSA9IFwiL1wiLFxuICAgICAgcGVnJGM4MiA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCIvXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjODMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gVW5pb25UeXBlU3ludGF4LlNMQVNIO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGM4NCA9IFwidHlwZW9mXCIsXG4gICAgICBwZWckYzg1ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcInR5cGVvZlwiLCBmYWxzZSksXG4gICAgICBwZWckYzg2ID0gZnVuY3Rpb24ob3BlcmF0b3IsIG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5UWVBFX1FVRVJZLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzg3ID0gXCJpbXBvcnRcIixcbiAgICAgIHBlZyRjODggPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiaW1wb3J0XCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjODkgPSBcIihcIixcbiAgICAgIHBlZyRjOTAgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiKFwiLCBmYWxzZSksXG4gICAgICBwZWckYzkxID0gXCIpXCIsXG4gICAgICBwZWckYzkyID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIilcIiwgZmFsc2UpLFxuICAgICAgcGVnJGM5MyA9IGZ1bmN0aW9uKG9wZXJhdG9yLCBwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IE5vZGVUeXBlLklNUE9SVCwgcGF0aDogcGF0aCB9O1xuICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjOTQgPSBmdW5jdGlvbihvcGVyYXRvciwgb3BlcmFuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5OVUxMQUJMRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBvcGVyYW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YTogeyBzeW50YXg6IE51bGxhYmxlVHlwZVN5bnRheC5QUkVGSVhfUVVFU1RJT05fTUFSSyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzk1ID0gXCIhXCIsXG4gICAgICBwZWckYzk2ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIiFcIiwgZmFsc2UpLFxuICAgICAgcGVnJGM5NyA9IGZ1bmN0aW9uKG9wZXJhdG9yLCBvcGVyYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLk5PVF9OVUxMQUJMRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBvcGVyYW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YTogeyBzeW50YXg6IE5vdE51bGxhYmxlVHlwZVN5bnRheC5QUkVGSVhfQkFORyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzk4ID0gXCI9XCIsXG4gICAgICBwZWckYzk5ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIj1cIiwgZmFsc2UpLFxuICAgICAgcGVnJGMxMDAgPSBmdW5jdGlvbihvcGVyYXRvciwgb3BlcmFuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5PUFRJT05BTCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBvcGVyYW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YTogeyBzeW50YXg6IE9wdGlvbmFsVHlwZVN5bnRheC5QUkVGSVhfRVFVQUxTX1NJR04gfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGMxMDEgPSBmdW5jdGlvbihvcGVyYW5kLCBvcGVyYXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5OVUxMQUJMRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBvcGVyYW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YTogeyBzeW50YXg6IE51bGxhYmxlVHlwZVN5bnRheC5TVUZGSVhfUVVFU1RJT05fTUFSSyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzEwMiA9IGZ1bmN0aW9uKG9wZXJhbmQsIG9wZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLk5PVF9OVUxMQUJMRSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBvcGVyYW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YTogeyBzeW50YXg6IE5vdE51bGxhYmxlVHlwZVN5bnRheC5TVUZGSVhfQkFORyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzEwMyA9IGZ1bmN0aW9uKG9wZXJhbmQsIG9wZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLk9QVElPTkFMLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG9wZXJhbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhOiB7IHN5bnRheDogT3B0aW9uYWxUeXBlU3ludGF4LlNVRkZJWF9FUVVBTFNfU0lHTiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzEwNCA9IGZ1bmN0aW9uKG9wZXJhbmQsIHN5bnRheCwgcGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5HRU5FUklDLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0OiBvcGVyYW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RzOiBwYXJhbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGE6IHsgc3ludGF4OiBzeW50YXggfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTA1ID0gXCIsXCIsXG4gICAgICBwZWckYzEwNiA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCIsXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjMTA3ID0gZnVuY3Rpb24oZmlyc3QsIHJlc3RzV2l0aENvbW1hKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3RzV2l0aENvbW1hLnJlZHVjZShmdW5jdGlvbihwYXJhbXMsIHRva2Vucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtcy5jb25jYXQoW3Rva2Vuc1szXV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIFtmaXJzdF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGMxMDggPSBcIi48XCIsXG4gICAgICBwZWckYzEwOSA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCIuPFwiLCBmYWxzZSksXG4gICAgICBwZWckYzExMCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdlbmVyaWNUeXBlU3ludGF4LkFOR0xFX0JSQUNLRVRfV0lUSF9ET1Q7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTExID0gXCI8XCIsXG4gICAgICBwZWckYzExMiA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCI8XCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjMTEzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2VuZXJpY1R5cGVTeW50YXguQU5HTEVfQlJBQ0tFVDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGMxMTQgPSBcIj5cIixcbiAgICAgIHBlZyRjMTE1ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIj5cIiwgZmFsc2UpLFxuICAgICAgcGVnJGMxMTYgPSBcIltcIixcbiAgICAgIHBlZyRjMTE3ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIltcIiwgZmFsc2UpLFxuICAgICAgcGVnJGMxMTggPSBcIl1cIixcbiAgICAgIHBlZyRjMTE5ID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIl1cIiwgZmFsc2UpLFxuICAgICAgcGVnJGMxMjAgPSBmdW5jdGlvbihvcGVyYW5kLCBicmFja2V0cykge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBicmFja2V0cy5yZWR1Y2UoZnVuY3Rpb24ob3BlcmFuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogTm9kZVR5cGUuR0VORVJJQyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLk5BTUUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0FycmF5J1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RzOiBbIG9wZXJhbmQgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YTogeyBzeW50YXg6IEdlbmVyaWNUeXBlU3ludGF4LlNRVUFSRV9CUkFDS0VUIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgIH0sIG9wZXJhbmQpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGMxMjEgPSBcIm5ld1wiLFxuICAgICAgcGVnJGMxMjIgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwibmV3XCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjMTIzID0gXCI9PlwiLFxuICAgICAgcGVnJGMxMjQgPSBwZWckbGl0ZXJhbEV4cGVjdGF0aW9uKFwiPT5cIiwgZmFsc2UpLFxuICAgICAgcGVnJGMxMjUgPSBmdW5jdGlvbihuZXdNb2RpZmllciwgcGFyYW1zUGFydCwgcmV0dXJuZWRUeXBlTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5BUlJPVyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zUGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybnM6IHJldHVybmVkVHlwZU5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBuZXc6IG5ld01vZGlmaWVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICBwZWckYzEyNiA9IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzEyNyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTI4ID0gZnVuY3Rpb24ocGFyYW1zV2l0aENvbW1hLCBsYXN0UGFyYW0pIHtcbiAgICAgICAgcmV0dXJuIHBhcmFtc1dpdGhDb21tYS5yZWR1Y2VSaWdodChmdW5jdGlvbihwYXJhbXMsIHRva2Vucykge1xuICAgICAgICAgIHZhciBwYXJhbSA9IHsgdHlwZTogTm9kZVR5cGUuTkFNRURfUEFSQU1FVEVSLCBuYW1lOiB0b2tlbnNbMF0sIHR5cGVOYW1lOiB0b2tlbnNbNF0gfTtcbiAgICAgICAgICByZXR1cm4gW3BhcmFtXS5jb25jYXQocGFyYW1zKTtcbiAgICAgICAgfSwgW2xhc3RQYXJhbV0pO1xuICAgICAgfSxcbiAgICAgIHBlZyRjMTI5ID0gXCIuLi5cIixcbiAgICAgIHBlZyRjMTMwID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcIi4uLlwiLCBmYWxzZSksXG4gICAgICBwZWckYzEzMSA9IGZ1bmN0aW9uKHNwcmVhZCwgaWQsIHR5cGUpIHtcbiAgICAgICAgdmFyIG9wZXJhbmQgPSB7IHR5cGU6IE5vZGVUeXBlLk5BTUVEX1BBUkFNRVRFUiwgbmFtZTogaWQsIHR5cGVOYW1lOiB0eXBlIH07XG4gICAgICAgIGlmIChzcHJlYWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5WQVJJQURJQyxcbiAgICAgICAgICB2YWx1ZTogb3BlcmFuZCxcbiAgICAgICAgICBtZXRhOiB7IHN5bnRheDogVmFyaWFkaWNUeXBlU3ludGF4LlBSRUZJWF9ET1RTIH0sXG4gICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG9wZXJhbmQ7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBwZWckYzEzMiA9IFwiZnVuY3Rpb25cIixcbiAgICAgIHBlZyRjMTMzID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcImZ1bmN0aW9uXCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjMTM0ID0gZnVuY3Rpb24ocGFyYW1zUGFydCwgcmV0dXJuZWRUeXBlUGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXR1cm5lZFR5cGVOb2RlID0gcmV0dXJuZWRUeXBlUGFydCA/IHJldHVybmVkVHlwZVBhcnRbMl0gOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLkZVTkNUSU9OLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXNQYXJ0LnBhcmFtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybnM6IHJldHVybmVkVHlwZU5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzOiBwYXJhbXNQYXJ0Lm1vZGlmaWVyLm5vZGVUaGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3OiBwYXJhbXNQYXJ0Lm1vZGlmaWVyLm5vZGVOZXcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTM1ID0gZnVuY3Rpb24obW9kaWZpZXIsIHBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHBhcmFtczogcGFyYW1zLCBtb2RpZmllcjogbW9kaWZpZXIgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTM2ID0gZnVuY3Rpb24obW9kaWZpZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBwYXJhbXM6IFtdLCBtb2RpZmllcjogbW9kaWZpZXIgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTM3ID0gZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgcGFyYW1zOiBwYXJhbXMsIG1vZGlmaWVyOiB7IG5vZGVUaGlzOiBudWxsLCBub2RlTmV3OiBudWxsIH0gfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTM4ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgcGFyYW1zOiBbXSwgbW9kaWZpZXI6IHsgbm9kZVRoaXM6IG51bGwsIG5vZGVOZXc6IG51bGwgfSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGMxMzkgPSBcInRoaXNcIixcbiAgICAgIHBlZyRjMTQwID0gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbihcInRoaXNcIiwgZmFsc2UpLFxuICAgICAgcGVnJGMxNDEgPSBmdW5jdGlvbihtb2RpZmllclRoaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgbm9kZVRoaXM6IG1vZGlmaWVyVGhpc1s0XSwgbm9kZU5ldzogbnVsbCB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTQyID0gZnVuY3Rpb24obW9kaWZpZXJOZXcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgbm9kZVRoaXM6IG51bGwsIG5vZGVOZXc6IG1vZGlmaWVyTmV3WzRdIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGMxNDMgPSBmdW5jdGlvbihwYXJhbXNXaXRoQ29tbWEsIGxhc3RQYXJhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbXNXaXRoQ29tbWEucmVkdWNlUmlnaHQoZnVuY3Rpb24ocGFyYW1zLCB0b2tlbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXJhbSA9IHRva2Vuc1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbcGFyYW1dLmNvbmNhdChwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIFtsYXN0UGFyYW1dKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTQ0ID0gXCJ7XCIsXG4gICAgICBwZWckYzE0NSA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJ7XCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjMTQ2ID0gXCJ9XCIsXG4gICAgICBwZWckYzE0NyA9IHBlZyRsaXRlcmFsRXhwZWN0YXRpb24oXCJ9XCIsIGZhbHNlKSxcbiAgICAgIHBlZyRjMTQ4ID0gZnVuY3Rpb24oZW50cmllcykge1xuICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLlJFQ09SRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyaWVzOiBlbnRyaWVzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTQ5ID0gZnVuY3Rpb24oZmlyc3QsIHJlc3RXaXRoQ29tbWEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN0V2l0aENvbW1hLnJlZHVjZShmdW5jdGlvbihlbnRyaWVzLCB0b2tlbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVudHJ5ID0gdG9rZW5zWzNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW50cmllcy5jb25jYXQoW2VudHJ5XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBbZmlyc3RdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGMxNTAgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5SRUNPUkRfRU5UUlksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTUxID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5SRUNPUkRfRU5UUlksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTUyID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzE1MyA9IGZ1bmN0aW9uKGVudHJpZXMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5UVVBMRSxcbiAgICAgICAgICBlbnRyaWVzOiBlbnRyaWVzIHx8IFtdLFxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcGVnJGMxNTQgPSBmdW5jdGlvbihyZXN0V2l0aENvbW1hLCBsYXN0KSB7XG4gICAgICAgIHJldHVybiByZXN0V2l0aENvbW1hLnJlZHVjZVJpZ2h0KChlbnRyaWVzLCB0b2tlbnMpID0+IHtcbiAgICAgICAgICBsZXQgZW50cnkgPSB0b2tlbnNbMF07XG4gICAgICAgICAgcmV0dXJuIFtlbnRyeV0uY29uY2F0KGVudHJpZXMpO1xuICAgICAgICB9LCBbbGFzdF0pO1xuICAgICAgfSxcbiAgICAgIHBlZyRjMTU1ID0gZnVuY3Rpb24od3JhcHBlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IE5vZGVUeXBlLlBBUkVOVEhFU0lTLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB3cmFwcGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgIHBlZyRjMTU2ID0gZnVuY3Rpb24ob3BlcmFuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBOb2RlVHlwZS5WQVJJQURJQyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBvcGVyYW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YTogeyBzeW50YXg6IFZhcmlhZGljVHlwZVN5bnRheC5QUkVGSVhfRE9UUyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICBwZWckYzE1NyA9IGZ1bmN0aW9uKG9wZXJhbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogTm9kZVR5cGUuVkFSSUFESUMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogb3BlcmFuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGE6IHsgc3ludGF4OiBWYXJpYWRpY1R5cGVTeW50YXguU1VGRklYX0RPVFMgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgcGVnJGMxNTggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogTm9kZVR5cGUuVkFSSUFESUMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGE6IHsgc3ludGF4OiBWYXJpYWRpY1R5cGVTeW50YXguT05MWV9ET1RTIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgcGVnJGN1cnJQb3MgICAgICAgICAgPSAwLFxuICAgICAgcGVnJHNhdmVkUG9zICAgICAgICAgPSAwLFxuICAgICAgcGVnJHBvc0RldGFpbHNDYWNoZSAgPSBbeyBsaW5lOiAxLCBjb2x1bW46IDEgfV0sXG4gICAgICBwZWckbWF4RmFpbFBvcyAgICAgICA9IDAsXG4gICAgICBwZWckbWF4RmFpbEV4cGVjdGVkICA9IFtdLFxuICAgICAgcGVnJHNpbGVudEZhaWxzICAgICAgPSAwLFxuXG4gICAgICBwZWckcmVzdWx0c0NhY2hlID0ge30sXG5cbiAgICAgIHBlZyRyZXN1bHQ7XG5cbiAgaWYgKFwic3RhcnRSdWxlXCIgaW4gb3B0aW9ucykge1xuICAgIGlmICghKG9wdGlvbnMuc3RhcnRSdWxlIGluIHBlZyRzdGFydFJ1bGVGdW5jdGlvbnMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBzdGFydCBwYXJzaW5nIGZyb20gcnVsZSBcXFwiXCIgKyBvcHRpb25zLnN0YXJ0UnVsZSArIFwiXFxcIi5cIik7XG4gICAgfVxuXG4gICAgcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uID0gcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uc1tvcHRpb25zLnN0YXJ0UnVsZV07XG4gIH1cblxuICBmdW5jdGlvbiB0ZXh0KCkge1xuICAgIHJldHVybiBpbnB1dC5zdWJzdHJpbmcocGVnJHNhdmVkUG9zLCBwZWckY3VyclBvcyk7XG4gIH1cblxuICBmdW5jdGlvbiBsb2NhdGlvbigpIHtcbiAgICByZXR1cm4gcGVnJGNvbXB1dGVMb2NhdGlvbihwZWckc2F2ZWRQb3MsIHBlZyRjdXJyUG9zKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4cGVjdGVkKGRlc2NyaXB0aW9uLCBsb2NhdGlvbikge1xuICAgIGxvY2F0aW9uID0gbG9jYXRpb24gIT09IHZvaWQgMCA/IGxvY2F0aW9uIDogcGVnJGNvbXB1dGVMb2NhdGlvbihwZWckc2F2ZWRQb3MsIHBlZyRjdXJyUG9zKVxuXG4gICAgdGhyb3cgcGVnJGJ1aWxkU3RydWN0dXJlZEVycm9yKFxuICAgICAgW3BlZyRvdGhlckV4cGVjdGF0aW9uKGRlc2NyaXB0aW9uKV0sXG4gICAgICBpbnB1dC5zdWJzdHJpbmcocGVnJHNhdmVkUG9zLCBwZWckY3VyclBvcyksXG4gICAgICBsb2NhdGlvblxuICAgICk7XG4gIH1cblxuICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlLCBsb2NhdGlvbikge1xuICAgIGxvY2F0aW9uID0gbG9jYXRpb24gIT09IHZvaWQgMCA/IGxvY2F0aW9uIDogcGVnJGNvbXB1dGVMb2NhdGlvbihwZWckc2F2ZWRQb3MsIHBlZyRjdXJyUG9zKVxuXG4gICAgdGhyb3cgcGVnJGJ1aWxkU2ltcGxlRXJyb3IobWVzc2FnZSwgbG9jYXRpb24pO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJGxpdGVyYWxFeHBlY3RhdGlvbih0ZXh0LCBpZ25vcmVDYXNlKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJsaXRlcmFsXCIsIHRleHQ6IHRleHQsIGlnbm9yZUNhc2U6IGlnbm9yZUNhc2UgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRjbGFzc0V4cGVjdGF0aW9uKHBhcnRzLCBpbnZlcnRlZCwgaWdub3JlQ2FzZSkge1xuICAgIHJldHVybiB7IHR5cGU6IFwiY2xhc3NcIiwgcGFydHM6IHBhcnRzLCBpbnZlcnRlZDogaW52ZXJ0ZWQsIGlnbm9yZUNhc2U6IGlnbm9yZUNhc2UgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRhbnlFeHBlY3RhdGlvbigpIHtcbiAgICByZXR1cm4geyB0eXBlOiBcImFueVwiIH07XG4gIH1cblxuICBmdW5jdGlvbiBwZWckZW5kRXhwZWN0YXRpb24oKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJlbmRcIiB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJG90aGVyRXhwZWN0YXRpb24oZGVzY3JpcHRpb24pIHtcbiAgICByZXR1cm4geyB0eXBlOiBcIm90aGVyXCIsIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbiB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJGNvbXB1dGVQb3NEZXRhaWxzKHBvcykge1xuICAgIHZhciBkZXRhaWxzID0gcGVnJHBvc0RldGFpbHNDYWNoZVtwb3NdLCBwO1xuXG4gICAgaWYgKGRldGFpbHMpIHtcbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH0gZWxzZSB7XG4gICAgICBwID0gcG9zIC0gMTtcbiAgICAgIHdoaWxlICghcGVnJHBvc0RldGFpbHNDYWNoZVtwXSkge1xuICAgICAgICBwLS07XG4gICAgICB9XG5cbiAgICAgIGRldGFpbHMgPSBwZWckcG9zRGV0YWlsc0NhY2hlW3BdO1xuICAgICAgZGV0YWlscyA9IHtcbiAgICAgICAgbGluZTogICBkZXRhaWxzLmxpbmUsXG4gICAgICAgIGNvbHVtbjogZGV0YWlscy5jb2x1bW5cbiAgICAgIH07XG5cbiAgICAgIHdoaWxlIChwIDwgcG9zKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHApID09PSAxMCkge1xuICAgICAgICAgIGRldGFpbHMubGluZSsrO1xuICAgICAgICAgIGRldGFpbHMuY29sdW1uID0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZXRhaWxzLmNvbHVtbisrO1xuICAgICAgICB9XG5cbiAgICAgICAgcCsrO1xuICAgICAgfVxuXG4gICAgICBwZWckcG9zRGV0YWlsc0NhY2hlW3Bvc10gPSBkZXRhaWxzO1xuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGVnJGNvbXB1dGVMb2NhdGlvbihzdGFydFBvcywgZW5kUG9zKSB7XG4gICAgdmFyIHN0YXJ0UG9zRGV0YWlscyA9IHBlZyRjb21wdXRlUG9zRGV0YWlscyhzdGFydFBvcyksXG4gICAgICAgIGVuZFBvc0RldGFpbHMgICA9IHBlZyRjb21wdXRlUG9zRGV0YWlscyhlbmRQb3MpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXJ0OiB7XG4gICAgICAgIG9mZnNldDogc3RhcnRQb3MsXG4gICAgICAgIGxpbmU6ICAgc3RhcnRQb3NEZXRhaWxzLmxpbmUsXG4gICAgICAgIGNvbHVtbjogc3RhcnRQb3NEZXRhaWxzLmNvbHVtblxuICAgICAgfSxcbiAgICAgIGVuZDoge1xuICAgICAgICBvZmZzZXQ6IGVuZFBvcyxcbiAgICAgICAgbGluZTogICBlbmRQb3NEZXRhaWxzLmxpbmUsXG4gICAgICAgIGNvbHVtbjogZW5kUG9zRGV0YWlscy5jb2x1bW5cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJGZhaWwoZXhwZWN0ZWQpIHtcbiAgICBpZiAocGVnJGN1cnJQb3MgPCBwZWckbWF4RmFpbFBvcykgeyByZXR1cm47IH1cblxuICAgIGlmIChwZWckY3VyclBvcyA+IHBlZyRtYXhGYWlsUG9zKSB7XG4gICAgICBwZWckbWF4RmFpbFBvcyA9IHBlZyRjdXJyUG9zO1xuICAgICAgcGVnJG1heEZhaWxFeHBlY3RlZCA9IFtdO1xuICAgIH1cblxuICAgIHBlZyRtYXhGYWlsRXhwZWN0ZWQucHVzaChleHBlY3RlZCk7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckYnVpbGRTaW1wbGVFcnJvcihtZXNzYWdlLCBsb2NhdGlvbikge1xuICAgIHJldHVybiBuZXcgcGVnJFN5bnRheEVycm9yKG1lc3NhZ2UsIG51bGwsIG51bGwsIGxvY2F0aW9uKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRidWlsZFN0cnVjdHVyZWRFcnJvcihleHBlY3RlZCwgZm91bmQsIGxvY2F0aW9uKSB7XG4gICAgcmV0dXJuIG5ldyBwZWckU3ludGF4RXJyb3IoXG4gICAgICBwZWckU3ludGF4RXJyb3IuYnVpbGRNZXNzYWdlKGV4cGVjdGVkLCBmb3VuZCksXG4gICAgICBleHBlY3RlZCxcbiAgICAgIGZvdW5kLFxuICAgICAgbG9jYXRpb25cbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlVG9wVHlwZUV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAwLFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJHBhcnNlXygpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VWYXJpYWRpY1R5cGVFeHByKCk7XG4gICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VVbmlvblR5cGVFeHByKCk7XG4gICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyID0gcGVnJHBhcnNlVW5hcnlVbmlvblR5cGVFeHByKCk7XG4gICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMiA9IHBlZyRwYXJzZUFycmF5VHlwZUV4cHIoKTtcbiAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZUdlbmVyaWNUeXBlRXhwcigpO1xuICAgICAgICAgICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZVJlY29yZFR5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZVR1cGxlVHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZUFycm93VHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgczIgPSBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZVR5cGVRdWVyeUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZUJyb2FkTmFtZXBhdGhFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlUGFyZW50aGVzaXplZEV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlVmFsdWVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczIgPSBwZWckcGFyc2VBbnlUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZVVua25vd25UeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGMwKHMyKTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlVG9wTGV2ZWwoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAxLFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJHBhcnNlXygpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VWYXJpYWRpY1R5cGVFeHByKCk7XG4gICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VVbmlvblR5cGVFeHByKCk7XG4gICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyID0gcGVnJHBhcnNlVW5hcnlVbmlvblR5cGVFeHByKCk7XG4gICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMiA9IHBlZyRwYXJzZUFycmF5VHlwZUV4cHIoKTtcbiAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZUdlbmVyaWNUeXBlRXhwcigpO1xuICAgICAgICAgICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZVJlY29yZFR5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZVR1cGxlVHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZUFycm93VHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgczIgPSBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZVR5cGVRdWVyeUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZUJyb2FkTmFtZXBhdGhFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlUGFyZW50aGVzaXplZEV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMyID0gcGVnJHBhcnNlVmFsdWVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczIgPSBwZWckcGFyc2VBbnlUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRwYXJzZVVua25vd25UeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGMwKHMyKTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlXygpIHtcbiAgICB2YXIgczAsIHMxO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAyLFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IFtdO1xuICAgIGlmIChwZWckYzEudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgczEgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzIpOyB9XG4gICAgfVxuICAgIHdoaWxlIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAucHVzaChzMSk7XG4gICAgICBpZiAocGVnJGMxLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgczEgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMik7IH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VKc0lkZW50aWZpZXIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNDtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMyxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChwZWckYzMudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgczIgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQpOyB9XG4gICAgfVxuICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczMgPSBbXTtcbiAgICAgIGlmIChwZWckYzUudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICBzNCA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2KTsgfVxuICAgICAgfVxuICAgICAgd2hpbGUgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMzLnB1c2goczQpO1xuICAgICAgICBpZiAocGVnJGM1LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICBzNCA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzYpOyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IFtzMiwgczNdO1xuICAgICAgICBzMSA9IHMyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gaW5wdXQuc3Vic3RyaW5nKHMwLCBwZWckY3VyclBvcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMwID0gczE7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlTmFtZXBhdGhFeHByKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNiwgczcsIHM4LCBzOTtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNCxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZVBhcmVudGhlc2l6ZWRFeHByKCk7XG4gICAgaWYgKHMxID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMSA9IHBlZyRwYXJzZUltcG9ydFR5cGVFeHByKCk7XG4gICAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczEgPSBwZWckcGFyc2VUeXBlTmFtZUV4cHIoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IFtdO1xuICAgICAgczMgPSBwZWckY3VyclBvcztcbiAgICAgIHM0ID0gcGVnJHBhcnNlXygpO1xuICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHM1ID0gcGVnJHBhcnNlSW5maXhOYW1lcGF0aE9wZXJhdG9yKCk7XG4gICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM2ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgNikgPT09IHBlZyRjNykge1xuICAgICAgICAgICAgICBzNyA9IHBlZyRjNztcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gNjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHM3ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzgpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczcgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczcgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHM3ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM4ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICBpZiAoczggIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzOSA9IHBlZyRwYXJzZU1lbWJlck5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAoczkgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHM0ID0gW3M0LCBzNSwgczYsIHM3LCBzOCwgczldO1xuICAgICAgICAgICAgICAgICAgczMgPSBzNDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMi5wdXNoKHMzKTtcbiAgICAgICAgczMgPSBwZWckY3VyclBvcztcbiAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM1ID0gcGVnJHBhcnNlSW5maXhOYW1lcGF0aE9wZXJhdG9yKCk7XG4gICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA2KSA9PT0gcGVnJGM3KSB7XG4gICAgICAgICAgICAgICAgczcgPSBwZWckYzc7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gNjtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzNyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzgpOyB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHM3ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczcgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHM4ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICAgIGlmIChzOCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgczkgPSBwZWckcGFyc2VNZW1iZXJOYW1lKCk7XG4gICAgICAgICAgICAgICAgICBpZiAoczkgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczQgPSBbczQsIHM1LCBzNiwgczcsIHM4LCBzOV07XG4gICAgICAgICAgICAgICAgICAgIHMzID0gczQ7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgIHMxID0gcGVnJGM5KHMxLCBzMik7XG4gICAgICAgIHMwID0gczE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlVHlwZU5hbWVFeHByKCkge1xuICAgIHZhciBzMDtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNSxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckcGFyc2VUeXBlTmFtZUV4cHJKc0RvY0ZsYXZvcmVkKCk7XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRwYXJzZVR5cGVOYW1lRXhwclN0cmljdCgpO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVR5cGVOYW1lRXhwclN0cmljdCgpIHtcbiAgICB2YXIgczAsIHMxO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA2LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJHBhcnNlSnNJZGVudGlmaWVyKCk7XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgIHMxID0gcGVnJGMxMChzMSk7XG4gICAgfVxuICAgIHMwID0gczE7XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VUeXBlTmFtZUV4cHJKc0RvY0ZsYXZvcmVkKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA3LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJGN1cnJQb3M7XG4gICAgczIgPSBwZWckY3VyclBvcztcbiAgICBpZiAocGVnJGMzLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgIHMzID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM0KTsgfVxuICAgIH1cbiAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHM0ID0gW107XG4gICAgICBpZiAocGVnJGMxMS50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgIHM1ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzEyKTsgfVxuICAgICAgfVxuICAgICAgd2hpbGUgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHM0LnB1c2goczUpO1xuICAgICAgICBpZiAocGVnJGMxMS50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgczUgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMik7IH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMzID0gW3MzLCBzNF07XG4gICAgICAgIHMyID0gczM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczEgPSBpbnB1dC5zdWJzdHJpbmcoczEsIHBlZyRjdXJyUG9zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBzMjtcbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgIHMxID0gcGVnJGMxMyhzMSk7XG4gICAgfVxuICAgIHMwID0gczE7XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VNZW1iZXJOYW1lKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQ7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDgsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAzOSkge1xuICAgICAgczEgPSBwZWckYzE0O1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzE1KTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMyA9IFtdO1xuICAgICAgaWYgKHBlZyRjMTYudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICBzNCA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxNyk7IH1cbiAgICAgIH1cbiAgICAgIHdoaWxlIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMy5wdXNoKHM0KTtcbiAgICAgICAgaWYgKHBlZyRjMTYudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgIHM0ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTcpOyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IGlucHV0LnN1YnN0cmluZyhzMiwgcGVnJGN1cnJQb3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczIgPSBzMztcbiAgICAgIH1cbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM5KSB7XG4gICAgICAgICAgczMgPSBwZWckYzE0O1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxNSk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICBzMSA9IHBlZyRjMTgoczIpO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAzNCkge1xuICAgICAgICBzMSA9IHBlZyRjMTk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMyMCk7IH1cbiAgICAgIH1cbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMyA9IFtdO1xuICAgICAgICBpZiAocGVnJGMyMS50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgczQgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczQgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMyMik7IH1cbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMy5wdXNoKHM0KTtcbiAgICAgICAgICBpZiAocGVnJGMyMS50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgICBzNCA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMjIpOyB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyID0gaW5wdXQuc3Vic3RyaW5nKHMyLCBwZWckY3VyclBvcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczIgPSBzMztcbiAgICAgICAgfVxuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM0KSB7XG4gICAgICAgICAgICBzMyA9IHBlZyRjMTk7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMjApOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICBzMSA9IHBlZyRjMTgoczIpO1xuICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMCA9IHBlZyRwYXJzZUpzSWRlbnRpZmllcigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZUluZml4TmFtZXBhdGhPcGVyYXRvcigpIHtcbiAgICB2YXIgczA7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDksXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJHBhcnNlTWVtYmVyVHlwZU9wZXJhdG9yKCk7XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRwYXJzZUluc3RhbmNlTWVtYmVyVHlwZU9wZXJhdG9yKCk7XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczAgPSBwZWckcGFyc2VJbm5lck1lbWJlclR5cGVPcGVyYXRvcigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVF1YWxpZmllZE1lbWJlck5hbWUoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczUsIHM2LCBzNztcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMTAsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2VUeXBlTmFtZUV4cHIoKTtcbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gW107XG4gICAgICBzMyA9IHBlZyRjdXJyUG9zO1xuICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0Nikge1xuICAgICAgICAgIHM1ID0gcGVnJGMyMztcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMjQpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczYgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNyA9IHBlZyRwYXJzZVR5cGVOYW1lRXhwcigpO1xuICAgICAgICAgICAgaWYgKHM3ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM0ID0gW3M0LCBzNSwgczYsIHM3XTtcbiAgICAgICAgICAgICAgczMgPSBzNDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMi5wdXNoKHMzKTtcbiAgICAgICAgczMgPSBwZWckY3VyclBvcztcbiAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDYpIHtcbiAgICAgICAgICAgIHM1ID0gcGVnJGMyMztcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMyNCk7IH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzNyA9IHBlZyRwYXJzZVR5cGVOYW1lRXhwcigpO1xuICAgICAgICAgICAgICBpZiAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzNCA9IFtzNCwgczUsIHM2LCBzN107XG4gICAgICAgICAgICAgICAgczMgPSBzNDtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjMjUoczEsIHMyKTtcbiAgICAgICAgczAgPSBzMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VNZW1iZXJUeXBlT3BlcmF0b3IoKSB7XG4gICAgdmFyIHMwLCBzMTtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMTEsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0Nikge1xuICAgICAgczEgPSBwZWckYzIzO1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzI0KTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgczEgPSBwZWckYzI2KCk7XG4gICAgfVxuICAgIHMwID0gczE7XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VJbm5lck1lbWJlclR5cGVPcGVyYXRvcigpIHtcbiAgICB2YXIgczAsIHMxO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAxMixcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEyNikge1xuICAgICAgczEgPSBwZWckYzI3O1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzI4KTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgczEgPSBwZWckYzI5KCk7XG4gICAgfVxuICAgIHMwID0gczE7XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VJbnN0YW5jZU1lbWJlclR5cGVPcGVyYXRvcigpIHtcbiAgICB2YXIgczAsIHMxO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAxMyxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM1KSB7XG4gICAgICBzMSA9IHBlZyRjMzA7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMzEpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICBzMSA9IHBlZyRjMzIoKTtcbiAgICB9XG4gICAgczAgPSBzMTtcblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZUJyb2FkTmFtZXBhdGhFeHByKCkge1xuICAgIHZhciBzMDtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMTQsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJHBhcnNlRXh0ZXJuYWxOYW1lRXhwcigpO1xuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckcGFyc2VNb2R1bGVOYW1lRXhwcigpO1xuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMwID0gcGVnJHBhcnNlTmFtZXBhdGhFeHByKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlRXh0ZXJuYWxOYW1lRXhwcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNTtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMTUsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgOCkgPT09IHBlZyRjMzMpIHtcbiAgICAgIHMxID0gcGVnJGMzMztcbiAgICAgIHBlZyRjdXJyUG9zICs9IDg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMzNCk7IH1cbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDU4KSB7XG4gICAgICAgICAgczMgPSBwZWckYzM1O1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMzNik7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM1ID0gcGVnJHBhcnNlTmFtZXBhdGhFeHByKCk7XG4gICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgIHMxID0gcGVnJGMzNyhzNSk7XG4gICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlTW9kdWxlTmFtZUV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczU7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDE2LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDYpID09PSBwZWckYzM4KSB7XG4gICAgICBzMSA9IHBlZyRjMzg7XG4gICAgICBwZWckY3VyclBvcyArPSA2O1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMzkpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA1OCkge1xuICAgICAgICAgIHMzID0gcGVnJGMzNTtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMzYpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNSA9IHBlZyRwYXJzZU1vZHVsZVBhdGhFeHByKCk7XG4gICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgIHMxID0gcGVnJGM0MChzNSk7XG4gICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlTW9kdWxlUGF0aEV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczUsIHM2LCBzNywgczgsIHM5O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAxNyxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZUZpbGVQYXRoRXhwcigpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBbXTtcbiAgICAgIHMzID0gcGVnJGN1cnJQb3M7XG4gICAgICBzNCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzNSA9IHBlZyRwYXJzZUluZml4TmFtZXBhdGhPcGVyYXRvcigpO1xuICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDYpID09PSBwZWckYzcpIHtcbiAgICAgICAgICAgICAgczcgPSBwZWckYzc7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDY7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzNyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM4KTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHM3ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM3ID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzOCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgaWYgKHM4ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczkgPSBwZWckcGFyc2VNZW1iZXJOYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHM5ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICBzNCA9IFtzNCwgczUsIHM2LCBzNywgczgsIHM5XTtcbiAgICAgICAgICAgICAgICAgIHMzID0gczQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgICB3aGlsZSAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIucHVzaChzMyk7XG4gICAgICAgIHMzID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIHM0ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNSA9IHBlZyRwYXJzZUluZml4TmFtZXBhdGhPcGVyYXRvcigpO1xuICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczYgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgNikgPT09IHBlZyRjNykge1xuICAgICAgICAgICAgICAgIHM3ID0gcGVnJGM3O1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDY7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgczcgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM4KTsgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChzNyA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHM3ID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzOCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgICBpZiAoczggIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHM5ID0gcGVnJHBhcnNlTWVtYmVyTmFtZSgpO1xuICAgICAgICAgICAgICAgICAgaWYgKHM5ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHM0ID0gW3M0LCBzNSwgczYsIHM3LCBzOCwgczldO1xuICAgICAgICAgICAgICAgICAgICBzMyA9IHM0O1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjNDEoczEsIHMyKTtcbiAgICAgICAgczAgPSBzMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VGaWxlUGF0aEV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAxOCxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRjdXJyUG9zO1xuICAgIHMyID0gW107XG4gICAgaWYgKHBlZyRjNDIudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgczMgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQzKTsgfVxuICAgIH1cbiAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHdoaWxlIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMi5wdXNoKHMzKTtcbiAgICAgICAgaWYgKHBlZyRjNDIudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgIHMzID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNDMpOyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgIH1cbiAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMxID0gaW5wdXQuc3Vic3RyaW5nKHMxLCBwZWckY3VyclBvcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gczI7XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICBzMSA9IHBlZyRjNDQoczEpO1xuICAgIH1cbiAgICBzMCA9IHMxO1xuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlQW55VHlwZUV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMTtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMTksXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0Mikge1xuICAgICAgczEgPSBwZWckYzQ1O1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQ2KTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgczEgPSBwZWckYzQ3KCk7XG4gICAgfVxuICAgIHMwID0gczE7XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VVbmtub3duVHlwZUV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMTtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMjAsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA2Mykge1xuICAgICAgczEgPSBwZWckYzQ4O1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQ5KTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgczEgPSBwZWckYzUwKCk7XG4gICAgfVxuICAgIHMwID0gczE7XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VWYWx1ZUV4cHIoKSB7XG4gICAgdmFyIHMwO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAyMSxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckcGFyc2VTdHJpbmdMaXRlcmFsRXhwcigpO1xuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckcGFyc2VOdW1iZXJMaXRlcmFsRXhwcigpO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVN0cmluZ0xpdGVyYWxFeHByKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNjtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMjIsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAzNCkge1xuICAgICAgczEgPSBwZWckYzE5O1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzIwKTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMyA9IFtdO1xuICAgICAgaWYgKHBlZyRjNTEudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICBzNCA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM1Mik7IH1cbiAgICAgIH1cbiAgICAgIGlmIChzNCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzNCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDkyKSB7XG4gICAgICAgICAgczUgPSBwZWckYzUzO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM1NCk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQubGVuZ3RoID4gcGVnJGN1cnJQb3MpIHtcbiAgICAgICAgICAgIHM2ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHM2ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM1NSk7IH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNSA9IFtzNSwgczZdO1xuICAgICAgICAgICAgczQgPSBzNTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNDtcbiAgICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNDtcbiAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHdoaWxlIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMy5wdXNoKHM0KTtcbiAgICAgICAgaWYgKHBlZyRjNTEudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgIHM0ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTIpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHM0ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczQgPSBwZWckY3VyclBvcztcbiAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDkyKSB7XG4gICAgICAgICAgICBzNSA9IHBlZyRjNTM7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTQpOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IHBlZyRjdXJyUG9zKSB7XG4gICAgICAgICAgICAgIHM2ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHM2ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzU1KTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM1ID0gW3M1LCBzNl07XG4gICAgICAgICAgICAgIHM0ID0gczU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHM0O1xuICAgICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczQ7XG4gICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBpbnB1dC5zdWJzdHJpbmcoczIsIHBlZyRjdXJyUG9zKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMyID0gczM7XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAzNCkge1xuICAgICAgICAgIHMzID0gcGVnJGMxOTtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMjApOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgczEgPSBwZWckYzU2KHMyKTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMzkpIHtcbiAgICAgICAgczEgPSBwZWckYzE0O1xuICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTUpOyB9XG4gICAgICB9XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckY3VyclBvcztcbiAgICAgICAgczMgPSBbXTtcbiAgICAgICAgaWYgKHBlZyRjNTcudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgIHM0ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTgpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHM0ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczQgPSBwZWckY3VyclBvcztcbiAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDkyKSB7XG4gICAgICAgICAgICBzNSA9IHBlZyRjNTM7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTQpOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IHBlZyRjdXJyUG9zKSB7XG4gICAgICAgICAgICAgIHM2ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHM2ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzU1KTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM1ID0gW3M1LCBzNl07XG4gICAgICAgICAgICAgIHM0ID0gczU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHM0O1xuICAgICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczQ7XG4gICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMzLnB1c2goczQpO1xuICAgICAgICAgIGlmIChwZWckYzU3LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgIHM0ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM1OCk7IH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHM0ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA5Mikge1xuICAgICAgICAgICAgICBzNSA9IHBlZyRjNTM7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM1NCk7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBpZiAoaW5wdXQubGVuZ3RoID4gcGVnJGN1cnJQb3MpIHtcbiAgICAgICAgICAgICAgICBzNiA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzNiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzU1KTsgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHM1ID0gW3M1LCBzNl07XG4gICAgICAgICAgICAgICAgczQgPSBzNTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHM0O1xuICAgICAgICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNDtcbiAgICAgICAgICAgICAgczQgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMiA9IGlucHV0LnN1YnN0cmluZyhzMiwgcGVnJGN1cnJQb3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMyID0gczM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAzOSkge1xuICAgICAgICAgICAgczMgPSBwZWckYzE0O1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzE1KTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgICAgczEgPSBwZWckYzU5KHMyKTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlTnVtYmVyTGl0ZXJhbEV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMTtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMjMsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2VCaW5OdW1iZXJMaXRlcmFsRXhwcigpO1xuICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczEgPSBwZWckcGFyc2VPY3ROdW1iZXJMaXRlcmFsRXhwcigpO1xuICAgICAgaWYgKHMxID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMxID0gcGVnJHBhcnNlSGV4TnVtYmVyTGl0ZXJhbEV4cHIoKTtcbiAgICAgICAgaWYgKHMxID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczEgPSBwZWckcGFyc2VEZWNpbWFsTnVtYmVyTGl0ZXJhbEV4cHIoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgczEgPSBwZWckYzYwKHMxKTtcbiAgICB9XG4gICAgczAgPSBzMTtcblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZURlY2ltYWxOdW1iZXJMaXRlcmFsRXhwcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNSwgczYsIHM3O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAyNCxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDUpIHtcbiAgICAgIHMyID0gcGVnJGM2MTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2Mik7IH1cbiAgICB9XG4gICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IG51bGw7XG4gICAgfVxuICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczMgPSBbXTtcbiAgICAgIGlmIChwZWckYzYzLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgczQgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczQgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjQpOyB9XG4gICAgICB9XG4gICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgd2hpbGUgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMucHVzaChzNCk7XG4gICAgICAgICAgaWYgKHBlZyRjNjMudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgICAgczQgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczQgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzY0KTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHM0ID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDYpIHtcbiAgICAgICAgICBzNSA9IHBlZyRjMjM7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzI0KTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM2ID0gW107XG4gICAgICAgICAgaWYgKHBlZyRjNjMudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgICAgczcgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczcgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzY0KTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHdoaWxlIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzNi5wdXNoKHM3KTtcbiAgICAgICAgICAgICAgaWYgKHBlZyRjNjMudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgICAgICAgIHM3ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHM3ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjQpOyB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczYgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM1ID0gW3M1LCBzNl07XG4gICAgICAgICAgICBzNCA9IHM1O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHM0O1xuICAgICAgICAgICAgczQgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHM0O1xuICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczQgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIgPSBbczIsIHMzLCBzNF07XG4gICAgICAgICAgczEgPSBzMjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gaW5wdXQuc3Vic3RyaW5nKHMwLCBwZWckY3VyclBvcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMwID0gczE7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlQmluTnVtYmVyTGl0ZXJhbEV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczU7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDI1LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NSkge1xuICAgICAgczIgPSBwZWckYzYxO1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzYyKTsgfVxuICAgIH1cbiAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAyKSA9PT0gcGVnJGM2NSkge1xuICAgICAgICBzMyA9IHBlZyRjNjU7XG4gICAgICAgIHBlZyRjdXJyUG9zICs9IDI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2Nik7IH1cbiAgICAgIH1cbiAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzNCA9IFtdO1xuICAgICAgICBpZiAocGVnJGM2Ny50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgczUgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2OCk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICB3aGlsZSAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM0LnB1c2goczUpO1xuICAgICAgICAgICAgaWYgKHBlZyRjNjcudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgICAgICBzNSA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2OCk7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczQgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyID0gW3MyLCBzMywgczRdO1xuICAgICAgICAgIHMxID0gczI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczE7XG4gICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IGlucHV0LnN1YnN0cmluZyhzMCwgcGVnJGN1cnJQb3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMCA9IHMxO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZU9jdE51bWJlckxpdGVyYWxFeHByKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAyNixcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDUpIHtcbiAgICAgIHMyID0gcGVnJGM2MTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2Mik7IH1cbiAgICB9XG4gICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IG51bGw7XG4gICAgfVxuICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgMikgPT09IHBlZyRjNjkpIHtcbiAgICAgICAgczMgPSBwZWckYzY5O1xuICAgICAgICBwZWckY3VyclBvcyArPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNzApOyB9XG4gICAgICB9XG4gICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczQgPSBbXTtcbiAgICAgICAgaWYgKHBlZyRjNzEudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgIHM1ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNzIpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgd2hpbGUgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNC5wdXNoKHM1KTtcbiAgICAgICAgICAgIGlmIChwZWckYzcxLnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgICAgczUgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNzIpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMiA9IFtzMiwgczMsIHM0XTtcbiAgICAgICAgICBzMSA9IHMyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczE7XG4gICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczE7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBpbnB1dC5zdWJzdHJpbmcoczAsIHBlZyRjdXJyUG9zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgczAgPSBzMTtcbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VIZXhOdW1iZXJMaXRlcmFsRXhwcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNTtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMjcsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ1KSB7XG4gICAgICBzMiA9IHBlZyRjNjE7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjIpOyB9XG4gICAgfVxuICAgIGlmIChzMiA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDIpID09PSBwZWckYzczKSB7XG4gICAgICAgIHMzID0gcGVnJGM3MztcbiAgICAgICAgcGVnJGN1cnJQb3MgKz0gMjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzc0KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHM0ID0gW107XG4gICAgICAgIGlmIChwZWckYzc1LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICBzNSA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzc2KTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHdoaWxlIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczQucHVzaChzNSk7XG4gICAgICAgICAgICBpZiAocGVnJGM3NS50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgICAgIHM1ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzc2KTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIgPSBbczIsIHMzLCBzNF07XG4gICAgICAgICAgczEgPSBzMjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gaW5wdXQuc3Vic3RyaW5nKHMwLCBwZWckY3VyclBvcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMwID0gczE7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlVW5pb25UeXBlRXhwcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNTtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMjgsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2VVbmlvblR5cGVFeHByT3BlcmFuZCgpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VVbmlvblR5cGVPcGVyYXRvcigpO1xuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM1ID0gcGVnJHBhcnNlVW5pb25UeXBlRXhwcigpO1xuICAgICAgICAgICAgaWYgKHM1ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJHBhcnNlVW5pb25UeXBlRXhwck9wZXJhbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczEgPSBwZWckYzc3KHMxLCBzMywgczUpO1xuICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVVuaW9uVHlwZU9wZXJhdG9yKCkge1xuICAgIHZhciBzMDtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMjksXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJHBhcnNlVW5pb25UeXBlT3BlcmF0b3JDbG9zdXJlTGlicmFyeUZsYXZvcmVkKCk7XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRwYXJzZVVuaW9uVHlwZU9wZXJhdG9ySlNEdWNrRmxhdm9yZWQoKTtcbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VVbmlvblR5cGVPcGVyYXRvckNsb3N1cmVMaWJyYXJ5Rmxhdm9yZWQoKSB7XG4gICAgdmFyIHMwLCBzMTtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMzAsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMjQpIHtcbiAgICAgIHMxID0gcGVnJGM3ODtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM3OSk7IH1cbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgIHMxID0gcGVnJGM4MCgpO1xuICAgIH1cbiAgICBzMCA9IHMxO1xuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlVW5pb25UeXBlT3BlcmF0b3JKU0R1Y2tGbGF2b3JlZCgpIHtcbiAgICB2YXIgczAsIHMxO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAzMSxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ3KSB7XG4gICAgICBzMSA9IHBlZyRjODE7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjODIpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICBzMSA9IHBlZyRjODMoKTtcbiAgICB9XG4gICAgczAgPSBzMTtcblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVVuaW9uVHlwZUV4cHJPcGVyYW5kKCkge1xuICAgIHZhciBzMDtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMzIsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJHBhcnNlVW5hcnlVbmlvblR5cGVFeHByKCk7XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRwYXJzZVJlY29yZFR5cGVFeHByKCk7XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczAgPSBwZWckcGFyc2VUdXBsZVR5cGVFeHByKCk7XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMwID0gcGVnJHBhcnNlQXJyb3dUeXBlRXhwcigpO1xuICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByKCk7XG4gICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VQYXJlbnRoZXNpemVkRXhwcigpO1xuICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZVR5cGVRdWVyeUV4cHIoKTtcbiAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlR2VuZXJpY1R5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBcnJheVR5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQnJvYWROYW1lcGF0aEV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVmFsdWVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBbnlUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZVVua25vd25UeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlVW5hcnlVbmlvblR5cGVFeHByKCkge1xuICAgIHZhciBzMDtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgMzMsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJHBhcnNlU3VmZml4VW5hcnlVbmlvblR5cGVFeHByKCk7XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRwYXJzZVByZWZpeFVuYXJ5VW5pb25UeXBlRXhwcigpO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVByZWZpeFVuYXJ5VW5pb25UeXBlRXhwcigpIHtcbiAgICB2YXIgczA7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDM0LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRwYXJzZVByZWZpeE9wdGlvbmFsVHlwZUV4cHIoKTtcbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gcGVnJHBhcnNlUHJlZml4Tm90TnVsbGFibGVUeXBlRXhwcigpO1xuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMwID0gcGVnJHBhcnNlUHJlZml4TnVsbGFibGVUeXBlRXhwcigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVByZWZpeFVuYXJ5VW5pb25UeXBlRXhwck9wZXJhbmQoKSB7XG4gICAgdmFyIHMwO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAzNSxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckcGFyc2VHZW5lcmljVHlwZUV4cHIoKTtcbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gcGVnJHBhcnNlUmVjb3JkVHlwZUV4cHIoKTtcbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMCA9IHBlZyRwYXJzZVR1cGxlVHlwZUV4cHIoKTtcbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczAgPSBwZWckcGFyc2VBcnJvd1R5cGVFeHByKCk7XG4gICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUZ1bmN0aW9uVHlwZUV4cHIoKTtcbiAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZVBhcmVudGhlc2l6ZWRFeHByKCk7XG4gICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQnJvYWROYW1lcGF0aEV4cHIoKTtcbiAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVmFsdWVFeHByKCk7XG4gICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBbnlUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZVVua25vd25UeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlVHlwZVF1ZXJ5RXhwcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDM2LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDYpID09PSBwZWckYzg0KSB7XG4gICAgICBzMSA9IHBlZyRjODQ7XG4gICAgICBwZWckY3VyclBvcyArPSA2O1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjODUpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VRdWFsaWZpZWRNZW1iZXJOYW1lKCk7XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGM4NihzMSwgczMpO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VJbXBvcnRUeXBlRXhwcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNSwgczYsIHM3O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAzNyxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA2KSA9PT0gcGVnJGM4Nykge1xuICAgICAgczEgPSBwZWckYzg3O1xuICAgICAgcGVnJGN1cnJQb3MgKz0gNjtcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzg4KTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJHBhcnNlXygpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDApIHtcbiAgICAgICAgICBzMyA9IHBlZyRjODk7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzkwKTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM0ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczUgPSBwZWckcGFyc2VTdHJpbmdMaXRlcmFsRXhwcigpO1xuICAgICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM2ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQxKSB7XG4gICAgICAgICAgICAgICAgICBzNyA9IHBlZyRjOTE7XG4gICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBzNyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOTIpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICBzMSA9IHBlZyRjOTMoczEsIHM1KTtcbiAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlUHJlZml4TnVsbGFibGVUeXBlRXhwcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDM4LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNjMpIHtcbiAgICAgIHMxID0gcGVnJGM0ODtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM0OSk7IH1cbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMyA9IHBlZyRwYXJzZVByZWZpeFVuYXJ5VW5pb25UeXBlRXhwck9wZXJhbmQoKTtcbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgczEgPSBwZWckYzk0KHMxLCBzMyk7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVByZWZpeE5vdE51bGxhYmxlVHlwZUV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyAzOSxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDMzKSB7XG4gICAgICBzMSA9IHBlZyRjOTU7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOTYpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VQcmVmaXhVbmFyeVVuaW9uVHlwZUV4cHJPcGVyYW5kKCk7XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGM5NyhzMSwgczMpO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VQcmVmaXhPcHRpb25hbFR5cGVFeHByKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNDAsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA2MSkge1xuICAgICAgczEgPSBwZWckYzk4O1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzk5KTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJHBhcnNlXygpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMzID0gcGVnJHBhcnNlUHJlZml4VW5hcnlVbmlvblR5cGVFeHByT3BlcmFuZCgpO1xuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICBzMSA9IHBlZyRjMTAwKHMxLCBzMyk7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVN1ZmZpeFVuYXJ5VW5pb25UeXBlRXhwcigpIHtcbiAgICB2YXIgczA7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDQxLFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRwYXJzZVN1ZmZpeE9wdGlvbmFsVHlwZUV4cHIoKTtcbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gcGVnJHBhcnNlU3VmZml4TnVsbGFibGVUeXBlRXhwcigpO1xuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMwID0gcGVnJHBhcnNlU3VmZml4Tm90TnVsbGFibGVUeXBlRXhwcigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVN1ZmZpeFVuYXJ5VW5pb25UeXBlRXhwck9wZXJhbmQoKSB7XG4gICAgdmFyIHMwO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA0MixcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckcGFyc2VQcmVmaXhVbmFyeVVuaW9uVHlwZUV4cHIoKTtcbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gcGVnJHBhcnNlR2VuZXJpY1R5cGVFeHByKCk7XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczAgPSBwZWckcGFyc2VSZWNvcmRUeXBlRXhwcigpO1xuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMCA9IHBlZyRwYXJzZVR1cGxlVHlwZUV4cHIoKTtcbiAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQXJyb3dUeXBlRXhwcigpO1xuICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlRnVuY3Rpb25UeXBlRXhwcigpO1xuICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZVBhcmVudGhlc2l6ZWRFeHByKCk7XG4gICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUJyb2FkTmFtZXBhdGhFeHByKCk7XG4gICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VWYWx1ZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBbnlUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VVbmtub3duVHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VTdWZmaXhOdWxsYWJsZVR5cGVFeHByKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNDMsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2VTdWZmaXhVbmFyeVVuaW9uVHlwZUV4cHJPcGVyYW5kKCk7XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDYzKSB7XG4gICAgICAgICAgczMgPSBwZWckYzQ4O1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM0OSk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICBzMSA9IHBlZyRjMTAxKHMxLCBzMyk7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVN1ZmZpeE5vdE51bGxhYmxlVHlwZUV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA0NCxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZVN1ZmZpeFVuYXJ5VW5pb25UeXBlRXhwck9wZXJhbmQoKTtcbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJHBhcnNlXygpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMzMpIHtcbiAgICAgICAgICBzMyA9IHBlZyRjOTU7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzk2KTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGMxMDIoczEsIHMzKTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlU3VmZml4T3B0aW9uYWxUeXBlRXhwcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDQ1LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJHBhcnNlU3VmZml4TnVsbGFibGVUeXBlRXhwcigpO1xuICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczEgPSBwZWckcGFyc2VTdWZmaXhOb3ROdWxsYWJsZVR5cGVFeHByKCk7XG4gICAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczEgPSBwZWckcGFyc2VTdWZmaXhVbmFyeVVuaW9uVHlwZUV4cHJPcGVyYW5kKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA2MSkge1xuICAgICAgICAgIHMzID0gcGVnJGM5ODtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOTkpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgczEgPSBwZWckYzEwMyhzMSwgczMpO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VHZW5lcmljVHlwZUV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczUsIHM2LCBzNztcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNDYsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2VHZW5lcmljVHlwZUV4cHJPcGVyYW5kKCk7XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMyA9IHBlZyRwYXJzZUdlbmVyaWNUeXBlU3RhcnRUb2tlbigpO1xuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM1ID0gcGVnJHBhcnNlR2VuZXJpY1R5cGVFeHByVHlwZVBhcmFtTGlzdCgpO1xuICAgICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM2ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzNyA9IHBlZyRwYXJzZUdlbmVyaWNUeXBlRW5kVG9rZW4oKTtcbiAgICAgICAgICAgICAgICBpZiAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgczEgPSBwZWckYzEwNChzMSwgczMsIHM1KTtcbiAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlR2VuZXJpY1R5cGVFeHByT3BlcmFuZCgpIHtcbiAgICB2YXIgczA7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDQ3LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRwYXJzZVBhcmVudGhlc2l6ZWRFeHByKCk7XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRwYXJzZUJyb2FkTmFtZXBhdGhFeHByKCk7XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczAgPSBwZWckcGFyc2VWYWx1ZUV4cHIoKTtcbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczAgPSBwZWckcGFyc2VBbnlUeXBlRXhwcigpO1xuICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBwZWckcGFyc2VVbmtub3duVHlwZUV4cHIoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VHZW5lcmljVHlwZUV4cHJUeXBlUGFyYW1PcGVyYW5kKCkge1xuICAgIHZhciBzMDtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNDgsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJHBhcnNlVW5pb25UeXBlRXhwcigpO1xuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckcGFyc2VVbmFyeVVuaW9uVHlwZUV4cHIoKTtcbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMCA9IHBlZyRwYXJzZVJlY29yZFR5cGVFeHByKCk7XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMwID0gcGVnJHBhcnNlVHVwbGVUeXBlRXhwcigpO1xuICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBcnJvd1R5cGVFeHByKCk7XG4gICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByKCk7XG4gICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlUGFyZW50aGVzaXplZEV4cHIoKTtcbiAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQXJyYXlUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlR2VuZXJpY1R5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVHlwZVF1ZXJ5RXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VCcm9hZE5hbWVwYXRoRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVmFsdWVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQW55VHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVW5rbm93blR5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlR2VuZXJpY1R5cGVFeHByVHlwZVBhcmFtTGlzdCgpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNSwgczYsIHM3O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA0OSxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZUdlbmVyaWNUeXBlRXhwclR5cGVQYXJhbU9wZXJhbmQoKTtcbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gW107XG4gICAgICBzMyA9IHBlZyRjdXJyUG9zO1xuICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NCkge1xuICAgICAgICAgIHM1ID0gcGVnJGMxMDU7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzEwNik7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM3ID0gcGVnJHBhcnNlR2VuZXJpY1R5cGVFeHByVHlwZVBhcmFtT3BlcmFuZCgpO1xuICAgICAgICAgICAgaWYgKHM3ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM0ID0gW3M0LCBzNSwgczYsIHM3XTtcbiAgICAgICAgICAgICAgczMgPSBzNDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMi5wdXNoKHMzKTtcbiAgICAgICAgczMgPSBwZWckY3VyclBvcztcbiAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDQpIHtcbiAgICAgICAgICAgIHM1ID0gcGVnJGMxMDU7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTA2KTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM2ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM3ID0gcGVnJHBhcnNlR2VuZXJpY1R5cGVFeHByVHlwZVBhcmFtT3BlcmFuZCgpO1xuICAgICAgICAgICAgICBpZiAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzNCA9IFtzNCwgczUsIHM2LCBzN107XG4gICAgICAgICAgICAgICAgczMgPSBzNDtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjMTA3KHMxLCBzMik7XG4gICAgICAgIHMwID0gczE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlR2VuZXJpY1R5cGVTdGFydFRva2VuKCkge1xuICAgIHZhciBzMDtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNTAsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJHBhcnNlR2VuZXJpY1R5cGVFY21hU2NyaXB0Rmxhdm9yZWRTdGFydFRva2VuKCk7XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRwYXJzZUdlbmVyaWNUeXBlVHlwZVNjcmlwdEZsYXZvcmVkU3RhcnRUb2tlbigpO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZUdlbmVyaWNUeXBlRWNtYVNjcmlwdEZsYXZvcmVkU3RhcnRUb2tlbigpIHtcbiAgICB2YXIgczAsIHMxO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA1MSxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAyKSA9PT0gcGVnJGMxMDgpIHtcbiAgICAgIHMxID0gcGVnJGMxMDg7XG4gICAgICBwZWckY3VyclBvcyArPSAyO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTA5KTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgczEgPSBwZWckYzExMCgpO1xuICAgIH1cbiAgICBzMCA9IHMxO1xuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlR2VuZXJpY1R5cGVUeXBlU2NyaXB0Rmxhdm9yZWRTdGFydFRva2VuKCkge1xuICAgIHZhciBzMCwgczE7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDUyLFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNjApIHtcbiAgICAgIHMxID0gcGVnJGMxMTE7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTEyKTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgczEgPSBwZWckYzExMygpO1xuICAgIH1cbiAgICBzMCA9IHMxO1xuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlR2VuZXJpY1R5cGVFbmRUb2tlbigpIHtcbiAgICB2YXIgczA7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDUzLFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDYyKSB7XG4gICAgICBzMCA9IHBlZyRjMTE0O1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzExNSk7IH1cbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VBcnJheVR5cGVFeHByKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNiwgczc7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDU0LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJHBhcnNlQXJyYXlUeXBlRXhwck9wZXJhbmQoKTtcbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gW107XG4gICAgICBzMyA9IHBlZyRjdXJyUG9zO1xuICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA5MSkge1xuICAgICAgICAgIHM1ID0gcGVnJGMxMTY7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzExNyk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTMpIHtcbiAgICAgICAgICAgICAgczcgPSBwZWckYzExODtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHM3ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzExOSk7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzNCA9IFtzNCwgczUsIHM2LCBzN107XG4gICAgICAgICAgICAgIHMzID0gczQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgd2hpbGUgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIucHVzaChzMyk7XG4gICAgICAgICAgczMgPSBwZWckY3VyclBvcztcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTEpIHtcbiAgICAgICAgICAgICAgczUgPSBwZWckYzExNjtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzExNyk7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzNiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA5Mykge1xuICAgICAgICAgICAgICAgICAgczcgPSBwZWckYzExODtcbiAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHM3ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMTkpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgczQgPSBbczQsIHM1LCBzNiwgczddO1xuICAgICAgICAgICAgICAgICAgczMgPSBzNDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgczEgPSBwZWckYzEyMChzMSwgczIpO1xuICAgICAgICBzMCA9IHMxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZUFycmF5VHlwZUV4cHJPcGVyYW5kKCkge1xuICAgIHZhciBzMDtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNTUsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJHBhcnNlVW5hcnlVbmlvblR5cGVFeHByKCk7XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRwYXJzZVJlY29yZFR5cGVFeHByKCk7XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczAgPSBwZWckcGFyc2VUdXBsZVR5cGVFeHByKCk7XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMwID0gcGVnJHBhcnNlQXJyb3dUeXBlRXhwcigpO1xuICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByKCk7XG4gICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VQYXJlbnRoZXNpemVkRXhwcigpO1xuICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUdlbmVyaWNUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VUeXBlUXVlcnlFeHByKCk7XG4gICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VCcm9hZE5hbWVwYXRoRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZVZhbHVlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBbnlUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVW5rbm93blR5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlQXJyb3dUeXBlRXhwcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNSwgczYsIHM3O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA1NixcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAzKSA9PT0gcGVnJGMxMjEpIHtcbiAgICAgIHMxID0gcGVnJGMxMjE7XG4gICAgICBwZWckY3VyclBvcyArPSAzO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTIyKTsgfVxuICAgIH1cbiAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMxID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMyA9IHBlZyRwYXJzZUFycm93VHlwZUV4cHJQYXJhbXNMaXN0KCk7XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM0ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgMikgPT09IHBlZyRjMTIzKSB7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJGMxMjM7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMjQpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczYgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHM3ID0gcGVnJHBhcnNlRnVuY3Rpb25UeXBlRXhwclJldHVybmFibGVPcGVyYW5kKCk7XG4gICAgICAgICAgICAgICAgaWYgKHM3ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgIHMxID0gcGVnJGMxMjUoczEsIHMzLCBzNyk7XG4gICAgICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZUFycm93VHlwZUV4cHJQYXJhbXNMaXN0KCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA1NyxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQwKSB7XG4gICAgICBzMSA9IHBlZyRjODk7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOTApOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VBcnJvd1R5cGVFeHByUGFyYW1zKCk7XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM0ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0MSkge1xuICAgICAgICAgICAgICBzNSA9IHBlZyRjOTE7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM5Mik7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczEgPSBwZWckYzEyNihzMyk7XG4gICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDApIHtcbiAgICAgICAgczEgPSBwZWckYzg5O1xuICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOTApOyB9XG4gICAgICB9XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDEpIHtcbiAgICAgICAgICAgIHMzID0gcGVnJGM5MTtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM5Mik7IH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgIHMxID0gcGVnJGMxMjcoKTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlQXJyb3dUeXBlRXhwclBhcmFtcygpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNSwgczYsIHM3LCBzOCwgczksIHMxMDtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNTgsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBbXTtcbiAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgIHMzID0gcGVnJHBhcnNlSnNJZGVudGlmaWVyKCk7XG4gICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzNCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDU4KSB7XG4gICAgICAgICAgczUgPSBwZWckYzM1O1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMzNik7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM3ID0gcGVnJHBhcnNlRnVuY3Rpb25UeXBlRXhwclBhcmFtT3BlcmFuZCgpO1xuICAgICAgICAgICAgaWYgKHM3ID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM3ID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzOCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgaWYgKHM4ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NCkge1xuICAgICAgICAgICAgICAgICAgczkgPSBwZWckYzEwNTtcbiAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHM5ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMDYpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzOSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgczEwID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICAgICAgaWYgKHMxMCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMyA9IFtzMywgczQsIHM1LCBzNiwgczcsIHM4LCBzOSwgczEwXTtcbiAgICAgICAgICAgICAgICAgICAgczIgPSBzMztcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgICAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICB9XG4gICAgd2hpbGUgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMS5wdXNoKHMyKTtcbiAgICAgIHMyID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMyA9IHBlZyRwYXJzZUpzSWRlbnRpZmllcigpO1xuICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHM0ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDU4KSB7XG4gICAgICAgICAgICBzNSA9IHBlZyRjMzU7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMzYpOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczYgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczcgPSBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByUGFyYW1PcGVyYW5kKCk7XG4gICAgICAgICAgICAgIGlmIChzNyA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHM3ID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzOCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgICBpZiAoczggIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDQpIHtcbiAgICAgICAgICAgICAgICAgICAgczkgPSBwZWckYzEwNTtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHM5ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzEwNik7IH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGlmIChzOSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMTAgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMTAgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzMyA9IFtzMywgczQsIHM1LCBzNiwgczcsIHM4LCBzOSwgczEwXTtcbiAgICAgICAgICAgICAgICAgICAgICBzMiA9IHMzO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VWYXJpYWRpY05hbWVFeHByKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgIHMxID0gcGVnJGMxMjgoczEsIHMyKTtcbiAgICAgICAgczAgPSBzMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VWYXJpYWRpY05hbWVFeHByKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNiwgczcsIHM4LCBzOTtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNTksXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgMykgPT09IHBlZyRjMTI5KSB7XG4gICAgICBzMSA9IHBlZyRjMTI5O1xuICAgICAgcGVnJGN1cnJQb3MgKz0gMztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzEzMCk7IH1cbiAgICB9XG4gICAgaWYgKHMxID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMSA9IG51bGw7XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VKc0lkZW50aWZpZXIoKTtcbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDU4KSB7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJGMzNTtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzM2KTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHM2ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzNyA9IHBlZyRwYXJzZUZ1bmN0aW9uVHlwZUV4cHJQYXJhbU9wZXJhbmQoKTtcbiAgICAgICAgICAgICAgICBpZiAoczcgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHM3ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHM3ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICBzOCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgICAgIGlmIChzOCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgczkgPSBwZWckYzEwNTtcbiAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIHM5ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTA2KTsgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzOSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgIHM5ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoczkgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRjMTMxKHMxLCBzMywgczcpO1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNiwgczcsIHM4O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA2MCxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA4KSA9PT0gcGVnJGMxMzIpIHtcbiAgICAgIHMxID0gcGVnJGMxMzI7XG4gICAgICBwZWckY3VyclBvcyArPSA4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTMzKTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJHBhcnNlXygpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMzID0gcGVnJHBhcnNlRnVuY3Rpb25UeXBlRXhwclBhcmFtc0xpc3QoKTtcbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNSA9IHBlZyRjdXJyUG9zO1xuICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA1OCkge1xuICAgICAgICAgICAgICBzNiA9IHBlZyRjMzU7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzNiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMzNik7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzNyA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgaWYgKHM3ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczggPSBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByUmV0dXJuYWJsZU9wZXJhbmQoKTtcbiAgICAgICAgICAgICAgICBpZiAoczggIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHM2ID0gW3M2LCBzNywgczhdO1xuICAgICAgICAgICAgICAgICAgczUgPSBzNjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNTtcbiAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzNTtcbiAgICAgICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczU7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzNSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgIHMxID0gcGVnJGMxMzQoczMsIHM1KTtcbiAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByUGFyYW1zTGlzdCgpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNSwgczYsIHM3LCBzOCwgczk7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDYxLFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDApIHtcbiAgICAgIHMxID0gcGVnJGM4OTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM5MCk7IH1cbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMyA9IHBlZyRwYXJzZUZ1bmN0aW9uVHlwZUV4cHJNb2RpZmllcigpO1xuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDQpIHtcbiAgICAgICAgICAgICAgczUgPSBwZWckYzEwNTtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzEwNik7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzNiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczcgPSBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByUGFyYW1zKCk7XG4gICAgICAgICAgICAgICAgaWYgKHM3ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICBzOCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgICAgICAgIGlmIChzOCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgczkgPSBwZWckYzkxO1xuICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgczkgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM5Mik7IH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoczkgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRjMTM1KHMzLCBzNyk7XG4gICAgICAgICAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQwKSB7XG4gICAgICAgIHMxID0gcGVnJGM4OTtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzkwKTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gcGVnJHBhcnNlXygpO1xuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IHBlZyRwYXJzZUZ1bmN0aW9uVHlwZUV4cHJNb2RpZmllcigpO1xuICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0MSkge1xuICAgICAgICAgICAgICAgIHM1ID0gcGVnJGM5MTtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOTIpOyB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczEgPSBwZWckYzEzNihzMyk7XG4gICAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDApIHtcbiAgICAgICAgICBzMSA9IHBlZyRjODk7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzkwKTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczMgPSBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByUGFyYW1zKCk7XG4gICAgICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDEpIHtcbiAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJGM5MTtcbiAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM5Mik7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgIHMxID0gcGVnJGMxMzcoczMpO1xuICAgICAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQwKSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRjODk7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOTApOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczIgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0MSkge1xuICAgICAgICAgICAgICAgIHMzID0gcGVnJGM5MTtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOTIpOyB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgczEgPSBwZWckYzEzOCgpO1xuICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByTW9kaWZpZXIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczUsIHM2O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA2MixcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDQpID09PSBwZWckYzEzOSkge1xuICAgICAgczIgPSBwZWckYzEzOTtcbiAgICAgIHBlZyRjdXJyUG9zICs9IDQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxNDApOyB9XG4gICAgfVxuICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczMgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA1OCkge1xuICAgICAgICAgIHM0ID0gcGVnJGMzNTtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMzYpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczUgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNiA9IHBlZyRwYXJzZUZ1bmN0aW9uVHlwZUV4cHJQYXJhbU9wZXJhbmQoKTtcbiAgICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzMiA9IFtzMiwgczMsIHM0LCBzNSwgczZdO1xuICAgICAgICAgICAgICBzMSA9IHMyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgczEgPSBwZWckYzE0MShzMSk7XG4gICAgfVxuICAgIHMwID0gczE7XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgczEgPSBwZWckY3VyclBvcztcbiAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDMpID09PSBwZWckYzEyMSkge1xuICAgICAgICBzMiA9IHBlZyRjMTIxO1xuICAgICAgICBwZWckY3VyclBvcyArPSAzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTIyKTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMzID0gcGVnJHBhcnNlXygpO1xuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDU4KSB7XG4gICAgICAgICAgICBzNCA9IHBlZyRjMzU7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMzYpOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczUgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczYgPSBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByUGFyYW1PcGVyYW5kKCk7XG4gICAgICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMyID0gW3MyLCBzMywgczQsIHM1LCBzNl07XG4gICAgICAgICAgICAgICAgczEgPSBzMjtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMxO1xuICAgICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMTtcbiAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjMTQyKHMxKTtcbiAgICAgIH1cbiAgICAgIHMwID0gczE7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlRnVuY3Rpb25UeXBlRXhwclBhcmFtcygpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNSwgczY7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDYzLFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gW107XG4gICAgczIgPSBwZWckY3VyclBvcztcbiAgICBzMyA9IHBlZyRwYXJzZUZ1bmN0aW9uVHlwZUV4cHJQYXJhbU9wZXJhbmQoKTtcbiAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHM0ID0gcGVnJHBhcnNlXygpO1xuICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDQpIHtcbiAgICAgICAgICBzNSA9IHBlZyRjMTA1O1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMDYpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczYgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMyA9IFtzMywgczQsIHM1LCBzNl07XG4gICAgICAgICAgICBzMiA9IHMzO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgIH1cbiAgICB3aGlsZSAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMxLnB1c2goczIpO1xuICAgICAgczIgPSBwZWckY3VyclBvcztcbiAgICAgIHMzID0gcGVnJHBhcnNlRnVuY3Rpb25UeXBlRXhwclBhcmFtT3BlcmFuZCgpO1xuICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHM0ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ0KSB7XG4gICAgICAgICAgICBzNSA9IHBlZyRjMTA1O1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzEwNik7IH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzNiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzMyA9IFtzMywgczQsIHM1LCBzNl07XG4gICAgICAgICAgICAgIHMyID0gczM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczI7XG4gICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VWYXJpYWRpY1R5cGVFeHByKCk7XG4gICAgICBpZiAoczIgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczIgPSBwZWckcGFyc2VWYXJpYWRpY1R5cGVFeHByT3BlcmFuZCgpO1xuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjMTQzKHMxLCBzMik7XG4gICAgICAgIHMwID0gczE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlRnVuY3Rpb25UeXBlRXhwclBhcmFtT3BlcmFuZCgpIHtcbiAgICB2YXIgczA7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDY0LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRwYXJzZVVuaW9uVHlwZUV4cHIoKTtcbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gcGVnJHBhcnNlVHlwZVF1ZXJ5RXhwcigpO1xuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMwID0gcGVnJHBhcnNlVW5hcnlVbmlvblR5cGVFeHByKCk7XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMwID0gcGVnJHBhcnNlUmVjb3JkVHlwZUV4cHIoKTtcbiAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVHVwbGVUeXBlRXhwcigpO1xuICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQXJyb3dUeXBlRXhwcigpO1xuICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUZ1bmN0aW9uVHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlUGFyZW50aGVzaXplZEV4cHIoKTtcbiAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUFycmF5VHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VHZW5lcmljVHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQnJvYWROYW1lcGF0aEV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZVZhbHVlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUFueVR5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZVVua25vd25UeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZUZ1bmN0aW9uVHlwZUV4cHJSZXR1cm5hYmxlT3BlcmFuZCgpIHtcbiAgICB2YXIgczA7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDY1LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRwYXJzZVByZWZpeFVuYXJ5VW5pb25UeXBlRXhwcigpO1xuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckcGFyc2VSZWNvcmRUeXBlRXhwcigpO1xuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMwID0gcGVnJHBhcnNlVHVwbGVUeXBlRXhwcigpO1xuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMCA9IHBlZyRwYXJzZUFycm93VHlwZUV4cHIoKTtcbiAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlRnVuY3Rpb25UeXBlRXhwcigpO1xuICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlUGFyZW50aGVzaXplZEV4cHIoKTtcbiAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBcnJheVR5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZVR5cGVRdWVyeUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUdlbmVyaWNUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUJyb2FkTmFtZXBhdGhFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZVZhbHVlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQW55VHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VVbmtub3duVHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVJlY29yZFR5cGVFeHByKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA2NixcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDEyMykge1xuICAgICAgczEgPSBwZWckYzE0NDtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxNDUpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VSZWNvcmRUeXBlRXhwckVudHJpZXMoKTtcbiAgICAgICAgaWYgKHMzID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczMgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM0ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAxMjUpIHtcbiAgICAgICAgICAgICAgczUgPSBwZWckYzE0NjtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzE0Nyk7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczEgPSBwZWckYzE0OChzMyk7XG4gICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlUmVjb3JkVHlwZUV4cHJFbnRyaWVzKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNiwgczc7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDY3LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJHBhcnNlUmVjb3JkVHlwZUV4cHJFbnRyeSgpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBbXTtcbiAgICAgIHMzID0gcGVnJGN1cnJQb3M7XG4gICAgICBzNCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ0KSB7XG4gICAgICAgICAgczUgPSBwZWckYzEwNTtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTA2KTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM2ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgIGlmIChzNiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczcgPSBwZWckcGFyc2VSZWNvcmRUeXBlRXhwckVudHJ5KCk7XG4gICAgICAgICAgICBpZiAoczcgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczQgPSBbczQsIHM1LCBzNiwgczddO1xuICAgICAgICAgICAgICBzMyA9IHM0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMztcbiAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgICAgd2hpbGUgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyLnB1c2goczMpO1xuICAgICAgICBzMyA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzNCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NCkge1xuICAgICAgICAgICAgczUgPSBwZWckYzEwNTtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMDYpOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczYgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczcgPSBwZWckcGFyc2VSZWNvcmRUeXBlRXhwckVudHJ5KCk7XG4gICAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHM0ID0gW3M0LCBzNSwgczYsIHM3XTtcbiAgICAgICAgICAgICAgICBzMyA9IHM0O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMzO1xuICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczM7XG4gICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgIHMxID0gcGVnJGMxNDkoczEsIHMyKTtcbiAgICAgICAgczAgPSBzMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VSZWNvcmRUeXBlRXhwckVudHJ5KCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA2OCxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZVJlY29yZFR5cGVFeHByRW50cnlLZXkoKTtcbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJHBhcnNlXygpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNTgpIHtcbiAgICAgICAgICBzMyA9IHBlZyRjMzU7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzM2KTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM0ID0gcGVnJHBhcnNlXygpO1xuICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczUgPSBwZWckcGFyc2VSZWNvcmRUeXBlRXhwckVudHJ5T3BlcmFuZCgpO1xuICAgICAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMSA9IHBlZyRjMTUwKHMxLCBzNSk7XG4gICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIHMxID0gcGVnJHBhcnNlUmVjb3JkVHlwZUV4cHJFbnRyeUtleSgpO1xuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjMTUxKHMxKTtcbiAgICAgIH1cbiAgICAgIHMwID0gczE7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlUmVjb3JkVHlwZUV4cHJFbnRyeUtleSgpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0O1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA2OSxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM0KSB7XG4gICAgICBzMSA9IHBlZyRjMTk7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMjApOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckY3VyclBvcztcbiAgICAgIHMzID0gW107XG4gICAgICBpZiAocGVnJGMyMS50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgIHM0ID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHM0ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzIyKTsgfVxuICAgICAgfVxuICAgICAgd2hpbGUgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMzLnB1c2goczQpO1xuICAgICAgICBpZiAocGVnJGMyMS50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgczQgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczQgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMyMik7IH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gaW5wdXQuc3Vic3RyaW5nKHMyLCBwZWckY3VyclBvcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMiA9IHMzO1xuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMzQpIHtcbiAgICAgICAgICBzMyA9IHBlZyRjMTk7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzIwKTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGMxNTIoczIpO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSAzOSkge1xuICAgICAgICBzMSA9IHBlZyRjMTQ7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxNSk7IH1cbiAgICAgIH1cbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBzMyA9IFtdO1xuICAgICAgICBpZiAocGVnJGMxNi50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgczQgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczQgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxNyk7IH1cbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMy5wdXNoKHM0KTtcbiAgICAgICAgICBpZiAocGVnJGMxNi50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgICBzNCA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzNCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTcpOyB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyID0gaW5wdXQuc3Vic3RyaW5nKHMyLCBwZWckY3VyclBvcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczIgPSBzMztcbiAgICAgICAgfVxuICAgICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM5KSB7XG4gICAgICAgICAgICBzMyA9IHBlZyRjMTQ7XG4gICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTUpOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICBzMSA9IHBlZyRjMTUyKHMyKTtcbiAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgICAgczEgPSBbXTtcbiAgICAgICAgaWYgKHBlZyRjNS50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgczIgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2KTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHdoaWxlIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczEucHVzaChzMik7XG4gICAgICAgICAgICBpZiAocGVnJGM1LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgICAgczIgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNik7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMwID0gaW5wdXQuc3Vic3RyaW5nKHMwLCBwZWckY3VyclBvcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVJlY29yZFR5cGVFeHByRW50cnlPcGVyYW5kKCkge1xuICAgIHZhciBzMDtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNzAsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJHBhcnNlVW5pb25UeXBlRXhwcigpO1xuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckcGFyc2VVbmFyeVVuaW9uVHlwZUV4cHIoKTtcbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMCA9IHBlZyRwYXJzZVJlY29yZFR5cGVFeHByKCk7XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMwID0gcGVnJHBhcnNlVHVwbGVUeXBlRXhwcigpO1xuICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBcnJvd1R5cGVFeHByKCk7XG4gICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByKCk7XG4gICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlUGFyZW50aGVzaXplZEV4cHIoKTtcbiAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQXJyYXlUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlR2VuZXJpY1R5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQnJvYWROYW1lcGF0aEV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVmFsdWVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBbnlUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZVVua25vd25UeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlVHVwbGVUeXBlRXhwcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNTtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNzEsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA5MSkge1xuICAgICAgczEgPSBwZWckYzExNjtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMTcpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VfKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VUdXBsZVR5cGVFeHByRW50cmllcygpO1xuICAgICAgICBpZiAoczMgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczQgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDkzKSB7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJGMxMTg7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzNSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMTkpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgIHMxID0gcGVnJGMxNTMoczMpO1xuICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVR1cGxlVHlwZUV4cHJFbnRyaWVzKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNjtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNzIsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBbXTtcbiAgICBzMiA9IHBlZyRjdXJyUG9zO1xuICAgIHMzID0gcGVnJHBhcnNlVHVwbGVUeXBlRXhwck9wZXJhbmQoKTtcbiAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHM0ID0gcGVnJHBhcnNlXygpO1xuICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDQpIHtcbiAgICAgICAgICBzNSA9IHBlZyRjMTA1O1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMDYpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHM1ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczYgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMyA9IFtzMywgczQsIHM1LCBzNl07XG4gICAgICAgICAgICBzMiA9IHMzO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgIH1cbiAgICB3aGlsZSAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMxLnB1c2goczIpO1xuICAgICAgczIgPSBwZWckY3VyclBvcztcbiAgICAgIHMzID0gcGVnJHBhcnNlVHVwbGVUeXBlRXhwck9wZXJhbmQoKTtcbiAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzNCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NCkge1xuICAgICAgICAgICAgczUgPSBwZWckYzEwNTtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMDYpOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczYgPSBwZWckcGFyc2VfKCk7XG4gICAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczMgPSBbczMsIHM0LCBzNSwgczZdO1xuICAgICAgICAgICAgICBzMiA9IHMzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMyO1xuICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMjtcbiAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJHBhcnNlVmFyaWFkaWNUeXBlRXhwcigpO1xuICAgICAgaWYgKHMyID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMyID0gcGVnJHBhcnNlVmFyaWFkaWNUeXBlRXhwck9wZXJhbmQoKTtcbiAgICAgIH1cbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgczEgPSBwZWckYzE1NChzMSwgczIpO1xuICAgICAgICBzMCA9IHMxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVR1cGxlVHlwZUV4cHJPcGVyYW5kKCkge1xuICAgIHZhciBzMDtcblxuICAgIHZhciBrZXkgICAgPSBwZWckY3VyclBvcyAqIDgxICsgNzMsXG4gICAgICAgIGNhY2hlZCA9IHBlZyRyZXN1bHRzQ2FjaGVba2V5XTtcblxuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gY2FjaGVkLm5leHRQb3M7XG5cbiAgICAgIHJldHVybiBjYWNoZWQucmVzdWx0O1xuICAgIH1cblxuICAgIHMwID0gcGVnJHBhcnNlVW5pb25UeXBlRXhwcigpO1xuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckcGFyc2VVbmFyeVVuaW9uVHlwZUV4cHIoKTtcbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMCA9IHBlZyRwYXJzZVJlY29yZFR5cGVFeHByKCk7XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMwID0gcGVnJHBhcnNlVHVwbGVUeXBlRXhwcigpO1xuICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBcnJvd1R5cGVFeHByKCk7XG4gICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VGdW5jdGlvblR5cGVFeHByKCk7XG4gICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlUGFyZW50aGVzaXplZEV4cHIoKTtcbiAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVHlwZVF1ZXJ5RXhwcigpO1xuICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQXJyYXlUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUdlbmVyaWNUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VCcm9hZE5hbWVwYXRoRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVmFsdWVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQW55VHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVW5rbm93blR5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlUGFyZW50aGVzaXplZEV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczU7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDc0LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDApIHtcbiAgICAgIHMxID0gcGVnJGM4OTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM5MCk7IH1cbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZV8oKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMyA9IHBlZyRwYXJzZVBhcmVudGhlc2l6ZWRFeHByT3BlcmFuZCgpO1xuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZV8oKTtcbiAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDEpIHtcbiAgICAgICAgICAgICAgczUgPSBwZWckYzkxO1xuICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOTIpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgcGVnJHNhdmVkUG9zID0gczA7XG4gICAgICAgICAgICAgIHMxID0gcGVnJGMxNTUoczMpO1xuICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVBhcmVudGhlc2l6ZWRFeHByT3BlcmFuZCgpIHtcbiAgICB2YXIgczA7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDc1LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRwYXJzZVVuaW9uVHlwZUV4cHIoKTtcbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gcGVnJHBhcnNlVW5hcnlVbmlvblR5cGVFeHByKCk7XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczAgPSBwZWckcGFyc2VSZWNvcmRUeXBlRXhwcigpO1xuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMCA9IHBlZyRwYXJzZVR1cGxlVHlwZUV4cHIoKTtcbiAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQXJyb3dUeXBlRXhwcigpO1xuICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlRnVuY3Rpb25UeXBlRXhwcigpO1xuICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUFycmF5VHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVHlwZVF1ZXJ5RXhwcigpO1xuICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlR2VuZXJpY1R5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlQnJvYWROYW1lcGF0aEV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlVmFsdWVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBbnlUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZVVua25vd25UeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlVmFyaWFkaWNUeXBlRXhwcigpIHtcbiAgICB2YXIgczA7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDc2LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRwYXJzZVByZWZpeFZhcmlhZGljVHlwZUV4cHIoKTtcbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gcGVnJHBhcnNlU3VmZml4VmFyaWFkaWNUeXBlRXhwcigpO1xuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMwID0gcGVnJHBhcnNlQW55VmFyaWFkaWNUeXBlRXhwcigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBlZyRyZXN1bHRzQ2FjaGVba2V5XSA9IHsgbmV4dFBvczogcGVnJGN1cnJQb3MsIHJlc3VsdDogczAgfTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZVByZWZpeFZhcmlhZGljVHlwZUV4cHIoKSB7XG4gICAgdmFyIHMwLCBzMSwgczI7XG5cbiAgICB2YXIga2V5ICAgID0gcGVnJGN1cnJQb3MgKiA4MSArIDc3LFxuICAgICAgICBjYWNoZWQgPSBwZWckcmVzdWx0c0NhY2hlW2tleV07XG5cbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBwZWckY3VyclBvcyA9IGNhY2hlZC5uZXh0UG9zO1xuXG4gICAgICByZXR1cm4gY2FjaGVkLnJlc3VsdDtcbiAgICB9XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDMpID09PSBwZWckYzEyOSkge1xuICAgICAgczEgPSBwZWckYzEyOTtcbiAgICAgIHBlZyRjdXJyUG9zICs9IDM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMzApOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VWYXJpYWRpY1R5cGVFeHByT3BlcmFuZCgpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjMTU2KHMyKTtcbiAgICAgICAgczAgPSBzMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VTdWZmaXhWYXJpYWRpY1R5cGVFeHByKCkge1xuICAgIHZhciBzMCwgczEsIHMyO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA3OCxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZVZhcmlhZGljVHlwZUV4cHJPcGVyYW5kKCk7XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAzKSA9PT0gcGVnJGMxMjkpIHtcbiAgICAgICAgczIgPSBwZWckYzEyOTtcbiAgICAgICAgcGVnJGN1cnJQb3MgKz0gMztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzEzMCk7IH1cbiAgICAgIH1cbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBwZWckc2F2ZWRQb3MgPSBzMDtcbiAgICAgICAgczEgPSBwZWckYzE1NyhzMSk7XG4gICAgICAgIHMwID0gczE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgfVxuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlQW55VmFyaWFkaWNUeXBlRXhwcigpIHtcbiAgICB2YXIgczAsIHMxO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA3OSxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAzKSA9PT0gcGVnJGMxMjkpIHtcbiAgICAgIHMxID0gcGVnJGMxMjk7XG4gICAgICBwZWckY3VyclBvcyArPSAzO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTMwKTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHBlZyRzYXZlZFBvcyA9IHMwO1xuICAgICAgczEgPSBwZWckYzE1OCgpO1xuICAgIH1cbiAgICBzMCA9IHMxO1xuXG4gICAgcGVnJHJlc3VsdHNDYWNoZVtrZXldID0geyBuZXh0UG9zOiBwZWckY3VyclBvcywgcmVzdWx0OiBzMCB9O1xuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlVmFyaWFkaWNUeXBlRXhwck9wZXJhbmQoKSB7XG4gICAgdmFyIHMwO1xuXG4gICAgdmFyIGtleSAgICA9IHBlZyRjdXJyUG9zICogODEgKyA4MCxcbiAgICAgICAgY2FjaGVkID0gcGVnJHJlc3VsdHNDYWNoZVtrZXldO1xuXG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgcGVnJGN1cnJQb3MgPSBjYWNoZWQubmV4dFBvcztcblxuICAgICAgcmV0dXJuIGNhY2hlZC5yZXN1bHQ7XG4gICAgfVxuXG4gICAgczAgPSBwZWckcGFyc2VVbmlvblR5cGVFeHByKCk7XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRwYXJzZVVuYXJ5VW5pb25UeXBlRXhwcigpO1xuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMwID0gcGVnJHBhcnNlUmVjb3JkVHlwZUV4cHIoKTtcbiAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczAgPSBwZWckcGFyc2VUdXBsZVR5cGVFeHByKCk7XG4gICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUFycm93VHlwZUV4cHIoKTtcbiAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUZ1bmN0aW9uVHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VQYXJlbnRoZXNpemVkRXhwcigpO1xuICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VUeXBlUXVlcnlFeHByKCk7XG4gICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBcnJheVR5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJHBhcnNlR2VuZXJpY1R5cGVFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRwYXJzZUJyb2FkTmFtZXBhdGhFeHByKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VWYWx1ZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VBbnlUeXBlRXhwcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckcGFyc2VVbmtub3duVHlwZUV4cHIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBwZWckcmVzdWx0c0NhY2hlW2tleV0gPSB7IG5leHRQb3M6IHBlZyRjdXJyUG9zLCByZXN1bHQ6IHMwIH07XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuXG4gICAgdmFyIG1ldGEgPSByZXF1aXJlKCcuLi9saWIvU3ludGF4VHlwZS5qcycpO1xuICAgIHZhciBHZW5lcmljVHlwZVN5bnRheCA9IG1ldGEuR2VuZXJpY1R5cGVTeW50YXg7XG4gICAgdmFyIFVuaW9uVHlwZVN5bnRheCA9IG1ldGEuVW5pb25UeXBlU3ludGF4O1xuICAgIHZhciBWYXJpYWRpY1R5cGVTeW50YXggPSBtZXRhLlZhcmlhZGljVHlwZVN5bnRheDtcbiAgICB2YXIgT3B0aW9uYWxUeXBlU3ludGF4ID0gbWV0YS5PcHRpb25hbFR5cGVTeW50YXg7XG4gICAgdmFyIE51bGxhYmxlVHlwZVN5bnRheCA9IG1ldGEuTnVsbGFibGVUeXBlU3ludGF4O1xuICAgIHZhciBOb3ROdWxsYWJsZVR5cGVTeW50YXggPSBtZXRhLk5vdE51bGxhYmxlVHlwZVN5bnRheDtcbiAgICB2YXIgTm9kZVR5cGUgPSByZXF1aXJlKCcuLi9saWIvTm9kZVR5cGUuanMnKTtcblxuICAgIHZhciBOYW1lcGF0aE9wZXJhdG9yVHlwZSA9IHtcbiAgICAgIE1FTUJFUjogJ01FTUJFUicsXG4gICAgICBJTk5FUl9NRU1CRVI6ICdJTk5FUl9NRU1CRVInLFxuICAgICAgSU5TVEFOQ0VfTUVNQkVSOiAnSU5TVEFOQ0VfTUVNQkVSJyxcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gcmV2ZXJzZShhcnJheSkge1xuICAgICAgdmFyIHJldmVyc2VkID0gW10uY29uY2F0KGFycmF5KTtcbiAgICAgIHJldmVyc2VkLnJldmVyc2UoKTtcbiAgICAgIHJldHVybiByZXZlcnNlZDtcbiAgICB9XG5cblxuICBwZWckcmVzdWx0ID0gcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uKCk7XG5cbiAgaWYgKHBlZyRyZXN1bHQgIT09IHBlZyRGQUlMRUQgJiYgcGVnJGN1cnJQb3MgPT09IGlucHV0Lmxlbmd0aCkge1xuICAgIHJldHVybiBwZWckcmVzdWx0O1xuICB9IGVsc2Uge1xuICAgIGlmIChwZWckcmVzdWx0ICE9PSBwZWckRkFJTEVEICYmIHBlZyRjdXJyUG9zIDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgICBwZWckZmFpbChwZWckZW5kRXhwZWN0YXRpb24oKSk7XG4gICAgfVxuXG4gICAgdGhyb3cgcGVnJGJ1aWxkU3RydWN0dXJlZEVycm9yKFxuICAgICAgcGVnJG1heEZhaWxFeHBlY3RlZCxcbiAgICAgIHBlZyRtYXhGYWlsUG9zIDwgaW5wdXQubGVuZ3RoID8gaW5wdXQuY2hhckF0KHBlZyRtYXhGYWlsUG9zKSA6IG51bGwsXG4gICAgICBwZWckbWF4RmFpbFBvcyA8IGlucHV0Lmxlbmd0aFxuICAgICAgICA/IHBlZyRjb21wdXRlTG9jYXRpb24ocGVnJG1heEZhaWxQb3MsIHBlZyRtYXhGYWlsUG9zICsgMSlcbiAgICAgICAgOiBwZWckY29tcHV0ZUxvY2F0aW9uKHBlZyRtYXhGYWlsUG9zLCBwZWckbWF4RmFpbFBvcylcbiAgICApO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBTeW50YXhFcnJvcjogcGVnJFN5bnRheEVycm9yLFxuICBwYXJzZTogICAgICAgcGVnJHBhcnNlXG59O1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iXX0=
