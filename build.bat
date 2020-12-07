set oldpath=%cd%
cd %~dp0

type highlight.js parse.js render.js > _build.js
cd %oldpath%
