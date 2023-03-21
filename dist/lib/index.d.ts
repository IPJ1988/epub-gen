/// <reference types="node" />
export interface OptionsInput {
    title: string;
    author: string | string[];
    publisher: string;
    cover: string;
    version: number;
    content: {
        title?: string;
        data: string;
    }[];
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
    fonts?: string[];
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
    generateTempFile(): any;
    makeCover(): any;
    downloadImage(options: any): any;
    downloadAllImage(): any;
    genEpub(): any;
    getBuffer(): Promise<Buffer | undefined>;
}
export default Epub;
//# sourceMappingURL=index.d.ts.map