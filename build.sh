cd -P -- "`dirname -- "$0"`"

cat highlight.js parse.js render.js > _build.js

# Instructions for humans:

# 1: combine the contents of the files (in order):
#  highlight.js parse.js render.js
# into _build.js
