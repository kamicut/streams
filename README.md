A small library of functions to implement suspensions and streams based on the ideas in [this](https://www.cs.cmu.edu/~rwh/introsml/techniques/memoization.htm) manual. I also try to introduce an operator for $-Notation as in [here](https://www.cs.cmu.edu/~rwh/theses/okasaki.pdf).

Examples
--------

To create the stream of natural numbers (in JS):
```javascript
var ns = Stream.From(0);
```

To get the multiples of 2 and filter out multiples of 4:
```javascript
ns.map(function(e) {return e*2}).filter(function(e) {return e%4 != 0})
```

To take a few numbers and output to a list:
```javascript
ns.take(5).toList()
```
will return [0,1,2,3,4]

To suspend a computation, use the `$$` operation in the form `$$(fun, args)`
```javascript
var x = $$(crazy_long_computation, args)
```

A Stream constructor takes an element and a suspended computation, to construct the list of fibonacci elements:
```javascript
function fibonacci() {
	function loop(h,n) {
		return Stream.Stream(n, $$(loop, [n, h+n]))
	}
	return loop(0,1)
}
```
Notice that we suspend the loop function so as to not evaluate it until we actually want to compute it. Thus we can now do something like this:
```javascript
var prime_number_1000 = fibonacci().apply(1000)
```

Finally, to construct all primes, use the sieve of Erastothenes coupled with some functional magic! 
```javascript
function primes() {
	function sieve(stream) {
		var head = stream.head(), tail = stream.tail()
		var sift = function(e) { return (e%head) != 0}
		return Stream.Stream(head, $$(sieve, tail.filter(sift)))	
	}	
	return sieve(Stream.From(2))
}
```