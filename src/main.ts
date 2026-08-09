// import { default as createExcelsiorPdf } from '@unsonet/excelsior-pdf-parser'; //!BUG: the spread operator is not working
// ==================== MAIN CODE ====================
window.addEventListener('DOMContentLoaded', async () => {
  var cache = {};
  // DOM elements – cast to specific types for safe property access
  const fileInfo = document.querySelector('.file-info') as HTMLElement | null;
  const fullPage = document.querySelector('.full-page') as HTMLElement | null;
  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
  const preview = document.querySelector('.preview') as HTMLElement | null;

  let currentPage = 1;
  let totalPages = 1;

  var currentRenderTask: any = null;
  var currentPdfDataArray: Uint8Array<ArrayBuffer> | null = null; // Глобальная переменная для хранения сырых данных PDF

  // Initialize ExcelsiorPDF (global object assumed)

  let initPdfParser = (await (globalThis as any)?.['excelsiorPdfParserModule'])?.default//; || createExcelsiorPdf;

  const excelsiorPdf = initPdfParser({
    pdfjs: pdfjsLib,
    workerSrc: pdfjsWorkerSrc,
  });

  // Holds the extraction results – define a proper interface if available
  let excelsiorPdfResults: any; // ideally replace `any` with a specific type

  // ========== FILE INPUT HANDLING ==========
  fileInput?.addEventListener('change', (ev) => {
    getFileInfo(ev); // pass the event – fixes missing argument error
  });

  // ========== DRAG & DROP ==========
  document.addEventListener('dragover', (ev) => {
    ev.preventDefault();
    if (fullPage) {
      fullPage.style.display = 'block';
      fullPage.style.opacity = '1';
    }
  });

  document.addEventListener('drop', (ev) => {
    ev.preventDefault();
    if (fullPage) {
      fullPage.style.opacity = '0';
      fullPage.style.display = 'none';
    }
    getFileInfo(ev); // pass the drop event
  });

  // document.addEventListener("dragend", function (ev) {
  //   ev.preventDefault();
  //   if (fullPage) {
  //     fullPage.style.opacity = 0;
  //     fullPage.style.display = "none";
  //   }
  // });

  fullPage?.addEventListener('dragleave', (ev) => {
    ev.preventDefault();
    if (fullPage) {
      fullPage.style.opacity = '0';
      fullPage.style.display = 'none';
    }
  });

  // ========== FILE INFO DISPLAY ==========
  function getFileInfo(ev: Event | DragEvent) {
    // Determine input source: DragEvent uses dataTransfer, otherwise fileInput
    let inputFile: File | null = null;
    if (ev instanceof DragEvent && ev.dataTransfer) {
      inputFile = ev.dataTransfer.files[0];
    } else if (fileInput?.files) {
      inputFile = fileInput.files[0];
    }

    if (inputFile && fileInfo) {
      fileInfo.innerHTML = `File name: ${inputFile.name}<br>`;
      fileInfo.innerHTML += `File size: ${prettifyFileSize(inputFile.size)}<br>`;
      fileInfo.innerHTML += `File type: ${inputFile.type.split('/')[1]}<br>`;
      fileInfo.style.opacity = '1';
    }
  }

  function prettifyFileSize(size: number): string {
    if (size < 1048576) {
      return (size / 1024).toFixed(2) + 'KB';
    } else if (size < 1073741824) {
      return (size / 1048576).toFixed(2) + 'MB';
    } else {
      return (size / 1073741824).toFixed(2) + 'GB';
    }
  }

  // ========== FILE READING & EXTRACTION ==========
  function handleFile(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    console.log('file', file);

    const reader = new FileReader();
    const fileByteArray: number[] = [];

    reader.onload = () => {
      // optional: show parsing message
    };

    reader.onloadend = async (evt: ProgressEvent<FileReader>) => {
      if (evt.target?.readyState === FileReader.DONE) {
        const arrayBuffer = evt.target.result;
        // Ensure it's an ArrayBuffer before converting
        if (arrayBuffer instanceof ArrayBuffer) {
          // const array = new Uint8Array(arrayBuffer);
          // for (let i = 0; i < array.length; i++) {
          //   fileByteArray.push(array[i]);
          // }
          // await extractFile(fileByteArray);

          var uint8Array = new Uint8Array(arrayBuffer);
          currentPdfDataArray = uint8Array; // Сохраняем данные
          excelsiorPdfResults = null;       // Сбрасываем результаты

          // Сразу просим отпарсить 1-ю страницу. 
          // Это единственный вызов pdfjs, ошибок с буфером не будет.
          await setPage(1);
        }
      }
    };

    reader.readAsArrayBuffer(file);
  }

  fileInput?.addEventListener('change', handleFile, false);

  // ========== PROGRESS & LOADING UI ==========
  function updateProgress(progress: number, duration: number) {
    progress = Math.min(Math.max(progress, 0), 1);
    const loadingElem = document.getElementById('loading') as HTMLElement | null;
    if (!loadingElem) return;
    loadingElem.style.transition = 'width ' + duration + 'ms ease';
    var targetPercentage = progress * 100;
    loadingElem.style.width = targetPercentage + '%';
  }

  let firstPageTimestamp: number | null = null;

  function onProgress(results: any) {
    showLoading(true);
    const progress = results.currentPage / results.numPages;
    const currentTimestamp = Date.now();
    let duration = 500;

    if (results.currentPage === 1 || firstPageTimestamp == null) {
      firstPageTimestamp = currentTimestamp;
    } else if (results.currentPage === 2 && firstPageTimestamp !== null) {
      duration = currentTimestamp - firstPageTimestamp;
    }
    updateProgress(progress, duration);
  }

  function onSuccess(results: any) {
    console.log('results', results);
    updateProgress(1, 500);
    setTimeout(() => {
      showLoading(false);
      firstPageTimestamp = null;
    }, 1);
  }

  function onError(error: any) {
    console.error(error);
    setTimeout(() => {
      showLoading(false);
      firstPageTimestamp = null;
    }, 1);
  }

  function showLoading(enabled: boolean) {
    if (!preview) return;
    if (enabled) {
      if (!preview.classList.contains('dim')) {
        preview.classList.add('dim');
      }
    } else {
      if (preview.classList.contains('dim')) {
        preview.classList.remove('dim');
      }
    }
  }

  async function extractFile(dataArray: any) {
    try {
      updateProgress(0, 0);
      showLoading(true);
      const res = await excelsiorPdf.extractorRun({
        dataArray: dataArray,
        onProgress,
        onSuccess,
        onError,
      });
      excelsiorPdfResults = res;
      currentPage = 1;
      totalPages = excelsiorPdfResults.extractorResults.numPages;
      await setPage(currentPage);
    } catch (error) {
      onError(error);
    }
  }

  //  Parses only a specific page
  async function parsePage(pageNum: number) {
    if (!excelsiorPdfResults) {
      excelsiorPdfResults = {
        documentProxy: null,
        extractorResults: {
          numPages: 0,
          pageTables: []
        }
      };
    }

    // If the page has already been parsed, exit
    if (excelsiorPdfResults.extractorResults.pageTables[pageNum - 1]) {
      return;
    }

    try {
      // FIX ERRORS: Create an exact copy of the data buffer.
      // The PDFJS worker “kills” the original buffer during transfer,
      // which is why a “detached” error occurred on the 2nd and 3rd pages.
      const dataCopy = currentPdfDataArray?.slice();

      let res = await excelsiorPdf.extractorRun({
        dataArray: dataCopy,
        pages: [pageNum]
      });

      totalPages = res.extractorResults.numPages;
      excelsiorPdfResults.extractorResults.numPages = totalPages;

      // Сохраняем результат парсинга в нужную ячейку массива
      excelsiorPdfResults.extractorResults.pageTables[pageNum - 1] = res.extractorResults.pageTables[0];

      // Сохраняем documentProxy для отрисовки канваса (один раз)
      if (!excelsiorPdfResults.documentProxy) {
        excelsiorPdfResults.documentProxy = res.documentProxy;
      }
    } catch (error) {
      console.log(`Error parsing page ${pageNum}:`, error);
    }
  }

  // ========== CARD INITIALIZATION ==========
  function initCards() {
    const cardsContainer = document.querySelector('.cards');
    if (!cardsContainer) return;
    const cards = Array.from(cardsContainer.querySelectorAll('.card'));
    cards.forEach((card) => {
      const id = (card as HTMLElement).dataset.id;
      const link = card.querySelector('a') as HTMLAnchorElement | null;
      const isCard = (el: Element): el is HTMLElement =>
        !!id && !el.classList.contains('more');

      if (isCard(card)) {
        const url = `./assets/pdf/${id}.pdf`;
        if (link && !link.href) {
          link.href = url;
        }
        // Attach click handler to the first child element
        const firstChild = card.firstElementChild as HTMLElement | null;
        if (firstChild) {
          firstChild.onclick = async () => {
            const response = await fetch(url);
            const fileByteArray = await response.arrayBuffer();
            //await extractFile(Array.from(new Uint8Array(fileByteArray)));

            var uint8Array = new Uint8Array(fileByteArray);
            currentPdfDataArray = uint8Array; // Сохраняем данные
            excelsiorPdfResults = null;       // Сбрасываем результаты

            // Сразу просим отпарсить 1-ю страницу. 
            // Это единственный вызов pdfjs, ошибок с буфером не будет.
            await setPage(1);

            card.classList.add('selected');
            cards.forEach((c) => {
              if (c !== card) {
                c.classList.remove('selected');
              }
            });
          };
        }
      }
    });
  }

  // ========== PAGE RENDERING ==========
  async function renderPage(pageNum: number) {
    if (!excelsiorPdfResults || !excelsiorPdfResults.documentProxy) return;
    const pdf = excelsiorPdfResults.documentProxy;
    // Load the page.
    const page = await pdf.getPage(pageNum);
    const scale = 1;
    const viewport = page.getViewport({ scale });

    const canvas = document.getElementById('pdf') as HTMLCanvasElement | null;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    // Если идет отрисовка предыдущей страницы — жестко отменяем её
    if (currentRenderTask) {
      try {
        currentRenderTask.cancel();
      } catch (e) {
        // Игнорируем ошибки отмены
      }
    }

    // Запускаем новый рендер и сохраняем ссылку на задачу
    currentRenderTask = page.render(renderContext);

    try {
      await currentRenderTask.promise;
      console.log('Page rendered!');
    } catch (error) {
      // При отмене задачи pdfjs кидает ошибку, мы её просто глушим
      if ((error as any)?.name !== 'RenderingCancelledException') {
        console.error('Render error:', error);
      }
    } finally {
      currentRenderTask = null; // Очищаем ссылку
    }
  }

  // ========== JSON TREE VIEW ==========
  function setJSONTree(pageNum: number) {
    const options = {
      showLen: false,
      showType: false,
      showBrackets: true,
      showFoldmarker: false,
      colors: {
        boolean: '#ff2929',
        null: '#ff2929',
        string: '#690',
        number: '#905',
        float: '#002f99'
      },
    };

    let data = {};
    if (excelsiorPdfResults) {
      const pageTables = excelsiorPdfResults.extractorResults.pageTables[pageNum - 1];
      if (pageTables) {
        data = pageTables.tableGroups.map((tableGroup: any) => tableGroup.tableData.table.json);
      }
    }

    const treeView = jsnview(data, options);
    const jsonElement = document.querySelector('#tab-html ~ .tab .json') as HTMLElement | null;
    if (jsonElement) {
      jsonElement.innerHTML = '';
      jsonElement.appendChild(treeView);
    }
  }

  // ========== HTML VIEW ==========
  function setHTML(pageNum: number) {
    if (!excelsiorPdfResults) return;
    const pageTables = excelsiorPdfResults.extractorResults.pageTables[pageNum - 1];
    //if (!pageTables) return;

    const html = pageTables ? pageTables.tableGroups
      .map((tableGroup: any) => tableGroup.tableData.table.html)
      .join('<br>') : '<p style="padding:10px;color:#666;">No data or page is empty</p>';

    const htmlElement = document.querySelector('#tab-html ~ .tab .html') as HTMLElement | null;
    if (htmlElement) {
      htmlElement.innerHTML = html;
    }
  }

  // ========== PAGE NAVIGATION ==========
  async function setPage(pageNum: number) {
    const currentPageCounter = document.querySelector('.current-page') as HTMLElement | null;
    const totalPagesCounter = document.querySelector('.total-pages') as HTMLElement | null;

    if (currentPdfDataArray) {
      showLoading(true);
      try {
        // 1. Парсим таблицы ТОЛЬКО для этой страницы
        await parsePage(pageNum);

        // 2. Обновляем UI
        paginationButtonsHandler(pageNum);
        // 3. Обновляем счетчики страниц в самом конце
        currentPage = pageNum;

        setJSONTree(currentPage);
        setHTML(currentPage);
        await renderPage(currentPage);

        const placeholder = document.querySelector(
          '.preview-placeholder'
        ) as HTMLElement | null;
        const container = document.querySelector(
          '.preview-container'
        ) as HTMLElement | null;
        if (placeholder && container) {
          if (!placeholder.classList.contains('hidden')) {
            placeholder.classList.add('hidden');
            container.classList.remove('hidden');
          }
        }
      } catch (error) {
        console.error(`Error setting page ${pageNum}:`, error);
      } finally {
        showLoading(false);
      }
    }


    if (currentPageCounter) currentPageCounter.textContent = String(currentPage);
    if (totalPagesCounter) totalPagesCounter.textContent = String(totalPages);
  }

  function paginationButtonsHandler(pageNum: number) {
    const prev = document.querySelector('.pagination .prev') as HTMLElement | null;
    const next = document.querySelector('.pagination .next') as HTMLElement | null;

    pageNum = pageNum || 1;
    if (pageNum <= totalPages && pageNum >= 1) {
      if (pageNum === 1) {
        prev?.setAttribute('disabled', 'true');
        if (totalPages > 1) {
          next?.removeAttribute('disabled');
        } else {
          next?.setAttribute('disabled', 'true');
        }
      } else if (pageNum === totalPages) {
        next?.setAttribute('disabled', 'true');
        if (totalPages > 1) {
          prev?.removeAttribute('disabled');
        } else {
          prev?.setAttribute('disabled', 'true');
        }
      } else {
        prev?.removeAttribute('disabled');
        next?.removeAttribute('disabled');
      }
    }
  }

  function initPagination() {
    const prev = document.querySelector('.pagination .prev') as HTMLElement | null;
    const next = document.querySelector('.pagination .next') as HTMLElement | null;

    if (prev) {
      prev.onclick = async () => {
        let pageNum = currentPage - 1;
        paginationButtonsHandler(pageNum);
        await setPage(pageNum);
      };
    }
    if (next) {
      next.onclick = async () => {
        let pageNum = currentPage + 1;
        paginationButtonsHandler(pageNum);
        await setPage(pageNum);
      };
    }
    paginationButtonsHandler(currentPage);
  }

  // ========== INITIALIZATION ==========
  initCards();
  setJSONTree(currentPage); // fixed missing argument
  initPagination();
});