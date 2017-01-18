#!/bin/bash

set -eux

get_version() {
  python -c 'import json; print json.load(open("package.json"))["version"]'
}

REPO="storage-form"
TAG="v$(get_version)"
TAR_GZ="storage-form-${TAG}.tar.gz"

rm -fr dist

npm run check
npm run debug-dist
npm run prod-dist

( cd dist && tar zcf "$TAR_GZ" "$REPO" )

# Require https://github.com/aktau/github-release

github-release release \
               --user kui \
               --repo "$REPO" \
               --tag "$TAG" \
               --draft

github-release upload \
               --user kui \
               --repo "$REPO" \
               --tag "$TAG" \
               --name "$TAR_GZ" \
               --file "dist/$TAR_GZ"
