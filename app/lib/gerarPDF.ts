import jsPDF from 'jspdf'

interface FotoVistoria {
  posicao: string
  url: string
}

interface DadosVistoria {
  placa: string
  modelo: string
  cor: string
  ano: string
  combustivel: string
  km: string
  fipe: string
  qualidade: string
  responsavel: string
  validacao: string
  observacoes: string
  itens: string[]
  fotos?: FotoVistoria[]
  data: string
  hora: string
}

// Logo oficial da Rotacar, hospedada no Supabase Storage. Antes essa logo vinha
// embutida no código como um texto base64 gigante (5000+ caracteres numa linha
// só) — isso demonstrou ser um risco real: copiar/colar esse texto manualmente
// várias vezes ao longo do desenvolvimento acabou corrompendo a logo (perdendo
// pedaços sem ninguém perceber), causando erros confusos no PDF. Buscar a logo
// por URL elimina esse risco de vez: o arquivo mora só num lugar (Supabase), e
// o código sempre baixa a versão íntegra e atual, sem depender de texto colado.
const LOGO_URL = 'https://ikqkipacxemgxtqkvgdb.supabase.co/storage/v1/object/public/fotos-vistorias/logo/logo%20rotacar.png'

// Desenha a logo (já pré-carregada) com proteção: se ela não tiver carregado
// (link fora do ar, sem internet, etc), o PDF continua sendo gerado sem a logo
// naquele ponto, em vez de travar o processo inteiro por causa de uma imagem
// decorativa no cabeçalho/rodapé.
function desenharLogoComSeguranca(doc: jsPDF, logoCarregada: { dataUrl: string } | null, x: number, y: number, largura: number, altura: number) {
  if (!logoCarregada) return
  try {
    doc.addImage(logoCarregada.dataUrl, 'JPEG', x, y, largura, altura)
  } catch (erro) {
    console.error('Não foi possível desenhar a logo da Rotacar:', erro)
  }
}

function desenharFaixaGradiente(doc: jsPDF, x: number, y: number, largura: number, altura: number) {
  const corInicio = { r: 0xB7, g: 0x1C, b: 0x1C } // vermelho sóbrio da Rotacar (#B71C1C)
  const corFim = { r: 255, g: 255, b: 255 } // branco
  const faixas = 60

  for (let i = 0; i < faixas; i++) {
    const proporcao = i / (faixas - 1)
    const r = Math.round(corInicio.r + (corFim.r - corInicio.r) * proporcao)
    const g = Math.round(corInicio.g + (corFim.g - corInicio.g) * proporcao)
    const b = Math.round(corInicio.b + (corFim.b - corInicio.b) * proporcao)

    const larguraFaixa = largura / faixas
    const xFaixa = x + i * larguraFaixa

    doc.setFillColor(r, g, b)
    // +0.3mm de sobreposição entre faixas evita "trilhos" brancos finos entre elas na impressão/zoom
    doc.rect(xFaixa, y, larguraFaixa + 0.3, altura, 'F')
  }
}

// Tempo máximo que esperamos por CADA foto individual. Se uma foto passar
// desse tempo (link lento, servidor engasgado, conexão ruim), desistimos só
// dela e o laudo segue sem travar por causa de uma única imagem.
const TEMPO_LIMITE_POR_FOTO_MS = 10000

// Carrega uma imagem a partir de uma URL e devolve os dados prontos para o jsPDF,
// junto com a largura e altura reais da imagem (para não distorcer no PDF).
//
// DETALHE IMPORTANTE: o jsPDF tem seu próprio decodificador de JPEG "caseiro",
// escrito em JavaScript puro, que é conhecido por falhar em vários JPEGs do
// mundo real (fotos de bancos de imagem, certos apps de celular, certas
// compressões) mesmo quando o arquivo é perfeitamente válido e abre normal em
// qualquer lugar. Foi exatamente esse decodificador que gerou o erro
// "Error while decompressing the data: -3" que você viu no console.
//
// A solução definitiva: em vez de entregar o JPEG original pro jsPDF, a gente
// deixa o PRÓPRIO NAVEGADOR decodificar a imagem (ele nunca falha, usa o
// mesmo motor que abre fotos em qualquer site) e depois redesenha ela como
// PNG num "canvas" invisível. PNG é um formato mais simples de decodificar,
// e o jsPDF lida com ele de forma muito mais confiável.
// Fotos de celular modernas costumam ter 3000-4000px de largura. Um canvas desse
// tamanho, multiplicado por 13+ fotos processando ao mesmo tempo, pode estourar
// limites de memória do navegador (especialmente em celular) e travar ou corromper
// a geração silenciosamente. Por isso limitamos o maior lado da imagem a 1600px —
// mais que suficiente para qualidade de leitura no PDF, e muito mais leve/seguro.
const MAIOR_LADO_MAXIMO_PX = 1600

