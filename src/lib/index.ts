import path from 'path';
import fs from 'fs';
const Q = require('q');
import _ from 'underscore';
import uslug from 'uslug';
import ejs from 'ejs';
import cheerio from 'cheerio';
const entities = require('entities');
import request from 'superagent';
require('superagent-proxy')(request);
import fsextra from 'fs-extra';
const removeDiacritics = require('diacritics').remove;
import mine from 'mime';
import archiver from 'archiver';


export interface OptionsInput {
  title: string;
  author: string | string[];
  publisher: string;
  cover: string;
  content: {
    title: string;
    data: string;
  }[];
}
export interface Options extends OptionsInput {
  output: string;
  description: string;
  publisher: string;
  author: string[];
  tocTitle: string;
  appendChapterTitles: boolean;
  date: Date;
  lang: string;
  fonts: string[];
  customOpfTemplatePath: string | undefined;
  customNcxTocTemplatePath: string | undefined;
  customHtmlTocTemplatePath: string | undefined;
  docHeader: string;
  tempDir: string;
  uuid: string;
  id: string;
  images: string[];
  content: any[];
}
class Epub {
  options: Options;
  output: string;
  defer = new Q.defer();
  id: string;
  uuid: string;
  name: string = '';

  constructor(options: OptionsInput, output: string, contentUID: string) {
    this.options = options as Options;
    this.output = output;
    this.id = contentUID;

    const self = this;
    this.options = _.extend({
      output,
      description: options.title,
      publisher: "anonymous",
      author: ["anonymous"],
      tocTitle: "Table Of Contents",
      appendChapterTitles: true,
      date: new Date().toISOString(),
      lang: "en",
      fonts: [],
      customOpfTemplatePath: null,
      customNcxTocTemplatePath: null,
      customHtmlTocTemplatePath: null
    }, options);
    this.options.docHeader = `<?xml version="1.0" encoding="utf-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">`;
    if (_.isEmpty(this.options.author)) {
      this.options.author = ["anonymous"];
    }
    this.options.tempDir = path.resolve(__dirname, "../tempDir/");
    this.uuid = path.resolve(this.options.tempDir, this.id);
    this.options.uuid = this.uuid;
    this.options.id = this.id;
    this.options.images = [];
    this.options.content = _.map(this.options.content, (content, index) => {
      var $: any, allowedAttributes: any, allowedXhtml11Tags: any;
      content.href = `Chapter${index}.html`;
      content.filePath = path.resolve(self.uuid, `./OEBPS/Text/Chapter${index}.html`);
      content.id = `item_${index}`;
      content.dir = path.dirname(content.filePath);
      content.excludeFromToc || (content.excludeFromToc = false);
      content.beforeToc || (content.beforeToc = false);
      //fix Author Array
      content.author = content.author && _.isString(content.author) ? [content.author] : !content.author || !_.isArray(content.author) ? [] : content.author;
      allowedAttributes = ["content", "alt", "id", "title", "src", "href", "about", "accesskey", "aria-activedescendant", "aria-atomic", "aria-autocomplete", "aria-busy", "aria-checked", "aria-controls", "aria-describedat", "aria-describedby", "aria-disabled", "aria-dropeffect", "aria-expanded", "aria-flowto", "aria-grabbed", "aria-haspopup", "aria-hidden", "aria-invalid", "aria-label", "aria-labelledby", "aria-level", "aria-live", "aria-multiline", "aria-multiselectable", "aria-orientation", "aria-owns", "aria-posinset", "aria-pressed", "aria-readonly", "aria-relevant", "aria-required", "aria-selected", "aria-setsize", "aria-sort", "aria-valuemax", "aria-valuemin", "aria-valuenow", "aria-valuetext", "class", "content", "contenteditable", "contextmenu", "datatype", "dir", "draggable", "dropzone", "hidden", "hreflang", "id", "inlist", "itemid", "itemref", "itemscope", "itemtype", "lang", "media", "ns1:type", "ns2:alphabet", "ns2:ph", "onabort", "onblur", "oncanplay", "oncanplaythrough", "onchange", "onclick", "oncontextmenu", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onerror", "onfocus", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadstart", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreadystatechange", "onreset", "onscroll", "onseeked", "onseeking", "onselect", "onshow", "onstalled", "onsubmit", "onsuspend", "ontimeupdate", "onvolumechange", "onwaiting", "prefix", "property", "rel", "resource", "rev", "role", "spellcheck", "style", "tabindex", "target", "title", "type", "typeof", "vocab", "xml:base", "xml:lang", "xml:space", "colspan", "rowspan", "epub:type", "epub:prefix"];
      allowedXhtml11Tags = ["div", "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "dl", "dt", "dd", "address", "hr", "pre", "blockquote", "center", "ins", "del", "a", "span", "bdo", "br", "em", "strong", "dfn", "code", "samp", "kbd", "bar", "cite", "abbr", "acronym", "q", "sub", "sup", "tt", "i", "b", "big", "small", "u", "s", "strike", "basefont", "font", "object", "param", "img", "table", "caption", "colgroup", "col", "thead", "tfoot", "tbody", "tr", "th", "td", "embed", "applet", "iframe", "img", "map", "noscript", "ns:svg", "object", "script", "table", "tt", "var"];
      $ = cheerio.load(content.data, {
        lowerCaseTags: true,
        recognizeSelfClosing: true
      });
      // Only body innerHTML is allowed
      if ($("body").length) {
        $ = cheerio.load($("body").html(), {
          lowerCaseTags: true,
          recognizeSelfClosing: true
        });
      }
      $($("*").get().reverse()).each((elemIndex: any, elem: any) => {
        var attrs, child, k, ref, ref1, that, v;
        attrs = elem.attribs;
        that = this;
        if ((ref = that.name) === "img" || ref === "br" || ref === "hr") {
          if (that.name === "img") {
            $(that).attr("alt", $(that).attr("alt") || "image-placeholder");
          }
        }
        for (k in attrs) {
          v = attrs[k];
          if (indexOf.call(allowedAttributes, k) >= 0) {
            if (k === "type") {
              if (that.name !== "script") {
                $(that).removeAttr(k);
              }
            }
          } else {
            $(that).removeAttr(k);
          }
        }
      });
      $("img").each((index: any, elem: any) => {
        var dir, extension, id, image, mediaType, url;
        url = $(elem).attr("src");
        if (image = self.options.images.find(function(element) {
          return element.url === url;
        })) {
          id = image.id;
          extension = image.extension;
        } else {
          id = uuid();
          mediaType = mime.getType(url.replace(/\?.*/, ""));
          extension = mime.getExtension(mediaType);
          dir = content.dir;
          self.options.images.push({id, url, dir, mediaType, extension});
        }
        return $(elem).attr("src", `images/${id}.${extension}`);
      });
      content.data = $.xml();
      return content;
    });
    if (this.options.cover) {
      this.options._coverMediaType = mime.getType(this.options.cover);
      this.options._coverExtension = mime.getExtension(this.options._coverMediaType);
    }
    this.render();
    this.promise = this.defer.promise;
  }

  render() {
    var self = this;
    if (self.options.verbose) {
      console.log("Generating Template Files.....");
    }
    return this.generateTempFile().then(function() {
      if (self.options.verbose) {
        console.log("Downloading Images...");
      }
      return self.downloadAllImage().fin(function() {
        if (self.options.verbose) {
          console.log("Making Cover...");
        }
        return self.makeCover().then(function() {
          if (self.options.verbose) {
            console.log("Generating Epub Files...");
          }
          return self.genEpub().then(function(result) {
            if (self.options.verbose) {
              console.log("About to finish...");
            }
            self.defer.resolve(result);
            if (self.options.verbose) {
              return console.log("Done.");
            }
          }, function(err) {
            return self.defer.reject(err);
          });
        }, function(err) {
          return self.defer.reject(err);
        });
      }, function(err) {
        return self.defer.reject(err);
      });
    }, function(err) {
      return self.defer.reject(err);
    });
  }

  generateTempFile() {
    var base, generateDefer, htmlTocPath, ncxTocPath, opfPath, self;
    generateDefer = new Q.defer();
    self = this;
    if (!fs.existsSync(this.options.tempDir)) {
      fs.mkdirSync(this.options.tempDir);
    }
    fs.mkdirSync(this.uuid);
    fs.mkdirSync(path.resolve(this.uuid, "./OEBPS"));
    (base = this.options).css || (base.css = fs.readFileSync(path.resolve(__dirname, "../templates/template.css")));
    fs.writeFileSync(path.resolve(this.uuid, "./OEBPS/style.css"), this.options.css);
    if (self.options.fonts.length) {
      fs.mkdirSync(path.resolve(this.uuid, "./OEBPS/fonts"));
      this.options.fonts = _.map(this.options.fonts, function(font) {
        var filename;
        if (!fs.existsSync(font)) {
          generateDefer.reject(new Error('Custom font not found at ' + font + '.'));
          return generateDefer.promise;
        }
        filename = path.basename(font);
        fsextra.copySync(font, path.resolve(self.uuid, "./OEBPS/fonts/" + filename));
        return filename;
      });
    }
    _.each(this.options.content, function(content) {
      var data;
      data = `${self.options.docHeader}\n  <head>\n  <meta charset="UTF-8" />\n  <title>${entities.encodeXML(content.title || '')}</title>\n  <link rel="stylesheet" type="text/css" href="style.css" />\n  </head>\n<body>`;
      data += content.title && self.options.appendChapterTitles ? `<h1>${entities.encodeXML(content.title)}</h1>` : "";
      data += content.title && content.author && content.author.length ? `<p class='epub-author'>${entities.encodeXML(content.author.join(", "))}</p>` : "";
      data += content.title && content.url ? `<p class='epub-link'><a href='${content.url}'>${content.url}</a></p>` : "";
      data += `${content.data}</body></html>`;
      return fs.writeFileSync(content.filePath, data);
    });
    // write meta-inf/container.xml
    fs.mkdirSync(this.uuid + "/META-INF");
    fs.writeFileSync(`${this.uuid}/META-INF/container.xml`, "<?xml version=\"1.0\" encoding=\"UTF-8\" ?><container version=\"1.0\" xmlns=\"urn:oasis:names:tc:opendocument:xmlns:container\"><rootfiles><rootfile full-path=\"OEBPS/content.opf\" media-type=\"application/oebps-package+xml\"/></rootfiles></container>");
    if (self.options.version === 2) {
      // write meta-inf/com.apple.ibooks.display-options.xml [from pedrosanta:xhtml#6]
      fs.writeFileSync(`${this.uuid}/META-INF/com.apple.ibooks.display-options.xml`, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<display_options>\n  <platform name=\"*\">\n    <option name=\"specified-fonts\">true</option>\n  </platform>\n</display_options>");
    }
    opfPath = self.options.customOpfTemplatePath || path.resolve(__dirname, `../templates/epub${self.options.version}/content.opf.ejs`);
    if (!fs.existsSync(opfPath)) {
      generateDefer.reject(new Error('Custom file to OPF template not found.'));
      return generateDefer.promise;
    }
    ncxTocPath = self.options.customNcxTocTemplatePath || path.resolve(__dirname, "../templates/toc.ncx.ejs");
    if (!fs.existsSync(ncxTocPath)) {
      generateDefer.reject(new Error('Custom file the NCX toc template not found.'));
      return generateDefer.promise;
    }
    htmlTocPath = self.options.customHtmlTocTemplatePath || path.resolve(__dirname, `../templates/epub${self.options.version}/toc.xhtml.ejs`);
    if (!fs.existsSync(htmlTocPath)) {
      generateDefer.reject(new Error('Custom file to HTML toc template not found.'));
      return generateDefer.promise;
    }
    Q.all([Q.nfcall(ejs.renderFile, opfPath, self.options), Q.nfcall(ejs.renderFile, ncxTocPath, self.options), Q.nfcall(ejs.renderFile, htmlTocPath, self.options)]).spread(function(data1, data2, data3) {
      fs.writeFileSync(path.resolve(self.uuid, "./OEBPS/content.opf"), data1);
      fs.writeFileSync(path.resolve(self.uuid, "./OEBPS/toc.ncx"), data2);
      fs.writeFileSync(path.resolve(self.uuid, "./OEBPS/toc.xhtml"), data3);
      return generateDefer.resolve();
    }, function(err) {
      console.error(arguments);
      return generateDefer.reject(err);
    });
    return generateDefer.promise;
  }

  makeCover() {
    var coverDefer: any, destPath, self, userAgent, writeStream;
    self = this;
    userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36";
    coverDefer = new Q.defer();
    if (this.options.cover) {
      destPath = path.resolve(this.uuid, "./OEBPS/cover." + this.options._coverExtension);
      writeStream = null;
      if (this.options.cover.slice(0, 4) === "http") {
        writeStream = request.get(this.options.cover).set({
          'User-Agent': userAgent
        });
        writeStream.pipe(fs.createWriteStream(destPath));
      } else {
        writeStream = fs.createReadStream(this.options.cover);
        writeStream.pipe(fs.createWriteStream(destPath));
      }
      writeStream.on("end", function() {
        if (self.options.verbose) {
          console.log("[Success] cover image downloaded successfully!");
        }
        return coverDefer.resolve();
      });
      writeStream.on("error", function(err) {
        console.error("Error", err);
        return coverDefer.reject(err);
      });
    } else {
      coverDefer.resolve();
    }
    return coverDefer.promise;
  }

  downloadImage(options) { //{id, url, mediaType}
    var auxpath, downloadImageDefer, filename, requestAction, self, userAgent;
    self = this;
    userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36";
    if (!options.url && typeof options !== "string") {
      return false;
    }
    downloadImageDefer = new Q.defer();
    filename = path.resolve(self.uuid, "./OEBPS/images/" + options.id + "." + options.extension);
    if (options.url.indexOf("file://") === 0) {
      auxpath = options.url.substr(7);
      fsextra.copySync(auxpath, filename);
      return downloadImageDefer.resolve(options);
    } else {
      if (options.url.indexOf("http") === 0) {
        requestAction = request.get(options.url).set({
          'User-Agent': userAgent
        });
        requestAction.pipe(fs.createWriteStream(filename));
      } else {
        requestAction = fs.createReadStream(path.resolve(options.dir, options.url));
        requestAction.pipe(fs.createWriteStream(filename));
      }
      requestAction.on('error', function(err) {
        if (self.options.verbose) {
          console.error('[Download Error]', 'Error while downloading', options.url, err);
        }
        fs.unlinkSync(filename);
        return downloadImageDefer.reject(err);
      });
      requestAction.on('end', function() {
        if (self.options.verbose) {
          console.log("[Download Success]", options.url);
        }
        return downloadImageDefer.resolve(options);
      });
      return downloadImageDefer.promise;
    }
  }

  downloadAllImage() {
    var deferArray, imgDefer, self;
    self = this;
    imgDefer = new Q.defer();
    if (!self.options.images.length) {
      imgDefer.resolve();
    } else {
      fs.mkdirSync(path.resolve(this.uuid, "./OEBPS/images"));
      deferArray = [];
      _.each(self.options.images, function(image) {
        return deferArray.push(self.downloadImage(image));
      });
      Q.all(deferArray).fin(function() {
        return imgDefer.resolve();
      });
    }
    return imgDefer.promise;
  }

  genEpub() {
    var archive, cwd, genDefer, output, self;
    // Thanks to Paul Bradley
    // http://www.bradleymedia.org/gzip-markdown-epub/ (404 as of 28.07.2016)
    // Web Archive URL:
    // http://web.archive.org/web/20150521053611/http://www.bradleymedia.org/gzip-markdown-epub
    // or Gist:
    // https://gist.github.com/cyrilis/8d48eef37fbc108869ac32eb3ef97bca
    genDefer = new Q.defer();
    self = this;
    cwd = this.uuid;
    archive = archiver("zip", {
      zlib: {
        level: 9
      }
    });
    output = fs.createWriteStream(self.options.output);
    if (self.options.verbose) {
      console.log("Zipping temp dir to", self.options.output);
    }
    archive.append("application/epub+zip", {
      store: true,
      name: "mimetype"
    });
    archive.directory(cwd + "/META-INF", "META-INF");
    archive.directory(cwd + "/OEBPS", "OEBPS");
    archive.pipe(output);
    archive.on("end", function() {
      if (self.options.verbose) {
        console.log("Done zipping, clearing temp dir...");
      }
      return rimraf(cwd, function(err) {
        if (err) {
          return genDefer.reject(err);
        } else {
          return genDefer.resolve();
        }
      });
    });
    archive.on("error", function(err) {
      return genDefer.reject(err);
    });
    archive.finalize();
    return genDefer.promise;
  }
}

export default Epub;