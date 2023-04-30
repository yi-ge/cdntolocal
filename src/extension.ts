import * as vscode from 'vscode'
import axios from 'axios'
import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'

async function download (url: string, dest: string): Promise<void> {
  const response = await axios.get(url, { responseType: 'arraybuffer' })
  fs.writeFileSync(dest, new Buffer(response.data), 'binary')
}

export function activate (context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('cdntolocal.downloadAndAddFallback', async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.')
      return
    }

    const document = editor.document
    if (document.languageId !== 'html') {
      vscode.window.showErrorMessage('Current file is not an HTML file.')
      return
    }

    const html = document.getText()
    const $ = cheerio.load(html)

    const cdnElements = $('link[href^="http"], script[src^="http"]')

    for (const element of cdnElements.toArray()) {
      const url = $(element).attr('href') || $(element).attr('src')
      if (!url) {
        continue
      }

      const localPath = `/local/path/to/${path.basename(url)}` // 根据实际情况修改本地路径
      try {
        await download(url, localPath)
        $(element).attr('onerror', `loadFallbackResource(this, '${localPath}')`)
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to download ${url}: ${error.message}`)
      }
    }

    const newHtml = $.html()
    const edit = new vscode.WorkspaceEdit()
    edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(html.length)), newHtml)
    await vscode.workspace.applyEdit(edit)

    const fallbackScript = `
<script>
  function loadFallbackResource(element, fallbackUrl) {
    if (element.tagName === 'LINK') {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fallbackUrl;
      document.head.appendChild(link);
    } else if (element.tagName === 'SCRIPT') {
      var script = document.createElement('script');
      script.src = fallbackUrl;
      document.body.appendChild(script);
    }
  }
</script>
        `

    editor.edit(editBuilder => {
      editBuilder.insert(document.positionAt(newHtml.length), fallbackScript)
    })
  })

  context.subscriptions.push(disposable)
}

export function deactivate () { }
