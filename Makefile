# Usage:
#   make                  Build the app, bumping the patch version (e.g. 1.0.0 -> 1.0.1)
#   make patch            Same as above
#   make minor            Build the app, bumping the minor version (e.g. 1.0.0 -> 1.1.0)
#   make major            Build the app, bumping the major version (e.g. 1.0.0 -> 2.0.0)
#   make release-patch    Bump patch version, build, commit, tag, push to GitHub, and upload DMG to GitHub Releases
#   make release-minor    Bump minor version, build, commit, tag, push to GitHub, and upload DMG to GitHub Releases
#   make release-major    Bump major version, build, commit, tag, push to GitHub, and upload DMG to GitHub Releases
#
# Versioning follows semantic versioning (semver): MAJOR.MINOR.PATCH
#   MAJOR: breaking or significant changes
#   MINOR: new features, backwards compatible
#   PATCH: bug fixes

.PHONY: all patch minor major release-patch release-minor release-major

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

release-patch:
	npm version patch --no-git-tag-version
	npm run make
	@VERSION=$$(node -p "require('./package.json').version") && \
	git add package.json && \
	git commit -m "Release v$$VERSION" && \
	git tag v$$VERSION && \
	git push && git push --tags && \
	gh release create v$$VERSION out/make/*.dmg --title "v$$VERSION"

release-minor:
	npm version minor --no-git-tag-version
	npm run make
	@VERSION=$$(node -p "require('./package.json').version") && \
	git add package.json && \
	git commit -m "Release v$$VERSION" && \
	git tag v$$VERSION && \
	git push && git push --tags && \
	gh release create v$$VERSION out/make/*.dmg --title "v$$VERSION"

release-major:
	npm version major --no-git-tag-version
	npm run make
	@VERSION=$$(node -p "require('./package.json').version") && \
	git add package.json && \
	git commit -m "Release v$$VERSION" && \
	git tag v$$VERSION && \
	git push && git push --tags && \
	gh release create v$$VERSION out/make/*.dmg --title "v$$VERSION"
