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
  const dialogo = useRef<HTMLDialogElement>(null)

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
    let janela: number | undefined
    const conectar = async () => {
      const versao = ++sequencia
      try {
        const [aba] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (encerrado || versao !== sequencia) return
        janela = aba?.windowId
        if (abaAtual.current !== aba?.id) {
          abaAtual.current = aba?.id
          definirSelecionadas([])
          definirPrevia(null)
          definirFalhas([])
          definirMidias(aba?.id === undefined ? [] : memorias.current.get(aba.id) || [])
        }
        const anterior = porta.current
        porta.current = null
        anterior?.disconnect()
        definirConectado(false)
        if (aba?.id === undefined || !aba.url?.startsWith('https://www.instagram.com/')) return
        const id = aba.id
        const atual = chrome.tabs.connect(id, { name: 'ims-painel', frameId: 0 })
        porta.current = atual
        atual.onMessage.addListener(mensagem => {
          if (porta.current !== atual || !Array.isArray(mensagem?.midias)) return
          const novas = reunir(memorias.current.get(id) || [], mensagem.midias)
          memorias.current.set(id, novas)
          definirMidias(novas)
        })
        atual.onDisconnect.addListener(() => {
          const erro = chrome.runtime.lastError
          if (porta.current !== atual) return
          porta.current = null
          definirConectado(false)
          if (erro) definirAviso('Atualize a página do Instagram para habilitar a captura.')
        })
        definirConectado(true)
        definirAviso('')
        atual.postMessage({ acao: 'atualizar' })
      } catch {
        if (!encerrado) definirAviso('Não foi possível conectar à página. Atualize o Instagram.')
      }
    }
    const ativada = (info: chrome.tabs.TabActiveInfo) => { if (janela === undefined || info.windowId === janela) void conectar() }
    const atualizada = (id: number, alteracao: chrome.tabs.TabChangeInfo) => {
      if (id === abaAtual.current && alteracao.status === 'complete') void conectar()
    }
    const removida = (id: number) => { memorias.current.delete(id) }
    chrome.tabs.onActivated.addListener(ativada)
    chrome.tabs.onUpdated.addListener(atualizada)
    chrome.tabs.onRemoved.addListener(removida)
    void conectar()
    return () => {
      encerrado = true
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
  const escolhidas = midias.filter(midia => selecionadas.includes(midia.id))

  function alternar(id: string) {
    definirSelecionadas(lista => lista.includes(id) ? lista.filter(item => item !== id) : [...lista, id])
  }

  function alterarModo(valor: 'grade' | 'lista') {
    definirModo(valor)
    void chrome.storage.local.set({ modo: valor })
  }

  function alterarTema(valor: Tema) {
    definirTema(valor)
    void chrome.storage.local.set({ tema: valor })
  }

  async function iniciarDownload(lista: Midia[]) {
    if (!lista.length || ocupado) return
    definirOcupado(true)
    definirAviso('')
    try { await baixar(lista, definirAviso) }
    catch (erro) { definirAviso(erro instanceof Error ? erro.message : 'Não foi possível baixar as mídias.') }
    finally { definirOcupado(false) }
  }

  function limparGaleria() {
    if (abaAtual.current !== undefined) memorias.current.delete(abaAtual.current)
    definirMidias([])
    definirSelecionadas([])
    definirFalhas([])
    definirPrevia(null)
    definirAviso('Galeria limpa.')
    definirConfiguracoes(false)
  }

  function atualizar() {
    if (!porta.current) { definirAviso('Abra ou atualize uma página do Instagram.'); return }
    try { porta.current.postMessage({ acao: 'atualizar' }); definirAviso('Galeria atualizada.') }
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
    <div className="barra"><h2>Galeria de mídias</h2><div className="acoes">
      <button className="icone" title="Atualizar galeria" aria-label="Atualizar galeria" onClick={atualizar}><RefreshCw size={17}/></button>
      <div className="modos"><button className="icone" aria-label="Visualização em grade" aria-pressed={modo === 'grade'} onClick={() => alterarModo('grade')}><LayoutGrid size={16}/></button><button className="icone" aria-label="Visualização em lista" aria-pressed={modo === 'lista'} onClick={() => alterarModo('lista')}><List size={18}/></button></div>
    </div></div>
    <main className="rolagem">
      {!visiveis.length ? <div className="vazio"><span><Images size={28}/></span><h3>{conectado ? 'Nenhuma mídia por aqui' : 'Abra o Instagram'}</h3><p>{conectado ? 'Navegue por publicações, Stories ou Reels para preencher sua galeria.' : 'Acesse o Instagram em uma aba para começar. Se já estiver aberto, atualize a página.'}</p></div> : <div className={'galeria ' + modo}>{visiveis.map(midia => {
        const marcada = selecionadas.includes(midia.id)
        const video = midia.tipo === 'video'
        return <article className={'cartao ' + (marcada ? 'marcado' : '')} key={midia.id}>
          <div className="miniatura">
            <button className="selecionar-midia" aria-label={(marcada ? 'Desmarcar ' : 'Selecionar ') + (video ? 'vídeo' : 'imagem')} aria-pressed={marcada} onClick={() => alternar(midia.id)}>
              {falhas.includes(midia.id) || (video && !midia.miniatura) ? <span className="placeholder">{video ? <Video size={30}/> : <Image size={30}/>}</span> : <img loading="lazy" referrerPolicy="no-referrer" src={video ? midia.miniatura : midia.url} alt={video ? 'Miniatura do vídeo' : 'Imagem do Instagram'} onError={() => definirFalhas(lista => [...lista, midia.id])}/>}
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
      <div className="selecao"><span>{escolhidas.length} {escolhidas.length === 1 ? 'selecionada' : 'selecionadas'}</span><div><button disabled={!escolhidas.length} onClick={() => definirSelecionadas([])}>Limpar</button><button disabled={!visiveis.length} onClick={() => definirSelecionadas(lista => [...new Set([...lista, ...visiveis.map(item => item.id)])])}>Selecionar todas</button></div></div>
      <button className="baixar" disabled={!escolhidas.length || ocupado} onClick={() => void iniciarDownload(escolhidas)}><Download size={18}/>{ocupado ? 'Preparando download…' : 'Baixar mídias selecionadas'}{!ocupado && escolhidas.length > 0 && <span>{escolhidas.length}</span>}</button>
    </section>
    <dialog ref={dialogo} onCancel={() => definirPrevia(null)} onClick={evento => { if (evento.target === dialogo.current) definirPrevia(null) }}>
      {previa && <div className="previa"><div className="previa-cabecalho"><strong>{previa.origem} · {previa.tipo === 'video' ? 'Vídeo' : 'Imagem'}</strong><button className="icone" aria-label="Fechar visualização" onClick={() => definirPrevia(null)}><X size={21}/></button></div>{previa.tipo === 'video' ? <video key={previa.id} src={previa.url} poster={previa.miniatura || undefined} controls playsInline/> : <img src={previa.url} alt="Pré-visualização da mídia" referrerPolicy="no-referrer"/>}<button className="baixar" disabled={ocupado} onClick={() => void iniciarDownload([previa])}><Download size={17}/> Baixar mídia</button></div>}
    </dialog>
  </div>
}
