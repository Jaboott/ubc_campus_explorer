#!/bin/bash

# Check if the first argument is "test"
if [ "$1" == "test" ]; then
    echo "Running yarn prettier:fix, yarn build, and yarn test..."
    yarn prettier:fix && yarn build && yarn test
else
    echo "Running yarn prettier:fix and yarn build..."
    yarn prettier:fix && yarn build
fi

# Check if all commands were successful
if [ $? -eq 0 ]; then
    echo "All tasks completed successfully."
else
    echo "One or more tasks failed."
    exit 1
fi
