// parser options
// this can be easily changed
// to control the output

// most functions should return an object containing:
//   .node or .nodes - the node(s) to insert
//   .branch - (optional if .node was specified) which node to insert children into
//   .block - `true` if the element is display: block or similar.

// most functions take input in the form of either
// (args) (or (args, contents) for things where the contents are plain text)
// (code blocks, [img], etc.)
// the unnamed argument uses a key of ""
// args without a value are set to true
// for example, `[tag=test key=value option]` would pass
// {"":"test", key:"value", option:true}

;(function() {
	var document = window.document
	// methods used:
	// document.createElement
	// document.createTextNode
	// document.createDocumentFragment
	// document.createEvent
	
	var parserElement = document.createElement('a')
	function parseURL(url) {
		if (!(/^[a-z][a-z0-9+\.\-]:/i.test(url))) //relative reference
			return null
		parserElement.href = url
		try {
			var pathname = parserElement.pathname
			if (pathname && pathname[0] != "/")
				pathname = "/"+pathname // IE bug where pathname is missing the initial /
			return {
				protocol: parserElement.protocol,
				hostname: parserElement.hostname,
				port: parserElement.port,
				pathname: pathname,
				search: parserElement.search,
				hash: parserElement.hash,
			}
		} catch(e) { //failed (if url has username/password in IE)
			return null
		}
	}
	function creator(tag) {
		return function() {
			return {node:document.createElement(tag)}
		}
	}
	function newEvent(name) {
		var event = document.createEvent("Event")
		event.initEvent(name, true, true)
		return event
	}
	var ytk = "\x41\x49\x7A\x61\x53\x79\x43\x4E\x6D\x33\x56\x79\x41\x4D\x49\x35\x44\x36\x56\x58\x48\x39\x62\x39\x48\x37\x44\x31\x36\x63\x6D\x76\x39\x4E\x34\x7A\x70\x68\x63"
	function getYoutube(id, callback) {
		var x = new XMLHttpRequest
		x.open("GET", "https://www.googleapis.com/youtube/v3/videos?part=snippet&id="+id+"&k\x65y\x3D"+ytk)
		x.onload = function() {
			if (x.status != 200)
				return
			try {
				var json = JSON.parse(x.responseText)
				var video = json.items[0]
				callback(video)
			} catch(e){}
		}
		x.send()
	}
	function defaultProtocol() {
		if (window.location.protocol == 'http:')
			return 'http:'
		else
			return 'https:'
	}
	function getYoutubeID(url) {
		var match = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/)
		if (match)
			return match[1]
		return null
	}
	// returns [protocol, rest of url] or [null, url]
	function urlProtocol(url) {
		var match = url.match(/^([-\w]+:)([^]*)$/)
		if (match)
			return [match[1].toLowerCase(), match[2]]
		return [null, url]
	}

	Parse.options = {
		maxDepth: 10,
		append: function (parent, child) {
			parent = parent.branch || parent.node
			parent.appendChild(child.node)
		},

		//sorry
		// removes all of `node`'s children and inserts them in its place
		// and inserts `before` before them
		kill: function(node, before) {
			var parent = node.parentNode
			parent.insertBefore(before, node)
			while (node.childNodes.length)
				parent.insertBefore(node.firstChild, node)
			parent.removeChild(node)
		},
		
		//========================
		// nodes without children:
		text: function(text) {
			return {node: document.createTextNode(text)}
		},
		lineBreak: creator('br'),
		line: creator('hr'),
		// used for displaying invalid markup
		// reason is currently unused
		invalid: function(text, reason) {
			var node = document.createElement('span')
			node.className = 'invalid'
			node.title = reason
			node.textContent = text
			return {node:node}
		},
		// code block
		code: function(args, contents) {
			var language = args[""] || 'sb'
			var node = document.createElement('pre')
			node.setAttribute('data-lang', language)
			node.appendChild(Highlight.highlight(contents, language))
			return {block:true, node:node}
		},
		// inline code
		icode: function(args, contents) {
			var node = document.createElement('code')
			node.textContent = contents
			return {node:node, block:false}
		},
		audio: function(args, contents) {
			var node = document.createElement('audio')
			node.setAttribute('controls', "")
			node.setAttribute('src', args[""])
			if (contents != null)
				node.appendChild(document.createTextNode(contents))
			return {block:true, node:node}
		},
		video: function(args, contents) {
			var url = args[""]
			var node = document.createElement('video')
			node.setAttribute('controls', "")
			node.setAttribute('src', url)
			node.setAttribute('shrink', "")
			if (contents != null)
				node.appendChild(document.createTextNode(contents))
			node.onplaying = function() {
				node.dispatchEvent(newEvent('videoclicked'))
			}
			return {block:true, node:node}
		},
		youtube: function(args, contents, preview) { //todo: use contents?
			var url = args[""]
			var protocol = defaultProtocol()
			var match = getYoutubeID(url)
			var link = document.createElement('a')
			var div = document.createElement('div')
			div.className = "youtube"
			div.appendChild(link)
			link.href = url
			
			if (match) {
				link.style.backgroundImage = 'url("'+protocol+"//i.ytimg.com/vi/"+match+"/mqdefault.jpg"+'")'
				var time = url.match(/[&?](?:t|start)=(\w+)/)
				var end = url.match(/[&?](?:end)=(\w+)/)
				var loop = url.match(/[&?]loop(=|&|$)/)
				if (!preview)
					getYoutube(match, function(data) {
						var title = document.createElement('div')
						title.className = 'pre videoTitle'
						title.textContent = data.snippet.title
						link.appendChild(title)
						link.appendChild(document.createElement('br'))
						title = document.createElement('div')
						title.className = 'pre videoAuthor'
						title.textContent = data.snippet.channelTitle
						link.appendChild(title)
					})
				var ifc = document.createElement('span')
				link.appendChild(ifc)
				link.onclick = function(e) {
					e.preventDefault()
					div.dispatchEvent(newEvent("beforeSizeChange"))
					var iframe = document.createElement('iframe')
					var src = "https://www.youtube-nocookie.com/embed/"+match+"?autoplay=1"
					if (time)
						src += "&start="+time[1]
					if (end)
						src += "&end="+end[1]
					if (loop)
						src += "&loop=1&playlist="+match
					iframe.src = src
					ifc.appendChild(iframe)
					div.className = "youtube playingYoutube"
					div.dispatchEvent(newEvent("afterSizeChange"))
				}
				var stop = document.createElement('button')
				stop.textContent = "x"
				stop.onclick = function(e) {
					e.preventDefault()
					div.dispatchEvent(newEvent("beforeSizeChange"))
					ifc.textContent = ""
					div.className = "youtube"
					div.dispatchEvent(newEvent("afterSizeChange"))
				}
				div.appendChild(stop)
			}
			return {block:true, node:div}
		},
		bg: function(opt) {
			var node=document.createElement("span")
			var color = opt[""]
			if (color) {
				node.setAttribute("data-bgcolor", color)
			}
			return {node:node}
		},
		
		//=====================
		// nodes with children
		root: function() {
			var node = document.createDocumentFragment()
			return {block:true, node:node}
		},
		bold: creator('b'),
		italic: creator('i'),
		underline: creator('u'),
		strikethrough: creator('s'),
		heading: function(level) { // input: 1, 2, or 3
			// output: h2-h4
			return {block:true, node:document.createElement('h'+(level+1))}
		},
		
		quote: function(args) {
			// <blockquote><cite> arg </cite><br> ... </blockquote>
			var name = args[""]
			var node = document.createElement('blockquote')
			if (name) {
				var cite = document.createElement('cite')
				cite.textContent = name
				node.appendChild(cite)
				node.appendChild(document.createElement('br'))
			}
			return {block:true, node:node}
		},
		list: function(args) {
			// <ul> ... </ul>
			if (args[""]!=undefined) {
				var list = document.createElement('ol')
				list.style.listStyleType = args[""]
			} else
				list = document.createElement('ul')
			return {block:true, node:list}
		},
		item: function(index) {
			return {block:true, node:document.createElement('li')}
		},
		//creator('li'), // (list item)
		
		link: function(args) {
			// <a href= url> ... </a>
			var url = args[""]
			// important, do not remove, prevents script injection
			if (/^ *javascript:/i.test(url))
				url = ""
			
			var protocol = urlProtocol(url)
			if (protocol[0] == "sbs:") {
				// put your custom local url handling code here
				var node = Nav.link(protocol[1])
			} else {
				var node = document.createElement('a')
				node.setAttribute('target', "_blank")
				if (!protocol[0]) {
					if (url[0] == "#") {
						// put your fragment link handling code here
						/*var hash1 = Nav.getPath()
						var name = url.substr(1)
						hash = "#"+hash1[0]+"#"+name
						url = hash
						node.onclick = function(e) {
							var hash2 = Nav.getPath()
							if (hash1[0]==hash2[0] && hash2[1]==name) {
								var n = document.getElementsByName("_anchor_"+name)
								if (n[0])
									n[0].scrollIntoView()
								e.preventDefault()
							} else {
								window.location.hash = hash
							}
						}*/
					} else {
						// urls without protocol get https:// or http:// added
						url = defaultProtocol()+"//"+url
					}
				} else {
					// unchanged
				}
				node.href = url
			}
			return {node:node}
		},
		
		table: function(opts) {
			// <div class="tableContainer"><table> ... </table></div>
			var container = document.createElement('div')
			container.className = "tableContainer"
			var node = document.createElement('table')
			container.appendChild(node)
			return {
				block: true,
				node: container,
				branch: node
			}
		},
		
		row: creator('tr'),
		
		cell: function (opt) {
			// <td> ... </td> etc.
			var node = opt.h ?
				 document.createElement('th') :
				 document.createElement('td')
			if (opt.rs)
				node.rowSpan = opt.rs
			if (opt.cs)
				node.colSpan = opt.cs
			if (opt.c) {
				if (opt.c[0] == "#")
					node.style.backgroundColor = opt.c
				node.setAttribute("data-bgcolor", opt.c)
			}
			if (opt.a) {
				node.style.textAlign = opt.a
			}
			node.className = "cell"
			return {node:node}
		},
		
		image: function(args, alt) {
			// <img src= arg tabindex="-1">
			var url = args[""]
			var node = document.createElement('img')
			node.setAttribute('src', url)
			node.setAttribute('tabindex', "-1")
			node.setAttribute('shrink', "")
			node.setAttribute('loading', "")
			if (alt != null)
				node.setAttribute('alt', alt)
			node.onerror = node.onload = function() {
				node.removeAttribute('loading')
			}
			// todo: add events for size change ??
			return {node:node, block:true}
		},
		
		// parser error message
		error: function(e, stack) {
			// <div class="error">Error while parsing:<pre> stack trace </pre>Please report this</div>
			var node = document.createElement('div')
			node.className = "error"
			node.appendChild(document.createTextNode("Markup parsing error: "))
			var err = document.createElement('code')
			err.textContent = e
			node.appendChild(err)
			node.appendChild(document.createTextNode("\nPlease report this!"))
			if (stack) {
				var pre = document.createElement('pre')
				pre.textContent = stack
				node.appendChild(pre)
			}
			return {node:node, block:true}
		},
		
		align: function(args) {
			var node = document.createElement('div')
			var arg = args[""]
			if (arg == 'left' || arg == 'right' || arg == 'center')
				node.style.textAlign = arg
			return {node:node, block:true}
		},
		superscript: creator('sup'),
		subscript: creator('sub'),
		anchor: function(args) {
			var name = args[""]
			var node = document.createElement('a')
			// put your anchor name handler here
			// I prefix the names to avoid collision with node ids
			// which use the same namespace as name
			node.name = "_anchor_"+name
			return {node:node, block:true}
		},
		spoiler: function(args) {
			// <button> arg </button><div class="spoiler"> ... </div>
			// I'd use <summary>/<details> but it's not widely supported
			// and impossible to style with css
			// this probably needs some aria attribute or whatever
			var button = document.createElement('button')
			button.onclick = function() {
				if (this.getAttribute('data-show') == null)
					this.setAttribute('data-show',"")
				else
					this.removeAttribute('data-show')
			}
			button.className = 'spoilerButton'
			var name = args[""]
			if (name === true)
				name = "spoiler"
			button.textContent = name
			
			var box = document.createElement('div')
			box.className = "spoiler"

			var node = document.createDocumentFragment()
			node.appendChild(button)
			node.appendChild(box)
			
			return {
				block: true,
				node: node,
				branch: box
			}
		}
	}
})()
