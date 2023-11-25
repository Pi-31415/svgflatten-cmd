#!/usr/bin/env node
const fs = require('fs');
const xmldoc = require('xmldoc');
const svgpath = require('svgpath');
const { program } = require('commander');

// Parse command-line arguments
program
    .option('-i, --input <type>', 'Input SVG file')
    .option('-o, --output <type>', 'Output SVG file');
program.parse(process.argv);
const options = program.opts();

if (!options.input || !options.output) {
    console.error('Input and output file paths are required');
    process.exit(1);
}

// parse.js
function parse(source) {
    try {
        return new xmldoc.XmlDocument(source);
    } catch (exception) {
        var dom = new xmldoc.XmlDocument('<invalid />');
        dom.attr.reason = exception.toString();
        return dom;
    }
}


function _convertEllipse(cx = 0, cy = 0, rx = 0, ry = 0) {
    return "M" + (cx - rx) + "," + cy + "a" + rx + "," + ry + " 0 1,0 " + (rx * 2) + ",0a" + rx + "," + ry + " 0 1,0 " + (rx * -2) + ",0";
  }
  
  function _convertPoints(points) {
    var path = "";
  
    for (var i=0; i<points.length; i+=2) {
        var prefix = path.length ? ' ' : 'M';
        path += prefix + points[i] + ',' + points[i+1];
    }
  
    return path;
  }
  
  function convertGroup(dom) {
    var newChildren = [];
  
    dom.children.forEach(function (child) {
        newChildren.push(pathify(child));
    });
  
    dom.children = newChildren;
  
    if (newChildren.length > 0) {
        dom.firstChild = newChildren[0];
        dom.lastChild = newChildren[newChildren.length - 1];
    }
  
    return dom;
  }
  
  function convertCircle(dom) {
    var path = _convertEllipse(dom.attr.cx, dom.attr.cy, dom.attr.r, dom.attr.r);
  
    delete dom.attr.cx;
    delete dom.attr.cy;
    delete dom.attr.r;
  
    dom.name = 'path';
    dom.attr.d = path;
  
    return dom;
  }
  
  function convertEllipse(dom) {
    var path = _convertEllipse(dom.attr.cx, dom.attr.cy, dom.attr.rx, dom.attr.ry);
  
    delete dom.attr.cx;
    delete dom.attr.cy;
    delete dom.attr.rx;
    delete dom.attr.ry;
  
    dom.name = 'path';
    dom.attr.d = path;
  
    return dom;
  }
  
  function convertLine(dom) {
    var path = _convertPoints([dom.attr.x1, dom.attr.y1, dom.attr.x2, dom.attr.y2]);
  
    delete dom.attr.x1;
    delete dom.attr.y1;
    delete dom.attr.x2;
    delete dom.attr.y2;
  
    dom.name = 'path';
    dom.attr.d = path;
  
    return dom;
  }
  
  function convertPolygon(dom) {
    var points = dom.attr.points.trim().split(/[\s,]+/);
    var path = _convertPoints(points) + "z";
  
    delete dom.attr.points;
  
    dom.name = 'path';
    dom.attr.d = path;
  
    return dom;
  }
  
  function convertPolyline(dom) {
    var points = dom.attr.points.trim().split(/[\s,]+/);
    var path = _convertPoints(points);
  
    delete dom.attr.points;
  
    dom.name = 'path';
    dom.attr.d = path;
  
    return dom;
  }
  
  function convertRect(dom) {
    var x = parseFloat(dom.attr.x || 0);
    var y = parseFloat(dom.attr.y || 0);
    var width = parseFloat(dom.attr.width);
    var height = parseFloat(dom.attr.height);
  
    var points = [];
    points.push(x, y);
    points.push(x + width, y);
    points.push(x + width, y + height);
    points.push(x, y + height);
    var path = _convertPoints(points) + "z";
  
    delete dom.attr.x;
    delete dom.attr.y;
    delete dom.attr.width;
    delete dom.attr.height;
  
    dom.name = 'path';
    dom.attr.d = path;
  
    return dom;
  }
  
  function pathify(dom) {
    if (dom.name === 'svg') {
        return convertGroup(dom);
    } else if (dom.name === 'circle') {
        return convertCircle(dom);
    } else if (dom.name === 'ellipse') {
        return convertEllipse(dom);
    } else if (dom.name === 'line') {
        return convertLine(dom);
    } else if (dom.name === 'polygon') {
        return convertPolygon(dom);
    } else if (dom.name === 'polyline') {
        return convertPolyline(dom);
    } else if (dom.name === 'rect') {
        return convertRect(dom);
    } else if (dom.name === 'g') {
        return convertGroup(dom);
    } else {
        return dom;
    }
  }

  
function transformGroup(dom) {
    var newChildren = [];

    dom.children.forEach(function (child) {
        newChildren.push(transform(child));
    });

    dom.children = newChildren;

    if (newChildren.length > 0) {
        dom.firstChild = newChildren[0];
        dom.lastChild = newChildren[newChildren.length - 1];
    }

    return dom;
}

function transformPath(dom) {
    dom.attr.d = svgpath(dom.attr.d).transform(dom.attr.transform)
      .round(10)
      .toString();

    delete dom.attr.transform;

    return dom;
}

function transform(dom) {
    if (dom.name === 'path' && dom.attr.transform) {
        return transformPath(dom);
    } else if (dom.name === 'svg' || dom.name === 'g') {
        return transformGroup(dom);
    } else {
        return dom;
    }
}


function flattenSvg(dom) {
    var newChildren = [];

    dom.children.forEach(function (child) {
        newChildren.push(flatten(child));
    });

    dom.children = newChildren;

    if (newChildren.length > 0) {
        dom.firstChild = newChildren[0];
        dom.lastChild = newChildren[newChildren.length - 1];
    }

    return dom;
}

function flattenGroup(dom) {
    var path = new xmldoc.XmlDocument('<path/>');

    path.attr = dom.attr;
    path.attr.d = "";

    dom.children.forEach(function (child) {
        var flatChild = transform(flatten(child));

        // Check if flatChild and flatChild.attr are defined before accessing flatChild.attr.d
        if (flatChild && flatChild.attr && flatChild.attr.d) {
            var prefix = path.attr.d.length ? " " : "";
            path.attr.d += prefix + flatChild.attr.d;
        }
    });

    return path;
}


function flatten(dom) {
    if (dom.name === 'svg') {
        return flattenSvg(dom);
    } else if (dom.name === 'g') {
        return flattenGroup(dom);
    } else {
        return dom;
    }
}
// lib.js
function Wrapper(source) {
    if (typeof source === "string") {
        this._value = parse(source);
    } else {
        this._value = source;
    }

    this.pathify = function() {
        this._value = pathify(this._value);
        return this;
    };

    this.transform = function() {
        this._value = transform(this._value);
        return this;
    };

    this.flatten = function() {
        this._value = flatten(this._value);
        return this;
    };

    this.value = function() {
        if (typeof source === "string") {
            var meta = source.substr(0, source.indexOf("<" + this._value.name));
            return meta + this._value.toString();
        } else {
            return this._value;
        }
    };
}

// Main function to process the SVG file
function processSvg(inputPath, outputPath) {
    const source = fs.readFileSync(inputPath, 'utf8');
    const wrapper = new Wrapper(source);
    wrapper.pathify().transform().flatten();
    const output = wrapper.value();

    fs.writeFileSync(outputPath, output, 'utf8');
    console.log(`SVG file flattened and saved to ${outputPath}`);
}

// Execute the main function with provided file paths
processSvg(options.input, options.output);
