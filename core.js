function parseDate(str) {
  var d = new Date(Date.parse(str));
  
  return d.toISOString();
}


// Gets some JSON from the url in `opts.url` then uses `opts.vars` and 
// `opts.display` to add another list item in the required format.
function getJson(list, opts) {
  $.getJSON(opts.url, function(data) {
    var vars = {};
    
    // For each element of `opts.vars` run through the given call path to get 
    // the value. So, say we have:
    //
    //     vars: {
    //       title: [0, 'title']
    //     }
    //
    // Which would translate to:
    //
    //    vars['title'] = data[0]['title']
    //
    $.each(opts.vars, function(key, val) {
      vars[key] = data;
      $.each(val, function(i, meth) {
        vars[key] = vars[key][meth];
      });
    });
    
    // Parse the date, and return in a common format.
    vars.date = parseDate(vars.date);
    
    // Now append a new list element using Mustache with `opts.display` and the 
    // vars found above.
    list.append('<li>' + Mustache.render(opts.display, vars) + '</li>');
  });
}

// Gets some XML from the url in `opts.url` then uses `opts.vars` and 
// `opts.display` to add another list item in the required format.
function getXml(list, opts) {
  $.get(opts.url, function(data) {
    var vars = {};

    // For each element of `opts.vars` run through the given call path to get
    // the value. As XML allows attributes a value beginning with '=' is taken
    // to refer to an attribute. So with,
    //
    //    vars: {
    //      photo: ['item', "media\\:content, content", '=url']
    //    }
    //
    // Becomes,
    //
    //    vars.photo = data.find('item')
    //                     .find("media\\:content, content")
    //                     .attr('url')
    //
    $.each(opts.vars, function(key, val) {
      vars[key] = data;
      
      $.each(val, function(i, meth) {
        if (meth[0] == '=') {
          vars[key] = $(vars[key]).attr(meth.substring(1));
        } else {
          vars[key] = $(vars[key]).find(meth);
        }
      });
      
      // The value in `vars[key]` is potentially an XML element, this extracts
      // the text so we have a string.
      if (typeof vars[key] != "string") {
        vars[key] = $(vars[key][0]).text();
      }
    });
    
    // Parse the date, and return in a common format.
    vars.date = parseDate(vars.date);
  
    // Now append a new list element using Mustache with `opts.display` and the 
    // vars found above.
    list.append('<li>' + Mustache.render(opts.display, vars) + '</li>');
  });
}

function extend () {
  var consumer = arguments[0],
      providers = Array.prototype.slice.call(arguments, 1),
      key,
      i,
      provider;
  for (i in providers) {
    provider = providers[i];
    for (key in provider) {
      if (provider.hasOwnProperty(key)) {
        consumer[key] = provider[key]
      } 
    }
  }
  return consumer
};

var JsonGetter = function() {
  var getter = {
    appendTo: function(list) {
      getJson(list, this)
    }
  }
  return getter
}

var XmlGetter = function() {
  var getter = {
    appendTo: function(list) {
      getXml(list, this)
    }
  }
  return getter
};

var Maker = function(getter, defaults) {
  return function(opts) {
    var getterWithDefaults = extend(getter, defaults(opts));
  
    return extend(getterWithDefaults, opts)
  }
}


var Twitter = Maker(JsonGetter(), function (opts) {
  return {
    url:  "https://api.twitter.com/1/statuses/user_timeline/" + opts.user + ".json?count=1&include_rts=1&callback=?",
    vars: {
      text: [0, 'text'],
      id:   [0, 'id'],
      date: [0, 'created_at']
    },
    display: '<h2><a href="http://twitter.com/' + opts.user + '/status/{{id}}">twitter</a>: {{text}}</h2>'
  }
})

// var tw = Twitter({user: 'hawx'})
// tw.appendTo( $('#list') )


// Gets the latest tweet from twitter for `opts.user`.
function fromTwitter(list, opts) {
  var url = "https://api.twitter.com/1/statuses/user_timeline/" + opts.user + ".json?count=1&include_rts=1&callback=?";
  
  var defaults = {
    url:  url,
    vars: {
      text: [0, 'text'],
      id:   [0, 'id'],
      date: [0, 'created_at']
    },
    display: '<h2><a href="http://twitter.com/' + opts.user + '/status/{{id}}">twitter</a>: {{text}}</h2>',
  };
  
  getJson(list, $.extend(defaults, opts));
}

// Gets the last track scrobbled to last.fm for `opts.user`.
function fromLastFm(list, opts) {
  var url = 'http://ws.audioscrobbler.com/1.0/user/' + opts.user + '/recenttracks.rss?limit=1';
  
  var defaults = {
    url:  url, 
    vars: {
      title: ['item', 'title'],
      link:  ['item', 'link'],
      date:  ['item', 'pubDate']
    },
    display: '<h2><a href="{{{link}}}">last.fm</a>: {{title}}</h2>',
  };
  
  getXml(list, $.extend(defaults, opts));
}

// Gets the latest post on tumblr for `opts.user`.
function fromTumblr(list, opts) {
  var url = 'http://' + opts.user + '/rss';
  
  var defaults = {
    url: 'http://' + opts.user + '/rss',
    vars: {
      title: ['item', 'title'],
      link:  ['item', 'link'],
      date:  ['item', 'pubDate'],
      text:  ['item', 'description']
    },
    display: '<h2><a href="{{{link}}}">tumblr</a>: {{title}}</h2><section class="sub">{{{text}}}</section>'
  };
  
  getXml(list, $.extend(defaults, opts));
}

// Gets the latest photo on flickr for `opts.user`.
function fromFlickr(list, opts) {
  var url = "http://api.flickr.com/services/feeds/photos_public.gne?id=" + opts.user + "&lang=en-us&format=rss_200";
  
  var defaults = {
    url: url,
    vars: {
      title: ['item', 'title'],
      photo: ['item', "media\\:content, content", '=url'],
      date:  ['item', 'pubDate'],
      link:  ['item', 'link']
    },
    display: '<h2><a href="{{{link}}}">flickr</a>: {{title}}</h2><img class="sub" src="{{{photo}}}" /> '
  };
  
  getXml(list, $.extend(defaults, opts));
}

var providers = {
  flickr:    fromFlickr,
  "last.fm": fromLastFm,
  twitter:   fromTwitter,
  tumblr:    fromTumblr
}

function startup(data) {
  $('body').append('<ul id="list"></ul>');
  var list = $("#list");

  $.each(data, function(i, obj) {
    var provider = providers[obj.type];
    
    provider(list, obj);
  });
}

$(document).ready(function() {
  $.getJSON('config.json', startup);
});