> Your reputation's only as good as the last piece of content you gave to a
> social network.

- Warren Ellis (http://www.warrenellis.com/?p=13972)


# I am my last _____

Aggregate your last (tweet / blog post / photo / listen / ...) onto a single
page.


## Setup

For an example, see `index.html`. Change the config values to the correct URLs
for yourself.

The `twitter` and `last.fm` providers are currently broken.

#### `type`

The provider used to retrieve data; `json`, `xml` or any of the others listed.

#### `url`

The full url to GET.

#### `vars`

An object containing key-value pairs, where the value is a function that returns
the part of the data required. For instance with the JSON response,

``` json
[{
  "body": {
    "text": "some text"
  }
}]
```

You could get the text variable with

``` js
vars: {
  text: data => data[0].body.text
}
```

XML works in a similar manner. It will take some trial and error, use the inspector
and console to help.

#### `display`

A function that acts on the defined `vars` and returns a string.

If a string, it is rendered using [Mustache][m] with the `vars` specified.
Something like,

``` js
{
  type: "xml",
  url:  "http://blog.example.com/feed.xml",
  base: data => data.rss.channel[0].item,
  vars: {
    title:  data => data.title,
    link:   data => data.link,
    date:   data => data.pubDate,
    text:   data => data.description,
    author: data => data.author
  },
  display: data => `<h2><a href='${data.link}'>${data.author} wrote</a>: ${data.title}</h2><section class='sub'>${data.text}</section>`
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
