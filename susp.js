function Susp(thunk) {
	this.evaled = false
	this.memo = function() {
		var ev = thunk() 
		this.evaled = true
		this.memo = ev
		return ev
	}
}

function force(susp) {
	if (susp instanceof Susp) {
		if (susp.evaled) return susp.memo
		else return susp.memo()
	}}

function $$(f, args) {
	if (isFunction(f)) {
		return new Susp(function() {
			return f.apply(null,[].concat(args))
		})
	} else {
		return new Susp(function() {
			return f
		})
	}}

var isFunction = function(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};

var Stream = (function() {
	var StreamObj = {
		Stream: function(a, susp) {return new Cons(a, susp)},
		FromList: function(lst) { return ListToCons(lst)},
		From: function(n, iter) { return from(n, iter)},
		Append: function(a, stream) { return new Cons(a, $$(stream))},
		Range: function(lo, hi, iter) {return range(lo,hi,iter)}
	}
	function Cons(a, susp) { 
		this.hd = a,
		this.tl = susp
	}
	var nil = undefined
	function isNil(x) { return (typeof x === "undefined") }

	Cons.prototype.head = function() {return this.hd}
	Cons.prototype.tail = function() {return force(this.tl)}
	Cons.prototype.toList = function() {
		function loop(cons) { 
			if (isNil(cons)) return []
			else {
				var next = force(cons.tl)
				return [cons.hd].concat(loop(next))
			}
		}
		return loop(this)
	}

	function ListToCons(lst) {
		if (lst.length == 0) return nil
		else {
			var hd = lst[0], tl = lst.splice(1,lst.length-1)
			return new Cons(hd, $$(ListToCons(tl)))
		}
	}

	Cons.prototype.take = function(n) {
		function take(n, susp) {
			return $$(function() {
				if (n == 0) { return nil}
				else {
					var cons = force(susp);
					if (isNil(cons)) return nil
					else return new Cons(cons.hd, take(n-1, cons.tl))
				}
			})
		}
		return force(take(n, $$(this)))
	}
	
	Cons.prototype.drop = function(n) {
		function drop(n, susp) {
			if (n == 0) {return susp}
			else {
				var cons = force(susp)
				if (isNil(cons)) return nil
				else return function() {return drop(n-1, cons.tl)}
			}
		}
		function trampoline(dr, n, susp) {
			var result = dr(n, susp)
			while (!(result instanceof Susp) && !(isNil(result))) {
				result = result();
			}
			return result
		}
		return force(trampoline(drop, n, $$(this)))
	}

	function from(n, iter) {
		var iter = iter || function(e) {return e+1}
		return new Cons(n, $$(from, iter(n)))
	}
	function range(lo, hi, iter) {
		var iter = iter || function(e) {return e+1}
		if (lo > hi) return nil
		else return new Cons(lo, $$(range(iter(lo), hi, iter)))
	}

	Cons.prototype.filter = function(f) {
		function filter(f, susp) {
			return $$(function() {
				var cons = force(susp);
				if (isNil(cons)) { return nil }
				else {
					if (f(cons.hd)) {return new Cons(cons.hd, filter(f,cons.tl))}
					else {return force(filter(f, cons.tl))}
				}
			})
		}
		return force(filter(f, $$(this)))
	}

	Cons.prototype.map = function(f) {
		function map(f, susp) {
			return $$(function() {
				var cons = force(susp);
				if (isNil(cons)) {return nil }
				else {
					return new Cons(f(cons.hd), map(f, cons.tl))
				}
			})
		}
		return force(map(f, $$(this)))
	} 

	Cons.prototype.apply = function(n) { return this.drop(n-1).head()}
	
	return StreamObj
})()


function fibonacci() {
	function loop(h,n) {
		return Stream.Stream(n, $$(loop, [n, h+n]))
	}
	return loop(0,1)
}

function primes() {
	function notMultipleof(h) {
		return function(e) {
			return (e%h) != 0 
		}
	} 

	function sieve(stream) {
		var head = stream.head();
		var nextStream = stream.tail().filter(notMultipleof(head))
		return Stream.Stream(head, $$(sieve, nextStream))	
	}	
	return sieve(Stream.From(2))
}