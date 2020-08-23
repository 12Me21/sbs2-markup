* Instructions
This can be adapted to work on any website
replace the functions in render.js with your own html generation functions
(I guess technically it doesn't even need to be html)

If you want to add your own syntax highlighter, you can replace highlight.js
Define a global variable named `Highlight`, with a function `Highlight.highlight(text, language)`, which returns the output in a DocumentFragment
(or whatever format your rendering system uses)

If you want, you can use `build.sh` to combine all the files into `_build.js` (or follow the instructions in the file to do it manually)

* Files
** parse.js
main parser
** render.js
html rendering functions
** highlight.js
syntax highlighter (for smilebasic)

** build.js
build script (optional)