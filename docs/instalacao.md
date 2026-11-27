# Instalação e atualização

## Instalar a distribuição

Requisitos: Microsoft Edge ou Google Chrome atualizado, suporte a painel lateral e acesso ao Instagram. O manifesto declara Chrome 116 como mínimo; utilize uma versão estável atual para a homologação.

1. Acesse https://github.com/vitoroliveirasilva/instagram-media-studio.extension/releases/latest.
2. Baixe o ZIP da extensão e o arquivo `.sha256` correspondente. Os arquivos automáticos **Source code** contêm o código-fonte e exigem compilação.
3. Extraia o ZIP em uma pasta permanente. `manifest.json` deve ficar diretamente nessa pasta.
4. Abra `edge://extensions` ou `chrome://extensions`.
5. Ative **Modo do desenvolvedor**, selecione **Carregar sem compactação** e escolha a pasta extraída.
6. Atualize as abas do Instagram e abra o painel pelo ícone da extensão.

Não apague a pasta de instalação enquanto a extensão estiver em uso.

## Conferir integridade

Compare o resultado com o valor presente no arquivo `.sha256` da mesma release.

Windows PowerShell:

```powershell
Get-FileHash .\instagram-media-studio-v0.6.1.zip -Algorithm SHA256
```

Linux:

```sh
sha256sum -c instagram-media-studio-v0.6.1.zip.sha256
```

O checksum detecta divergências do arquivo baixado. Obtenha ambos os arquivos na release oficial do repositório.

## Atualizar uma instalação

Feche o painel, extraia a nova distribuição e substitua o conteúdo da pasta já carregada. No gerenciador de extensões, clique em **Recarregar**. Atualize a página do Instagram e reabra o painel. Confira a versão exibida no gerenciador.

Se preferir mudar de pasta, remova a instalação anterior e carregue a nova pasta. A remoção pode apagar as preferências locais; a galeria não é persistida.

## Compilar a partir do código

Com Git, Node.js 22 e npm:

```sh
git clone -b prod https://github.com/vitoroliveirasilva/instagram-media-studio.extension.git
cd instagram-media-studio.extension
npm ci
npm run verificar
npm run empacotar
```

Carregue `dist/` no navegador. O ZIP e o SHA-256 são gerados em `artifacts/`. O pacote inclui interface, scripts de captura, manifesto, instruções e licenças.

## Remover

No gerenciador do navegador, selecione **Remover**. Atualize as abas do Instagram para descarregar os scripts já injetados. Arquivos anteriormente baixados permanecem no destino de downloads do navegador.
