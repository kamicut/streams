// Let's define what a position on the board is
function Pos(x, y) {
	this.x = x
	this.y = y
	this.toString = function() {
		return "("+ x + ", " + y + ")"
	}
	this.equals = function(otherPos) {
		return (this.x == otherPos.x && this.y == otherPos.y)
	}
}

// Given a position, what are the possible next positions
function possibleMoves(pos) {
	return [
		new Pos(pos.x+2, pos.y+1),
		new Pos(pos.x-2, pos.y-1),
		new Pos(pos.x-2, pos.y+1),
		new Pos(pos.x+2, pos.y-1),
		new Pos(pos.x+1, pos.y+2),
		new Pos(pos.x-1, pos.y-2),
		new Pos(pos.x-1, pos.y+2),
		new Pos(pos.x+1, pos.y-2)
	]
}

// A path is a list of positions
function Path(history) {
	this.history = history
	this.extend = function(pos) {
		var newhistory = this.history.slice(0)
		return new Path(newhistory.concat(pos))
	}
	this.toString = function() {
		var s = this.history[0].toString()
		for (var i = 1; i <this.history.length; i++) {
			s += " --> " + this.history[i].toString()
		}
		return s
	}
	this.endState = function() {
		return this.history[this.history.length - 1]
	}
}

// For each current set of paths, extend them with the possible
// moves and append to the stream
function allPaths(pathList) {
	var nextPaths = []
	pathList.forEach(function(path) {
		var nextPositions = possibleMoves(path.endState())

		nextPositions.forEach(function(position) {
			nextPaths.push(path.extend(position));
		})
	})

	return Stream.Stream(nextPaths, 
		$$(allPaths, [nextPaths])
	)
}

// For each set of the paths in the stream, filter out 
// all the solutions and return them in a stream
function solutions(pathLists, target) {
	// We flatten the stream of path sets into a single stream
	// of paths by applying fromList followed by concat
	function flatten(pathLists) {
		var pathList = pathLists.head();
		var pathStream = Stream.FromList(pathList); 
		return Stream.Concat($$(pathStream), 
			$$(flatten, pathLists.tail())
		) 
	}
	// We can now filter to get only the paths that will
	// end in the target
	return flatten(pathLists).filter(function(path) {
			return path.endState().equals(target)
	})
}

//We can call this function to get a stream of solutions 
//from fromPos to toPos and print out a number of solutions
function game(fromPos, toPos, numSolutions, id) {
	var numSolutions = numSolutions || 5
	var initialPath = new Path([fromPos]);
	var pathLists = allPaths([initialPath]);
	var allSolutions = solutions(pathLists, toPos);
	allSolutions
		.take(numSolutions)
		.toList()
		.forEach(function(e) { 
			if (id) {
				id.innerHTML += "<p>" + e.toString() + "</p>"
			} else {
				console.log(e.toString())
			}	
	})
	return allSolutions
}

