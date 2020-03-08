#!/usr/bin/env bash

NODE_ENV=development

npm outdated | tail -n +2 | awk '{print $1 "@latest"}' | xargs -L 1 npm install --save