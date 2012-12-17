> Your reputation's only as good as the last piece of content you gave to a 
> social network.

- Warren Ellis (http://www.warrenellis.com/?p=13972)


# I am my last _____

Aggregate your last (tweet / blog post / photo / listen / ...) onto a single 
page. That page is your reputation, well done.


## Setup

To setup what data to pull in edit `config.json` with the correct details. The
file is an array of objects, each object will contain specific keys:

#### `type`

The provider used to retrieve data; `json`, `xml` or any others listed below.

#### `url`

The full url to GET.

#### `vars`

An object containing key-value pairs, where the value describes the "path" to
find in the retrieved data. For instance with the json response,

``` json
[
  {
    "body": {
      "text": "some text"
    }
  }
]
```

You could get the text variable with

``` json
"vars": {
  "text": ["body", "text"]
}
```

With an xml response,

``` xml
<items>
  <item>
    <body text="some text">
  </item>
</items>
```

You would use,

``` json
"vars": {
  "text": ["item", "body", "=text"]
}
```

For xml, you can get an attribute value with `=attrName` and node values 
normally.

#### `display`

This string is rendered using [Mustache][m] with the `vars` specified.
  

All together this produces something like,

``` json
{
  "type": "xml",
  "url":  "http://blog.example.com/feed.xml",
  "vars": {
    "title":  ["item", "title"],
    "link":   ["item", "link"],
    "date":   ["item", "pubDate"],
    "text":   ["item", "description"],
    "author": ["item", "author"]
  },
  "display": "<h2><a href='{{{link}}}'>{{author}} wrote</a>: {{title}}</h2><section class='sub'>{{{text}}}</section>"
}
```

For common services there are the in built providers listed below.


### Twitter

``` json
{
  "type": "twitter",
  "user": "your_user_name"
}
```


### Last.fm

``` json
{
  "type": "last.fm",
  "user": "your_user_name"
}
```


### Flickr

``` json
{
  "type": "flickr",
  "user": "your_user_id"
}
```

Note: `your_user_id` is the crazy number, like `XXXXXXXX@NXX`.


### Blog

``` json
{
  "type": "blog",
  "name": "My Example Blog",
  "feed": "http://blog.example.com/feed.xml"
}
```

