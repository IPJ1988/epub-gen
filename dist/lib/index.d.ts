import * as Q from "q";
export interface EpubContent {
    title?: string;
    data: string;
    beforeToc?: boolean;
    filename?: string;
    href?: string;
    filePath?: string;
    excludeFromToc?: boolean;
    author?: string;
}
export interface OptionsInput {
    title: string;
    author: string | string[];
    publisher: string;
    cover: string;
    version: number;
    content: EpubContent[];
}
export interface Options extends OptionsInput {
    output?: string;
    description?: string;
    publisher: string;
    author: string[];
    tocTitle: string;
    appendChapterTitles?: boolean;
    date?: Date;
    lang: string;
    fonts?: string[] | Promise<string>[];
    customOpfTemplatePath?: string | undefined;
    customNcxTocTemplatePath?: string | undefined;
    customHtmlTocTemplatePath?: string | undefined;
    docHeader?: string;
    tempDir?: string;
    uuid?: string;
    id?: string;
    images?: Image[];
    content: any[];
    verbose?: boolean;
    _coverMediaType?: string;
    _coverExtension?: string;
    css: Buffer;
    customCss?: Buffer;
}
interface Image {
    id: string;
    url: string;
    dir: string;
    mediaType: string;
    extension: string;
}
declare class Epub {
    options: Options;
    defer: any;
    id: string;
    uuid: string;
    name: string;
    promise: any;
    constructor(options: Options, contentUID: string, output: string);
    render(): Promise<any>;
    generateTempFile(): Promise<unknown>;
    makeCover(): Q.Promise<unknown>;
    downloadImage(options: any): false | void | Q.Promise<unknown>;
    downloadAllImage(): Q.Promise<unknown>;
    genEpub(): Q.Promise<unknown>;
    getBuffer(): Promise<NonSharedBuffer | undefined>;
}
export default Epub;
//# sourceMappingURL=index.d.ts.map