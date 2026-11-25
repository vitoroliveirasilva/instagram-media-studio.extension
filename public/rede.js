(() => {
  let ativo = false
  let geracao = 0
  const eventoControle = 'ims-controle-captura'
  const eventoMidias = 'ims-midias-carregadas'
  const identificar = globalThis.IMSContexto.identificar
  let dadosLidos = new WeakMap()
  let diagnostico = { contexto: '', respostas: 0, objetos: 0, candidatosVideo: 0, videosContexto: 0, manifestos: 0, urlsSegmentadas: 0, fotosPerfil: 0, fotosHd: 0, videosEmitidos: 0 }

  function obterDiagnostico() {
    const contexto = identificar(location.href).chave
    if (diagnostico.contexto !== contexto) diagnostico = { contexto, respostas: 0, objetos: 0, candidatosVideo: 0, videosContexto: 0, manifestos: 0, urlsSegmentadas: 0, fotosPerfil: 0, fotosHd: 0, videosEmitidos: 0 }
    return diagnostico
  }

  document.addEventListener(eventoControle, evento => {
    ativo = evento.detail === true
    geracao += 1
  })

  document.addEventListener('ims-reler-dados', () => {
    if (ativo) lerDadosPagina()
  })

  document.addEventListener('ims-diagnostico-rede', () => {
    if (!ativo) return
    const { contexto, ...contagens } = obterDiagnostico()
    document.dispatchEvent(new CustomEvent('ims-diagnostico-resposta', { detail: JSON.stringify(contagens) }))
  })

  function urlValida(valor) {
    try {
      const url = new URL(valor)
      return url.protocol === 'https:' && !url.username && !url.password && !url.port && (/(^|\.)cdninstagram\.com$/.test(url.hostname) || /(^|\.)fbcdn\.net$/.test(url.hostname))
    } catch {
      return false
    }
  }

  function rotaValida(valor) {
    try {
      const url = new URL(valor, location.href)
      return url.origin === location.origin && /^\/(graphql\/query|api\/graphql|api\/v1\/(feed|clips|media|stories|highlights|users\/(web_profile_info|\d+\/info)))(\/|$)/.test(url.pathname)
    } catch {
      return false
    }
  }

  function melhor(lista) {
    if (!Array.isArray(lista)) return null
    return lista.filter(item => item && urlValida(item.url)).sort((a, b) => (Number(b.width) || 0) * (Number(b.height) || 0) - (Number(a.width) || 0) * (Number(a.height) || 0))[0] || null
  }

  function candidatos(lista, tipo) {
    if (!Array.isArray(lista)) return []
    return lista.flatMap(item => {
      const url = typeof item === 'string' ? item : item?.url || item?.src || item?.uri
      if (!urlValida(url)) return []
      if (tipo === 'video') {
        const endereco = new URL(url)
        if (/\.(m3u8|mpd|m4s|ts)$/i.test(endereco.pathname) || endereco.searchParams.has('bytestart') || endereco.searchParams.has('byteend')) return []
      }
      return [{ url, width: Number(item?.width || item?.config_width) || 0, height: Number(item?.height || item?.config_height) || 0 }]
    })
  }

  function formatos(item) {
    const width = item.original_width || item.dimensions?.width || item.width
    const height = item.original_height || item.dimensions?.height || item.height
    const imagem = melhor([
      ...candidatos(item.image_versions2?.candidates, 'imagem'),
      ...candidatos(item.display_resources, 'imagem'),
      ...candidatos(item.thumbnail_resources, 'imagem'),
      ...candidatos([{ url: item.display_url, width, height }, { url: item.thumbnail_src }, { url: item.thumbnail_url }], 'imagem')
    ])
    const video = melhor([
      ...candidatos(item.video_versions, 'video'),
      ...candidatos(item.video_resources, 'video'),
      ...candidatos(item.video?.video_versions, 'video'),
      ...candidatos(item.video?.video_resources, 'video'),
      ...candidatos(item.video_info?.video_versions, 'video'),
      ...candidatos(item.playback_video?.video_versions, 'video'),
      ...candidatos(item.video_delivery_response?.video_versions, 'video'),
      ...candidatos([{ url: item.video_url, width, height }, { url: item.playback_url, width, height }, { url: item.video?.url, width, height }, { url: item.video?.video_url, width, height }, { url: item.video_info?.video_url, width, height }, { url: item.playback_video?.url, width, height }, { url: item.video_delivery_response?.progressive_url, width, height }], 'video')
    ])
    return { imagem, video }
  }

  function fotoPerfil(item) {
    const hd = candidatos([
      ...(Array.isArray(item.hd_profile_pic_versions) ? item.hd_profile_pic_versions : []),
      item.hd_profile_pic_url_info,
      { url: item.profile_pic_url_hd },
      { url: item.hd_profile_pic_url }, { url: item.profile_pic_url_hd?.uri }, item.hd_profile_picture
    ], 'imagem')
    const comum = candidatos([{ url: item.profile_pic_url }, { url: item.profile_picture_url }, { url: item.profile_picture?.uri || item.profile_picture?.url, width: item.profile_picture?.width, height: item.profile_picture?.height }, item.profile_pic_url_info], 'imagem')
    const melhorHd = melhor(hd)
    if (melhorHd) return { ...melhorHd, qualidadePerfil: 2 }
    const melhorComum = melhor(comum)
    return melhorComum ? { ...melhorComum, qualidadePerfil: 1 } : null
  }

  function lerDadosPagina() {
    const pagina = location.href
    const contexto = identificar(pagina)
    if (!['perfil','stories','destaque','publicacao'].includes(contexto.tipo)) return
    let bytes = 0
    const scripts = document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]')
    for (const script of scripts) {
      const texto = script.textContent || ''
      if (!texto || texto.length > 5000000 || bytes + texto.length > 12000000) continue
      const chave = contexto.chave + ':' + geracao + ':' + texto.length
      if (dadosLidos.get(script) === chave) continue
      dadosLidos.set(script, chave)
      bytes += texto.length
      if (!/profile_pic|profile_picture|video_url|video_versions|video_resources|image_versions|display_url|display_resources/.test(texto)) continue
      try { extrair(JSON.parse(texto), pagina) } catch {}
    }
  }

  function extrair(dados, pagina) {
    const contexto = identificar(pagina)
    const diag = obterDiagnostico()
    diag.respostas++
    const visitados = new WeakSet()
    const caminho = new URL(pagina).pathname
    const idStory = caminho.split('/').filter(Boolean)[2]
    const pilha = [{ item: dados, usuario: '', publicacao: '', destaque: '', historia: false }]
    let lote = []
    let melhorPerfil = null
    let total = 0
    const urlsEmitidas = new Set()
    function emitir() {
      if (!lote.length) return
      document.dispatchEvent(new CustomEvent(eventoMidias, { detail: JSON.stringify({ contexto: contexto.chave, midias: lote }) }))
      lote = []
    }
    while (pilha.length && total++ < 50000) {
      const { item, usuario, publicacao, destaque, historia } = pilha.pop()
      if (!item || typeof item !== 'object' || visitados.has(item)) continue
      visitados.add(item)
      diag.objetos++
      if (Array.isArray(item)) {
        for (let indice = Math.min(item.length, 5000) - 1; indice >= 0 && pilha.length < 50000; indice--) pilha.push({ item: item[indice], usuario, publicacao, destaque, historia })
        continue
      }
      const nome = [item.user?.username, item.owner?.username, item.username].find(valor => typeof valor === 'string' && /^[a-zA-Z0-9_.]{1,30}$/.test(valor))
      const autor = nome?.toLowerCase() || usuario
      const codigo = [item.code, item.shortcode].find(valor => typeof valor === 'string')
      const grupo = publicacao || codigo
      const idDestaque = [item.id, item.pk, item.reel_id, item.highlight_id].map(valor => String(valor || '').match(/^highlight:(\d+)$/)?.[1]).find(Boolean) || (item.highlight_id != null && /^\d+$/.test(String(item.highlight_id)) ? String(item.highlight_id) : '') || ((item.reel_type === 'highlight_reel' || /highlight/i.test(String(item.__typename || ''))) && Array.isArray(item.items) && /^\d+$/.test(String(item.id || item.pk || item.reel_id || '')) ? String(item.id || item.pk || item.reel_id) : '')
      const grupoDestaque = idDestaque || destaque
      const ehHistoria = historia || item.product_type === 'story' || !!idDestaque || item.reel_type === 'user_reel' || item.reel_type === 'highlight_reel' || item.__typename === 'GraphStoryVideo' || item.__typename === 'GraphStoryImage'
      const id = String(item.pk || item.id || '').split('_')[0]
      const temVideo = !!(item.video_versions || item.video_url || item.video_resources || item.playback_url || item.video_dash_manifest || item.dash_manifest || item.video?.video_versions || item.media_type === 2 || item.is_video === true)
      if (temVideo) diag.candidatosVideo++
      if (item.video_dash_manifest || item.dash_manifest || item.video?.dash_manifest || item.video_delivery_response?.dash_manifest) diag.manifestos++
      const pertence = contexto.tipo === 'stories' ? ((autor === contexto.alvo && ehHistoria) || (!!idStory && id === idStory && (!autor || autor === contexto.alvo)))
        : contexto.tipo === 'destaque' ? grupoDestaque === contexto.alvo
        : contexto.tipo === 'publicacao' ? grupo === contexto.alvo && !ehHistoria
        : contexto.tipo === 'perfil' ? autor === contexto.alvo && !ehHistoria
        : false
      if (contexto.tipo === 'perfil') {
        for (const dono of [item, item.user, item.owner]) {
          if (typeof dono?.username !== 'string' || dono.username.toLowerCase() !== contexto.alvo) continue
          const candidato = fotoPerfil(dono)
          if (candidato) { diag.fotosPerfil++; if (candidato.qualidadePerfil === 2) diag.fotosHd++ }
          if (candidato && (!melhorPerfil || candidato.qualidadePerfil > melhorPerfil.qualidadePerfil || (candidato.qualidadePerfil === melhorPerfil.qualidadePerfil && candidato.width * candidato.height > melhorPerfil.width * melhorPerfil.height))) melhorPerfil = candidato
        }
      }
      if (pertence) {
        if (temVideo) diag.videosContexto++
        const { imagem, video } = formatos(item)
        if (temVideo && !video && Array.isArray(item.video_versions) && item.video_versions.some(v => typeof v?.url === 'string' && /[?&](bytestart|byteend)=|\.(mpd|m4s|m3u8)(?:\?|$)/i.test(v.url))) diag.urlsSegmentadas++
        const midia = video || imagem
        const ehVideo = item.media_type === 2 || item.is_video === true || item.__typename === 'GraphVideo' || item.__typename === 'GraphStoryVideo' || item.__typename === 'XDTGraphVideo'
        const carrossel = Array.isArray(item.carousel_media) || !!item.edge_sidecar_to_children || item.media_type === 8
        const reconhecida = item.media_type === 1 || item.media_type === 2 || typeof item.is_video === 'boolean' || /Media|GraphImage|GraphVideo|GraphStoryImage|GraphStoryVideo/.test(String(item.__typename || '')) || !!video
        if (midia && !carrossel && reconhecida && (!ehVideo || video)) {
          const origem = contexto.tipo === 'stories' ? 'Stories' : contexto.tipo === 'destaque' ? 'Destaques' : item.product_type === 'clips' || (/(?:^|\/)reels?\//.test(caminho)) ? 'Reels' : 'Posts'
          const chaveMidia = (video ? 'video:' : 'imagem:') + midia.url
          if (!urlsEmitidas.has(chaveMidia)) {
            urlsEmitidas.add(chaveMidia)
            if (video) diag.videosEmitidos++
            lote.push({ url: midia.url, miniatura: imagem?.url || '', tipo: video ? 'video' : 'imagem', origem, largura: Number(midia.width) || 0, altura: Number(midia.height) || 0 })
          }
          if (lote.length >= 100) emitir()
        }
      }
      for (const [chave, filho] of Object.entries(item)) {
        if (['image_versions2','video_versions','display_resources','video_resources','thumbnail_resources','user','owner','caption','comments','profile_pic_url','hd_profile_pic_versions','hd_profile_pic_url_info','suggested_users','suggested_posts'].includes(chave)) continue
        if (filho && typeof filho === 'object' && pilha.length < 50000) pilha.push({ item: filho, usuario: autor, publicacao: ['carousel_media','edge_sidecar_to_children'].includes(chave) || (grupo && ['edges','node','media','video','video_info','media_info'].includes(chave)) ? grupo : '', destaque: chave.match(/^highlight:(\d+)$/)?.[1] || grupoDestaque, historia: ehHistoria || /stories|reels_media|reel_media|highlight/i.test(chave) })
      }
    }
    if (melhorPerfil) lote.push({ url: melhorPerfil.url, miniatura: melhorPerfil.url, tipo: 'imagem', origem: 'Perfil', largura: melhorPerfil.width, altura: melhorPerfil.height, qualidadePerfil: melhorPerfil.qualidadePerfil })
    emitir()
  }

  function contextoCompativel(pagina) {
    const anterior = identificar(pagina)
    const atual = identificar(location.href)
    if (anterior.chave === atual.chave) return true
    return anterior.tipo === 'perfil' && ((atual.tipo === 'stories' && anterior.alvo === atual.alvo) || atual.tipo === 'publicacao' || atual.tipo === 'destaque')
  }

  function processar(texto, pagina, versao) {
    if (!ativo || versao !== geracao || !contextoCompativel(pagina) || typeof texto !== 'string' || texto.length > 5000000) return
    try {
      extrair(JSON.parse(texto.replace(/^for \(;;\);/, '')), location.href)
    } catch {
      for (const linha of texto.split(/\r?\n/).slice(0, 1000)) {
        try { extrair(JSON.parse(linha.trim().replace(/^for \(;;\);/, '')), location.href) } catch {}
      }
    }
  }

  async function lerResposta(resposta) {
    const leitor = resposta.body?.getReader()
    if (!leitor) return ''
    const decodificador = new TextDecoder()
    let bytes = 0
    let texto = ''
    try {
      while (ativo) {
        const { value, done } = await leitor.read()
        if (done) return texto + decodificador.decode()
        bytes += value.byteLength
        if (bytes > 5000000) return ''
        texto += decodificador.decode(value, { stream: true })
      }
      return ''
    } finally {
      void leitor.cancel().catch(() => {})
      leitor.releaseLock()
    }
  }

  const buscarOriginal = window.fetch
  window.fetch = function (...args) {
    const pagina = location.href
    const versao = geracao
    const observar = ativo && rotaValida(args[0] instanceof Request ? args[0].url : args[0])
    const resposta = Reflect.apply(buscarOriginal, this, args)
    if (observar) resposta.then(retorno => {
      if (!ativo || versao !== geracao || !retorno.ok || !/(json|text\/plain)/i.test(retorno.headers.get('content-type') || '') || Number(retorno.headers.get('content-length')) > 5000000) return
      lerResposta(retorno.clone()).then(texto => processar(texto, pagina, versao)).catch(() => {})
    }).catch(() => {})
    return resposta
  }

  const abrirOriginal = XMLHttpRequest.prototype.open
  const enviarOriginal = XMLHttpRequest.prototype.send
  const rotas = new WeakMap()
  XMLHttpRequest.prototype.open = function (metodo, url, ...args) {
    rotas.set(this, url)
    return Reflect.apply(abrirOriginal, this, [metodo, url, ...args])
  }
  XMLHttpRequest.prototype.send = function (...args) {
    if (ativo && rotaValida(rotas.get(this))) {
      const pagina = location.href
      const versao = geracao
      this.addEventListener('load', () => {
        if (!ativo || versao !== geracao || !contextoCompativel(pagina) || this.status < 200 || this.status >= 300) return
        try {
          if (this.responseType === 'json') extrair(this.response, location.href)
          else if (!this.responseType || this.responseType === 'text') processar(this.responseText, pagina, versao)
        } catch {}
      }, { once: true })
    }
    return Reflect.apply(enviarOriginal, this, args)
  }
})()
