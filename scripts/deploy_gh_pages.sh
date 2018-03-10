#!/bin/sh

git clone -b gh-pages https://${GH_TOKEN}@github.com/stackstorm-japan/st2docs.jp.git gh-pages

cd gh-pages

# clear old files and add new files
rm -fR *
cp -r ../docs/build/html/* ./

# commit to remote repository on the gh-pages branch
git add .
git commit -m "Updates gh-pages because of updating the master branch."
git push origin gh-pages
