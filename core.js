(function(window){

  function extend(obj, props) {
    let newObj = {};

    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        newObj[prop] = obj[prop];
      }
    }

    for (let prop in props) {
      if (props.hasOwnProperty(prop)) {
        newObj[prop] = props[prop];
      }
    }

    return newObj;
  }

  function parseDate(str) {
    try {
      var d = new Date(Date.parse(str));

      return d.toISOString();
    } catch (err) {
      return "ugh, idk";
    }
  }

  // Gets some JSON from the url in `opts.url` then uses `opts.vars` and
  // `opts.display` to add another list item in the required format.
  function getJson(opts, callback) {
    fetch(opts.url)
      .then(response => response.json())
      .then(data => {
        var vars = {};

        if (opts.base) {
          data = opts.base(data);
        }

        if (opts.vars) {
          for (var key in opts.vars) {
            let val = opts.vars[key];

            vars[key] = val(data);
          }

          if (vars.date) {
            // Parse the date, and return in a common format.
            vars.date = parseDate(vars.date);
          }

          callback(vars);
        } else {
          callback(data);
        }
      })
      .catch(err => console.warn(opts.url, err));
  }

  function maybeFirst(thing) {
    return thing.length === undefined ? thing : thing[0];
  }

  function addToList(opts, list) {
    return function(data) {
      var text = '';

      if (typeof opts.display == "function") {
        text = opts.display(data);
      } else {
        text = Mustache.render(opts.display, data);
      }

      // Now append a new list element using Mustache with `opts.display` and the
      // vars found above.
      list.innerHTML += '<li>' + text + '</li>';
    };
  }

  function mapObject(obj, f) {
    for (var key in obj) {
      obj[key] = f(obj[key]);
    }
    return obj;
  }

  var JsonGetter = function() {
    var getter = {
      appendTo: function(list) {
        getJson(this, addToList(this, list));
      }
    };
    return getter;
  };

  var XmlGetter = function() {
    var getter = {
      appendTo: function(list) {
        this.url = "//query.yahooapis.com/v1/public/yql?q=" +
          encodeURIComponent('select * from xml where url="' + this.url + '"') +
          "&env=store://datatables.org/alltableswithkeys&format=json";

        if (this.base) {
          var oldBase = this.base;
          this.base = data => oldBase(data.query.results);
        } else {
          this.base = data => data.query.results;
        }

        getJson(this, addToList(this, list));
      }
    };
    return getter;
  };

  var Maker = function(getter, defaults) {
    return function(opts) {
      var getterWithDefaults = extend(getter, defaults(opts));

      return extend(getterWithDefaults, opts);
    };
  };

  var Providers = {
    flickr: Maker(XmlGetter(), function(opts) {
      return {
        url: "http://api.flickr.com/services/feeds/photos_public.gne?id=" + opts.user + "&lang=en-us&format=rss_200",
        base: data => maybeFirst(data.rss.channel.item),
        vars: {
          title: data => data.title[0],
          photo: data => data.content.url.replace(/^http:/, 'https:'),
          date:  data => data.pubDate,
          link:  data => data.link
        },
        display: '<h2><a href="{{{link}}}">flickr</a>: {{title}}</h2><img class="sub" src="{{{photo}}}" /> '
      };
    }),

    "last.fm": Maker(XmlGetter(), function(opts) {
      return {
        url:  '//ws.audioscrobbler.com/1.0/user/' + opts.user + '/recenttracks.rss?limit=1',
        base: data => data.rss.channel.item,
        vars: {
          title: data => data.title,
          link:  data => data.link,
          date:  data => data.pubDate
        },
        display: '<h2><a href="{{{link}}}">last.fm</a>: {{title}}</h2>'
      };
    }),

    twitter: Maker(JsonGetter(), function(opts) {
      return {
        url:  "//api.twitter.com/1/statuses/user_timeline/" + opts.user + ".json?count=1&include_rts=1&callback=?",
        vars: {
          text: data => data[0].text,
          id:   data => data[0].id,
          date: data => data[0].created_at
        },
        display: '<h2><a href="//twitter.com/' + opts.user + '/status/{{id}}">twitter</a>: {{text}}</h2>'
      };
    }),

    github: Maker(JsonGetter(), function(opts) {
      return {
        url:  "//api.github.com/users/" + opts.user + "/events/public",
        formats: {
          CommitCommentEvent: 'commented on {{repo.name}}',
          CreateEvent:        'created {{repo.name}}/{{payload.ref}}',
          DeleteEvent:        'deleted {{ref.name}}',
          FollowEvent:        'followed {{target.login}}',
          ForkEvent:          'forked {{forkee.name}}',
          ForkApplyEvent:     'applied {{head}}',
          GistEvent:          '{{payload.action}} gist {{gist.html_url}}',
          IssueCommentEvent:  '{{payload.action}} comment on {{repo.name}}#{{payload.issue.number}}',
          IssuesEvent:        '{{payload.action}} issue #{{payload.issue.number}} on {{repo.name}}',
          PullRequestEvent:   '{{payload.action}} issue #{{payload.issue.number}} on {{repo.name}}',
          PushEvent:          'pushed to {{repo.name}}',
          WatchEvent:         '{{payload.action}} watching {{repo.name}}'
        },
        display: function(data) {
          var head = '<h2><a href="{{url}}">github</a>: ',
              tail = '</h2>',
              data = data[0];

          return Mustache.render(head + this.formats[data.type] + tail, data);
        }
      };
    }),

    blog: Maker(XmlGetter(), function(opts) {
      var name = opts.name || 'blog';

      return {
        url: opts.feed,
        base: data => maybeFirst(data.rss.channel.item),
        vars: {
          title: data => data.title,
          link:  data => data.link,
          date:  data => data.pubDate,
          text:  data => data.description.replace('<img src="http:', '<img src="https:')
        },
        display: '<h2><a href="{{{link}}}">' + name + '</a>: {{title}}</h2><section class="sub">{{{text}}}</section>'
      };
    }),

    xml: Maker(XmlGetter(), function(opts) {
      return {};
    }),

    json: Maker(JsonGetter(), function(opts) {
      return {};
    })
  };

  window.myLast = (list, config) => {
    config.forEach(obj => {
      var provider = Providers[obj.type];

      if (provider == null) {
        console.log("ERROR: No provider '" + obj.type + "'");
      } else {
        provider(obj).appendTo(list);
      }
    });
  };
})(window);
