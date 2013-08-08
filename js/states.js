// types:
// upper1, upper2, upper3, upper4, upper5, upper6
// kinds2, kinds3, kinds4
// 2pairs, smallSt, largeSt, chance, house, yatzy

// states: array(5)
function checkUppers(states, number) {
  var filtered = states.filter(function(element, index, array) { return element == number; });
  var score = 0;
  if (filtered.length > 0) {
    score = filtered.reduce(function(previousValue, currentValue, index, array){
      return previousValue + currentValue;
    });
  }
  return {"type": "upper"+number, "score": score};
}

function checkKinds(states, number, count) {
  var filtered = states.filter(function(element, index, array) { return element == number; });
  var score = 0;

  if (filtered.length >= count) {
    score = filtered.slice(0, count).reduce(function(previousValue, currentValue, index, array){
      return previousValue + currentValue;
    });
  }
  return {"type": "kinds"+count, "score": score};
}

function checkSmallStraight(states) {
  var score = 0;
  var isSmallSt = states.sort().every(function(element, index, array) { return element == index + 1; });
  if (isSmallSt){ 
    score = 15;
  }
  return {"type": "smallSt", "score": score};
}

function checkLargeStraight(states) {
  var score = 0;
  var isLargeSt = states.sort().every(function(element, index, array) { return element == index + 2; });
  if (isLargeSt){ 
    score = 20;
  }
  return {"type": "largeSt", "score": score};
}

function checkChance(states) {
  var score = states.reduce(function(previousValue, currentValue, index, array){
    return previousValue + currentValue;
  });
  return {"type": "chance", "score": score};
}

function checkYatzy(states) {
  var filtered = states.filter(function(element, index, array) { return element == states[0]; });
  var score = 0;
  if (filtered.length == 5) {
    score = 50;  
  }
  return {"type": "yatzy", "score": score};
}

// states: [2, 2, 3, 5, 4], usedScores: ["kinds2", "upper1"]
function getScores(states, usedScores) {
  if (states.length != 5) {
    console.log("state length error");
    return;
  }
  // combinations:
  var scores = [];

  // uppers and kinds
  var pairs = [];
  var threes = null;
  var usedKinds = [];
  // backwards because we need the max for kinds - (2, 2, 3, 3, 1) the (3, 3) is better than (2, 2)
  for (i = 6; i >= 1; i--) {
    var upper = checkUppers(states, i);
    if (upper.score > 0) {
      scores.push(upper);
    }

    for (j = 2; j <= 4 ; j++) {
      var kind = checkKinds(states, i, j);
      if (kind.score > 0 && usedKinds.indexOf(kind.type) < 0) {
        usedKinds.push(kind.type);
        scores.push(kind);
      }
      if (j == 2 && kind.score > 0) {
        pairs.push(kind);      
      }
      if (j == 3 && kind.score > 0) {
        threes = kind;
      }
    }
  }

  // 2 pairs
  if (pairs.length == 2) {
    scores.push({"type": "2pairs", score: pairs[0].score + pairs[1].score});
  }

  // straights
  var small = checkSmallStraight(states);
  if (small.score > 0) {
    scores.push(small);
  }
  var large = checkLargeStraight(states);
  if (large.score > 0) {
    scores.push(large);
  }

  // house
  if (threes && pairs.length > 0) {
    if (pairs.length == 1) {
      // it's a yatzy
      scores.push({"type": "house", "score": threes.score + pairs[0].score});
    } else {
      // it's two different states (2, 2, 3, 3, 3);
      var pairScore = threes.score / 3 * 2
      pairs.forEach(function(element, index, array) {
        if (element.score != pairScore) {
          scores.push({"type": "house", "score": threes.score + element.score});
        }
      });
    }
  }

  // chance
  scores.push(checkChance(states));
  
  // yatzy
  var yatzy = checkYatzy(states);
  if (yatzy.score > 0) {
    scores.push(yatzy);
  }

  return scores.filter(function(element, index, array) { return usedScores.indexOf(element.type) < 0; });;
}
