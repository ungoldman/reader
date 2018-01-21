var html = require('choo/html')
var devtools = require('choo-devtools')
var Parser = require('rss-parser')
var choo = require('choo')
var url = require('url')
var { shell } = require('electron')

var parser = new Parser()
var app = choo()

app.use(devtools())
app.use(feedStore)
app.route('/', mainView)
app.mount('#app')

function mainView (state, emit) {
  return html`
    <div id="app">
      <section class="main columns is-fullheight is-mobile">
        ${sidebar(state, emit)}
        ${articles(state, emit)}
      </section>
    </div>
  `
}

function sidebar (state, emit) {
  return html`
    <aside class="sidebar column is-3 is-fullheight section">
      <p class="menu-label is-hidden-touch">Feeds</p>
      <form id="addFeed" onsubmit=${onsubmit}>
        <div class="field has-addons">
          <div class="control is-expanded">
            <input class="input" type="text" name="feedURL" placeholder="Add a feed"
              value="http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml" />
          </div>
          <div class="control">
            <button type="submit" class="button">➕</button>
          </div>
        </div>
      </form>
      <ul class="menu-list feeds">
        <li>
        </li>
        <li>
          <a href="#">📰 Feeds</a>
          <ul>
            ${state.feeds.map((feed, idx) => {
              return html`
                <li class="feed" onclick=${() => emit('selectFeed', idx)}>
                  <a href="#">${feed.title}</a>
                </li>
              `
            })}
          </ul>
        </li>
      </ul>
    </aside>
  `

  function onsubmit (event) {
    event.preventDefault()
    var { feedURL } = getFormDataFromSubmitEvent(event)
    emit('feedURL', feedURL)
  }
}

function articles (state, emit) {
  var currentFeed = state.feeds[state.currentFeedIndex]

  return html`
    <main class="main container column is-9 is-mobile">
      <div class="articles section">
        ${currentFeed
          ? currentFeed.items.map(item => {
            return html`
              <article class="media">
                <figure class="media-left">
                  <p class="image is-64x64">
                    <img src="${getFavicon(item.link)}">
                  </p>
                </figure>
                <div class="media-content">
                  <div class="content">
                    <h2><a onclick=${() => shell.openExternal(item.link)}>${item.title}</a></h2>
                    <p>${item.contentSnippet || item.content || null}</p>
                    <details>
                      <summary>Metadata</summary>
                      <pre>${JSON.stringify(item, null, 2)}</pre>
                    </details>
                  </div>
                </div>
              </article>
            `
          })
          : null
        }
      </div>
    </main>
  `
}

function feedStore (state, emitter) {
  state.feeds = []
  state.currentFeedIndex = null

  emitter.on('feedURL', async function (feedURL) {
    var feed = await parser.parseURL(feedURL)
    state.feeds.push(feed)
    emitter.emit('render')
  })

  emitter.on('selectFeed', function (idx) {
    state.currentFeedIndex = idx
    emitter.emit('render')
  })
}

function getFormDataFromSubmitEvent (event) {
  return [].reduce.call(event.target.elements, function (data, element) {
    data[element.name] = element.value
    return data
  }, {})
}

function getFavicon (link) {
  var u = url.parse(link)
  return `${u.protocol}//${u.hostname}/favicon.ico`
}
