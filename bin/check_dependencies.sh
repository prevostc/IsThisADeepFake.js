#!/usr/bin/env bash

NODE_ENV=development
outdated_dependencies=$(npm outdated --long | tail -n +2 | grep -v beta | grep -v git | grep -v webpack-dev-server)

if [[ ${outdated_dependencies} ]]; then
    echo "Dependencies outdated"
    echo "$outdated_dependencies"
    exit 1
else
    exit 0
fi
