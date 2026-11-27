(() => {
  const permitidos = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/i
  function url(valor) {
    if (typeof valor !== 'string' || valor.length > 8192) return ''
    try {
      const u = new URL(valor.replace(/&amp;/g, '&'))
      return u.protocol === 'https:' && !u.username && !u.password && !u.port && permitidos.test(u.hostname) ? u.href : ''
    } catch { return '' }
  }
  function melhor(candidatos) {
    return (Array.isArray(candidatos) ? candidatos : []).filter(v => url(v?.url || v?.src)).sort((a, b) =>
      (Number(b.width || b.config_width) || 0) * (Number(b.height || b.config_height) || 0) -
      (Number(a.width || a.config_width) || 0) * (Number(a.height || a.config_height) || 0))[0]
  }
  function extrair(dados) {
    const saida = [], vistos = new WeakSet()
    const pilha = [{ item: dados, usuario: '', codigo: '', destaque: '', historia: false }]
    let total = 0
    while (pilha.length && total++ < 60000) {
      const estado = pilha.pop(), item = estado.item
      if (!item || typeof item !== 'object' || vistos.has(item)) continue
      vistos.add(item)
      if (Array.isArray(item)) {
        for (const filho of item.slice(0, 5000)) pilha.push({ ...estado, item: filho })
        continue
      }
      const nome = [item.user?.username, item.owner?.username, item.username].find(v => typeof v === 'string' && /^[\w.]{1,30}$/.test(v))
      const usuario = nome?.toLowerCase() || estado.usuario
      const codigo = [item.code, item.shortcode].find(v => typeof v === 'string' && /^[\w-]{1,80}$/.test(v)) || estado.codigo
      const id = String(item.pk || item.id || '').split('_')[0]
      const destaque = id.match(/^highlight:(\d+)$/)?.[1] || estado.destaque
      const historia = estado.historia || !!destaque || item.product_type === 'story' || /^(user|highlight)_reel$/.test(item.reel_type || '')
      const base = { usuario, codigo, destaque, historia, id, perfil: false }
      const imagem = melhor(item.image_versions2?.candidates || item.display_resources) || { url: item.display_url || item.thumbnail_src, width: item.dimensions?.width, height: item.dimensions?.height }
      const videos = [...(Array.isArray(item.video_versions) ? item.video_versions : []), ...(Array.isArray(item.video_resources) ? item.video_resources : [])]
      for (const v of [item.video_url, item.browser_native_hd_url, item.browser_native_sd_url, item.playable_url_quality_hd, item.playable_url]) if (url(v)) videos.push({ url: v, width: item.original_width || item.dimensions?.width, height: item.original_height || item.dimensions?.height })
      const video = melhor(videos)
      const ehVideo = item.media_type === 2 || item.is_video === true || !!video || /GraphVideo/.test(item.__typename || '')
      const ehMidia = !!video || [1, 2].includes(item.media_type) || !!item.shortcode || /Graph(Image|Video)|XDT.*Media/.test(item.__typename || '')
      const fonte = ehVideo ? video : imagem
      if (ehMidia && fonte && url(fonte.url || fonte.src) && !Array.isArray(item.carousel_media) && !item.edge_sidecar_to_children) {
        saida.push({ ...base, url: url(fonte.url || fonte.src), miniatura: url(imagem?.url || imagem?.src), tipo: ehVideo ? 'video' : 'imagem', origem: historia ? (destaque ? 'Destaques' : 'Stories') : item.product_type === 'clips' ? 'Reels' : 'Posts', largura: Number(fonte.width || fonte.config_width || item.original_width) || 0, altura: Number(fonte.height || fonte.config_height || item.original_height) || 0 })
      }
      if (typeof item.username === 'string') {
        for (const foto of globalThis.IMSPerfil.candidatos(item)) saida.push({ ...base, ...foto, perfil: true, usuario: item.username.toLowerCase(), miniatura: foto.url, tipo: 'imagem', origem: 'Perfil' })
      }
      for (const [chave, filho] of Object.entries(item)) {
        if (['image_versions2', 'display_resources', 'video_versions', 'video_resources', 'caption', 'comments', 'edge_media_to_comment', 'suggested_users', 'suggested_posts', '_owner', 'stateNode', 'return', 'child', 'sibling', 'alternate', 'ref'].includes(chave)) continue
        if (filho && typeof filho === 'object' && pilha.length < 60000) pilha.push({ item: filho, usuario, codigo, destaque: chave.match(/^highlight:(\d+)$/)?.[1] || destaque, historia: historia || /^(stories|reels|reels_media|reel_media)$/.test(chave) })
      }
    }
    return saida
  }
  function selecionar(registros, pagina) {
    const c = globalThis.IMSContexto.identificar(pagina)
    const story = new URL(pagina).pathname.split('/').filter(Boolean)[2]
    const fotos = registros.filter(r => r.perfil && r.usuario === c.alvo).sort((a,b) => (b.qualidadePerfil || 0) - (a.qualidadePerfil || 0) || b.largura * b.altura - a.largura * a.altura)
    return registros.filter(r => {
      if (r.perfil) return c.tipo === 'perfil' && r === fotos[0]
      if (c.tipo === 'destaque') return r.destaque === c.alvo
      if (c.tipo === 'stories') return r.historia && (story && /^\d+$/.test(story) ? r.id === story : r.usuario === c.alvo)
      if (c.tipo === 'publicacao') return r.codigo === c.alvo && !r.historia
      if (c.tipo === 'reels') return r.origem === 'Reels' && !r.historia
      if (c.tipo === 'perfil') return r.usuario === c.alvo && !r.historia
      return false
    }).map(r => ({ ...r, origem: r.perfil ? 'Perfil' : c.tipo === 'publicacao' && /^\/reels?\//.test(new URL(pagina).pathname) ? 'Reels' : r.origem }))
  }
  globalThis.IMSExtrator = Object.freeze({ url, extrair, selecionar })
})()
