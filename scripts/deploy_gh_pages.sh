#!/bin/sh

#
# This script is mainly used by CI to update contents of gh-pages to the latest one.
#

if [ -z "${GH_TOKEN}" -o -z "${GH_REPO}" ]; then
  echo '(ERROR) The environment variables "GH_TOKEN" and "GH_REPO" have to be set'
  exit 1
fi

# ${GH_TOKEN} is an access token of GitHub to update GitHub pages of the repository
# which is specified in ${GH_REPO}.
git clone -b gh-pages https://${GH_TOKEN}@github.com/${GH_REPO}.git gh-pages
if [ $? -ne 0 ]; then
  echo "(ERROR) Failed to clone the remote repository from 'https://${GH_TOKEN}@github.com/${GH_REPO}.git'"
  exit 1
fi

cd gh-pages

# clear old files and add new files
rm -fR *
cp -r ../docs/build/html/* ./

# commit to remote repository on the gh-pages branch
git add .
git commit -m "Updates gh-pages because of updating the master branch."
git push origin gh-pages
