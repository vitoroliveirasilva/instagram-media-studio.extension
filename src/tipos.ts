export type Origem = 'Stories' | 'Destaques' | 'Posts' | 'Reels' | 'Perfil'
export type Filtro = 'Todas' | Origem
export type Tipo = 'imagem' | 'video'
export type Tema = 'sistema' | 'claro' | 'escuro'
export type Midia = { id: string; url: string; miniatura: string; tipo: Tipo; origem: Origem; largura: number; altura: number }
