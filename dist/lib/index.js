"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const q_1 = __importDefault(require("q"));
const underscore_1 = __importDefault(require("underscore"));
const uslug_1 = __importDefault(require("uslug"));
const ejs_1 = __importDefault(require("ejs"));
const cheerio_1 = __importDefault(require("cheerio"));
const entities_1 = require("entities");
const superagent_1 = __importDefault(require("superagent"));
const superagent_proxy_1 = __importDefault(require("superagent-proxy"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const diacritics_1 = __importDefault(require("diacritics"));
const mime_1 = __importDefault(require("mime"));
const uuid_1 = require("uuid");
const async_1 = __importStar(require("async"));
const url_1 = __importDefault(require("url"));
const zipFolder = require("zip-dir");
(0, superagent_proxy_1.default)(superagent_1.default);
class Epub {
    constructor(options, contentUID, output) {
        this.defer = q_1.default.defer();
        this.name = "";
        this.options = options;
        this.id = contentUID;
        if (!this.options.fonts) {
            this.options.fonts = [];
        }
        if (!this.options.content) {
            this.options.content = [];
        }
        const self = this;
        this.options = underscore_1.default.extend({
            output: `${output}/${contentUID}.epub`, // path.resolve(__dirname, "../tempDir/book.epub"),
            description: options.description,
            publisher: options.publisher,
            author: options.author,
            tocTitle: options.tocTitle,
            appendChapterTitles: options.appendChapterTitles ?? false,
            date: options.date ?? new Date().toISOString(),
            lang: options.lang,
            fonts: options.fonts ?? [],
            customOpfTemplatePath: options.customHtmlTocTemplatePath,
            customNcxTocTemplatePath: options.customNcxTocTemplatePath,
            customHtmlTocTemplatePath: options.customOpfTemplatePath,
            version: options.version,
            customCss: options.customCss,
        }, options);
        switch (this.options.version) {
            case 2:
                this.options.docHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">\n<html xmlns="http://www.w3.org/1999/xhtml" lang="${self.options.lang}">`;
                break;
            case 3:
            default:
                this.options.docHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${self.options.lang}">`;
                break;
        }
        if (underscore_1.default.isEmpty(this.options.author)) {
            this.options.author = ["anonymous"];
        }
        this.options.tempDir = output; // path.resolve(__dirname, "../tempDir/");
        this.uuid = path_1.default.resolve(this.options.tempDir, this.id);
        this.options.uuid = this.uuid;
        this.options.id = this.id;
        this.options.images = [];
        this.options.content = underscore_1.default.map(this.options.content, (content, index) => {
            var $, allowedAttributes, allowedXhtml11Tags, titleSlug;
            if (!content.filename) {
                titleSlug = (0, uslug_1.default)(diacritics_1.default.remove(content.title || "no title"));
                content.href = `${index}_${titleSlug}.xhtml`;
                content.filePath = path_1.default.resolve(self.uuid, `./OEBPS/${index}_${titleSlug}.xhtml`);
            }
            else {
                content.href = content.filename.match(/\.xhtml$/)
                    ? content.filename
                    : `${content.filename}.xhtml`;
                if (content.filename.match(/\.xhtml$/)) {
                    content.filePath = path_1.default.resolve(self.uuid, `./OEBPS/${content.filename}`);
                }
                else {
                    content.filePath = path_1.default.resolve(self.uuid, `./OEBPS/${content.filename}.xhtml`);
                }
            }
            content.id = `item_${index}`;
            content.dir = path_1.default.dirname(content.filePath);
            content.excludeFromToc || (content.excludeFromToc = false);
            content.beforeToc || (content.beforeToc = false);
            //fix Author Array
            content.author =
                content.author && underscore_1.default.isString(content.author)
                    ? [content.author]
                    : !content.author || !underscore_1.default.isArray(content.author)
                        ? []
                        : content.author;
            allowedAttributes = [
                "content",
                "alt",
                "id",
                "title",
                "src",
                "href",
                "about",
                "accesskey",
                "aria-activedescendant",
                "aria-atomic",
                "aria-autocomplete",
                "aria-busy",
                "aria-checked",
                "aria-controls",
                "aria-describedat",
                "aria-describedby",
                "aria-disabled",
                "aria-dropeffect",
                "aria-expanded",
                "aria-flowto",
                "aria-grabbed",
                "aria-haspopup",
                "aria-hidden",
                "aria-invalid",
                "aria-label",
                "aria-labelledby",
                "aria-level",
                "aria-live",
                "aria-multiline",
                "aria-multiselectable",
                "aria-orientation",
                "aria-owns",
                "aria-posinset",
                "aria-pressed",
                "aria-readonly",
                "aria-relevant",
                "aria-required",
                "aria-selected",
                "aria-setsize",
                "aria-sort",
                "aria-valuemax",
                "aria-valuemin",
                "aria-valuenow",
                "aria-valuetext",
                "class",
                "content",
                "contenteditable",
                "contextmenu",
                "datatype",
                "dir",
                "draggable",
                "dropzone",
                "hidden",
                "hreflang",
                "id",
                "inlist",
                "itemid",
                "itemref",
                "itemscope",
                "itemtype",
                "lang",
                "media",
                "ns1:type",
                "ns2:alphabet",
                "ns2:ph",
                "onabort",
                "onblur",
                "oncanplay",
                "oncanplaythrough",
                "onchange",
                "onclick",
                "oncontextmenu",
                "ondblclick",
                "ondrag",
                "ondragend",
                "ondragenter",
                "ondragleave",
                "ondragover",
                "ondragstart",
                "ondrop",
                "ondurationchange",
                "onemptied",
                "onended",
                "onerror",
                "onfocus",
                "oninput",
                "oninvalid",
                "onkeydown",
                "onkeypress",
                "onkeyup",
                "onload",
                "onloadeddata",
                "onloadedmetadata",
                "onloadstart",
                "onmousedown",
                "onmousemove",
                "onmouseout",
                "onmouseover",
                "onmouseup",
                "onmousewheel",
                "onpause",
                "onplay",
                "onplaying",
                "onprogress",
                "onratechange",
                "onreadystatechange",
                "onreset",
                "onscroll",
                "onseeked",
                "onseeking",
                "onselect",
                "onshow",
                "onstalled",
                "onsubmit",
                "onsuspend",
                "ontimeupdate",
                "onvolumechange",
                "onwaiting",
                "prefix",
                "property",
                "rel",
                "resource",
                "rev",
                "role",
                "spellcheck",
                "style",
                "tabindex",
                "target",
                "title",
                "type",
                "typeof",
                "vocab",
                "xml:base",
                "xml:lang",
                "xml:space",
                "colspan",
                "rowspan",
                "epub:type",
                "epub:prefix",
            ];
            allowedXhtml11Tags = [
                "div",
                "p",
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "ul",
                "ol",
                "li",
                "dl",
                "dt",
                "dd",
                "address",
                "hr",
                "pre",
                "blockquote",
                "center",
                "ins",
                "del",
                "a",
                "span",
                "bdo",
                "br",
                "em",
                "strong",
                "dfn",
                "code",
                "samp",
                "kbd",
                "bar",
                "cite",
                "abbr",
                "acronym",
                "q",
                "sub",
                "sup",
                "tt",
                "i",
                "b",
                "big",
                "small",
                "u",
                "s",
                "strike",
                "basefont",
                "font",
                "object",
                "param",
                "img",
                "table",
                "caption",
                "colgroup",
                "col",
                "thead",
                "tfoot",
                "tbody",
                "tr",
                "th",
                "td",
                "embed",
                "applet",
                "iframe",
                "img",
                "map",
                "noscript",
                "ns:svg",
                "object",
                "script",
                "table",
                "tt",
                "var",
            ];
            $ = cheerio_1.default.load(content.data, {
                lowerCaseTags: true,
                recognizeSelfClosing: true,
            });
            // Only body innerHTML is allowed
            if ($("body").length) {
                $ = cheerio_1.default.load($("body").html(), {
                    lowerCaseTags: true,
                    recognizeSelfClosing: true,
                });
            }
            $($("*").get().reverse()).each((elemIndex, elem) => {
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
                    if (allowedAttributes.indexOf(k) >= 0) {
                        if (k === "type") {
                            if (that.name !== "script") {
                                $(that).removeAttr(k);
                            }
                        }
                    }
                    else {
                        $(that).removeAttr(k);
                    }
                }
                if (self.options.version === 2) {
                    if (((ref1 = that.name), allowedXhtml11Tags.indexOf(ref1) >= 0)) {
                    }
                    else {
                        if (self.options.verbose) {
                            console.log("Warning (content[" + index + "]):", that.name, "tag isn't allowed on EPUB 2/XHTML 1.1 DTD.");
                        }
                        child = $(that).html();
                        return $(that).replaceWith($("<div>" + child + "</div>"));
                    }
                }
            });
            $("img").each((index, elem) => {
                var dir, extension, id, image, mediaType, url;
                url = $(elem).attr("src");
                if ((image = self.options.images?.find((element) => {
                    return element.url === url;
                }))) {
                    id = image.id;
                    extension = image.extension;
                }
                else {
                    id = (0, uuid_1.v4)();
                    mediaType = mime_1.default.getType(url.replace(/\?.*/, ""));
                    extension = mime_1.default.getExtension(mediaType);
                    dir = content.dir;
                    self.options.images?.push({ id, url, dir, mediaType, extension });
                }
                return $(elem).attr("src", `images/${id}.${extension}`);
            });
            //content.data = $.xml();
            return content;
        });
        if (this.options.cover) {
            const urlData = url_1.default.parse(this.options.cover);
            const coverUrl = `${urlData.protocol}//${urlData.hostname}/${urlData.pathname}`;
            this.options._coverMediaType = mime_1.default.getType(coverUrl);
            this.options._coverExtension = mime_1.default.getExtension(this.options._coverMediaType);
        }
    }
    async render() {
        var self = this;
        if (self.options.verbose) {
            console.log("Generating Template Files.....");
        }
        await this.generateTempFile();
        console.log("Downloading Images...");
        await self.downloadAllImage();
        console.log("Making Cover...");
        await self.makeCover();
        console.log("Generating Epub Files...");
        return await self.genEpub();
    }
    async generateTempFile() {
        var base, htmlTocPath, ncxTocPath, opfPath, self = this;
        if (!fs_1.default.existsSync(this.options.tempDir)) {
            fs_1.default.mkdirSync(this.options.tempDir);
        }
        fs_1.default.mkdirSync(this.uuid);
        fs_1.default.mkdirSync(path_1.default.resolve(this.uuid, "./OEBPS"));
        (base = this.options).css ||
            (base.css = fs_1.default.readFileSync(path_1.default.resolve(__dirname, "../templates/template.css")));
        fs_1.default.writeFileSync(path_1.default.resolve(this.uuid, "./OEBPS/style.css"), this.options.css);
        if (self.options.customCss) {
            fs_1.default.writeFileSync(path_1.default.resolve(this.uuid, "./OEBPS/customStyle.css"), this.options.customCss);
        }
        if (self.options.fonts && self.options.fonts.length > 0) {
            fs_1.default.mkdirSync(path_1.default.resolve(this.uuid, "./OEBPS/fonts"));
            this.options.fonts = await (0, async_1.mapLimit)(this.options.fonts ?? [], 1, async (font) => {
                var filename;
                filename = path_1.default.basename(font);
                if (isValidUrl(font)) {
                    const response = await axios_1.default.get(font);
                    fs_extra_1.default.writeFileSync(path_1.default.resolve(self.uuid, "./OEBPS/fonts/" + filename), response.data);
                    return filename;
                }
                else {
                    if (!fs_1.default.existsSync(font)) {
                        new Error("Custom font not found at " + font + ".");
                    }
                    fs_extra_1.default.copySync(font, path_1.default.resolve(self.uuid, "./OEBPS/fonts/" + filename));
                    return filename;
                }
            });
        }
        console.log(self.options.fonts);
        //  });
        //   this.options.fonts = await _.map(
        //     (this.options.fonts as string[]) ?? [],
        //     async function (font: string) {
        //   );
        // }
        await async_1.default.eachLimit(self.options.content, 1, async (content) => {
            console.log("content.filePath", content);
            var data;
            data = `${self.options.docHeader}\n  <head>\n  <meta charset="UTF-8" />\n  <title>${(0, entities_1.encodeXML)(content.title || "")}</title>\n  <link rel="stylesheet" type="text/css" href="style.css" />\n 
      ${self.options.customCss
                ? '<link rel="stylesheet" type="text/css" href="customStyle.css" />\n'
                : ""}</head>\n<body>`;
            data +=
                content.title && self.options.appendChapterTitles
                    ? `<h1>${(0, entities_1.encodeXML)(content.title)}</h1>`
                    : "";
            data +=
                content.title && content.author && content.author.length
                    ? `<p class='epub-author'>${(0, entities_1.encodeXML)(content.author)}</p>`
                    : "";
            data +=
                content.title && content.url
                    ? `<p class='epub-link'><a href='${content.url}'>${content.url}</a></p>`
                    : "";
            data += `${content.data}</body></html>`;
            console.log("content.data", data);
            console.log("content.filePath", content.filePath);
            return fs_1.default.writeFileSync(content.filePath, data);
        });
        // write meta-inf/container.xml
        fs_1.default.mkdirSync(this.uuid + "/META-INF");
        fs_1.default.writeFileSync(`${this.uuid}/META-INF/container.xml`, '<?xml version="1.0" encoding="UTF-8" ?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
        if (self.options.version === 2) {
            // write meta-inf/com.apple.ibooks.display-options.xml [from pedrosanta:xhtml#6]
            fs_1.default.writeFileSync(`${this.uuid}/META-INF/com.apple.ibooks.display-options.xml`, '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<display_options>\n  <platform name="*">\n    <option name="specified-fonts">true</option>\n  </platform>\n</display_options>');
        }
        opfPath =
            self.options.customOpfTemplatePath ||
                path_1.default.resolve(__dirname, `../templates/epub${self.options.version}/content.opf.ejs`);
        if (!fs_1.default.existsSync(opfPath)) {
            new Error("Custom file to OPF template not found.");
        }
        ncxTocPath =
            self.options.customNcxTocTemplatePath ||
                path_1.default.resolve(__dirname, "../templates/toc.ncx.ejs");
        if (!fs_1.default.existsSync(ncxTocPath)) {
            new Error("Custom file the NCX toc template not found.");
        }
        htmlTocPath =
            self.options.customHtmlTocTemplatePath ||
                path_1.default.resolve(__dirname, `../templates/epub${self.options.version}/toc.xhtml.ejs`);
        if (!fs_1.default.existsSync(htmlTocPath)) {
            new Error("Custom file to HTML toc template not found.");
        }
        console.log("renderFile EJS");
        const [data1, data2, data3] = await Promise.all([
            ejs_1.default.renderFile(opfPath, self.options),
            ejs_1.default.renderFile(ncxTocPath, self.options),
            ejs_1.default.renderFile(htmlTocPath, self.options),
        ]);
        console.log("writeFileSync", data1);
        console.log("writeFileSync", data2);
        console.log("writeFileSync", data3);
        fs_1.default.writeFileSync(path_1.default.resolve(self.uuid, "./OEBPS/content.opf"), data1);
        fs_1.default.writeFileSync(path_1.default.resolve(self.uuid, "./OEBPS/toc.ncx"), data2);
        fs_1.default.writeFileSync(path_1.default.resolve(self.uuid, "./OEBPS/toc.xhtml"), data3);
    }
    makeCover() {
        return new Promise((resolve, reject) => {
            var destPath, self = this, userAgent, writeStream;
            userAgent =
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36";
            if (this.options.cover) {
                destPath = path_1.default.resolve(this.uuid, "./OEBPS/cover." + this.options._coverExtension);
                writeStream = null;
                if (this.options.cover.slice(0, 4) === "http") {
                    writeStream = superagent_1.default.get(this.options.cover).set({
                        "User-Agent": userAgent,
                    });
                    writeStream.pipe(fs_1.default.createWriteStream(destPath));
                }
                else {
                    writeStream = fs_1.default.createReadStream(this.options.cover);
                    writeStream.pipe(fs_1.default.createWriteStream(destPath));
                }
                // writeStream.on("end",)
                writeStream.on("end", function () {
                    if (self.options.verbose) {
                        console.log("[Success] cover image downloaded successfully!");
                    }
                    resolve(true);
                });
                writeStream.on("error", function (err) {
                    console.error("Error", err);
                    reject(err);
                });
            }
            else {
                resolve(true);
            }
        });
    }
    downloadImage(options) {
        return new Promise((resolve, reject) => {
            var auxpath, filename, requestAction, self = this, userAgent;
            userAgent =
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36";
            if (!options.url && typeof options !== "string") {
                return false;
            }
            if (!options.url.match(/^http/i)) {
                return false;
            }
            filename = path_1.default.resolve(self.uuid, "./OEBPS/images/" + options.id + "." + options.extension);
            if (options.url.indexOf("file://") === 0) {
                auxpath = options.url.substr(7);
                fs_extra_1.default.copySync(auxpath, filename);
                resolve(options);
            }
            else {
                if (options.url.indexOf("http") === 0) {
                    requestAction = superagent_1.default.get(options.url).set({
                        "User-Agent": userAgent,
                    });
                    requestAction.pipe(fs_1.default.createWriteStream(filename));
                }
                else {
                    requestAction = fs_1.default.createReadStream(path_1.default.resolve(options.dir, options.url));
                    requestAction.pipe(fs_1.default.createWriteStream(filename));
                }
                requestAction.on("error", function (err) {
                    if (self.options.verbose) {
                        console.error("[Download Error]", "Error while downloading", options.url, err);
                    }
                    fs_1.default.unlinkSync(filename);
                    return reject(err);
                });
                requestAction.on("end", function () {
                    if (self.options.verbose) {
                        console.log("[Download Success]", options.url);
                    }
                    resolve(options);
                });
            }
        });
        //{id, url, mediaType}
    }
    async downloadAllImage() {
        var deferArray, self = this;
        if (!self.options.images?.length) {
            return true;
        }
        else {
            fs_1.default.mkdirSync(path_1.default.resolve(this.uuid, "./OEBPS/images"));
            deferArray = [];
            underscore_1.default.each(self.options.images, async function (image) {
                return deferArray.push(await self.downloadImage(image));
            });
            q_1.default.all(deferArray).fin(function () {
                return true;
            });
        }
        return true;
    }
    genEpub() {
        return new Promise((resolve, reject) => {
            zipFolder(this.uuid, (err, buffer) => {
                //self.deleteTmpFile();
                if (err) {
                    reject(err);
                }
                resolve(buffer);
            });
            // var archive,
            //   cwd: string,
            //   output,
            //   self = this;
            // cwd = this.uuid;
            // archive = archiver("zip", {
            //   zlib: {
            //     level: 9,
            //   },
            // });
            // output = fs.createWriteStream(self.options.output!);
            // if (self.options.verbose) {
            //   console.log("Zipping temp dir to", self.options.output);
            // }
            // archive.append("application/epub+zip", {
            //   store: true,
            //   name: "mimetype",
            // });
            // archive.directory(cwd + "/META-INF", "META-INF");
            // archive.directory(cwd + "/OEBPS", "OEBPS");
            // archive.pipe(output);
            // archive.on("end", async function () {
            //   if (self.options.verbose) {
            //     console.log("Done zipping, clearing temp dir...");
            //   }
            //   console.log("complete zip file");
            //   resolve(true); //await fsPromise.rm(cwd, { recursive: true, force: true });
            // });
            // archive.on("error", function (err) {
            //   reject(err);
            // });
            // archive.finalize();
        });
        // Thanks to Paul Bradley
        // http://www.bradleymedia.org/gzip-markdown-epub/ (404 as of 28.07.2016)
        // Web Archive URL:
        // http://web.archive.org/web/20150521053611/http://www.bradleymedia.org/gzip-markdown-epub
        // or Gist:
        // https://gist.github.com/cyrilis/8d48eef37fbc108869ac32eb3ef97bca
    }
    // archiveEpub(): Promise<Buffer> {
    //   const self = this;
    //   return new Promise((resolve, reject) => {
    //     zipFolder(this.uuid, (err: Error, buffer: Buffer) => {
    //       //self.deleteTmpFile();
    //       if (err) {
    //         reject(err);
    //       }
    //       resolve(buffer);
    //     });
    //   });
    // }
    async getBuffer() {
        try {
            console.log("get getBuffer");
            return await this.render();
        }
        catch (error) {
            console.error("error get file", error);
            throw error;
        }
    }
}
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch (_) {
        return false;
    }
};
exports.default = Epub;
//# sourceMappingURL=index.js.map