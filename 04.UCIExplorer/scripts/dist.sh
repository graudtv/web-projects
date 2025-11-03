#!/usr/bin/env bash

esbuild --bundle --outdir=dist --minify --sourcemap \
        --loader:.png=file --loader:.svg=file \
        src/main.js
