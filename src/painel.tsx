import { useEffect, useMemo, useRef, useState } from 'react'
import { Images, Settings2, LayoutGrid, List, Download, Image, Video, Play, Check, RefreshCw, X, Expand, Trash2, Moon, Sun, Monitor } from 'lucide-react'
import type { Filtro, Midia, Tema } from './tipos'
import { reunir } from './midias'
import { baixar } from './downloads'

const filtros: Filtro[] = ['Todas','Stories','Posts','Reels','Destaques']

export default function Painel() {
  const [midias, definirMidias] = useState<Midia[]>([])
  const [filtro, definirFiltro] = useState<Filtro>('Todas')
  const [modo, definirModo] = useState<'grade' | 'lista'>('grade')
  const [selecionadas, definirSelecionadas] = useState<string[]>([])
  const [tema, definirTema] = useState<Tema>('sistema')
  const [configuracoes, definirConfiguracoes] = useState(false)
  const [previa, definirPrevia] = useState<Midia | null>(null)
  const [aviso, definirAviso] = useState('')
  const [conectado, definirConectado] = useState(false)
  const [ocupado, definirOcupado] = useState(false)
  const [falhas, definirFalhas] = useState<string[]>([])
  const porta = useRef<chrome.runtime.Port | null>(null)
  const abaAtual = useRef<number | undefined>(undefined)
  const memorias = useRef(new Map<number, Midia[]>())
  const contextos = useRef(new Map<number, string>())
  const contextoAtual = useRef('')
  const [tituloContexto, definirTituloContexto] = useState('')
  const dialogo = useRef<HTMLDialogElement>(null)
  const downloadAtual = useRef<AbortController | null>(null)
  const janelaAtual = useRef<number | undefined>(undefined)

  useEffect(() => () => downloadAtual.current?.abort(), [])

  useEffect(() => {
    chrome.storage.local.get(['tema','modo']).then(dados => {
      if (['sistema','claro','escuro'].includes(dados.tema)) definirTema(dados.tema)
      if (['grade','lista'].includes(dados.modo)) definirModo(dados.modo)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.dataset.tema = tema
  }, [tema])

  useEffect(() => {
    let encerrado = false
    let sequencia = 0
    let prazo: ReturnType<typeof setTimeout> | undefined
    const conectar = async () => {
      const versao = ++sequencia
      try {
        if (janelaAtual.current === undefined) janelaAtual.current = (await chrome.windows.getCurrent()).id
        const [aba] = await chrome.tabs.query({ active: true, ...(janelaAtual.current === undefined ? { currentWindow: true } : { windowId: janelaAtual.current }) })
        if (encerrado || versao !== sequencia) return
        clearTimeout(prazo)
        if (abaAtual.current !== aba?.id) {
          abaAtual.current = aba?.id
          contextoAtual.current = ''
          definirTituloContexto('')
          downloadAtual.current?.abort()
          definirSelecionadas([])
          definirPrevia(null)
          definirFalhas([])
          definirMidias([])
        }
        const anterior = porta.current
        porta.current = null
        anterior?.disconnect()
        definirConectado(false)
        definirAviso('')
        if (aba?.id === undefined || !aba.url?.startsWith('https://www.instagram.com/')) return
        const id = aba.id
        const atual = chrome.tabs.connect(id, { name: 'ims-painel', frameId: 0 })
        porta.current = atual
        atual.onMessage.addListener(mensagem => {
          if (porta.current !== atual) return
          if (mensagem?.acao === 'pronto') {
            clearTimeout(prazo)
            definirConectado(true)
            definirAviso('')
            return
          }
          if (mensagem?.acao === 'contexto') {
            const contexto = mensagem.contexto
            if (typeof contexto?.chave !== 'string' || typeof contexto?.titulo !== 'string') return
            contextoAtual.current = contexto.chave
            definirTituloContexto(contexto.titulo.slice(0, 100))
            if (contextos.current.get(id) !== contexto.chave) {
              contextos.current.set(id, contexto.chave)
              memorias.current.delete(id)
              definirMidias([])
              definirSelecionadas([])
              definirFalhas([])
              definirPrevia(null)
              definirFiltro('Todas')
              definirAviso('')
              downloadAtual.current?.abort()
            } else definirMidias(memorias.current.get(id) || [])
            return
          }
          if (mensagem?.acao === 'limpo' && mensagem.contexto === contextoAtual.current) {
            memorias.current.delete(id)
            definirMidias([])
            definirSelecionadas([])
            definirFalhas([])
            definirPrevia(null)
            return
          }
          if (!Array.isArray(mensagem?.midias) || mensagem.contexto !== contextoAtual.current) return
          const novas = reunir(memorias.current.get(id) || [], mensagem.midias)
          memorias.current.set(id, novas)
          definirMidias(novas)
          definirSelecionadas(lista => lista.filter(chave => novas.some(item => item.id === chave)))
        })
        atual.onDisconnect.addListener(() => {
          const erro = chrome.runtime.lastError
          if (porta.current !== atual) return
          clearTimeout(prazo)
          porta.current = null
          definirConectado(false)
          if (erro) definirAviso('Atualize a página do Instagram para habilitar a captura.')
        })
        prazo = setTimeout(() => {
          if (porta.current !== atual) return
          porta.current = null
          atual.disconnect()
          definirConectado(false)
          definirAviso('Atualize a página do Instagram para habilitar a captura.')
        }, 4000)
      } catch {
        if (!encerrado) definirAviso('Não foi possível conectar à página. Atualize o Instagram.')
      }
    }
    const ativada = (info: chrome.tabs.TabActiveInfo) => { if (janelaAtual.current === undefined || info.windowId === janelaAtual.current) void conectar() }
    const atualizada = (id: number, alteracao: chrome.tabs.TabChangeInfo) => {
      if (id !== abaAtual.current) return
      if (alteracao.status === 'loading') {
        const anterior = porta.current
        porta.current = null
        anterior?.disconnect()
        clearTimeout(prazo)
        definirConectado(false)
        if (alteracao.url && !alteracao.url.startsWith('https://www.instagram.com/')) {
          memorias.current.delete(id)
          definirMidias([])
          definirSelecionadas([])
          definirPrevia(null)
          downloadAtual.current?.abort()
        }
      }
      if (alteracao.status === 'complete') void conectar()
    }
    const removida = (id: number) => { memorias.current.delete(id); contextos.current.delete(id) }
    chrome.tabs.onActivated.addListener(ativada)
    chrome.tabs.onUpdated.addListener(atualizada)
    chrome.tabs.onRemoved.addListener(removida)
    void conectar()
    return () => {
      encerrado = true
      clearTimeout(prazo)
      const anterior = porta.current
      porta.current = null
      anterior?.disconnect()
      chrome.tabs.onActivated.removeListener(ativada)
      chrome.tabs.onUpdated.removeListener(atualizada)
      chrome.tabs.onRemoved.removeListener(removida)
    }
  }, [])

  useEffect(() => {
    if (previa && !dialogo.current?.open) dialogo.current?.showModal()
    else if (!previa && dialogo.current?.open) dialogo.current.close()
  }, [previa])

  const visiveis = useMemo(() => midias.filter(midia => filtro === 'Todas' || midia.origem === filtro), [midias, filtro])
  const conjuntoSelecionadas = useMemo(() => new Set(selecionadas), [selecionadas])
  const escolhidas = useMemo(() => midias.filter(midia => conjuntoSelecionadas.has(midia.id)), [midias, conjuntoSelecionadas])

  function alternar(id: string) {
    definirSelecionadas(lista => lista.includes(id) ? lista.filter(item => item !== id) : [...lista, id])
  }

  function alterarModo(valor: 'grade' | 'lista') {
    definirModo(valor)
    void chrome.storage.local.set({ modo: valor }).catch(() => definirAviso('Não foi possível salvar a preferência.'))
  }

  function alterarTema(valor: Tema) {
    definirTema(valor)
    void chrome.storage.local.set({ tema: valor }).catch(() => definirAviso('Não foi possível salvar a preferência.'))
  }

  async function iniciarDownload(lista: Midia[]) {
    if (!lista.length || downloadAtual.current) return
    const controle = new AbortController()
    downloadAtual.current = controle
    definirOcupado(true)
    definirAviso('')
    try { await baixar(lista, definirAviso, controle.signal) }
    catch (erro) { definirAviso(controle.signal.aborted ? 'Download cancelado.' : erro instanceof Error ? erro.message : 'Não foi possível baixar as mídias.') }
    finally { downloadAtual.current = null; definirOcupado(false) }
  }

  function limparGaleria() {
    try { porta.current?.postMessage({ acao: 'limpar', contexto: contextoAtual.current, ids: midias.map(item => item.id) }) } catch {}
    if (abaAtual.current !== undefined) memorias.current.delete(abaAtual.current)
    definirMidias([])
    definirSelecionadas([])
    definirFalhas([])
    definirPrevia(null)
    definirAviso('Galeria limpa. Navegue ou atualize para capturar novamente.')
    definirConfiguracoes(false)
  }

  function atualizar() {
    if (!porta.current) { definirAviso('Abra ou atualize uma página do Instagram.'); return }
    try { porta.current.postMessage({ acao: 'atualizar' }); definirFalhas([]); definirAviso('Galeria atualizada.') }
    catch { definirAviso('Atualize a página do Instagram.') }
  }

  return <div className="painel">
    <header className="cabecalho">
      <div className="marca"><span className="marca-icone"><Images size={19}/></span><h1>Instagram Media Studio</h1></div>
      <button className="icone" aria-label="Configurações" aria-expanded={configuracoes} onClick={() => definirConfiguracoes(!configuracoes)}><Settings2 size={19}/></button>
    </header>
    {configuracoes && <section className="configuracoes" aria-label="Configurações">
      <div className="config-titulo"><strong>Aparência</strong><button className="icone" aria-label="Fechar configurações" onClick={() => definirConfiguracoes(false)}><X size={16}/></button></div>
      <div className="temas">{([{ valor: 'sistema', texto: 'Sistema', Icone: Monitor }, { valor: 'claro', texto: 'Claro', Icone: Sun }, { valor: 'escuro', texto: 'Escuro', Icone: Moon }] as const).map(({valor,texto,Icone}) => <button key={valor} aria-pressed={tema === valor} onClick={() => alterarTema(valor)}><Icone size={16}/>{texto}</button>)}</div>
      <button className="limpar-galeria" onClick={limparGaleria}><Trash2 size={16}/> Limpar galeria</button>
    </section>}
    <nav className="filtros" aria-label="Filtrar mídias">{filtros.map(item => <button key={item} aria-pressed={filtro === item} onClick={() => definirFiltro(item)}>{item}</button>)}</nav>
    <div className="barra"><div className="titulo-galeria"><h2>Galeria de mídias</h2>{tituloContexto && <small title={tituloContexto}>{tituloContexto}</small>}</div><div className="acoes">
      <button className="icone" title="Limpar galeria" aria-label="Limpar galeria" disabled={!midias.length} onClick={limparGaleria}><Trash2 size={17}/></button>
      <button className="icone" title="Atualizar galeria" aria-label="Atualizar galeria" onClick={atualizar}><RefreshCw size={17}/></button>
      <div className="modos"><button className="icone" aria-label="Visualização em grade" aria-pressed={modo === 'grade'} onClick={() => alterarModo('grade')}><LayoutGrid size={16}/></button><button className="icone" aria-label="Visualização em lista" aria-pressed={modo === 'lista'} onClick={() => alterarModo('lista')}><List size={18}/></button></div>
    </div></div>
    <main className="rolagem">
      {!visiveis.length ? <div className="vazio"><span><Images size={28}/></span><h3>{conectado ? 'Nenhuma mídia por aqui' : 'Abra o Instagram'}</h3><p>{conectado ? 'Navegue por publicações, Stories ou Reels para preencher sua galeria.' : 'Acesse o Instagram em uma aba para começar. Se já estiver aberto, atualize a página.'}</p></div> : <div className={'galeria ' + modo}>{visiveis.map(midia => {
        const marcada = conjuntoSelecionadas.has(midia.id)
        const video = midia.tipo === 'video'
        return <article className={'cartao ' + (marcada ? 'marcado' : '')} key={midia.id}>
          <div className="miniatura">
            <button className="selecionar-midia" aria-label={(marcada ? 'Desmarcar ' : 'Selecionar ') + (video ? 'vídeo' : 'imagem')} aria-pressed={marcada} onClick={() => alternar(midia.id)}>
              {falhas.includes(midia.id) || (video && !midia.miniatura) ? <span className="placeholder">{video ? <Video size={30}/> : <Image size={30}/>}</span> : <img loading="lazy" referrerPolicy="no-referrer" src={video ? midia.miniatura : midia.url} alt={video ? 'Miniatura do vídeo' : 'Imagem do Instagram'} onError={() => definirFalhas(lista => lista.includes(midia.id) ? lista : [...lista, midia.id])}/>}
              <span className="degrade"/>
              <span className="tipo">{video ? <Video size={14}/> : <Image size={14}/>}</span>
              <span className="check">{marcada && <Check size={14}/>}</span>
              {video && <span className="play"><Play size={18} fill="currentColor"/></span>}
            </button>
            <button className="expandir" aria-label="Pré-visualizar mídia" onClick={() => definirPrevia(midia)}><Expand size={14}/></button>
          </div>
          <div className="legenda"><div><strong>{midia.origem}</strong><small>{video ? 'Vídeo' : 'Imagem'}</small></div><button className="icone" aria-label="Baixar mídia" disabled={ocupado} onClick={() => void iniciarDownload([midia])}><Download size={15}/></button></div>
        </article>
      })}</div>}
    </main>
    <section className="controles">
      {aviso && <div className="aviso" role="status">{aviso}<button className="icone" aria-label="Dispensar mensagem" onClick={() => definirAviso('')}><X size={14}/></button></div>}
      <div className="selecao"><span>{escolhidas.length} {escolhidas.length === 1 ? 'selecionada' : 'selecionadas'}</span><div><button disabled={!escolhidas.length} onClick={() => definirSelecionadas([])}>Limpar seleção</button><button disabled={!visiveis.length} onClick={() => definirSelecionadas(lista => [...new Set([...lista, ...visiveis.map(item => item.id)])])}>Selecionar todas</button></div></div>
      {ocupado && <button className="cancelar" onClick={() => downloadAtual.current?.abort()}><X size={15}/> Cancelar download</button>}
      <button className="baixar" disabled={!escolhidas.length || ocupado} onClick={() => void iniciarDownload(escolhidas)}><Download size={18}/>{ocupado ? 'Preparando download…' : 'Baixar mídias selecionadas'}{!ocupado && escolhidas.length > 0 && <span>{escolhidas.length}</span>}</button>
    </section>
    <dialog ref={dialogo} aria-label="Pré-visualização da mídia" onCancel={() => definirPrevia(null)} onClick={evento => { if (evento.target === dialogo.current) definirPrevia(null) }}>
      {previa && <div className="previa"><div className="previa-cabecalho"><strong>{previa.origem} · {previa.tipo === 'video' ? 'Vídeo' : 'Imagem'}</strong><button className="icone" aria-label="Fechar visualização" onClick={() => definirPrevia(null)}><X size={21}/></button></div>{previa.tipo === 'video' ? <video key={previa.id} src={previa.url} poster={previa.miniatura || undefined} controls playsInline preload="metadata" onError={() => definirAviso('Vídeo indisponível. Abra a publicação novamente.')}/> : <img src={previa.url} alt="Pré-visualização da mídia" referrerPolicy="no-referrer" onError={() => definirAviso('Imagem indisponível. Abra a publicação novamente.')}/>}<button className="baixar" disabled={ocupado} onClick={() => void iniciarDownload([previa])}><Download size={17}/> Baixar mídia</button></div>}
    </dialog>
  </div>
}
