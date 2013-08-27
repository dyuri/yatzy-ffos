window.yatzy = window.yatzy || {};

(function (Y, $) {
// types:
// upper1, upper2, upper3, upper4, upper5, upper6
// kind2, kind3, kind4
// twopairs, smallSt, largeSt, chance, house, yatzy

var MAX_HIGHSCORES = 10;

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

  // lock orientation
  var locked = window.screen && (window.screen.lockOrientation && window.screen.lockOrientation('portrait-primary')) || (window.screen.mozLockOrientation && window.screen.mozLockOrientation('portrait-primary'));

  // event handlers
  if ($.os.phone || $.os.tablet) {
    $('#btn_roll').on('tap', Y.game.roll.bind(Y.game));
    // swipe disabled, too sensitive
    // $('[role="toolbar"] .dice').on('swipeLeft', Y.game.roll.bind(Y.game));
    // $('[role="toolbar"] .dice').on('swipeRight', Y.game.roll.bind(Y.game));
    $('#btn_new_game').on('tap', Y.game.newGame.bind(Y.game));
    $('#main button.startnew').on('tap', Y.game.newGame.bind(Y.game));
    $('#btn_help').on('tap', Y.board.help.bind(Y.board));
    $('.dice').on('tap', 'button', function (e) {
      var button = $(e.currentTarget);
      Y.game.toggleDie(button.attr('data-die-index'));
    }, this);
    $('.sheet').on('tap', 'button:not([disabled])', function (e) {
      Y.board.selectCell(e.currentTarget);
    });
    Y.shakeCheck.startCheck();
  } else {
    $('#btn_roll').on('click', Y.game.roll.bind(Y.game));
    $('#btn_new_game').on('click', Y.game.newGame.bind(Y.game));
    $('#main button.startnew').on('click', Y.game.newGame.bind(Y.game));
    $('#btn_help').on('click', Y.board.help.bind(Y.board));
    $('.dice').on('click', 'button', function (e) {
      var button = $(e.currentTarget);
      Y.game.toggleDie(button.attr('data-die-index'));
    }, this);
    $('.sheet').on('click', 'button:not([disabled])', function (e) {
      Y.board.selectCell(e.currentTarget);
    });
  }
};

Y.shakeCheck = {
  lastRot: null,
  startCheck: function () {
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", function (e) {
        var rot = Math.pow((Math.abs(e.alpha) * Math.abs(e.beta) * Math.abs(e.gamma)), 1/3);
        if (this.lastRot !== null) {
          if (Math.min(Math.abs(rot - this.lastRot) % 360, Math.abs(this.lastRot - rot) % 360) > 60) {
            Y.game.roll();
          }
        }
        this.lastRot = rot;
      }.bind(this));
    }
  },
  doCheck: function () {
  },
};

Y.board = {
  vibrate: function (time) {
    time = time || 100;

    if (navigator.vibrate) {
      navigator.vibrate(time);
    }
  },
  help: function () {
    if (this.isActiveTab('help')) {
      if (Y.game.checkGameOver()) {
        this.showTab('gameover');
      } else {       
        this.showTab('board');
      }
    } else {
      this.showTab('help');
    }
  },
  gameOver: function (score, hslist, inhs) {
    var $hsul = $('#highscores');

    $('#go-score span').html(score);
    if (inhs < MAX_HIGHSCORES) {
      $('#inhs').css('display', 'block');
    } else {
      $('#inhs').css('display', 'none');
    }
    $hsul.html('');
    hslist.forEach(function (el, i) {
      var d = new Date(el.date);
      $hsul.append('<li class="'+(i === inhs ? 'current' : '')+'"><span class="date">'+d.toLocaleString()+'</span><span class="score">'+el.score+'</span></li>');
    });
    this.showTab('gameover');
    this.vibrate([100, 200, 100, 200, 100]);
  },
  showTab: function (tab) {
    var t = $('.tab-'+tab);

    if (t && !t.hasClass('active')) {
      $('.tab').removeClass('active');
      t.addClass('active');
    }
  },
  isActiveTab: function (tab) {
    var t = $('.tab-'+tab);
    
    return t.hasClass('active');
  },
  updateRoll: function (rollCount) {
    $('#btn_roll').attr('data-roll', rollCount);
  },
  clearScores: function () {
    $('.sheet button:not([disabled]) span').html('');
  },
  showScores: function (scores) {
    scores = scores || [];

    this.clearScores();

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
      if (Y.game.checkGameOver()) {
        Y.game.gameOver();
      }
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
        w = button.children().first().width(),
        indent = - (r * 6 + number) * w,
        oldindent = parseInt(button.css('text-indent'), 10);

    if (!dontRoll && indent === oldindent) {
      while (indent === oldindent) {
        r = random(0, 9);
        indent = - (r * 6 + number) * w;
      }
    }

    button.attr('data-value', number);
    // "roll" the die
    button.css('text-indent', indent);
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
  },
  availableCells: function () {
    var cells = $('.sheet button:not([disabled])'),
        types = [];

    cells.each(function (i, c) {
      types.push($(c).attr('data-type'));
    });

    return types;
  },
  usedCells: function () {
    var cells = $('.sheet button[disabled]'),
        types = [];

    cells.each(function (i, c) {
      types.push($(c).attr('data-type'));
    });

    return types;
  }
};

