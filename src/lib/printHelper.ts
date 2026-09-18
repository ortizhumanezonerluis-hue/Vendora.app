/**
 * Helper to print and download documents cleanly in both Web and Electron desktop environments
 * without popup blockers or "No se permite la vista previa" errors.
 */

export function printHtmlDocument(titleOrHtml: string, htmlBodyContent?: string, styles: string = '') {
  let fullHtml = ''
  if (htmlBodyContent === undefined) {
    fullHtml = titleOrHtml
  } else {
    fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titleOrHtml}</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      padding: 20px;
      font-size: 12px;
      line-height: 1.4;
    }
    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }
      @page {
        margin: 10mm;
      }
    }
    ${styles}
  </style>
</head>
<body>
  ${htmlBodyContent}
</body>
</html>`
  }

  // Use a hidden iframe attached to the document. This works 100% reliably in Electron and Chrome
  // without about:blank popup restrictions.
  const existingFrame = document.getElementById('vendora-print-frame')
  if (existingFrame) {
    existingFrame.remove()
  }

  const iframe = document.createElement('iframe')
  iframe.id = 'vendora-print-frame'
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  iframe.style.visibility = 'hidden'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (doc) {
    doc.open()
    doc.write(fullHtml)
    doc.close()

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (err) {
        console.warn('Error al invocar impresión nativa:', err)
        const w = window.open('', '_blank')
        if (w) {
          w.document.write(fullHtml)
          w.document.close()
          setTimeout(() => w.print(), 300)
        }
      }
    }, 300)
  }
}

export function downloadHtmlDocument(fileName: string, titleOrFullHtml: string, htmlBodyContent?: string, styles: string = '') {
  let fullHtml = ''
  if (htmlBodyContent === undefined) {
    fullHtml = titleOrFullHtml
  } else {
    fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titleOrFullHtml}</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      padding: 24px;
      font-size: 13px;
      line-height: 1.4;
    }
    @media print {
      body { padding: 0; }
    }
    ${styles}
  </style>
</head>
<body>
  ${htmlBodyContent}
</body>
</html>`
  }

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.html') ? fileName : `${fileName}.html`
  a.click()
  URL.revokeObjectURL(url)
}
