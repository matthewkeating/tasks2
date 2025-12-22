# Install instructions
## From Terminal
1. Install Homebrew
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
2. Update Homebrew
```
brew update
```
3. Install Node.js:
```
brew install node
```
4. Check the install (just make sure the following returns a version number)
```
npm -v
```
5. Update Node.js
```
brew upgrade node
```
6. Install build dependencies
```
npm -install electron-forge
```
7. Clone the Tasks repo
```
git clone https://github.com/matthewkeating/tasks.git
```
8. Build the Tasks software
```
cd tasks
npm run make
```

## From Finder
1. Copy the Tasks application from the output directory into your `User/Applications` directory:
	- Open Finder
	- Right-click the `Documents` Favorite on the lefthand side
	- Select `Show in Enclosing Folder`
	- Right click the `Applications` folder in the folders list (not the `Applications` item under Favorites) and select `Open in New Tab`
	* Go back to the first tab
	* Double click the `tasks` folder and navigate to `tasks\out\Tasks-darwin-arm64`
	* Copy the `Tasks.app` file from `tasks\out\Tasks-darwin-arm64` to the `Applications` folder in the second tab
2. Open the app
