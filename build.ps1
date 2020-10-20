$currdir = $pwd
cd (Split-Path $PSCommandPath)

cat "highlight.js","parse.js","render.js" | sc "_build.js"
cd $currdir