(() => {
  function endereco(valor, nivel = 0) {
    if (nivel > 3) return ''
    if (valor && typeof valor === 'object') return endereco(valor.url, nivel + 1) || endereco(valor.uri, nivel + 1) || endereco(valor.src, nivel + 1)
    if (typeof valor !== 'string' || valor.length > 8192) return ''
    try {
      const u = new URL(valor.replace(/&amp;/g, '&'))
      return u.protocol === 'https:' && !u.username && !u.password && !u.port && /(^|\.)(cdninstagram\.com|fbcdn\.net)$/i.test(u.hostname) ? u.href : ''
    } catch { return '' }
  }
  function candidatos(usuario) {
    const lista = []
    const numero = n => Number.isFinite(Number(n)) && Number(n) > 0 ? Math.min(16384, Number(n)) : 0
    const incluir = (valor, qualidadePerfil) => {
      const url = endereco(valor)
      if (!url) return
      lista.push({ url, largura: numero(valor?.width || valor?.config_width), altura: numero(valor?.height || valor?.config_height), qualidadePerfil })
    }
    for (const item of [usuario.hd_profile_pic_url_info, usuario.profile_pic_url_hd, usuario.hd_profile_pic_url, usuario.hd_profile_picture, ...(Array.isArray(usuario.hd_profile_pic_versions) ? usuario.hd_profile_pic_versions : [])]) incluir(item, 2)
    for (const item of [usuario.profile_pic_url, usuario.profile_picture_url, usuario.profile_picture, usuario.profile_pic_url_info]) incluir(item, 1)
    return lista.sort((a,b) => b.qualidadePerfil - a.qualidadePerfil || b.largura * b.altura - a.largura * a.altura)
  }
  function doDom(documento, alvo, bloqueadas = new Set()) {
    const principal = documento.querySelector('main, [role="main"]')
    const cabecalho = principal?.querySelector('header, [role="banner"]')
    const imagens = [...(principal || documento).querySelectorAll('img')].filter(img => {
      if (img.closest('nav, [role="navigation"], aside, [role="complementary"], a[href*="/p/"], a[href*="/reel/"], a[href*="/stories/highlights/"]')) return false
      const caixa = img.getBoundingClientRect()
      return caixa.width >= 40 && caixa.height >= 40 && getComputedStyle(img).display !== 'none' && getComputedStyle(img).visibility !== 'hidden'
    })
    const nome = alvo.replace(/\./g, '\\.')
    const nomeExato = new RegExp('(^|[^a-z0-9_.])' + nome + '($|[^a-z0-9_.])', 'i')
    const rotulo = img => /profile\s*(picture|photo|image)|(?:foto|imagem)\s+(?:de|do)\s+perfil/i.test(img.alt || '')
    const explicitas = imagens.filter(img => nomeExato.test(img.alt || '') && rotulo(img))
    const genericas = cabecalho ? imagens.filter(img => cabecalho.contains(img) && rotulo(img)) : []
    const estruturais = cabecalho ? imagens.filter(img => {
      const r = img.getBoundingClientRect()
      return cabecalho.contains(img) && r.width >= 70 && r.height >= 70 && Math.abs(r.width - r.height) < 12
    }) : []
    const foto = explicitas[0] || (genericas.length === 1 ? genericas[0] : null) || (estruturais.length === 1 ? estruturais[0] : null)
    if (!foto) return null
    const fontes = (foto.srcset || '').split(',').map(v => {
      const [url, tamanho] = v.trim().split(/\s+/)
      return { url: endereco(url), largura: /^\d+w$/.test(tamanho || '') ? Number.parseInt(tamanho, 10) : 0 }
    }).sort((a,b) => b.largura - a.largura)
    fontes.push({ url: endereco(foto.currentSrc), largura: foto.naturalWidth }, { url: endereco(foto.src), largura: foto.naturalWidth })
    const fonte = fontes.find(v => v.url && !bloqueadas.has(v.url))
    if (!fonte) return null
    const largura = fonte.largura || 0
    const altura = foto.naturalWidth && foto.naturalHeight && largura ? Math.round(largura * foto.naturalHeight / foto.naturalWidth) : 0
    return { url: fonte.url, miniatura: fonte.url, tipo: 'imagem', origem: 'Perfil', largura, altura, qualidadePerfil: 0 }
  }
  globalThis.IMSPerfil = Object.freeze({ endereco, candidatos, doDom })
})()