async function carregarImagem(url: string): Promise<{ dataUrl: string; largura: number; altura: number } | null> {
  try {
    // AbortController é o "cronômetro" que cancela o download se ele demorar demais.
    const controlador = new AbortController()
    const cronometro = setTimeout(() => controlador.abort(), TEMPO_LIMITE_POR_FOTO_MS)

    const resposta = await fetch(url, { signal: controlador.signal })
    clearTimeout(cronometro)
    const blob = await resposta.blob()

    const dataUrlOriginal = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })

    // Deixa o navegador decodificar a imagem original (isso nunca falha para
    // um JPEG/PNG válido, não importa a compressão, o perfil de cor, ou a
    // orientação EXIF — o navegador já aplica a rotação correta sozinho).
    const imgElement = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = dataUrlOriginal
    })

    const larguraOriginal = imgElement.naturalWidth || imgElement.width
    const alturaOriginal = imgElement.naturalHeight || imgElement.height

    // Calcula um tamanho final seguro, reduzindo proporcionalmente se a foto
    // vier maior que o limite (comum em fotos de celular).
    const maiorLado = Math.max(larguraOriginal, alturaOriginal)
    const fatorReducao = maiorLado > MAIOR_LADO_MAXIMO_PX ? MAIOR_LADO_MAXIMO_PX / maiorLado : 1
    const larguraFinal = Math.round(larguraOriginal * fatorReducao)
    const alturaFinal = Math.round(alturaOriginal * fatorReducao)

    // Redesenha a imagem, já no tamanho reduzido, num canvas invisível.
    const canvas = document.createElement('canvas')
    canvas.width = larguraFinal
    canvas.height = alturaFinal
    const contexto = canvas.getContext('2d')
    if (!contexto) throw new Error('Não foi possível criar contexto de canvas')
    contexto.drawImage(imgElement, 0, 0, larguraFinal, alturaFinal)

    // Exporta como JPEG comprimido (qualidade 0.85) em vez de PNG: bem mais leve
    // para fotos de celular (que são fotos "cheias", não teriam ganho com PNG sem
    // perdas) e ainda assim contorna o decodificador JPEG problemático do jsPDF,
    // porque quem gerou este JPEG foi o próprio navegador, não a câmera do celular.
    const dataUrlConvertido = canvas.toDataURL('image/jpeg', 0.85)

    return { dataUrl: dataUrlConvertido, largura: larguraFinal, altura: alturaFinal }
  } catch {
    // Se uma foto falhar ao carregar (link quebrado, sem internet, tempo esgotado, etc),
    // o laudo continua sendo gerado sem travar tudo por causa de uma imagem.
    return null
  }
}

// Baixa TODAS as fotos ao mesmo tempo (em paralelo), em vez de uma de cada vez.
// Isso é o que resolve o travamento com muitas fotos: o tempo total de espera
// passa a ser "o tempo da foto mais lenta", não "a soma do tempo de todas".
// onProgresso é chamado a cada foto que termina, para atualizar um contador na tela.
//
// Importante: a chave do resultado é o ÍNDICE da foto na lista (0, 1, 2...), não a URL.
// Se usássemos a URL como chave, fotos repetidas (mesma imagem em posições diferentes,
// comum em testes) colidiriam na mesma entrada do mapa — cada uma é sempre única por índice.
async function carregarTodasAsFotos(
  fotos: FotoVistoria[],
  onProgresso?: (concluidas: number, total: number) => void
): Promise<Map<number, { dataUrl: string; largura: number; altura: number } | null>> {
  const resultado = new Map<number, { dataUrl: string; largura: number; altura: number } | null>()
  let concluidas = 0

  await Promise.all(
    fotos.map(async (foto, indice) => {
      const imagem = await carregarImagem(foto.url)
      resultado.set(indice, imagem)
      concluidas++
      onProgresso?.(concluidas, fotos.length)
    })
  )

  return resultado
}

