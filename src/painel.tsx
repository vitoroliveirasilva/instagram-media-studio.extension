import { useEffect, useMemo, useRef, useState } from 'react'
import { Images, Settings2, LayoutGrid, List, Download, Image, Video, Play, Check, RefreshCw, X, Expand, Trash2, Moon, Sun, Monitor, Camera, Clapperboard, Layers, CirclePlay, Bookmark, UserRound, MousePointer2, Info, CheckCheck, ArrowDownRight } from 'lucide-react'
import type { Filtro, Midia, Tema, ModoDownload } from './tipos'
import { reunir, urlValida } from './midias'
import { baixar, planejarDownloads } from './downloads'

const filtros: Filtro[] = ['Todas','Reels','Posts','Stories','Destaques','Perfil']

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
  const [videoSemUrl, definirVideoSemUrl] = useState(false)
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

  function atualizar() {
    if (!porta.current) { definirAviso('Abra ou atualize uma página do Instagram.'); return }
    try { porta.current.postMessage({ acao: 'atualizar' }); definirFalhas([]); definirAviso('Galeria atualizada.') }
    catch { definirAviso('Atualize a página do Instagram.') }
  }

  return <div className="painel">
    <header className="cabecalho">
      <div className="marca"><span className="marca-icone"><Camera size={23}/></span><div className="marca-texto"><span className="assinatura">INSTAGRAM</span><h1>Media Studio<span className="marca-ponto">.</span></h1></div></div>
      <div className="cabecalho-acoes">
        <button className="icone" aria-label={tema === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro'} title="Alternar tema" onClick={() => alterarTema(tema === 'escuro' ? 'claro' : 'escuro')}>{tema === 'escuro' ? <Sun size={18}/> : <Moon size={18}/>}</button>
        <button className="icone" aria-label="Configurações" aria-expanded={configuracoes} onClick={() => definirConfiguracoes(!configuracoes)}><Settings2 size={18}/></button>
      </div>
    </header>
    {configuracoes && <section className="configuracoes" aria-label="Configurações">
      <div className="config-titulo"><div><span className="sobretitulo">DO SEU JEITO</span><strong>Aparência</strong></div><button className="icone" aria-label="Fechar configurações" onClick={() => definirConfiguracoes(false)}><X size={17}/></button></div>
      <div className="temas">{([{ valor: 'sistema', texto: 'Sistema', Icone: Monitor, Camera, Clapperboard, Layers, CirclePlay, Bookmark, UserRound, MousePointer2, Info, CheckCheck, ArrowDownRight }, { valor: 'claro', texto: 'Claro', Icone: Sun }, { valor: 'escuro', texto: 'Escuro', Icone: Moon }] as const).map(({valor,texto,Icone}) => <button key={valor} aria-pressed={tema === valor} onClick={() => alterarTema(valor)}><Icone size={19}/>{texto}{tema === valor && <Check size={12} className="tema-check"/>}</button>)}</div>
      <button className="limpar-galeria" onClick={limparGaleria}><Trash2 size={15}/> Limpar galeria</button>
    </section>}
    <section className="colecao" aria-label="Resumo da biblioteca">
      <div className="colecao-topo"><span className="sobretitulo">SUA BIBLIOTECA</span><span className={'status-conexao ' + (conectado ? 'ativo' : '')}><i/>{conectado ? 'Captura ativa' : 'Desconectado'}</span></div>
      <div className="colecao-titulo"><h2>Suas mídias,<br/><span>em um só lugar</span></h2><span className="colecao-simbolo" aria-hidden="true"><Images size={34}/></span></div>
      <div className="colecao-contexto"><span>{tituloContexto || 'Abra o Instagram para começar'}</span><span className="colecao-total">{midias.length} {midias.length === 1 ? 'item' : 'itens'}</span></div>
    </section>
    <nav className="filtros" aria-label="Filtrar mídias">{filtros.map(item => {
      const Icone = iconesFiltros[item]
      const total = item === 'Todas' ? midias.length : midias.filter(midia => midia.origem === item).length
      return <button key={item} aria-pressed={filtro === item} onClick={() => definirFiltro(item)}><Icone size={14}/><span>{item}</span>{total > 0 && <small>{total}</small>}</button>
    })}</nav>
    <div className="barra">
      <div className="titulo-galeria"><h3>{filtro === 'Todas' ? 'Todos os arquivos' : filtro}<span className="contador">{visiveis.length}</span></h3></div>
      <div className="acoes">
        <button className="icone" title="Atualizar galeria" aria-label="Atualizar galeria" onClick={atualizar}><RefreshCw size={16}/></button>
        <button className="icone" title="Limpar galeria" aria-label="Limpar galeria" disabled={!midias.length} onClick={limparGaleria}><Trash2 size={16}/></button>
        <div className="modos"><button className="icone" aria-label="Visualização em grade" aria-pressed={modo === 'grade'} onClick={() => alterarModo('grade')}><LayoutGrid size={15}/></button><button className="icone" aria-label="Visualização em lista" aria-pressed={modo === 'lista'} onClick={() => alterarModo('lista')}><List size={17}/></button></div>
      </div>
    </div>
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
              {falhas.includes(midia.id) || (video && !midia.miniatura) ? <span className="placeholder">{video ? <Video size={32}/> : <Image size={32}/>}</span> : <img loading="lazy" referrerPolicy="no-referrer" src={video ? midia.miniatura : midia.url} alt={video ? 'Capa do vídeo' : midia.origem === 'Perfil' ? 'Foto de perfil' : 'Imagem do Instagram'} onError={() => definirFalhas(lista => lista.includes(midia.id) ? lista : [...lista, midia.id])}/>}
              <span className="degrade"/>
              <span className="tipo">{video ? <Clapperboard size={11}/> : <Image size={11}/>}<span>{video ? 'VÍDEO' : midia.origem === 'Perfil' ? 'PERFIL' : 'IMAGEM'}</span></span>
              <span className="check">{marcada && <Check size={13}/>}</span>
              {video && <span className="play"><Play size={18} fill="currentColor"/></span>}
              <span className="indice-midia">{String(indice + 1).padStart(2, '0')}</span>
            </button>
            <button className="expandir" aria-label="Pré-visualizar mídia" title="Abrir prévia" onClick={() => definirPrevia(midia)}><Expand size={13}/></button>
          </div>
          <div className="legenda"><div><strong>{titulo}</strong><small>{resolucao}</small></div>{!video && <button className="icone baixar-individual" title="Baixar imagem" aria-label="Baixar imagem" disabled={ocupado} onClick={() => void iniciarDownload([midia])}><Download size={16}/></button>}</div>
          {video && <div className="reel-downloads" aria-label="Downloads do vídeo">
            <button disabled={ocupado} title="Baixar só o vídeo" aria-label="Baixar só o vídeo" onClick={() => void iniciarDownload([midia], 'video')}><Video size={14}/><span>Vídeo</span></button>
            <button disabled={ocupado || !temCapa} title={temCapa ? 'Baixar só a capa' : 'Capa não disponível neste vídeo'} aria-label="Baixar só a capa" onClick={() => void iniciarDownload([midia], 'capa')}><Image size={14}/><span>Capa</span></button>
            <button disabled={ocupado || !temCapa} title={temCapa ? 'Baixar vídeo e capa juntos em ZIP' : 'Capa não disponível neste vídeo'} aria-label="Baixar vídeo e capa" onClick={() => void iniciarDownload([midia], 'ambos')}><Layers size={14}/><span>Ambos</span></button>
          </div>}
        </article>
      })}</div>}
    </main>
    <section className="controles" aria-label="Seleção e download">
      {videoSemUrl && !midias.some(item => item.tipo === 'video') && !aviso && <div className="aviso" role="status">O vídeo ainda não disponibilizou um arquivo completo. Atualize a galeria após reproduzi-lo.</div>}
      {aviso && <div className="aviso" role="status"><Info size={14}/><span>{aviso}</span><button className="icone" aria-label="Dispensar mensagem" onClick={() => definirAviso('')}><X size={14}/></button></div>}
      {midias.some(item => item.tipo === 'video') && <EscolhaVideo valor={modoDownload} alterar={definirModoDownload} desabilitado={ocupado}/>}
      <div className="selecao"><span><span className="selecao-numero">{escolhidas.length}</span>{escolhidas.length === 1 ? 'selecionada' : 'selecionadas'}</span><div><button disabled={!escolhidas.length} onClick={() => definirSelecionadas([])}>Limpar</button><button disabled={!visiveis.length} onClick={() => definirSelecionadas(lista => [...new Set([...lista, ...visiveis.filter(item => filtro === 'Perfil' || item.origem !== 'Perfil').map(item => item.id)])])}><CheckCheck size={13}/>Selecionar todas</button></div></div>
      {ocupado && <button className="cancelar" onClick={() => downloadAtual.current?.abort()}><X size={14}/> Cancelar download</button>}
      {escolhidas.length > 0 && !planoSelecionado.arquivos.length && <p className="capa-indisponivel">Os vídeos selecionados ainda não têm capa disponível.</p>}
      <button className="baixar" disabled={!planoSelecionado.arquivos.length || ocupado} onClick={() => void iniciarDownload(escolhidas)}><Download size={18}/><span>{ocupado ? 'Preparando arquivos…' : escolhidas.length ? 'Baixar seleção' : 'Selecione suas mídias'}</span>{!ocupado && planoSelecionado.arquivos.length > 0 && <small>{planoSelecionado.arquivos.length > 1 ? 'ZIP' : 'ARQUIVO'}<ArrowDownRight size={13}/></small>}</button>
    </section>
    <dialog ref={dialogo} aria-label="Pré-visualização da mídia" onCancel={() => definirPrevia(null)} onClick={evento => { if (evento.target === dialogo.current) definirPrevia(null) }}>
      {previa && <div className="previa">
        <div className="previa-cabecalho"><div><span className="sobretitulo">PRÉ-VISUALIZAÇÃO</span><strong>{previa.origem === 'Perfil' ? 'Foto de perfil' : previa.origem}</strong></div><button className="icone" aria-label="Fechar visualização" onClick={() => definirPrevia(null)}><X size={20}/></button></div>
        {previa.tipo === 'video' ? <video key={previa.id} src={previa.url} poster={previa.miniatura || undefined} controls playsInline preload="metadata" onError={() => definirAviso('Vídeo indisponível. Abra a publicação novamente.')}/> : <img src={previa.url} alt="Pré-visualização da mídia" referrerPolicy="no-referrer" onError={() => definirAviso('Imagem indisponível. Abra a publicação novamente.')}/>}
        {previa.tipo === 'video' && <EscolhaVideo valor={modoDownload} alterar={definirModoDownload} desabilitado={ocupado}/>}
        <button className="baixar" disabled={ocupado || (previa.tipo === 'video' && modoDownload !== 'video' && !urlValida(previa.miniatura))} onClick={() => void iniciarDownload([previa])}><Download size={17}/><span>{previa.tipo !== 'video' ? 'Baixar imagem' : modoDownload === 'capa' ? 'Baixar capa' : modoDownload === 'ambos' ? 'Baixar vídeo + capa' : 'Baixar vídeo'}</span></button>
      </div>}
    </dialog>
  </div>
}
