(function($){

  function parseDate(str) {
    var d = new Date(Date.parse(str));
    
    return d.toISOString();
  }
  
  // Gets some JSON from the url in `opts.url` then uses `opts.vars` and 
  // `opts.display` to add another list item in the required format.
  function getJson(opts, callback) {
    $.getJSON(opts.url, function(data) {
      var vars = {};
      
      if (opts.vars) {
      
        // For each element of `opts.vars` run through the given call path to get 
        // the value. So, say we have:
        //
        //     vars: {
        //       title: ['title']
        //     }
        //
        // Which would translate to:
        //
        //    vars['title'] = data['title']
        //
        $.each(opts.vars, function(key, val) {  
          vars[key] = data;
          $.each(val, function(i, meth) {
            vars[key] = vars[key][meth];
          });
        });
        
        if (vars.date) {
          // Parse the date, and return in a common format.
          vars.date = parseDate(vars.date);
        };
        
        callback(vars);
      
      } else {
        callback(data);
      }
    });
  }
  
  
  function addToList(opts, list) {
    return function(data) {
      var text = ''
    
      if (typeof opts.display == "function") {
        text = opts.display(data);
      } else {
        text = Mustache.render(opts.display, data);
      }
    
      // Now append a new list element using Mustache with `opts.display` and the 
      // vars found above.
      list.append('<li>' + text + '</li>');
    }
  }
  
  function map(obj, func) {
    for (var key in obj) {
      obj[key] = func(obj[key])
    }
    return obj
  }
  
  var JsonGetter = function() {
    var getter = {
      appendTo: function(list) {
        getJson(this, addToList(this, list))
      }
    }
    return getter
  }
  
  var XmlGetter = function() {
    var getter = {
      appendTo: function(list) {
        this.url = "http://query.yahooapis.com/v1/public/yql?q=" +
                   encodeURIComponent('select * from xml where url="' + this.url + '"') +
                   "&env=store://datatables.org/alltableswithkeys&format=json"
  
        this.vars = map(this.vars, function(e) {
          return ['query', 'results'].concat(e);
        });
        
        getJson(this, addToList(this, list));
      }
    }
    return getter
  };
  
  var Maker = function(getter, defaults) {
    return function(opts) {
      var getterWithDefaults = $.extend(getter, defaults(opts));
    
      return $.extend(getterWithDefaults, opts)
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
  
  var LastFm = Maker(XmlGetter(), function(opts) {
    return {
      url:  'http://ws.audioscrobbler.com/1.0/user/' + opts.user + '/recenttracks.rss?limit=1', 
      vars: {
        title: ['rss', 'channel', 'item', 'title'],
        link:  ['rss', 'channel', 'item', 'link'],
        date:  ['rss', 'channel', 'item', 'pubDate']
      },
      display: '<h2><a href="{{{link}}}">last.fm</a>: {{title}}</h2>',
    }
  })
  
  var Blog = Maker(XmlGetter(), function(opts) {
    var name = opts.name || 'blog';
  
    return {
      url: opts.feed,
      vars: {
        title: ['rss', 'channel', 'item', 0, 'title'],
        link:  ['rss', 'channel', 'item', 0, 'link'],
        date:  ['rss', 'channel', 'item', 0, 'pubDate'],
        text:  ['rss', 'channel', 'item', 0, 'description']
      },
      display: '<h2><a href="{{{link}}}">' + name + '</a>: {{title}}</h2><section class="sub">{{{text}}}</section>'
    }
  })
  
  var Flickr = Maker(XmlGetter(), function(opts) {
    return {
      url: "http://api.flickr.com/services/feeds/photos_public.gne?id=" + opts.user + "&lang=en-us&format=rss_200",
      vars: {
        title: ['rss', 'channel', 'item', 0, 'title', 0],
        photo: ['rss', 'channel', 'item', 0, 'content', 'url'],
        date:  ['rss', 'channel', 'item', 0, 'pubDate'],
        link:  ['rss', 'channel', 'item', 0, 'link']
      },
      display: '<h2><a href="{{{link}}}">flickr</a>: {{title}}</h2><img class="sub" src="{{{photo}}}" /> '
    }
  })
  
  var Xml = Maker(XmlGetter(), function(opts) {
    return {}
  })
  
  var Json = Maker(JsonGetter(), function(opts) {
    return {}
  })
  
  var Providers = {
    flickr:    Flickr,
    "last.fm": LastFm,
    twitter:   Twitter,
    blog:      Blog,
    xml:       Xml,
    json:      Json, 
  }
  
  $.fn.myLast = function(config) {
    var list = $(this);
    
    $.each(config, function(i, obj) {
      var provider = Providers[obj.type];
      
      if (provider == null) {
        console.log("ERROR: No provider '" + obj.type + "'");
      } else {
        provider(obj).appendTo(list);
      }
    });
  };
  
})(jQuery);