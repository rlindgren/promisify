// REQUIRES a promise (using Q until custom deferred object created)
(function (global) {
	function promisify (srcObject, fnName) {
		if (!fnName) {
			// promisify all functions
			if (typeof srcObject === 'object' && typeof srcObject !== null) {
				Object.keys(srcObject).forEach(function (key) {
					if (typeof srcObject[key] === 'function') {
						promisify(srcObject, key);
					}
				});
			} else if (typeof srcObject === 'function') {
				return promisifyMethod(srcObject);
			}
		} else if (typeof srcObject === 'object') {
			if (fnName instanceof Array) {
				// promisify the method(s) that match `fnName` or `_fnName in fnName` (if fnName is Array)
				fnName.forEach(function (_fnName) {
					srcObject[_fnName] = promisifyMethod(srcObject, _fnName);
				});
			} else {
				srcObject[fnName] = promisifyMethod(srcObject, fnName);
			}
		}
	};

	function promisifyMethod (srcObject, fnName) {
		var fn = typeof srcObject == 'function' ? srcObject : srcObject[fnName];

		var promisifiedFn = function () {
			var deferred = global.Q.defer();
			var lastArg = arguments[arguments.length - 1];
			var hasCallback = typeof lastArg === 'function';
			var cb = hasCallback ? lastArg : function noop (){};
			if (hasCallback) Array.prototype.pop.call(arguments);
			Array.prototype.push.call(arguments, function () {
				var args = Array.prototype.slice.call(arguments);
				var error = args.shift(arguments);
				cb.apply(null, arguments);
				if (error) deferred.reject(error);
				else deferred.resolve(args.pop());
			});
			fn.apply(this, arguments);
			return deferred.promise;
		};
		promisifiedFn.name = fnName;
		
		return promisifiedFn;
	}

	if (global.module && global.module.exports) {
		global.module.exports = promisify;
	}

	if (typeof Window !== 'undefined' && global instanceof Window) {
		global.Promisify = promisify;
	}

}(self));