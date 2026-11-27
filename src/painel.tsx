import { useCallback, type PointerEvent as EventoPonteiro, useEffect, useMemo, useRef, useState } from 'react'
import { Images, Settings2, LayoutGrid, List, Download, Image, Video, Play, Check, RefreshCw, X, Expand, Trash2, Moon, Sun, Monitor, Camera, Clapperboard, Layers, CirclePlay, Bookmark, UserRound, MousePointer2, Info, CheckCheck, ArrowDownRight, Aperture, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react'
import type { Filtro, Midia, Tema, ModoDownload } from './tipos'
import { reunir, urlValida } from './midias'
import { baixar, planejarDownloads } from './downloads'

const filtros: Filtro[] = ['Todas','Reels','Posts','Stories','Destaques','Perfil']

const chaveImagem = (midia: Midia) => midia.id + '|' + (midia.tipo === 'video' ? midia.miniatura : midia.url)

const iconesFiltros = { Todas: LayoutGrid, Reels: Clapperboard, Posts: Images, Stories: CirclePlay, Destaques: Bookmark, Perfil: UserRound }

function EscolhaVideo({ valor, alterar, desabilitado }: { valor: ModoDownload; alterar: (valor: ModoDownload) => void; desabilitado: boolean }) {
  return <fieldset className="escolha-video"><legend>Ao baixar vídeos, incluir</legend><div>{([{ valor: 'video', texto: 'Vídeo', Icone: Video }, { valor: 'capa', texto: 'Capa', Icone: Image }, { valor: 'ambos', texto: 'Vídeo + capa', Icone: Layers }] as const).map(({ valor: opcao, texto, Icone }) => <button key={opcao} type="button" disabled={desabilitado} aria-pressed={valor === opcao} onClick={() => alterar(opcao)}><Icone size={13}/>{texto}</button>)}</div></fieldset>
}

export default function Painel() {
  const [midias, definirMidias] = useState<Midia[]>([])
  const [filtro, definirFiltro] = useState<Filtro>('Todas')
  const [modoDownload, definirModoDownload] = useState<ModoDownload>('video')
  const [modo, definirModo] = useState<'grade' | 'lista'>('grade')
  const [selecionadas, definirSelecionadas] = useState<string[]>([])
  const [tema, definirTema] = useState<Tema>('escuro')
  const [configuracoes, definirConfiguracoes] = useState(false)
  const [telaCheia, definirTelaCheia] = useState(false)
  const [previa, definirPrevia] = useState<Midia | null>(null)
  const [aviso, definirAviso] = useState('')
  const [conectado, definirConectado] = useState(false)
  const [ocupado, definirOcupado] = useState(false)
  const [falhas, definirFalhas] = useState<string[]>([])
  const recuperacoesPerfil = useRef(new Map<string, { instante: number; quantidade: number; url: string }>())
  const porta = useRef<chrome.runtime.Port | null>(null)
  const abaAtual = useRef<number | undefined>(undefined)
  const memorias = useRef(new Map<number, Midia[]>())
  const contextos = useRef(new Map<number, string>())
  const contextoAtual = useRef('')
  const [tituloContexto, definirTituloContexto] = useState('')
  const [videoSemUrl, definirVideoSemUrl] = useState(false)
  const dialogo = useRef<HTMLDialogElement>(null)
  const visualizador = useRef<HTMLDivElement>(null)
  const videoAmpliado = useRef<HTMLVideoElement>(null)
  const faixaMiniaturas = useRef<HTMLDivElement>(null)
  const gestoPrevia = useRef<{ x: number; y: number; ponteiro: number; inicio: number } | null>(null)
  const cliqueBloqueadoAte = useRef(0)
  const downloadAtual = useRef<AbortController | null>(null)
  const janelaAtual = useRef<number | undefined>(undefined)

  useEffect(() => () => downloadAtual.current?.abort(), [])

  useEffect(() => {
    chrome.storage.local.get(['temaEssencial','modo']).then(dados => {
      if (['sistema','claro','escuro'].includes(dados.temaEssencial)) definirTema(dados.temaEssencial)
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
          definirVideoSemUrl(false)
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
              definirVideoSemUrl(false)
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
          if (mensagem?.acao === 'video-sem-url' && mensagem.contexto === contextoAtual.current) {
            definirVideoSemUrl(true)
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

  const planoSelecionado = useMemo(() => planejarDownloads(escolhidas, modoDownload), [escolhidas, modoDownload])

  const fotoContexto = contextoAtual.current.startsWith('perfil:') ? midias.find(item => item.origem === 'Perfil') : undefined

  const indicePrevia = previa ? visiveis.findIndex(item => item.id === previa.id) : -1
  const navegarPrevia = useCallback((direcao: -1 | 1) => {
    videoAmpliado.current?.pause()
    definirPrevia(atual => {
      if (!atual) return atual
      const indice = visiveis.findIndex(item => item.id === atual.id)
      return indice < 0 ? atual : visiveis[indice + direcao] || atual
    })
  }, [visiveis])

  useEffect(() => {
    if (!previa) return
    const teclado = (evento: KeyboardEvent) => {
      if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) return
      const alvo = evento.target
      if (alvo instanceof Element && alvo.closest('video, input, textarea, select, [contenteditable="true"], [role="slider"]')) return
      if (evento.key === 'ArrowRight' || evento.key === 'ArrowLeft') {
        evento.preventDefault()
        navegarPrevia(evento.key === 'ArrowRight' ? 1 : -1)
      }
    }
    document.addEventListener('keydown', teclado)
    return () => document.removeEventListener('keydown', teclado)
  }, [!!previa, navegarPrevia])

  useEffect(() => {
    const sincronizar = () => definirTelaCheia(!!document.fullscreenElement && document.fullscreenElement === visualizador.current)
    document.addEventListener('fullscreenchange', sincronizar)
    return () => document.removeEventListener('fullscreenchange', sincronizar)
  }, [])

  useEffect(() => {
    gestoPrevia.current = null
    if (!previa) return
    const faixa = faixaMiniaturas.current
    const ativa = faixa?.querySelector<HTMLButtonElement>('[aria-current="true"]')
    if (faixa && ativa) faixa.scrollTo({ left: ativa.offsetLeft - faixa.clientWidth / 2 + ativa.clientWidth / 2, behavior: 'auto' })
  }, [previa?.id])

  function fecharPrevia() {
    videoAmpliado.current?.pause()
    const elemento = document.fullscreenElement
    if (elemento && visualizador.current?.contains(elemento)) void document.exitFullscreen().catch(() => {})
    definirPrevia(null)
  }

  async function alternarTelaCheia() {
    try {
      if (document.fullscreenElement === visualizador.current) await document.exitFullscreen()
      else await visualizador.current?.requestFullscreen()
    } catch { definirAviso('O navegador não permitiu a tela cheia. A navegação continua disponível na prévia.') }
  }

  function iniciarDeslize(evento: EventoPonteiro<HTMLDivElement>) {
    if (!evento.isPrimary || (evento.pointerType === 'mouse' && evento.button !== 0)) { gestoPrevia.current = null; return }
    const alvo = evento.target
    if (alvo instanceof Element && alvo.closest('button, input, [role="slider"]')) return
    if (alvo instanceof HTMLVideoElement && evento.clientY >= alvo.getBoundingClientRect().bottom - 54) return
    gestoPrevia.current = { x: evento.clientX, y: evento.clientY, ponteiro: evento.pointerId, inicio: performance.now() }
    evento.currentTarget.setPointerCapture(evento.pointerId)
  }

  function concluirDeslize(evento: EventoPonteiro<HTMLDivElement>) {
    const inicio = gestoPrevia.current
    gestoPrevia.current = null
    if (!inicio || inicio.ponteiro !== evento.pointerId) return
    const dx = evento.clientX - inicio.x
    const dy = evento.clientY - inicio.y
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6 || performance.now() - inicio.inicio > 1000) return
    cliqueBloqueadoAte.current = performance.now() + 350
    navegarPrevia(dx < 0 ? 1 : -1)
  }


  function alternar(id: string) {
    definirSelecionadas(lista => lista.includes(id) ? lista.filter(item => item !== id) : [...lista, id])
  }

  function alterarModo(valor: 'grade' | 'lista') {
    definirModo(valor)
    void chrome.storage.local.set({ modo: valor }).catch(() => definirAviso('Não foi possível salvar a preferência.'))
  }

  function alterarTema(valor: Tema) {
    definirTema(valor)
    void chrome.storage.local.set({ temaEssencial: valor }).catch(() => definirAviso('Não foi possível salvar a preferência.'))
  }

  async function iniciarDownload(lista: Midia[], opcao: ModoDownload = modoDownload) {
    if (!lista.length || downloadAtual.current) return
    const controle = new AbortController()
    downloadAtual.current = controle
    definirOcupado(true)
    definirAviso('')
    try { await baixar(lista, definirAviso, controle.signal, opcao) }
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

  function recuperarFotoPerfil(midia: Midia) {
    const contexto = contextoAtual.current
    if (!contexto.startsWith('perfil:') || !porta.current) return
    const agora = Date.now(), anterior = recuperacoesPerfil.current.get(contexto)
    if (anterior && anterior.url === midia.url && agora - anterior.instante < 15000) return
    const quantidade = anterior && agora - anterior.instante < 60000 ? anterior.quantidade + 1 : 1
    if (quantidade > 3) { definirAviso('A foto de perfil não carregou. Atualize a galeria para tentar novamente.'); return }
    recuperacoesPerfil.current.set(contexto, { instante: agora, quantidade, url: midia.url })
    while (recuperacoesPerfil.current.size > 100) recuperacoesPerfil.current.delete(recuperacoesPerfil.current.keys().next().value!)
    if (abaAtual.current !== undefined) memorias.current.set(abaAtual.current, (memorias.current.get(abaAtual.current) || []).filter(item => item.origem !== 'Perfil'))
    definirMidias(lista => lista.filter(item => item.origem !== 'Perfil'))
    definirPrevia(item => item?.origem === 'Perfil' ? null : item)
    try { porta.current.postMessage({ acao: 'atualizar-perfil', contexto, url: midia.url }) } catch { definirAviso('Atualize a aba do Instagram para recuperar a foto de perfil.') }
  }

  function falharImagem(midia: Midia) {
    const chave = chaveImagem(midia)
    definirFalhas(lista => lista.includes(chave) ? lista : [...lista.slice(-499), chave])
    if (midia.origem === 'Perfil') recuperarFotoPerfil(midia)
  }

  function atualizar() {
    if (!porta.current) { definirAviso('Abra ou atualize uma página do Instagram.'); return }
    try { recuperacoesPerfil.current.clear(); porta.current.postMessage({ acao: 'atualizar' }); definirFalhas([]); definirAviso('Galeria atualizada.') }
    catch { definirAviso('Atualize a página do Instagram.') }
  }

  return <div className="painel">
    <header className="cabecalho">
      <div className="marca"><span className="marca-icone"><Aperture size={25}/></span><h1>Media Studio</h1></div>
      <button className="icone" aria-label="Configurações" aria-expanded={configuracoes} title="Configurações" onClick={() => definirConfiguracoes(!configuracoes)}><Settings2 size={18}/></button>
    </header>
    {configuracoes && <section className="configuracoes" aria-label="Configurações">
      <div className="config-titulo"><div><span className="sobretitulo">DO SEU JEITO</span><strong>Aparência</strong></div><button className="icone" aria-label="Fechar configurações" onClick={() => definirConfiguracoes(false)}><X size={17}/></button></div>
      <div className="temas">{([{ valor: 'sistema', texto: 'Sistema', Icone: Monitor }, { valor: 'claro', texto: 'Claro', Icone: Sun }, { valor: 'escuro', texto: 'Escuro', Icone: Moon }] as const).map(({valor,texto,Icone}) => <button key={valor} aria-pressed={tema === valor} onClick={() => alterarTema(valor)}><Icone size={19}/>{texto}{tema === valor && <Check size={12} className="tema-check"/>}</button>)}</div>
      <button className="limpar-galeria" onClick={limparGaleria}><Trash2 size={15}/> Limpar galeria</button>
    </section>}
    <section className="perfil-atual" aria-label="Contexto de captura">
      <span className="perfil-avatar">{fotoContexto && !falhas.includes(chaveImagem(fotoContexto)) ? <img key={fotoContexto.url} src={fotoContexto.url} alt="" referrerPolicy="no-referrer" onError={() => falharImagem(fotoContexto)}/> : <UserRound size={19}/>}</span>
      <span className="perfil-nome" title={tituloContexto}>{tituloContexto || 'Abra o Instagram'}</span>
      <span className={'status-conexao ' + (conectado ? 'ativo' : '')} title={conectado ? 'Captura ativa nesta aba' : 'Aguardando uma aba do Instagram'}><i/><span>{conectado ? 'Conectado' : 'Aguardando'}</span></span>
      <button className="icone" title="Atualizar galeria" aria-label="Atualizar galeria" onClick={atualizar}><RefreshCw size={16}/></button>
    </section>
    <div className="biblioteca-cabecalho"><h2>Biblioteca</h2><div className="biblioteca-info"><span className="contador">{visiveis.length} {visiveis.length === 1 ? 'mídia' : 'mídias'}</span><div className="modos"><button className="icone" aria-label="Visualização em grade" aria-pressed={modo === 'grade'} title="Grade" onClick={() => alterarModo('grade')}><LayoutGrid size={14}/></button><button className="icone" aria-label="Visualização em lista" aria-pressed={modo === 'lista'} title="Lista" onClick={() => alterarModo('lista')}><List size={16}/></button></div></div></div>
    <nav className="filtros" aria-label="Filtrar mídias">{filtros.map(item => <button key={item} title={item} aria-pressed={filtro === item} onClick={() => definirFiltro(item)}><span>{item}</span></button>)}</nav>
    <main className="rolagem">
      {!visiveis.length ? <div className="vazio"><div className="vazio-ilustracao" aria-hidden="true"><span/><span/><span><Images size={30}/></span></div><h3>{conectado ? 'Tudo pronto para capturar' : 'Sua próxima coleção começa aqui'}</h3><p>{conectado ? 'Abra uma publicação, Story ou Reel. As mídias disponíveis aparecem aqui.' : 'Abra o Instagram em uma aba e navegue até as mídias que deseja salvar.'}</p><span className="vazio-dica"><MousePointer2 size={13}/>{conectado ? 'Selecione, escolha e baixe' : 'Conecte-se pela aba do Instagram'}</span></div> : <div className={'galeria ' + modo}>{visiveis.map((midia, indice) => {
        const marcada = conjuntoSelecionadas.has(midia.id)
        const video = midia.tipo === 'video'
        const temCapa = !!urlValida(midia.miniatura)
        const titulo = midia.origem === 'Perfil' ? 'Foto de perfil' : midia.origem === 'Reels' ? 'Reel' : midia.origem === 'Stories' ? 'Story' : midia.origem === 'Destaques' ? 'Destaque' : 'Publicação'
        const resolucao = midia.largura && midia.altura ? midia.largura + ' × ' + midia.altura : video ? 'Vídeo' : 'Imagem'
        return <article className={'cartao ' + (marcada ? 'marcado' : '')} data-origem={midia.origem} key={midia.id}>
          <div className="miniatura">
            <button className="selecionar-midia" aria-label={(marcada ? 'Desmarcar ' : 'Selecionar ') + (video ? 'vídeo' : 'imagem')} aria-pressed={marcada} onClick={() => alternar(midia.id)}>
              {falhas.includes(chaveImagem(midia)) || (video && !midia.miniatura) ? <span className="placeholder">{video ? <Video size={32}/> : <Image size={32}/>}</span> : <img key={chaveImagem(midia)} loading="lazy" referrerPolicy="no-referrer" src={video ? midia.miniatura : midia.url} alt={video ? 'Capa do vídeo' : midia.origem === 'Perfil' ? 'Foto de perfil' : 'Imagem do Instagram'} onError={() => falharImagem(midia)}/>}
              <span className="degrade"/>
              <span className="tipo">{video ? <Clapperboard size={11}/> : <Image size={11}/>}<span>{video ? 'VÍDEO' : midia.origem === 'Perfil' ? 'PERFIL' : 'IMAGEM'}</span></span>
              <span className="check">{marcada && <Check size={13}/>}</span>
              {video && <span className="play"><Play size={18} fill="currentColor"/></span>}
              <span className="indice-midia">{String(indice + 1).padStart(2, '0')}</span>
            </button>
            <button className="expandir" aria-label="Pré-visualizar mídia" title="Abrir prévia" onClick={() => definirPrevia(midia)}><Expand size={13}/></button>
          </div>
          <div className="legenda"><div><strong>{titulo}</strong><small>{resolucao}</small></div>{video ? <details className="download-card" name="downloads-video" onBlur={evento => { if (!evento.currentTarget.contains(evento.relatedTarget)) evento.currentTarget.open = false }}>
            <summary aria-label="Opções de download do vídeo" title="Baixar vídeo ou capa"><Download size={14}/><ChevronDown size={10}/></summary>
            <div className="reel-downloads" aria-label="Downloads do vídeo">
              <button disabled={ocupado} aria-label="Baixar só o vídeo" onClick={evento => { evento.currentTarget.closest('details')?.removeAttribute('open'); void iniciarDownload([midia], 'video') }}><Video size={14}/><span>Somente vídeo</span></button>
              <button disabled={ocupado || !temCapa} title={temCapa ? 'Baixar só a capa' : 'Capa não disponível neste vídeo'} aria-label="Baixar só a capa" onClick={evento => { evento.currentTarget.closest('details')?.removeAttribute('open'); void iniciarDownload([midia], 'capa') }}><Image size={14}/><span>Somente capa</span></button>
              <button disabled={ocupado || !temCapa} title={temCapa ? 'Vídeo e capa em ZIP' : 'Capa não disponível neste vídeo'} aria-label="Baixar vídeo e capa" onClick={evento => { evento.currentTarget.closest('details')?.removeAttribute('open'); void iniciarDownload([midia], 'ambos') }}><Layers size={14}/><span>Vídeo + capa</span><small>ZIP</small></button>
            </div>
          </details> : <button className="icone baixar-individual" title="Baixar imagem" aria-label="Baixar imagem" disabled={ocupado} onClick={() => void iniciarDownload([midia])}><Download size={15}/></button>}</div>
        </article>
      })}</div>}
    </main>
    <section className="controles" aria-label="Seleção e download">
      {videoSemUrl && !midias.some(item => item.tipo === 'video') && !aviso && <div className="aviso" role="status">O vídeo ainda não disponibilizou um arquivo completo. Atualize a galeria após reproduzi-lo.</div>}
      {aviso && <div className="aviso" role="status"><Info size={14}/><span>{aviso}</span><button className="icone" aria-label="Dispensar mensagem" onClick={() => definirAviso('')}><X size={14}/></button></div>}
      <div className="selecao"><span><span className="selecao-numero">{escolhidas.length}</span>{escolhidas.length === 1 ? 'selecionada' : 'selecionadas'}</span><div><button disabled={!escolhidas.length} onClick={() => definirSelecionadas([])}>Limpar</button><button disabled={!visiveis.length} onClick={() => definirSelecionadas(lista => [...new Set([...lista, ...visiveis.filter(item => filtro === 'Perfil' || item.origem !== 'Perfil').map(item => item.id)])])}><CheckCheck size={13}/>Selecionar todas</button></div></div>
      {midias.some(item => item.tipo === 'video') && <EscolhaVideo valor={modoDownload} alterar={definirModoDownload} desabilitado={ocupado}/>}
      {ocupado && <button className="cancelar" onClick={() => downloadAtual.current?.abort()}><X size={14}/> Cancelar download</button>}
      {escolhidas.length > 0 && !planoSelecionado.arquivos.length && <p className="capa-indisponivel">Os vídeos selecionados ainda não têm capa disponível.</p>}
      <button className="baixar" disabled={!planoSelecionado.arquivos.length || ocupado} onClick={() => void iniciarDownload(escolhidas)}><Download size={18}/><span>{ocupado ? 'Preparando arquivos…' : escolhidas.length ? 'Baixar seleção' : 'Selecione suas mídias'}</span>{!ocupado && planoSelecionado.arquivos.length > 0 && <small>{planoSelecionado.arquivos.length > 1 ? 'ZIP' : 'ARQUIVO'}<ArrowDownRight size={13}/></small>}</button>
    </section>
    <dialog ref={dialogo} aria-label="Pré-visualização da mídia" onCancel={fecharPrevia} onClick={evento => { if (evento.target === dialogo.current) fecharPrevia() }}>
      {previa && <div className="previa" ref={visualizador}>
        <div className="previa-cabecalho"><div><span className="sobretitulo">PRÉ-VISUALIZAÇÃO</span><strong>{previa.origem === 'Perfil' ? 'Foto de perfil' : previa.origem}</strong></div><div className="previa-acoes"><span className="previa-contador" aria-live="polite" aria-atomic="true">{indicePrevia + 1} / {visiveis.length}</span><button className="icone" aria-label={telaCheia ? 'Sair da tela cheia' : 'Entrar em tela cheia'} title={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'} onClick={() => void alternarTelaCheia()}>{telaCheia ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</button><button className="icone" aria-label="Fechar visualização" onClick={fecharPrevia}><X size={20}/></button></div></div>
        <div className="previa-palco" onPointerDown={iniciarDeslize} onPointerUp={concluirDeslize} onPointerCancel={() => { gestoPrevia.current = null }} onClickCapture={evento => { if (performance.now() < cliqueBloqueadoAte.current) { evento.preventDefault(); evento.stopPropagation() } }}>
          {previa.tipo === 'video' ? <video ref={videoAmpliado} key={previa.id} src={previa.url} poster={previa.miniatura || undefined} controls controlsList="nofullscreen" playsInline preload="metadata" onError={() => definirAviso('Vídeo indisponível. Abra a publicação novamente.')}/> : <img draggable={false} src={previa.url} alt="Pré-visualização da mídia" referrerPolicy="no-referrer" onError={() => { if (previa.origem === 'Perfil') falharImagem(previa); else definirAviso('Imagem indisponível. Abra a publicação novamente.') }}/>}
          <button className="previa-seta anterior" aria-label="Mídia anterior" disabled={indicePrevia <= 0} onClick={() => navegarPrevia(-1)}><ChevronLeft size={22}/></button>
          <button className="previa-seta proxima" aria-label="Próxima mídia" disabled={indicePrevia < 0 || indicePrevia >= visiveis.length - 1} onClick={() => navegarPrevia(1)}><ChevronRight size={22}/></button>
        </div>
        <div className="previa-faixa" ref={faixaMiniaturas} aria-label="Escolher mídia">{visiveis.map((item, indice) => <button key={item.id} aria-label={'Ver mídia ' + (indice + 1)} aria-current={item.id === previa.id ? 'true' : undefined} onClick={() => { videoAmpliado.current?.pause(); definirPrevia(item) }}>{item.tipo === 'video' && !item.miniatura ? <Video size={18}/> : <img loading="lazy" src={item.tipo === 'video' ? item.miniatura : item.url} alt="" referrerPolicy="no-referrer"/>}{item.tipo === 'video' && <span><Play size={9} fill="currentColor"/></span>}</button>)}</div>
        {previa.tipo === 'video' && <EscolhaVideo valor={modoDownload} alterar={definirModoDownload} desabilitado={ocupado}/>}
        <button className="baixar" disabled={ocupado || (previa.tipo === 'video' && modoDownload !== 'video' && !urlValida(previa.miniatura))} onClick={() => void iniciarDownload([previa])}><Download size={17}/><span>{previa.tipo !== 'video' ? 'Baixar imagem' : modoDownload === 'capa' ? 'Baixar capa' : modoDownload === 'ambos' ? 'Baixar vídeo + capa' : 'Baixar vídeo'}</span></button>
      </div>}
    </dialog>
  </div>
}
