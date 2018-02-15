PyPoker = {

  socket: null,

  Game: {
    gameId: null,

    numCards: null,

    scoreCategories: null,

    getCurrentPlayerId: function() {
      console.log("getCurrentPlayerId");
      return $('#current-player').attr('data-player-id');
    },

    setCard: function($card, rank, suit) {
      console.log("setCard");
      $card.each(function() {
        x = 0;
        y = 0;

        if ($(this).hasClass('small')) {
          url = "static/images/cards-small.png";
          width = 24;
          height = 40;
        }
        else if ($(this).hasClass('medium')) {
          url = "static/images/cards-medium.png";
          width = 45;
          height = 75;
        }
        else {
          url = "static/images/cards-large.png";
          width = 75;
          height = 125;
        }

        if (rank !== undefined || suit !== undefined) {
          switch (suit) {
            case 0: // Spades
              x -= width;
              y -= height;
              break;
            case 1: // Clubs
              y -= height;
              break;
            case 2: // Diamonds
              x -= width;
              break;
            case 3: // Hearts
              break;
            default:
              throw "Invalid suit";
          }

          if (rank == 14) {
            rank = 1;
          }
          else if (rank < 1 || rank > 13) {
            throw "Invalid rank";
          }

          x -= (rank - 1) * 2 * width + width;
        }

        $(this).css('background-position', x + "px " + y + "px");
        $(this).css('background-image', 'url(' + url + ')');
      })
    },

    newGame: function(message) {
      console.log("newGame");
      soundNewHand.play();
      $('#shared-cards').attr('cards', '');
      $('.cards').attr('cards', '');
      
      PyPoker.Game.gameId = message.game_id;
      PyPoker.Game.scoreCategories = {
        0: "Highest card",
        1: "Pair",
        2: "Double pair",
        3: "Three of a kind",
        4: "Straight",
        5: "Flush",
        6: "Full house",
        7: "Four of a kind",
        8: "Straight flush"
      };

      if (message.game_type == "traditional") {
        PyPoker.Game.numCards = 5;
      } else {
        PyPoker.Game.numCards = 2;
      }

      $('#game-wrapper').addClass(message.game_type);
      $dealerButton = $('#dealer-button');
      $dealerButton.remove();

      for (key in message.players) {
        playerId = message.players[key].id
        $player = $('#players .player[data-player-id=' + playerId + ']');
        $cards = $('.cards', $player);
        
        for (i = 0; i < PyPoker.Game.numCards; i++) {
          $cards.append('<div class="card small" data-key="' + i + '"></div>');
        }

        if (playerId == message.dealer_id) {
          $player.addClass('dealer');
          $player.append('<div id="dealer-button">D</div>');
          $dealerButton = $('#dealer-button');

          if ($player.parent().attr('data-key') < 5) {
            $dealerButton.css('top', '110px');
          } else {
            $dealerButton.css('top', '-10px');
          }
        }
        if (playerId == PyPoker.Game.getCurrentPlayerId())  {
          $player.addClass('current');
        }
      }
      $('#current-player').show();
    },

    gameOver: function(message) {
      console.log("gameOver");
      $('.player').removeClass('fold');
      $('.player').removeClass('winner');
      $('.player').removeClass('looser');
      $('.player').removeClass('dealer');
      $('.player .cards').empty();
      $('#pots').empty();
      $('#shared-cards').empty();
      $('#players .player .bet-wrapper').empty();
      $('#current-player').hide();
    },

    updatePlayer: function(player) {
      console.log("updatePlayer");
      $player = $('#players .player[data-player-id=' + player.id + ']');
      $('.player-money', $player).text('$' + parseInt(player.money));
      $('.player-name', $player).text(player.name);
    },

    playerFold: function(player) {
      console.log("playerFold");
      soundFold.play();
      $player = $('#players .player[data-player-id=' + player.id + ']');
      var name = $player.find('.player-info').find('.player-name').text();
      PyPoker.Room.logActivity(name + ' folds');
      $player.addClass('fold');
    },

    updatePlayers: function(players) {
      console.log("updatePlayers");
      for (k in players) {
        PyPoker.Game.updatePlayer(players[k]);
      }
    },

    updatePlayersBet: function(bets) {
      console.log("updatePlayerBets");
      // Remove bets
      $('#players .player .bet-wrapper').empty();
      if (bets !== undefined) {
        for (playerId in bets) {
          bet = parseInt(bets[playerId]);
          if (bet > 0) {
            $bet = $('<div class="bet"></div>');
            $bet.text('$' + parseInt(bets[playerId]));
            $('#players .player[data-player-id=' + playerId + '] .bet-wrapper').append($bet);
          }
        }
      }
    },

    setPlayerCards: function(cards, $cards) {
      console.log("setPlayerCards");
      var strCards = '';
      
      for (cardKey in cards) {
        $card = $('.card[data-key=' + cardKey + ']', $cards);
        PyPoker.Game.setCard(
          $card,
          cards[cardKey][0],
          cards[cardKey][1]
        );
        strCards += cardFriendlyName(cards[cardKey][0], cards[cardKey][1]) +' ';
      }
      
      $cards.attr('cards', strCards);

      PyPoker.Room.logActivity(
         $cards.siblings('.player-info').find('.player-name').text() +
         ' has [ ' + strCards + ']');
    },

    updatePlayersCards: function(players) {
      console.log("updatePlayerCards");
      for (playerId in players) {
        $cards = $('.player[data-player-id=' + playerId + '] .cards');
        PyPoker.Game.setPlayerCards(players[playerId].cards, $cards);
      }
    },

    updateCurrentPlayerCards: function(cards, score) {
      console.log("updateCurrentPlayerCards");
      $cards = $('.player[data-player-id=' + PyPoker.Game.getCurrentPlayerId() + '] .cards');
      PyPoker.Game.setPlayerCards(cards, $cards);
      $('#current-player .cards .category').text(PyPoker.Game.scoreCategories[score.category]);
    },

    addSharedCards: function(cards) {
      console.log("addSharedCards");
      if (cards.length == 3) soundFlop.play();
      else soundTurn.play();
      var strCards = '';
      
      for (cardKey in cards) {
        $card = $('<div class="card medium"></div>');
        PyPoker.Game.setCard($card, cards[cardKey][0], cards[cardKey][1]);
        $('#shared-cards').append($card);
        strCards += cardFriendlyName(cards[cardKey][0], cards[cardKey][1]) + ' ';
      }
      
      PyPoker.Room.logActivity('Dealt to board [ ' + strCards +  ']');
      $sharedCards = $('#shared-cards');
      $sharedCards.attr('cards', $sharedCards.attr('cards') + strCards);
      
      if (cards.length == 3 && ! $('.player .current').hasClass('fold')) {
        var flops = $('#flops-seen').attr('flops');
        flops++;
        $('#flops-seen').attr('flops', flops);
        $('#flops-seen').text('Flops seen: ' + flops++);
      }
    },

    updatePots: function(pots) {
      console.log("updatePots");
      $('#pots').empty();
      $('#pots').empty();
      for (potIndex in pots) {
        $('#pots').append($(
          '<div class="pot">' + '$' + parseInt(pots[potIndex].money) + '</div>'
        ));
      }
    },

    setWinners: function(pot) {
      console.log("setWinners");
      soundWin.play();
      $('#players .player').addClass('fold');
      $('#players .player').removeClass('winner');
      
      for (playerIdKey in pot.player_ids) {
        playerId = pot.player_ids[playerIdKey];
        $player = $('#players .player[data-player-id=' + playerId + ']');

        // player is involved in the pot, but not necessarily current player
        if (pot.winner_ids.indexOf(playerId) != -1) {
          $player.removeClass('fold');
          $player.addClass('winner');

          var name = $player.find('.player-name').text();          
          PyPoker.Room.logActivity(name + ' wins ' + pot.money_split + ' chips');
          
          if ($('#shared-cards').children().length == 5) {
            var cards = $player.parent().find('.cards').attr('cards') +
              $('#shared-cards').attr('cards');
            cards = cards.slice(0, -1); // remove trailing space
            var handName = Hand.solve(cards.split(' ')).descr;
            PyPoker.Room.logActivity("Winning hand [ " + cards + " ] [ " + handName + 
              " ]\n=============================================");
          }
        }
        else {
          $player.addClass('fold');
        }
        
        // current player is winner
        if (playerId == PyPoker.Game.getCurrentPlayerId()) {
          var won = $('#pots-won').attr('won');
          won++;
          $('#pots-won').attr('won', won);
          $('#pots-won').text('Pots won: ' + won);
        }
      }
    },

    changeCards: function(player, numCards) {
      console.log("changeCards");
      $player = $('#players .player[data-player-id=' + player.id + ']');

      $cards = $('.card', $player).slice(-numCards);

      $cards.slideUp(1000).slideDown(1000);
    },

    onGameUpdate: function(message) {
      console.log("onGameUpdate");
      PyPoker.Player.resetControls();
      PyPoker.Player.resetTimers();
      
      switch (message.bet_type) {
         case "raise":
          PyPoker.Room.logActivity(message.player.name + ' bet ' + message.bets[message.player.id]);
          soundBet.play();
          break;
         case "check":
          // for some reason this fires on fold too
          if ($('.fold').length != 1) {
            PyPoker.Room.logActivity(message.player.name + ' checked');
            soundCheck.play();
          }
          break;
         case "call":
          PyPoker.Room.logActivity(message.player.name + ' called ' + message.bets[message.player.id]);
          soundBet.play();
          break;
         case "blind":
          soundBet.play();
          break;
      }

      switch (message.event) {
        case 'new-game':
          PyPoker.Game.newGame(message);
          break;
        case 'cards-assignment':
          $cards = $('#current-player .cards');
          $cards.empty();
          for (i = 0; i < PyPoker.Game.numCards; i++) {
            $cards.append($('<div class="card large" data-key="' + i + '"></div>'));
          }
          $('.card', $cards).click(function() {
            if (PyPoker.Player.cardsChangeMode) {
              $(this).toggleClass('selected');
            }
          });
          PyPoker.Game.updateCurrentPlayerCards(message.cards, message.score);
          break;
        case 'game-over':
          PyPoker.Game.gameOver();
          break;
        case 'fold':
          PyPoker.Game.playerFold(message.player);
          break;
        case 'bet':
          PyPoker.Game.updatePlayer(message.player);
          PyPoker.Game.updatePlayersBet(message.bets);
          break;
        case 'pots-update':
          PyPoker.Game.updatePlayers(message.players);
          PyPoker.Game.updatePots(message.pots);
          PyPoker.Game.updatePlayersBet();  // Reset the bets
          break;
        case 'player-action':
          PyPoker.Player.onPlayerAction(message);
          break;
        case 'dead-player':
          PyPoker.Game.playerFold(message.player);
          break;
        case 'cards-change':
          PyPoker.Game.changeCards(message.player, message.num_cards);
          break;
        case 'shared-cards':
          PyPoker.Game.addSharedCards(message.cards);
          break;
        case 'winner-designation':
          PyPoker.Game.updatePlayers(message.players);
          PyPoker.Game.updatePots(message.pots);
          PyPoker.Game.setWinners(message.pot);
          break;
        case 'showdown':
          PyPoker.Game.updatePlayersCards(message.players);
          break;
      }
    }
  },

  Logger: {
    log: function(text) {
      $p0 = $('#game-status p[data-key="0"]');
      $p1 = $('#game-status p[data-key="1"]');
      $p2 = $('#game-status p[data-key="2"]');
      $p3 = $('#game-status p[data-key="3"]');
      $p4 = $('#game-status p[data-key="4"]');

      $p4.text($p3.text());
      $p3.text($p2.text());
      $p2.text($p1.text());
      $p1.text($p0.text());
      $p0.text(text);
    }
  },

  Player: {
    betMode: false,

    cardsChangeMode: false,

    resetTimers: function() {
      console.log("resetTimers");
      $activeTimers = $('.timer.active');
      $activeTimers.TimeCircles().destroy();
      $activeTimers.removeClass('active');
      
      clearTimeout(soundTimeoutTimer);
      clearTimeout(preventTimeoutTimer);
    },

    resetControls: function() {
      console.log("resetControls");
      PyPoker.Player.setCardsChangeMode(false);
      PyPoker.Player.disableBetMode();
    },

    sliderHandler: function(value) {
      if (value == 0) {
        $('#bet-cmd').attr("value", "Check");
      }
      else {
        $('#bet-cmd').attr("value", "$" + parseInt(value));
      }
      $('#bet-input').val(value);
    },

    enableBetMode: function(message) {
      console.log("enableBetMode");
      PyPoker.Player.betMode = true;

      if (!message.min_score || $('#current-player').data('allowed-to-bet')) {
        // Set-up slider
        $('#bet-input').slider({
          'min': parseInt(message.min_bet),
          'max': parseInt(message.max_bet),
          'value': parseInt(message.min_bet),
          'formatter': PyPoker.Player.sliderHandler
        }).slider('setValue', parseInt(message.min_bet));

        // Fold control
        if (message.min_score) {
          $('#fold-cmd').val('Pass')
            .removeClass('btn-danger')
            .addClass('btn-warning');
        }
        else {
          $('#fold-cmd').val('Fold')
            .addClass('btn-danger')
            .removeClass('btn-warning');
        }

        $('#fold-cmd-wrapper').show();
        $('#bet-input-wrapper').show();
        $('#no-bet-cmd-wrapper').hide();
        $('#bet-cmd-wrapper').show();
      }
      else {
        $('#fold-cmd-wrapper').hide();
        $('#bet-input-wrapper').hide();
        $('#bet-cmd-wrapper').hide();
        $('#no-bet-cmd-wrapper').show();
      }

      $('#bet-controls').show();
      
      if ($('#auto-check').is(":checked")) {
        $('#bet-cmd').click();
        $('#auto-check').prop('checked', false);
        return;
      }
      
      if ($('#auto-fold').is(":checked")) {
        $('#fold-cmd').click();
        $('#auto-fold').prop('checked', false);
      }
    },

    disableBetMode: function() {
      console.log("disableBetMode");
      $('#bet-controls').hide();
    },

    setCardsChangeMode: function(changeMode) {
      console.log("setCardsChangeMode");
      PyPoker.Player.cardsChangeMode = changeMode;

      if (changeMode) {
        $('#cards-change-controls').show();
      }
      else {
        $('#cards-change-controls').hide();
        $('#current-player .card.selected').removeClass('selected');
      }
    },

    onPlayerAction: function(message) {
      console.log("onPlayerAction");
      isCurrentPlayer = message.player.id == $('#current-player').attr('data-player-id');

      switch (message.action) {
        case 'bet':
          if (isCurrentPlayer) {
            PyPoker.Player.onBet(message);
          }
          break;
        case 'cards-change':
          if (isCurrentPlayer) {
            PyPoker.Player.onChangeCards(message);
          }
          break;
      }

      timeout = (Date.parse(message.timeout_date) - Date.now()) / 1000;

      $timers = $('.player[data-player-id=' + message.player.id + '] .timer');
      $timers.data('timer', timeout);
      $timers.TimeCircles({
        "start": true,
        "animation": "ticks", // smooth
        "bg_width": 1,
        "fg_width": 0.05,
        "count_past_zero": false,
        "time": {
          "Days": { show: false },
          "Hours": { show: false },
          "Minutes": { show: false },
          "Seconds": { show: true }
        }
      });
      $timers.addClass('active');
      
      if (message.player.id == PyPoker.Game.getCurrentPlayerId()) {
        soundTimeoutCountdown();
        preventTimeoutTimer = setTimeout(function(){ PyPoker.Player.preventTimeoutAction(); }, 28.5 *1000);
      }
    },
    
    preventTimeoutAction: function() {
      if ($('#bet-cmd').attr("value") == 'Check') {
        $('#bet-cmd').click();
      }
      else {
        $('#fold-cmd').click();
      }
    },

    onBet: function(message) {
      console.log("onBet");
      PyPoker.Player.enableBetMode(message);
      $("html, body").animate({ scrollTop: $(document).height() }, "slow");
    },

    onChangeCards: function(message) {
      console.log("onChangeCards");
      PyPoker.Player.setCardsChangeMode(true);
      $("html, body").animate({ scrollTop: $(document).height() }, "slow");
    }
  },

  Room: {
    roomId: null,

    createPlayer: function(player) {
      if (player === undefined) {
        return $('<div class="player"><div class="player-info"></div></div>');
      }
      isCurrentPlayer = player.id == $('#current-player').attr('data-player-id');

      $playerName = $('<p class="player-name"></p>');
      $playerName.text(isCurrentPlayer ? 'You' : player.name);

      $playerMoney = $('<p class="player-money"></p>');
      $playerMoney.text('$' + parseInt(player.money));

      $playerInfo = $('<div class="player-info"></div>');
      $playerInfo.append($playerName);
      $playerInfo.append($playerMoney);

      $player = $('<div class="player' + (isCurrentPlayer ? ' current' : '') + '"></div>');
      $player.attr('data-player-id', player.id);
      $player.append($playerInfo);
      $player.append($('<div class="bet-wrapper"></div>'));
      $player.append($('<div class="cards small"></div>'));
      $player.append($('<div class="timer"></div>'));

      return $player;
    },

    destroyRoom: function() {
      PyPoker.Game.gameOver();
      PyPoker.Room.roomId = null;
      $('#players').empty();
    },

    initRoom: function(message) {
      PyPoker.Room.roomId = message.room_id;
      // Initializing the room
      $('#players').empty();
      for (k in message.player_ids) {
        $seat = $('<div class="seat"></div>');
        $seat.attr('data-key', k);

        playerId = message.player_ids[k];

        if (playerId) {
          // This seat is taken
          $seat.append(PyPoker.Room.createPlayer(message.players[playerId]));
          $seat.attr('data-player-id', playerId);
        }
        else {
          $seat.append(PyPoker.Room.createPlayer());
          $seat.attr('data-player-id', null);
        }
        $('#players').append($seat);
      }
    },

    onRoomUpdate: function(message) {
      if (PyPoker.Room.roomId == null) {
        PyPoker.Room.initRoom(message);
      }

      switch (message.event) {
        case 'player-added':
          playerId = message.player_id;
          player = message.players[playerId]
          playerName = playerId == $('#current-player').attr('data-player-id') ? 'You' : player.name;
          // Go through every available seat, find the one where the new player should sat and seated him
          $('.seat').each(function() {
            seat = $(this).attr('data-key');
            if (message.player_ids[seat] == playerId) {
              $(this).empty();
              $(this).append(PyPoker.Room.createPlayer(player));
              $(this).attr('data-player-id', playerId);
              var name = $('.player[data-player-id=' + playerId + ']').find('.player-info').find('.player-name').text();
              PyPoker.Room.logActivity(name + ' joined the table');
              return;
            }
          });
          break;

        case 'player-removed':
          playerId = message.player_id;
          playerName = $('.player[data-player-id=' + playerId + '] .player-name').text();
          // Go through every available seat, find the one where the leaving player sat and kick him out
          $('.seat').each(function() {
            seatedPlayerId = $(this).attr('data-player-id');
            if (seatedPlayerId == playerId) {
              var name = $('.player[data-player-id=' + playerId + ']').find('.player-info').find('.player-name').text();
              PyPoker.Room.logActivity(name + ' left the table');
              $(this).empty();
              $(this).append(PyPoker.Room.createPlayer());
              $(this).attr('data-player-id', null);
              return;
            }
          });
          break;
      }
    },
    
    logActivity: function(message) {
      var $activityLog = $('#activity-log');
      
      // if over 50 messages, trim messages
      $activityLog.text($activityLog.text() + "\n " + getTimeString() + ": " + message);
      $activityLog.scrollTop($activityLog[0].scrollHeight);
    }
  },

  init: function() {
    wsScheme = window.location.protocol == "https:" ? "wss://" : "ws://";

    PyPoker.socket = new WebSocket(wsScheme + location.host + "/poker/texas-holdem");

    PyPoker.socket.onopen = function() {
      PyPoker.Logger.log('Connected :)');
    };

    PyPoker.socket.onclose = function() {
      PyPoker.Logger.log('Disconnected :(');
      PyPoker.Room.destroyRoom();
    };

    PyPoker.socket.onmessage = function(message) {
      var data = JSON.parse(message.data);

      console.log(data);

      switch (data.message_type) {
        case 'ping':
          PyPoker.socket.send(JSON.stringify({'message_type': 'pong'}));
          break;
        case 'connect':
          PyPoker.onConnect(data);
          break;
        case 'disconnect':
          PyPoker.onDisconnect(data);
          break;
        case 'room-update':
          PyPoker.Room.onRoomUpdate(data);
          break;
        case 'game-update':
          PyPoker.Game.onGameUpdate(data);
          break;
        case 'error':
          PyPoker.Logger.log(data.error);
          break;
      }
    };

    $('#cards-change-cmd').click(function() {
      discards = [];
      $('#current-player .card.selected').each(function() {
        discards.push($(this).data('key'))
      });
      PyPoker.socket.send(JSON.stringify({
        'message_type': 'cards-change',
        'cards': discards
      }));
      PyPoker.Player.setCardsChangeMode(false);
    });

    $('#fold-cmd').click(function() {
      PyPoker.socket.send(JSON.stringify({
        'message_type': 'bet',
        'bet': -1
      }));
      PyPoker.Player.disableBetMode();
    });

    $('#no-bet-cmd').click(function() {
      PyPoker.socket.send(JSON.stringify({
        'message_type': 'bet',
        'bet': 0
      }));
      PyPoker.Player.disableBetMode();
    });

    $('#bet-cmd').click(function() {
      PyPoker.socket.send(JSON.stringify({
        'message_type': 'bet',
        'bet': $('#bet-input').val()
      }));
      PyPoker.Player.disableBetMode();
    });

    PyPoker.Player.setCardsChangeMode(false);
    PyPoker.Player.disableBetMode();
  },

  onConnect: function(message) {
    PyPoker.Logger.log('Connection established with poker5 server: ' + message.server_id);
    $('#current-player').attr('data-player-id', message.player.id);
    $('#activity-log').text(' ' + getTimeString() + ": Welcome to the poker room");
  },

  onDisconnect: function(message) {

  },

  onError: function(message) {
    PyPoker.Logger.log(message.error);
  }
}

$(document).ready(function() {
  PyPoker.init();
})

