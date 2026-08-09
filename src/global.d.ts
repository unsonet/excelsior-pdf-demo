export {};

declare global {
  interface Window {
    excelsiorPdfParserModule: {
      init(config: { pdfjs: any; workerSrc: string }): any;
      default(config: { pdfjs: any; workerSrc: string }): any;
    };
    pdfjsLib: any;
    jsnview: any;
  }

  const pdfjsLib: any;
  const pdfjsWorkerSrc: string;
  const jsnview: any;
}