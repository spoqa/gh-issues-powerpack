// ==UserScript==
// @name        GitHub Issues Powerpack
// @namespace   https://github.com/spoqa
// @description Provide more features than vanilla GitHub Issues
// @include     https://github.com/*/*/issues*
// @include     https://github.com/*/*/issues/assigned/*
// @include     https://github.com/*/*/issues/created_by/*
// @include     https://github.com/*/*/labels/*
// @include     https://github.com/*/*/milestones/*
// @version     1
// @grant       none
// ==/UserScript==

function poll(f, ms) {
  var tFunc = function () {
    var retry = !f();
    if (retry) {
      window.setTimeout(tFunc, ms);
    }
  };
  tFunc();
}

function getCache(key) {
  window.localStorage.getItem(key);
}

function setCache(key, value) {
  window.localStorage.setItem(key, value);
}

function initialize() {
  var selectMenu = $('.toolbar-filters .table-list-header-toggle ' +
                     '.select-menu[data-contents-url*=assign]');
  if (selectMenu.hasClass('progress-loaded')) {
    console.log('GitHub Issues Powerpack already initialized; skipped');
    return;
  }
  selectMenu.click(function () {
    if (selectMenu.hasClass('active') || selectMenu.hasClass('progress-loaded')) {
      return;
    }
    poll(function () {
      var items = $('.select-menu-modal .select-menu-list .select-menu-item',
                    selectMenu);
      if (items.length < 2) {
        return false;
      }
      items.each(function (i, el) {
        var self = $(this),
            href = self.attr('href'),
            cacheKey = 'progress:percentage:' + href,
            percentage = getCache(cacheKey),
            progressBarImage = $('img', this).attr('src');
        var drawBar = function (percentage) {
          self.css({
            'background-image': progressBarImage ? 'url(' + progressBarImage + ')'
                                                 : 'linear-gradient(to left, gray, black)',
            'background-size': percentage + ' 4px',
            'background-repeat': 'no-repeat'
          });
        };
        if (percentage) {
          drawBar(percentage);
        } else {
          $.ajax({
            url: href,
            success: function (response) {
              var tree = $(response),
                  links = $('.table-list-header-toggle.states > a', tree),
                  numbers = {};
              links.each(function () {
                var self = $(this),
                    text = self.text(),
                    match = text.match(/([0-9,]*)\s+(open|closed)\b/i);
                numbers[match[2].toLowerCase()] = window.parseInt((match[1] || '0').replace(/,/g, ''));
              });
              numbers.total = numbers.open + numbers.closed;
              if (numbers.total < 1) {
                percentage = '100%';
              } else if (numbers.closed > 0) {
                percentage = ~~(numbers.closed / numbers.total * 100) + '%';
              } else {
                percentage = '0%';
              }
              setCache(cacheKey, percentage);
              drawBar(percentage);
            }
          });
        }
      });
      return true;
    }, 250)
    selectMenu.addClass('progress-loaded');
  });

  console.log('GitHub Issues Powerpack initialized');
}

$(document).ajaxSuccess(initialize);
initialize();