// TODO: maybe use html5 data api for attributes (Robi's idea)
Y.game = { 
  // types, that have been checked
  upperScore: 0, // TODO: can be document.getElementById("upperScore")
  totalScore: 0, // TODO: can be document.getElementById("totalScore")
  // upper bonus (50 if more than 63)
  hasUpperBonus: false, // TODO: can be in the dom
  // 3 rolls in a turn
  rollCount: 0,
  // don't roll before this time
  minNextRoll: 0,

  setNextRoll: function (delay) {
    var t = new Date().getTime();

    delay = delay || 100;

    this.minNextRoll = t + delay;
  },
  roll: function() {
    var i, states, t = new Date().getTime();

    if (!Y.board.getRolling() && (this.minNextRoll < t) && this.rollCount < 3) {
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

      // don't use the actual states array, but a copy of it
      var scores = getScores(states.slice(0), Y.board.usedCells());

      Y.board.showScores(scores);

      this.rollCount += 1;
      Y.board.updateRoll(this.rollCount);

      // show board if it's hidden
      Y.board.showTab('board');

      // delay next roll
      this.setNextRoll(500);

      return states;
    }
    
    return null;
  },

  newGame: function() {
    this.upperScore = 0;
    this.totalScore = 0;
    this.rollCount = 0;
    this.hasUpperBonus = false;
    Y.board.updateRoll(this.rollCount);
    Y.board.resetDice();
    Y.board.resetCells();
    Y.board.updateTotalScores(0, 0, false);
    Y.board.showTab('board');
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
      
      // delay next roll a bit to prevent accidental rolls
      this.setNextRoll(100);
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
      if (type.indexOf("upper") === 0) {
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
      Y.board.clearScores();
      Y.board.updateTotalScores(this.upperScore, this.totalScore, this.hasUpperBonus);
      Y.board.updateRoll(this.rollCount);

      return true;
    }

    return false;
  },

  gameOver: function () {
    var hs = this.getHighScores();
    Y.board.gameOver(this.totalScore, hs.list, hs.currentIn);
  },

  checkGameOver: function () {
    var availableTypes = Y.board.availableCells();

    if (availableTypes.length === 0) {
      this.rollCount = 3;
      Y.board.updateRoll(this.rollCount);

      return true;
    }

    return false;
  },

  getHighScores: function () {
    var ohs = this.loadHighScores(),
        now = new Date(),
        currentIndex = null;

    if (!ohs && !ohs.length) {
      ohs = [];
    }

    ohs.forEach(function (el, i) {
      if (currentIndex === null && el.score <= this.totalScore) {
        currentIndex = i;
      }
    }, this);

    if (currentIndex === null) {
      currentIndex = ohs.length;
    }

    // add current score to list
    ohs.splice(currentIndex, 0, {score: this.totalScore, date: now});
    // truncate list to max
    ohs.splice(MAX_HIGHSCORES, Number.MAX_VALUE);

    // save list
    this.saveHighScores(ohs);

    // is current score in the highsceres?
    return {list: ohs, currentIn: currentIndex};
  },

  saveHighScores: function(highScores) {
    if (window.localStorage) {
      // save highscores to localstorage
      window.localStorage.setItem('highScores', JSON.stringify(highScores));
    }
  },

  loadHighScores: function() {
    if (window.localStorage) {
      try {
        // load highscores from localstorage
        return JSON.parse(window.localStorage.getItem('highScores') || "[]");
      } catch (e) {}
    }

    return [];
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
