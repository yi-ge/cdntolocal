# CDN to Local Fallback for HTML Files (VSCode Extension)

CDN to Local Fallback is a Visual Studio Code extension that automatically downloads CSS and JavaScript resources linked in an HTML file from their CDN URLs, saves them locally, and adds fallback code to the HTML file in case the CDN resources fail to load.

## Features

* Downloads CSS and JavaScript resources from CDN URLs.
* Saves the downloaded resources in a local directory with the same structure as the CDN.
* Inserts a fallback script in the HTML file to use local resources if the CDN resources fail to load.

## Installation

1. Open Visual Studio Code.
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac) to open the Quick Open dialog.
3. Type `ext install cdntolocal.downloadAndAddFallback` and press Enter to install the extension.

## Usage

1. Open an HTML file in Visual Studio Code.
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) to open the Command Palette.
3. Type `CDN to Local Fallback: Download and Add Fallback` and press Enter to run the command.

The extension will download all the CSS and JavaScript resources from their CDN URLs, save them locally in the `static` directory under the same path as the HTML file, and add a fallback script to the HTML file. If the CDN resources fail to load, the fallback script will automatically switch to using the local resources.

## Known Issues

* If the HTML file has no `<title>` tag, the fallback script will not be inserted properly. Make sure your HTML file has a `<title>` tag.

## Release Notes

### 1.0.0

* Initial release of CDN to Local Fallback for HTML Files.

## License

This extension is licensed under the [MIT License](LICENSE).
