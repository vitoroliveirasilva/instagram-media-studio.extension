(() => {
  const portas = new Set()
  let observador
  let temporizador
  let ultimaColeta = 0
  const enviados = new Map()
  const eventoControle = 'ims-controle-captura'
  const eventoMidias = 'ims-midias-carregadas'

  function validarUrl(valor) {
    try {
      const url = new URL(valor)
      return url.protocol === 'https:' && !url.username && !url.password && !url.port && (/(^|\.)cdninstagram\.com$/.test(url.hostname) || /(^|\.)fbcdn\.net$/.test(url.hostname)) ? url.href : ''
    } catch {
      return ''
    }
  }

  function origem(elemento) {
    if (location.pathname.startsWith('/stories/highlights/')) return 'Destaques'
    if (location.pathname.startsWith('/stories/')) return 'Stories'
    if (/^\/reels?(\/|$)/.test(location.pathname) || elemento.closest('a[href*="/reel/"]') || elemento.closest('article')?.querySelector('a[href*="/reel/"]')) return 'Reels'
    return 'Posts'
  }

  function visivel(elemento) {
    const caixa = elemento.getBoundingClientRect()
    const estilo = getComputedStyle(elemento)
    return caixa.width >= 100 && caixa.height >= 100 && caixa.bottom > 0 && caixa.right > 0 && caixa.top < innerHeight && caixa.left < innerWidth && estilo.visibility !== 'hidden' && estilo.display !== 'none'
  }

  function publicar(midias) {
    if (!portas.size || !Array.isArray(midias)) return
    const validas = midias.slice(0, 150).flatMap(midia => {
      const url = validarUrl(midia?.url)
      if (!url || !['imagem','video'].includes(midia.tipo) || !['Stories','Destaques','Posts','Reels'].includes(midia.origem)) return []
      return [{ url, miniatura: validarUrl(midia.miniatura), tipo: midia.tipo, origem: midia.origem, largura: Math.max(0, Number(midia.largura) || 0), altura: Math.max(0, Number(midia.altura) || 0) }]
    })
    const novas = validas.filter(midia => {
      const chave = midia.tipo + ':' + midia.url
      const qualidade = midia.largura * midia.altura + ':' + midia.miniatura + ':' + midia.origem
      if (enviados.get(chave) === qualidade) return false
      enviados.set(chave, qualidade)
      if (enviados.size > 2500) enviados.delete(enviados.keys().next().value)
      return true
    })
    if (!novas.length) return
    for (const porta of portas) {
      try { porta.postMessage({ midias: novas }) } catch {}
    }
  }

  function coletar() {
    if (!portas.size) return
    ultimaColeta = performance.now()
    const midias = []
    const seletores = 'main img, main video, article img, article video, [role="dialog"] img, [role="dialog"] video'
    const elementos = document.querySelectorAll(location.pathname.startsWith('/stories/') ? 'img, video' : seletores)
    for (const elemento of elementos) {
      if (midias.length >= 150) break
      if (!visivel(elemento)) continue
      if (elemento instanceof HTMLImageElement && (elemento.closest('header, nav, [role="navigation"]') || elemento.closest('button')?.getBoundingClientRect().width < 100)) continue
      const video = elemento instanceof HTMLVideoElement
      const largura = video ? elemento.videoWidth : elemento.naturalWidth
      const altura = video ? elemento.videoHeight : elemento.naturalHeight
      if (!video && (largura < 240 || altura < 240)) continue
      const candidatos = !video && elemento.srcset ? elemento.srcset.split(',').map(item => item.trim().split(/\s+/)).filter(item => validarUrl(item[0])).sort((a,b) => (parseFloat(b[1]) || 0) - (parseFloat(a[1]) || 0)) : []
      const url = video ? elemento.currentSrc || elemento.src || elemento.querySelector('source')?.src : candidatos[0]?.[0] || elemento.currentSrc || elemento.src
      if (!validarUrl(url)) continue
      midias.push({ url, miniatura: video ? elemento.poster : url, tipo: video ? 'video' : 'imagem', origem: origem(elemento), largura, altura })
    }
    publicar(midias)
  }

  function agendar() {
    if (temporizador !== undefined) return
    temporizador = setTimeout(() => { temporizador = undefined; coletar() }, Math.max(100, 250 - (performance.now() - ultimaColeta)))
  }

  document.addEventListener(eventoMidias, evento => {
    if (!portas.size || typeof evento.detail !== 'string' || evento.detail.length > 500000) return
    try {
      const dados = JSON.parse(evento.detail)
      if (dados.pagina === location.href) publicar(dados.midias)
    } catch {}
  })

  function iniciar() {
    document.dispatchEvent(new CustomEvent(eventoControle, { detail: true }))
    observador = new MutationObserver(agendar)
    observador.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src','srcset','poster'] })
    window.addEventListener('scroll', agendar, true)
    document.addEventListener('load', agendar, true)
    document.addEventListener('loadedmetadata', agendar, true)
    coletar()
  }

  function parar() {
    document.dispatchEvent(new CustomEvent(eventoControle, { detail: false }))
    observador?.disconnect()
    clearTimeout(temporizador)
    temporizador = undefined
    enviados.clear()
    window.removeEventListener('scroll', agendar, true)
    document.removeEventListener('load', agendar, true)
    document.removeEventListener('loadedmetadata', agendar, true)
  }

  chrome.runtime.onConnect.addListener(porta => {
    if (porta.name !== 'ims-painel' || porta.sender?.id !== chrome.runtime.id) return
    portas.add(porta)
    porta.onDisconnect.addListener(() => {
      portas.delete(porta)
      if (!portas.size) parar()
    })
    porta.onMessage.addListener(mensagem => { if (mensagem?.acao === 'atualizar') { enviados.clear(); coletar() } })
    porta.postMessage({ acao: 'pronto' })
    if (portas.size === 1) iniciar()
    else { enviados.clear(); coletar() }
  })
})()
