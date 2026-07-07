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

// Logo oficial da Rotacar (a mesma imagem já usada na tela de login do app).
const LOGO_ROTACAR = 'data:image/png;base64,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'

// Desenha uma faixa horizontal com gradiente do vermelho da marca até o branco,
// da esquerda para a direita. O jsPDF não tem gradiente nativo, então simulamos
// pintando várias faixinhas verticais bem finas, cada uma um tom mais claro que a anterior.
// Desenha a logo com proteção: se ela estiver corrompida (base64 incompleto por
// um copiar/colar malsucedido, por exemplo), o PDF continua sendo gerado sem a
// logo naquele ponto, em vez de travar o processo inteiro por causa de uma imagem
// decorativa no cabeçalho/rodapé.
function desenharLogoComSeguranca(doc: jsPDF, x: number, y: number, largura: number, altura: number) {
  try {
    doc.addImage(LOGO_ROTACAR, 'PNG', x, y, largura, altura)
  } catch (erro) {
    console.error('Não foi possível desenhar a logo da Rotacar (provável corrupção do base64):', erro)
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

  // VERIFICAÇÃO DE INTEGRIDADE DA LOGO: essa string de base64 é gigante (mais de
  // 5000 caracteres numa linha só) e, ao ser copiada e colada manualmente várias
  // vezes ao longo do desenvolvimento, corre o risco real de perder um pedaço sem
  // ninguém perceber — o que quebra o PDF de um jeito confuso (erro de "PNG
  // signature" ou tentativa de buscar a logo como se fosse um link). Este aviso
  // avisa ISSO diretamente no console, em vez de deixar o erro genérico confundir
  // o diagnóstico.
  const TAMANHO_ESPERADO_LOGO = 5010
  if (LOGO_ROTACAR.length !== TAMANHO_ESPERADO_LOGO) {
    console.error(
      `⚠️ ALERTA: a logo da Rotacar parece estar corrompida ou incompleta! ` +
      `Tamanho esperado: ${TAMANHO_ESPERADO_LOGO} caracteres. ` +
      `Tamanho atual: ${LOGO_ROTACAR.length} caracteres. ` +
      `Isso provavelmente foi causado por um copiar/colar incompleto do código. ` +
      `Solução: recopie o arquivo gerarPDF.ts completo, sem editar a linha da logo manualmente.`
    )
  } else {
    console.log('✅ Logo da Rotacar íntegra (tamanho correto).')
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Vermelho sóbrio da marca — usado em títulos de seção, ícones de item marcado, etc.
  const vermelho = [0xB7, 0x1C, 0x1C] as [number, number, number]
  const cinzaEscuro = [15, 23, 42] as [number, number, number]
  const cinzaMedio = [100, 116, 139] as [number, number, number]
  const cinzaClaro = [241, 245, 249] as [number, number, number]

  const largura = 210
  const margem = 20

  // ===== Header com gradiente e logo =====
  desenharFaixaGradiente(doc, 0, 0, largura, 35)

  // Logo no canto esquerdo do cabeçalho (altura 12.9mm, largura proporcional)
  desenharLogoComSeguranca(doc, margem, 6, 32, 12.9)

  // Textos do cabeçalho ficam à direita da logo. Como o gradiente vai de vermelho (esquerda)
  // para branco (direita), o texto escuro garante boa leitura sobre o lado claro da faixa.
  const xTextoHeader = margem + 40
  doc.setTextColor(...cinzaEscuro)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Laudo de Vistoria de Entrada', xTextoHeader, 14)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Data: ${dados.data}   Hora: ${dados.hora}`, xTextoHeader, 22)

  // Seção dados do veículo
  let y = 45

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
    ['Qualidade', dados.qualidade],
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

    doc.setFillColor(temItem ? vermelho[0] : 220, temItem ? vermelho[1] : 38, temItem ? vermelho[2] : 38)
    doc.circle(x + 3, yItem + 2, 2, 'F')

    doc.setFont('helvetica', temItem ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(temItem ? vermelho[0] : 150, temItem ? vermelho[1] : 150, temItem ? vermelho[2] : 150)
    doc.text(item, x + 7, yItem + 4)
  })

  y += Math.ceil(todosItens.length / colunas) * 8 + 8

  // ===== Rodapé da primeira página, com gradiente e logo pequena =====
  desenharFaixaGradiente(doc, 0, 287, largura, 10)
  desenharLogoComSeguranca(doc, margem, 288.5, 14.5, 5.9)

  doc.setTextColor(...cinzaEscuro)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Vistoria Digital', margem + 18, 293)
  doc.text(`Gerado em ${dados.data} às ${dados.hora}`, largura - margem, 293, { align: 'right' })

  // ===== PÁGINA(S) DE FOTOS =====
  // Só cria a página de fotos se realmente existirem fotos anexadas na vistoria.
  if (dados.fotos && dados.fotos.length > 0) {
    const colunasFoto = 2
    const espacamento = 6
    const larguraFoto = (largura - margem * 2 - espacamento) / colunasFoto
    const alturaFoto = larguraFoto * 0.75 // proporção 4:3, boa para fotos de celular
    const alturaCartao = alturaFoto + 12 // espaço da foto + legenda com o nome da posição
    const topoUtil = 40 // onde o conteúdo pode começar, abaixo do cabeçalho da página de fotos
    const rodapeLimite = 280 // onde o conteúdo deve parar, antes do rodapé

    let paginaFotoAtual = -1 // força criar a primeira página de fotos no loop abaixo
    let yFoto = topoUtil

    // Baixa TODAS as fotos ao mesmo tempo, ANTES de começar a desenhar qualquer página.
    // É essa etapa que resolve o travamento: com 13+ fotos, baixar uma de cada vez
    // podia levar quase 1 minuto; em paralelo, leva o tempo da foto mais lenta apenas.
    const imagensCarregadas = await carregarTodasAsFotos(dados.fotos, onProgressoFotos)

    const desenharCabecalhoPaginaFotos = () => {
      desenharFaixaGradiente(doc, 0, 0, largura, 25)
      desenharLogoComSeguranca(doc, margem, 5, 24, 9.7)
      doc.setTextColor(...cinzaEscuro)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Placa: ${dados.placa}`, margem + 30, 12)
    }

    const desenharRodapePaginaFotos = () => {
      desenharFaixaGradiente(doc, 0, 287, largura, 10)
      desenharLogoComSeguranca(doc, margem, 288.5, 14.5, 5.9)
      doc.setTextColor(...cinzaEscuro)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Sistema de Vistoria Digital', margem + 18, 293)
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
