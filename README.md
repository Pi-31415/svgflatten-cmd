# SVG-Flatten

SVG-Flatten is a Node.js tool designed to process SVG files. It turns SVG shapes (such as polygon, polyline, rect, and groups) into SVG paths, merging groups and applying transformations to flatten the SVG structure.

## Installation

Before you begin, ensure that you have Node.js installed on your system. You can download and install Node.js from [nodejs.org](https://nodejs.org/).

### Dependencies

SVG-Flatten requires the following Node.js modules:

- `xmldoc`
- `svgpath`
- `commander`

Install these dependencies by running the following command in your terminal:

```bash
npm install xmldoc svgpath commander
```
Then

```bash
chmod +x svg-flatten.js
```

Usage

```bash
./svg-flatten.js -i [input-file].svg -o [output-file].svg
```

