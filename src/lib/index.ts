// import path from 'path';
// import fs from 'fs';
import Q from 'q';
import _ from 'underscore';
// import uslug from 'uslug';
// import ejs from 'ejs';
// import cheerio from 'cheerio';
// import entities from 'entities';

export interface Options {
  title: string;
  author: string;
  publisher: string;
  cover: string;
  version: number;
  content: {
    title: string;
    data: string;
  }[];
}
class Epub {
  options: Options;
  output: string;
  // defer = new Q.defer();

  constructor(options: Options, output: string) {
    this.options = options;
    this.output = output;

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
      customHtmlTocTemplatePath: null,
      version: 3
    }, options);
    console.log(this.options);
  }
}

export default Epub;