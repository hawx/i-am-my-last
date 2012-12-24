> Your reputation's only as good as the last piece of content you gave to a 
> social network.

- Warren Ellis (http://www.warrenellis.com/?p=13972)


# I am my last _____

Aggregate your last (tweet / blog post / photo / listen / ...) onto a single 
page. That page is your reputation, well done.


## Setup

It is set up as a jQuery plugin, just call `myLast` on the `<ul>` to add to
and pass the options in, for example;

``` js
$(document).ready(function() {
  $('#list').myLast([
    {
      type: "twitter",
      user: "my_user_name"
    }
  ])
})
```

To setup what data to pull in edit `config.json` with the correct details. The
file is an array of objects, each object will contain specific keys:

#### `type`

The provider used to retrieve data; `json`, `xml` or any of the others listed 
below.

#### `url`

The full url to GET.

#### `vars`

An object containing key-value pairs, where the value describes the "path" to
find in the retrieved data. For instance with the JSON response,

``` json
[{
  "body": {
    "text": "some text"
  }
}]
```

You could get the text variable with

``` json
vars: {
  text: [0, "body", "text"]
}
```

XML works in a similar manner. It will take some trial and error, use the inspector
and console to help.

#### `display`

Either a string or a function.

If a string, it is rendered using [Mustache][m] with the `vars` specified.
Something like,

``` js
{
  type: "xml",
  url:  "http://blog.example.com/feed.xml",
  vars: {
    title:  ["rss", "channel", 0, "item", "title"],
    link:   ["rss", "channel", 0, "item", "link"],
    date:   ["rss", "channel", 0, "item", "pubDate"],
    text:   ["rss", "channel", 0, "item", "description"],
    author: ["rss", "channel", 0, "item", "author"]
  },
  display: "<h2><a href='{{{link}}}'>{{author}} wrote</a>: {{title}}</h2><section class='sub'>{{{text}}}</section>"
}
```

If a function, it is passed the data and will return a string.

``` js
{
  type: "xml",
  url:  "http://blog.example.com/feed.xml",
  display: function(data) {
    var tmpl = "<h2><a href='{{link}}'>{{author}} wrote</a>: {{title}}</h2>" +
               "<section class='sub'>{{{text}}}</section>",
        data = data.rss.channel[0].item;
        
    return Mustache.render(tmpl, data);
  }
}
```


For common services there are the in built providers listed below.


### Twitter

``` js
{
  type: "twitter",
  user: "your_user_name"
}
```


### Last.fm

``` js
{
  type: "last.fm",
  user: "your_user_name"
}
```


### Flickr

``` js
{
  type: "flickr",
  user: "your_user_id"
}
```

Note: `your_user_id` is the crazy number, like `XXXXXXXX@NXX`.


### Blog

``` js
{
  type: "blog",
  name: "My Example Blog",
  feed: "http://blog.example.com/feed.xml"
}
```

### Github

``` js
{
  type: "github",
  user: "your_user_name"
}
```

