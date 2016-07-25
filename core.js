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
      list.innerHTML += '<li>' + opts.display(data) + '</li>';
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
        display: data => `<h2><a href="${data.link}">flickr</a>: ${data.title}</h2><img class="sub" src="${data.photo}" /> `
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
        display: data => `<h2><a href="${data.link}">last.fm</a>: ${data.title}</h2>`
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
        display: data => `<h2><a href="//twitter.com/${opts.user}/status/${data.id}">twitter</a>: ${data.text}</h2>`
      };
    }),

    github: Maker(JsonGetter(), function(opts) {
      return {
        url:  "//api.github.com/users/" + opts.user + "/events/public",
        formats: {
          CommitCommentEvent: data => `commented on ${data.repo.name}`,
          CreateEvent:        data => `created ${data.repo.name}/${data.payload.ref}`,
          DeleteEvent:        data => `deleted ${data.ref.name}`,
          FollowEvent:        data => `followed ${data.target.login}`,
          ForkEvent:          data => `forked ${data.forkee.name}`,
          ForkApplyEvent:     data => `applied ${data.head}`,
          GistEvent:          data => `${data.payload.action} gist ${data.gist.html_url}`,
          IssueCommentEvent:  data => `${data.payload.action} comment on ${data.repo.name}#${data.payload.issue.number}`,
          IssuesEvent:        data => `${data.payload.action} issue #${data.payload.issue.number} on ${data.repo.name}`,
          PullRequestEvent:   data => `${data.payload.action} issue #${data.payload.issue.number} on ${data.repo.name}`,
          PushEvent:          data => `pushed to ${data.repo.name}`,
          WatchEvent:         data => `${data.payload.action} watching ${data.repo.name}`
        },
        display: function(data) {
          var head = '<h2><a href="{{url}}">github</a>: ',
              tail = '</h2>',
              data = data[0];

          return `<h2><a href="${data.url}">github</a>: ${this.formats[data.type](data)}</h2>`;
        }
      };
    }),

    blog: Maker(XmlGetter(), function(opts) {
      var name = opts.name || 'blog';

      return {
        url: opts.feed,
        base: data => maybeFirst(data.rss.channel.item),
        vars: {
          title: data => data.title || '',
          link:  data => data.link,
          date:  data => data.pubDate,
          text:  data => data.description.replace('<img src="http:', '<img src="https:')
        },
        display: data => `<h2><a href="${data.link}">${name}</a>: ${data.title}</h2><section class="sub">${data.text}</section>`
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
