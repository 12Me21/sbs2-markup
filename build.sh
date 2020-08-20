cd -P -- "`dirname -- "$0"`"

cat highlight.js parse.js render.js > _build.js