export async function gerarPDFVistoria(
  dados: DadosVistoria,
  onProgressoFotos?: (concluidas: number, total: number) => void
): Promise<Blob> {
  // CARIMBO DE VERSÃO — remove depois de confirmar que o código novo está rodando.
  console.log('🔖 gerarPDF.ts VERSÃO JPEG-CANVAS-v2 rodando')

  // Baixa a logo uma única vez, no início, reaproveitando a mesma função robusta
  // (download com timeout + conversão via canvas) já validada com as fotos das
  // vistorias. Se falhar (link fora do ar, sem internet), o PDF segue sem a logo
  // em vez de travar tudo.
  const logoCarregada = await carregarImagem(LOGO_URL)
  if (logoCarregada) {
    console.log('✅ Logo da Rotacar carregada com sucesso.')
  } else {
    console.error('⚠️ Não foi possível carregar a logo da Rotacar (verifique o link no Supabase Storage).')
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Vermelho sóbrio da marca — usado em títulos de seção, ícones de item marcado, etc.
  const vermelho = [0xB7, 0x1C, 0x1C] as [number, number, number]
  // Verde reservado especificamente para os itens MARCADOS do checklist — cria um
  // contraste tipo "semáforo" (verde = tem, cinza = não tem) que é muito mais rápido
  // de ler numa vistoria do que duas variações de vermelho lado a lado.
  const verdeItemMarcado = [22, 163, 74] as [number, number, number] // #16A34A
  const cinzaItemNaoMarcado = [180, 188, 199] as [number, number, number] // cinza neutro, discreto
  const cinzaEscuro = [15, 23, 42] as [number, number, number]
  const cinzaMedio = [100, 116, 139] as [number, number, number]
  const cinzaClaro = [241, 245, 249] as [number, number, number]

  const largura = 210
  const margem = 20

  // ===== Header: faixa de gradiente com texto branco (sem logo aqui) =====
  desenharFaixaGradiente(doc, 0, 0, largura, 35)

  // Texto branco garante contraste forte contra o gradiente vermelho, em
  // qualquer ponto da faixa (tanto no lado mais vermelho quanto no mais claro).
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Laudo de Vistoria de Entrada', margem, 14)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Data: ${dados.data}   Hora: ${dados.hora}`, margem, 22)

  // ===== Logo, na área branca, acima da seção "Dados do veículo" =====
  desenharLogoComSeguranca(doc, logoCarregada, margem, 42, 32, 12.9)

  // Seção dados do veículo
  let y = 60

  doc.setFillColor(...cinzaClaro)
  doc.rect(margem, y, largura - margem * 2, 8, 'F')
  doc.setTextColor(...cinzaEscuro)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DADOS DO VEÍCULO', margem + 3, y + 5.5)

  y += 12

  const campos = [
    ['Placa', dados.placa],
    ['Modelo', dados.modelo],
    ['Cor', dados.cor],
    ['Ano', dados.ano],
    ['Combustível', dados.combustivel],
    ['KM atual', `${dados.km} km`],
    ['Valor FIPE', dados.fipe],
  ]

  const colEsq = margem
  const colDir = largura / 2 + 5

  campos.forEach((campo, i) => {
    const x = i % 2 === 0 ? colEsq : colDir
    if (i % 2 === 0 && i > 0) y += 10

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...cinzaMedio)
    doc.text(campo[0].toUpperCase(), x, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...cinzaEscuro)
    doc.text(campo[1] || '-', x, y + 5)
  })

  // "Qualidade" fica na posição direita da última linha (mesmo lugar que ocupava
  // na lista antes), mas desenhada à parte porque ela usa um "selo" colorido em
  // vez de texto simples — cor muda conforme o valor: Bom (verde), Regular
  // (amarelo), Repasse (vermelho). Isso deixa visível de longe, sem precisar ler.
  {
    const xQualidade = colDir
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...cinzaMedio)
    doc.text('QUALIDADE', xQualidade, y)

    const qualidadeCores: Record<string, { fundo: [number, number, number]; texto: [number, number, number] }> = {
      'Bom': { fundo: [22, 163, 74], texto: [255, 255, 255] },       // verde / branco
      'Regular': { fundo: [250, 204, 21], texto: [113, 63, 18] },    // amarelo / marrom
      'Repasse': { fundo: [220, 38, 38], texto: [255, 255, 255] },   // vermelho / branco
    }
    const corSelo = qualidadeCores[dados.qualidade] || { fundo: cinzaClaro, texto: cinzaMedio }
    const textoSelo = dados.qualidade || '-'

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    const larguraSelo = doc.getTextWidth(textoSelo) + 8
    doc.setFillColor(...corSelo.fundo)
    doc.roundedRect(xQualidade, y + 1.5, larguraSelo, 6.5, 1.5, 1.5, 'F')
    doc.setTextColor(...corSelo.texto)
    doc.text(textoSelo, xQualidade + 4, y + 6)
  }

  y += 16

  // Seção responsável
  doc.setFillColor(...cinzaClaro)
  doc.rect(margem, y, largura - margem * 2, 8, 'F')
  doc.setTextColor(...cinzaEscuro)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('RESPONSÁVEIS', margem + 3, y + 5.5)

  y += 12

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...cinzaMedio)
  doc.text('RESPONSÁVEL PELA VISTORIA', colEsq, y)
  doc.text('VALIDAÇÃO DA VISTORIA', colDir, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...cinzaEscuro)
  doc.text(dados.responsavel || '-', colEsq, y + 5)
  doc.text(dados.validacao || '-', colDir, y + 5)

  y += 16

  // Seção observações
  if (dados.observacoes) {
    doc.setFillColor(...cinzaClaro)
    doc.rect(margem, y, largura - margem * 2, 8, 'F')
    doc.setTextColor(...cinzaEscuro)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVAÇÕES', margem + 3, y + 5.5)

    y += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...cinzaEscuro)
    const linhas = doc.splitTextToSize(dados.observacoes, largura - margem * 2)
    doc.text(linhas, margem, y)
    y += linhas.length * 5 + 6
  }

  // Seção itens
  doc.setFillColor(...cinzaClaro)
  doc.rect(margem, y, largura - margem * 2, 8, 'F')
  doc.setTextColor(...cinzaEscuro)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('ITENS DO VEÍCULO', margem + 3, y + 5.5)

  y += 12

  const todosItens = ['Documento','Chave roda','Estepe','Macaco','Bagagito','Som','Antena','Triângulo','Chave reserva','Manual','Rastreador','Seguro']
  const colunas = 3
  const larguraColuna = (largura - margem * 2) / colunas

  todosItens.forEach((item, i) => {
    const col = i % colunas
    const linha = Math.floor(i / colunas)
    const x = margem + col * larguraColuna
    const yItem = y + linha * 8
    const temItem = dados.itens?.includes(item)
    const corItem = temItem ? verdeItemMarcado : cinzaItemNaoMarcado

    doc.setFillColor(...corItem)
    doc.circle(x + 3, yItem + 2, 2, 'F')

    doc.setFont('helvetica', temItem ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...corItem)
    doc.text(item, x + 7, yItem + 4)
  })

  y += Math.ceil(todosItens.length / colunas) * 8 + 8

  // ===== Rodapé da primeira página, com gradiente (sem logo, só texto) =====
  desenharFaixaGradiente(doc, 0, 287, largura, 10)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Vistoria Digital', margem, 293)
  doc.text(`Gerado em ${dados.data} às ${dados.hora}`, largura - margem, 293, { align: 'right' })

  // ===== PÁGINA(S) DE FOTOS =====
  // Só cria a página de fotos se realmente existirem fotos anexadas na vistoria.
  if (dados.fotos && dados.fotos.length > 0) {
    const colunasFoto = 2
    const espacamento = 6
    const larguraFoto = (largura - margem * 2 - espacamento) / colunasFoto
    const alturaFoto = larguraFoto * 0.75 // proporção 4:3, boa para fotos de celular
    const alturaCartao = alturaFoto + 12 // espaço da foto + legenda com o nome da posição
    const topoUtil = 55 // abaixo da faixa (25mm) + área branca com a logo (mais respiro)
    const rodapeLimite = 280 // onde o conteúdo deve parar, antes do rodapé

    let paginaFotoAtual = -1 // força criar a primeira página de fotos no loop abaixo
    let yFoto = topoUtil

    // Baixa TODAS as fotos ao mesmo tempo, ANTES de começar a desenhar qualquer página.
    // É essa etapa que resolve o travamento: com 13+ fotos, baixar uma de cada vez
    // podia levar quase 1 minuto; em paralelo, leva o tempo da foto mais lenta apenas.
    const imagensCarregadas = await carregarTodasAsFotos(dados.fotos, onProgressoFotos)

    const desenharCabecalhoPaginaFotos = () => {
      desenharFaixaGradiente(doc, 0, 0, largura, 25)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Placa: ${dados.placa}`, margem, 15)

      // Logo na área branca, abaixo do gradiente — fundo branco por trás da logo
      // fica mais limpo do que sobre o vermelho, igual já fizemos na capa.
      desenharLogoComSeguranca(doc, logoCarregada, margem, 32, 32, 12.9)
    }

    const desenharRodapePaginaFotos = () => {
      desenharFaixaGradiente(doc, 0, 287, largura, 10)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Sistema de Vistoria Digital', margem, 293)
      doc.text(`Gerado em ${dados.data} às ${dados.hora}`, largura - margem, 293, { align: 'right' })
    }

    for (let i = 0; i < dados.fotos.length; i++) {
      const foto = dados.fotos[i]
      const col = i % colunasFoto
      const x = margem + col * (larguraFoto + espacamento)

      // Início de uma nova linha: verifica se cabe, senão pula de página
      if (col === 0) {
        const precisaNovaPagina = paginaFotoAtual === -1 || yFoto + alturaCartao > rodapeLimite
        if (precisaNovaPagina) {
          if (paginaFotoAtual !== -1) desenharRodapePaginaFotos()
          doc.addPage()
          paginaFotoAtual++
          desenharCabecalhoPaginaFotos()
          yFoto = topoUtil
        }
      }

      // Moldura de fundo do cartão da foto
      doc.setFillColor(...cinzaClaro)
      doc.rect(x, yFoto, larguraFoto, alturaCartao, 'F')

      const imagem = imagensCarregadas.get(i) ?? null

      if (imagem) {
        // Calcula o encaixe da imagem dentro do espaço reservado, mantendo a proporção original
        // (evita fotos esticadas ou achatadas).
        const proporcaoImagem = imagem.largura / imagem.altura
        const proporcaoEspaco = larguraFoto / alturaFoto
        let wDesenho = larguraFoto - 4
        let hDesenho = alturaFoto - 4
        if (proporcaoImagem > proporcaoEspaco) {
          hDesenho = wDesenho / proporcaoImagem
        } else {
          wDesenho = hDesenho * proporcaoImagem
        }
        const xImg = x + (larguraFoto - wDesenho) / 2
        const yImg = yFoto + 2 + (alturaFoto - 4 - hDesenho) / 2

        // Formato 'JPEG' porque toda imagem já foi redimensionada e recomprimida
        // via canvas em carregarImagem(), gerando um JPEG "limpo" do próprio
        // navegador — isso contorna o decodificador problemático do jsPDF.
        const aliasUnico = `foto_${i}`

        try {
          doc.addImage(imagem.dataUrl, 'JPEG', xImg, yImg, wDesenho, hDesenho, aliasUnico, 'FAST')
        } catch (erro) {
          // Log no console para conseguirmos diagnosticar casos futuros sem adivinhar.
          console.error(`Falha ao inserir a foto "${foto.posicao}" (posição ${i}) no PDF:`, erro)
          doc.setTextColor(...cinzaMedio)
          doc.setFontSize(8)
          doc.text('(imagem indisponível)', x + larguraFoto / 2, yFoto + alturaFoto / 2, { align: 'center' })
        }
      } else {
        // Não conseguiu baixar a foto (link expirado, sem internet no momento da geração, etc)
        doc.setTextColor(...cinzaMedio)
        doc.setFontSize(8)
        doc.text('(imagem indisponível)', x + larguraFoto / 2, yFoto + alturaFoto / 2, { align: 'center' })
      }

      // Legenda com o nome da posição, embaixo da foto
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...cinzaEscuro)
      doc.text(foto.posicao, x + larguraFoto / 2, yFoto + alturaFoto + 6, { align: 'center' })

      if (col === colunasFoto - 1 || i === dados.fotos.length - 1) {
        yFoto += alturaCartao + espacamento
      }
    }

    desenharRodapePaginaFotos()
  }

  return doc.output('blob')
}
