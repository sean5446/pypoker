var soundBet     = new Audio('static/audio/bet.mp3');
var soundCheck   = new Audio('static/audio/check.mp3');
var soundFlop    = new Audio('static/audio/flop.mp3');
var soundFold    = new Audio('static/audio/fold.mp3');
var soundNewHand = new Audio('static/audio/newhand.mp3');
//var soundRiver = new Audio('static/audio/river.mp3');
//var soundShow    = new Audio('static/audio/show.mp3');
var soundTimeout = new Audio('static/audio/timeout.mp3');
var soundTurn    = new Audio('static/audio/turn.mp3');
var soundWin     = new Audio('static/audio/win.mp3');

var soundTimeoutTimer;
var preventTimeoutTimer;

function soundTimeoutCountdown() {
  soundTimeoutTimer = setTimeout(function(){ soundTimeout.play(); }, 15 *1000);
}

function cardFriendlyName(card, suit) {
  var strCard = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"][card]
              + "" + ["s", "c", "d", "h"][suit];
  return strCard;
}

function getTimeString() {
  var d = new Date();
  return d.toLocaleTimeString();
}
