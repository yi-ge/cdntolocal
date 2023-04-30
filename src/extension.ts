import * as vscode from 'vscode';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

async function download (url: string, dest: string): Promise<void> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(dest, new Buffer(response.data), 'binary');
}

export function activate (context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'cdntolocal.downloadAndAddFallback',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
      }

      const document = editor.document;
      if (document.languageId !== 'html') {
        vscode.window.showErrorMessage('Current file is not an HTML file.');
        return;
      }

      const html = document.getText();
      const $ = cheerio.load(html);

      const cdnElements = $('link[href^="http"], script[src^="http"]');

      for (const element of cdnElements.toArray()) {
        const urlStr = $(element).attr('href') || $(element).attr('src');
        if (!urlStr) {
          continue;
        }

        const parsedUrl = url.parse(urlStr);
        const localDir = path.join(
          path.dirname(document.fileName),
          'static',
          parsedUrl.pathname ? path.dirname(parsedUrl.pathname) : ''
        );
        fs.mkdirSync(localDir, { recursive: true });

        const localPath = path.join(localDir, path.basename(urlStr));
        const relativePath = path.relative(
          path.dirname(document.fileName),
          localPath
        );

        try {
          await download(urlStr, localPath);
          $(element).attr(
            'onerror',
            `loadFallbackResource(this, '${relativePath}')`
          );
        } catch (error: any) {
          vscode.window.showErrorMessage(
            `Failed to download ${urlStr}: ${error.message}`
          );
        }
      }

      const newHtml = $.html();
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(html.length)), newHtml);
      await vscode.workspace.applyEdit(edit);

      const updatedDocument = await vscode.workspace.openTextDocument(document.uri);
      const updatedHtml = updatedDocument.getText();

      const fallbackScript = `
<script>
  function loadFallbackResource(element, fallbackUrl) {
    const url = new URL(fallbackUrl, window.location.href);
    if (element.tagName === 'LINK') {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url.href;
      document.head.appendChild(link);
    } else if (element.tagName === 'SCRIPT') {
      var script = document.createElement('script');
      script.src = url.href;
      document.body.appendChild(script);
    }
  }
</script>
`;

      const headCloseTagPosition = updatedDocument.positionAt(updatedHtml.indexOf('</head>'));
      editor.edit(editBuilder => {
        editBuilder.insert(headCloseTagPosition, fallbackScript);
      });
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate () { }
