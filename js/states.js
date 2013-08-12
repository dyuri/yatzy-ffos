window.yatzy = window.yatzy || {};

(function (Y) {
// types:
// upper1, upper2, upper3, upper4, upper5, upper6
// kind2, kind3, kind4
// 2pairs, smallSt, largeSt, chance, house, yatzy

// TODO: maybe use html5 data api for attributes (Robi's idea)
Y.game = { 
  // dice states
  states: [0, 0, 0, 0, 0],
  // checked dice - they don't roll 
  checkedIndexes: [],
  // types, that have been checked
  usedTypes: [], // TODO: can be in the dom
  upperScore: 0, // TODO: can be document.getElementById("upperScore")
  totalScore: 0, // TODO: can be document.getElementById("totalScore")
  // 3 rolls in a turn
  rollCount: 0,
  // upper bonus (50 if more than 63)
  hasUpperBonus: false, // TODO: can be in the dom
  availableScores: [], // TODO: can be in the dom

  random: function(min, max) {
    min = min || 1;
    max = max || 6;
    return Math.floor(Math.random() * (max - min + 1) + min);
  },

  roll: function() {
    var i, states;

    if (this.rollCount < 3) {
      // parallel for all dice?
      states = [];
      
      for (i = 0; i < 5; i++) {
        if (!this.isSelected(i)) {
          states.push(this.random(1, 6));
        } else {
          states.push(this.states[i]);
        }
      }

      // TODO: update dice displays
      // TODO: update "roll" button to "reroll" if rollcount > 0
      // don't use the actual states array, but a copy of it
      var scores = getScores(states.slice(0), this.usedTypes);
      console.log(scores);

      // TODO: update available scores
      this.rollCount += 1;

      // store states
      this.states = states;

      return this.states;
    }
    
    return null;
  },

  newGame: function() {
    this.usedTypes = [];
    this.upperScore = 0;
    this.totalScore = 0;
    this.checkedIndexes = [];
    this.rollCount = 0;
    this.hasUpperBonus = false;
    // TODO: update "reroll" button to "roll"
    // TODO: update dice display (unselected)
  },

  isSelected: function(diceIndex) {
    return this.checkedIndexes.indexOf(diceIndex) > -1;
  },

  selectDice: function(diceIndex) {
    this.checkedIndexes.push(diceIndex);
    // TODO: update dice display (selected)
  },

  unselectDice: function(diceIndex) {
    var foundIndex = this.checkedIndexes.indexOf(diceIndex);
    if (foundIndex >= 0) {
      this.checkedIndexes.splice(foundIndex, 1);
    }
    // TODO: update dice display (unselected)
  },

  selectType: function(type, score) {
    this.totalScore += score;
    if (type.startsWith("upper")) {
      this.upperScore += score;
      // check if upper has more than 63 and add 50
      if (!this.hasUpperBonus && this.upperScore >= 63) {
        this.hasUpperBonus = true;
        this.totalScore += 50;
        this.upperScore += 50;
      }
    }
    this.checkedIndexes = [];
    this.rollCount = 0;
    // TODO: update dice display (unselected)
  },

  save: function() {
  },

  load: function() {
  }
};

function checkUpper(states, number) {
  var filtered = states.filter(function(element, index, array) { return element === number; });
  var score = 0;
  if (filtered.length > 0) {
    score = filtered.reduce(function(previousValue, currentValue, index, array){
      return previousValue + currentValue;
    });
  }
  return {type: "upper"+number, score: score};
}

function checkKind(states, number, count) {
  var filtered = states.filter(function(element, index, array) { return element === number; });
  var score = 0;

  if (filtered.length >= count) {
    score = filtered.slice(0, count).reduce(function(previousValue, currentValue, index, array){
      return previousValue + currentValue;
    });
  }
  return {type: "kind"+count, score: score, number: number};
}

function checkSmallStraight(states) {
  var score = 0;
  var isSmallSt = states.sort().every(function(element, index, array) { return element === index + 1; });
  if (isSmallSt){ 
    score = 15;
  }
  return {type: "smallSt", score: score};
}

function checkLargeStraight(states) {
  var score = 0;
  var isLargeSt = states.sort().every(function(element, index, array) { return element === index + 2; });
  if (isLargeSt){ 
    score = 20;
  }
  return {type: "largeSt", score: score};
}

function checkChance(states) {
  var score = states.reduce(function(previousValue, currentValue, index, array){
    return previousValue + currentValue;
  });
  return {type: "chance", score: score};
}

function checkYatzy(states) {
  var filtered = states.filter(function(element, index, array) { return element === states[0]; });
  var score = 0;
  if (filtered.length === 5) {
    score = 50;  
  }
  return {type: "yatzy", score: score, number: states[0]};
}

// states: [2, 2, 3, 5, 4], usedTypes: ["kind2", "upper1"]
var getScores = function (states, usedTypes) {
  if (states.length !== 5) {
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
  for (var i = 6; i >= 1; i--) {
    var upper = checkUpper(states, i);
    if (upper.score > 0) {
      scores.push(upper);
    }

    for (var j = 2; j <= 4 ; j++) {
      var kind = checkKind(states, i, j);
      if (kind.score > 0 && usedKinds.indexOf(kind.type) < 0) {
        usedKinds.push(kind.type);
        scores.push(kind);
      }
      if (j === 2 && kind.score > 0) {
        pairs.push(kind);      
      }
      if (j === 3 && kind.score > 0) {
        threes = kind;
      }
    }
  }

  // 2 pairs
  if (pairs.length === 2) {
    scores.push({type: "2pairs", score: pairs[0].score + pairs[1].score});
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
  if (threes && pairs.length === 2) {
    // it's two different states (2, 2, 3, 3, 3);
    var pairScore = threes.score / 3 * 2;
    pairs.forEach(function(element, index, array) {
      if (element.score !== pairScore) {
        scores.push({type: "house", score: threes.score + element.score});
      }
    });
  }

  // chance
  scores.push(checkChance(states));
  
  // yatzy
  var yatzy = checkYatzy(states);
  if (yatzy.score > 0) {
    scores.push(yatzy);
    // yatzy is a house as well
    scores.push({type: "house", score: 5*yatzy.number});
  }

  return scores.filter(function(element, index, array) { return usedTypes.indexOf(element.type) < 0; });
};
Y.getScores = getScores;

}(window.yatzy));
