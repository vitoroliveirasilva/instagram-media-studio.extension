(() => {
  const reservados = new Set(['accounts','explore','direct','reels','reel','p','stories','tv','about','developer','privacy','legal','challenge','api','graphql','web','emails','notifications'])
  function identificar(endereco) {
    const url = new URL(endereco)
    const [a = '', b = '', c = ''] = url.pathname.split('/').filter(Boolean)
    const perfil = /^[a-zA-Z0-9_.]{1,30}$/
    const codigo = /^[a-zA-Z0-9_-]{1,80}$/
    if (a === 'stories' && b === 'highlights' && codigo.test(c)) return { chave: 'destaque:' + c, tipo: 'destaque', alvo: c, titulo: 'Destaque aberto' }
    if (a === 'stories' && perfil.test(b) && b !== 'highlights') return { chave: 'stories:' + b.toLowerCase(), tipo: 'stories', alvo: b.toLowerCase(), titulo: 'Stories de @' + b }
    if (['p','reel','tv'].includes(a) && codigo.test(b)) return { chave: 'publicacao:' + b, tipo: 'publicacao', alvo: b, titulo: a === 'reel' ? 'Reel aberto' : 'Publicação aberta' }
    if (perfil.test(a) && !reservados.has(a.toLowerCase())) return { chave: 'perfil:' + a.toLowerCase(), tipo: 'perfil', alvo: a.toLowerCase(), titulo: '@' + a }
    return { chave: 'pagina:' + url.pathname, tipo: 'pagina', alvo: '', titulo: 'Página atual' }
  }
  globalThis.IMSContexto = Object.freeze({ identificar })
})()
