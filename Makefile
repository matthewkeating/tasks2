.PHONY: all patch minor major

all: patch

patch:
	npm version patch --no-git-tag-version
	npm run make

minor:
	npm version minor --no-git-tag-version
	npm run make

major:
	npm version major --no-git-tag-version
	npm run make
