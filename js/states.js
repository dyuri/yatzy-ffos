window.yatzy = window.yatzy || {};

(function (Y, $) {
// types:
// upper1, upper2, upper3, upper4, upper5, upper6
// kind2, kind3, kind4
// twopairs, smallSt, largeSt, chance, house, yatzy

var random = function(min, max) {
  min = min || 1;
  max = max || 6;
  return Math.floor(Math.random() * (max - min + 1) + min);
};

Y.init = function () {
  // create rollable dice
  var roll = 'ROLL!'.split('');
  $('ul.dice li').each(function (index, el) {
    var button = $('<button id="die_'+index+'" data-die-index="'+index+'"><span>'+roll[index]+'</span></button>'),
        i, j, dstra = [];

    button.appendTo(el);

    for (i = 0; i < 10; i++) {
      for (j = 1; j <= 6; j++) {
        dstra.push('<span>'+j+'</span>');
      }
    }

    button.append(dstra.join(''));
  });

  // event handlers
  if ($.os.phone || $.os.tablet) {
    $('#btn_roll').on('tap', Y.game.roll.bind(Y.game));
    $('#btn_new_game').on('tap', Y.game.newGame.bind(Y.game));
    $('.dice').on('tap', 'button', function (e) {
      var button = $(e.currentTarget);
      Y.game.toggleDie(button.attr('data-die-index'));
    }, this);
    $('.sheet').on('tap', 'button:not([disabled])', function (e) {
      Y.board.selectCell(e.currentTarget);
    });
  } else {
    $('#btn_roll').on('click', Y.game.roll.bind(Y.game));
    $('#btn_new_game').on('click', Y.game.newGame.bind(Y.game));
    $('.dice').on('click', 'button', function (e) {
      var button = $(e.currentTarget);
      Y.game.toggleDie(button.attr('data-die-index'));
    }, this);
    $('.sheet').on('click', 'button:not([disabled])', function (e) {
      Y.board.selectCell(e.currentTarget);
    });
  }
};

Y.board = {
  showScores: function (scores) {
    scores = scores || [];

    $('.sheet button:not([disabled]) span').html('');

    scores.forEach(function (s) {
      var cell = $('.sheet button[data-type='+s.type+']:not([disabled])');

      if (cell) {
        cell.find('span').html(s.score);
      } else {
        console.warn('No cell for type: '+s.type);
      }
    }, this);
  },
  updateTotalScores: function (upper, total, bonus) {
    $('#upper_score span').html(upper);
    $('#total_score span').html(total);
    if (bonus) {
      $('.sheet').addClass('bonus');
    } else {
      $('.sheet').removeClass('bonus');
    }
  },
  setRolling: function () {
    var $sheet = $('.sheet');

    $sheet.addClass('rolling');
    setTimeout(function () { $sheet.removeClass('rolling'); }, 1000);
  },
  getRolling: function () {
    return $('.sheet').hasClass('rolling');
  },
  getScore: function (cell) {
    var $cell = $(cell);

    return +$cell.find('span').text() || 0;
  },
  selectCell: function (cell) {
    var $cell = $(cell), 
        score = this.getScore($cell);

    if (Y.game.selectType($cell.attr('data-type'), score)) {
      $cell.attr('disabled', true);
      $cell.find('span').html(score);
    }
  },
  resetCells: function () {
    $('.sheet button').attr('disabled', null).find('span').html('');
  },
  setDie: function (index, number, dontRoll) {
    // don't roll selected die
    if (this.isSelected(index)) {
      return;
    }

    var r = dontRoll ? 0 : random(0, 9),
        button = $('#die_'+index),
        w = button.children().first().width();

    button.attr('data-value', number);
    // "roll" the die
    button.css('text-indent', - (r * 6 + number) * w);
  },
  setDice: function (numbers, dontRoll) {
    numbers.forEach(function (n, index) {
      this.setDie(index, n, dontRoll);
    }, this);
  },
  resetDice: function () {
    this.unselectAll();
    this.setDice([0, 0, 0, 0, 0], true);
  },
  unselectAll: function () {
    $('.dice button').removeClass('selected');
  },
  getDieNumber: function (index) {
    var button = $('#die_'+index);

    return +button.attr('data-value');
  },
  getNumbers: function () {
    return [0, 1, 2, 3, 4].map(function (i) {
      return this.getDieNumber(i);
    }, this);
  },
  isSelected: function (i) {
    return $('#die_'+i).hasClass('selected');
  },
  selectDie: function (i) {
    $('#die_'+i).addClass('selected');
  },
  unselectDie: function (i) {
    $('#die_'+i).removeClass('selected');
  }
};

// TODO: maybe use html5 data api for attributes (Robi's idea)
Y.game = { 
  // types, that have been checked
  usedTypes: [], // TODO: can be in the dom
  upperScore: 0, // TODO: can be document.getElementById("upperScore")
  totalScore: 0, // TODO: can be document.getElementById("totalScore")
  // 3 rolls in a turn
  rollCount: 0,
  // upper bonus (50 if more than 63)
  hasUpperBonus: false, // TODO: can be in the dom

  roll: function() {
    var i, states;

    if (!Y.board.getRolling() && this.rollCount < 3) {
      // parallel for all dice?
      states = [];
      
      for (i = 0; i < 5; i++) {
        if (!this.isSelected(i)) {
          states.push(random(1, 6));
        } else {
          states.push(Y.board.getDieNumber(i));
        }
      }

      // update dice displays
      Y.board.setDice(states);
      Y.board.setRolling();

      // TODO: update "roll" button to "reroll" if rollcount > 0

      // don't use the actual states array, but a copy of it
      var scores = getScores(states.slice(0), this.usedTypes);

      // TODO: update available scores
      Y.board.showScores(scores);

      this.rollCount += 1;

      return states;
    }
    
    return null;
  },

  newGame: function() {
    this.usedTypes = [];
    this.upperScore = 0;
    this.totalScore = 0;
    this.rollCount = 0;
    this.hasUpperBonus = false;
    // TODO: update "reroll" button to "roll"
    // TODO: update dice display (unselected)
    Y.board.resetDice();
    Y.board.resetCells();
    Y.board.updateTotalScores(0, 0, false);
  },

  isSelected: function(diceIndex) {
    return Y.board.isSelected(diceIndex);
  },

  toggleDie: function(diceIndex) {
    if (this.rollCount > 0 && this.rollCount < 3) {
      if (this.isSelected(diceIndex)) {
        this.unselectDie(diceIndex);
      } else {
        this.selectDie(diceIndex);
      }
    }
  },

  selectDie: function(diceIndex) {
    Y.board.selectDie(diceIndex);
  },

  unselectDie: function(diceIndex) {
    Y.board.unselectDie(diceIndex);
  },

  selectType: function(type, score) {
    if (this.rollCount > 0) {
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
      this.rollCount = 0;
      Y.board.unselectAll();
      Y.board.updateTotalScores(this.upperScore, this.totalScore, this.hasUpperBonus);
      
      return true;
    }

    return false;
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
    scores.push({type: "twopairs", score: pairs[0].score + pairs[1].score});
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

}(window.yatzy, window.Zepto));

window.yatzy.init();
