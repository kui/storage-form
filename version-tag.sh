#!/bin/bash
set -eux

get_version() {
  python -c 'import json; print json.load(open("package.json"))["version"]'
}

TAG="v$(get_version)"

git tag "$TAG" && git push --tags
