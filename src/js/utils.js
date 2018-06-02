'use strict';
//import {config} from './config.js';

var clock = {
  interval: 1000,
  multiplier: 1,
  maxMultiplier: 8,
  minMultiplier: 0.125,
  isRunning: false,
  isStarted: false,
  timerId: undefined,
  run: function(callback) {
    if (clock.isRunning) {
      this.timerId = setTimeout(function() {
        callback();
        clock.run(callback);
      }, this.interval / this.multiplier);
    }
  },
  start: function(startCallback, tickCallback) {
    this.isRunning = true;
    if (!this.isStarted) {
      this.isStarted = true;
      startCallback();
    }
    this.run(tickCallback);
  },
  pause: function() {
    this.isRunning = false;
    clearTimeout(this.timerId);
  },
  stop: function(resetCallback) {
    this.reset();
    resetCallback();
  },
  reset: function() {
    this.isRunning = false;
    this.isStarted = false;
    clearTimeout(this.timerId);
  },
  multiply: function(m) {
    this.multiplier = Math.max(this.minMultiplier, Math.min(this.maxMultiplier, this.multiplier * m));
  },
  resetMultiplier: function() {
    this.multiplier = 1;
  }
}

export function setupPlaybackControlActions(startCb, tickCb, resetCb) {

  $('#pb-play').click(function() {
    if ($('#pb-play i').hasClass('fa-play')) {
      clock.start(startCb, tickCb);
    } else {
      clock.pause();
    }
    $('#pb-play i').toggleClass('fa-pause fa-play');
    $('#pb-play i').addClass('blink');
    $(this).blur();
    return false;
  });

  $('#pb-faster').click(function() {
    clock.multiply(2);
    $(this).blur();
    return false;
  });

  $('#pb-slower').click(function() {
    clock.multiply(.5);
    $(this).blur();
    return false;
  });

  $('#pb-stop').click(function() {
    setPlaybackPauseMode();
    clock.stop(resetCb);
    $(this).blur();
    return false;
  });

  // Keyboard events
  $(document).off('keydown');
  $(document).keydown(function (e) {
    switch (e.which) {
      case 32: // Spacebar
        $('#pb-play').click();
        e.preventDefault();
        break;
      case 27: // Escape key
        $('#pb-stop').click();
        break;
      case 38: // Up arror
        $('#pb-faster').click();
        break;
      case 40: // Down arrow
        $('#pb-slower').click();
        break;
    }
  });

}

export function resetPlaybackControl() {
  setPlaybackPauseMode();
  clock.reset();
}

function setPlaybackPauseMode() {
  if ($('#pb-play i').hasClass('fa-pause')) {
    $('#pb-play').click();
  }
  $('#pb-play i').removeClass('blink');
}

export function getUrlVars() {
	var urlVars = [];
	var varArray = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	for (var i = 0; i < varArray.length; i++) {
		var urlVar = varArray[i].split('=');
		urlVars[urlVar[0]] = urlVar[1];
	}
	return urlVars;
}
