A small library of functions to implement suspensions and streams based on the ideas in [this](https://www.cs.cmu.edu/~rwh/introsml/techniques/memoization.htm) manual. I also try to introduce an operator for $-Notation as in [here](https://www.cs.cmu.edu/~rwh/theses/okasaki.pdf).

Examples
========
The following examples are in javascript.

Infinite Sequences
------------------

With suspensions and streams you can easily work with infinite sequences! Here we create the stream of natural numbers, then get the multiples of 2 and filter out the multiples of 4. Finally we take 5 elements and return a list:
```javascript
var ns = Stream.From(0); //Natural numbers

ns.map(function(e) {return e*2})
	.filter(function(e) {return e%4 != 0})
	.take(5)
	.toList() // Returns [2, 6, 10, 14, 18]
```

Suspensions
-----------

To suspend a computation, use the `$$` operation in the form `$$(fun, args)`. You can then evaluate the computation with `force()`, the result will be memoized.
```javascript
var x = $$(crazy_long_computation, args)
force(x) //will evaluate the computation
force(x) //2nd time, will retrieve the stored result
```

Stream Construction
-----------------
A Stream constructor takes an element and a suspended computation. To construct the list of fibonacci elements:
```javascript
function fibonacci() {
	function loop(h,n) {
		return Stream.Stream(n, $$(loop, [n, h+n]))
	}
	return loop(0,1)
}
```
Notice that we suspend the loop function so as to not evaluate it until we actually want to compute it. We can now the following:
```javascript
var fibs = fibonacci()
var fibonacci_number_50 = fibs.apply(50) //returns 12586269025
```
Since the evaluation of the stream is lazy, the results are stored and we can now do `fibs.apply(1)`, `fibs.apply(2)`,`...,fibs.apply(50)` at no additional cost. 

Primes
------
Let's use the sieve of Eratosthenes coupled with some functional magic for a more involved example.
```javascript
function primes() {
	//Returns a function to pass into the stream filter that will 
	//remove all the multiples of the first element in the stream
	function notMultipleof(h) { 
		return function(e) {
			return (e%h) != 0 
		}
	} 
	//Create a sieve out of a stream
	function sieve(stream) {
		//Take the first element
		var head = stream.head();

		//Use it to sift the rest of the list
		var siftedStream = stream.tail().filter(notMultipleof(head))

		//Append the first element to the sifted list and recurse on
		//the sifted list
		return Stream.Stream(head, $$(sieve, siftedStream))	
	}	
	//Start with the list of consecutive integers starting from 2
	return sieve(Stream.From(2))
}

var p = primes()
p.apply(2000) //Will return the 2000th prime: 17389
```
