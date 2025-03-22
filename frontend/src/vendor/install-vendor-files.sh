#!/bin/bash

# Script to setup vendor files by copying from node_modules

# Create vendor directories
mkdir -p ./highlight.js/styles

# Copy highlight.js themes
cp ../../node_modules/highlight.js/styles/atom-one-dark.css ./highlight.js/styles/
cp ../../node_modules/highlight.js/styles/atom-one-light.css ./highlight.js/styles/
cp ../../node_modules/highlight.js/styles/github.css ./highlight.js/styles/

echo "Vendor files have been installed successfully!" 