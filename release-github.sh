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

( cd dist && tar zcf "$TAR_GZ" *.js )

# Require https://github.com/aktau/github-release

GH_REL_OPTS="--user kui --repo $REPO --tag $TAG"

github-release release $GH_REL_OPTS \
               --draft

github-release upload $GH_REL_OPTS \
               --file "dist/$TAR_GZ" \
               --name "$TAR_GZ"
