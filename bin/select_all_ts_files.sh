#!/bin/sh

find ./src -type f -name '*.ts' | grep -v typings | grep -v serviceWorker
find ./src -type f -name '*.tsx' | grep -v typings | grep -v serviceWorker