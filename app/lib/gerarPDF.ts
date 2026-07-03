import jsPDF from 'jspdf'

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
  data: string
  hora: string
}

export async function gerarPDFVistoria(dados: DadosVistoria): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  
  const verde = [29, 158, 117] as [number, number, number]
  const cinzaEscuro = [15, 23, 42] as [number, number, number]
  const cinzaMedio = [100, 116, 139] as [number, number, number]
  const cinzaClaro = [241, 245, 249] as [number, number, number]

  const largura = 210
  const margem = 20

  // Header
  doc.setFillColor(...verde)
  doc.rect(0, 0, largura, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('ROTACAR LOCADORA', margem, 14)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Laudo de Vistoria de Entrada', margem, 22)

  doc.setFontSize(9)
  doc.text(`Data: ${dados.data}   Hora: ${dados.hora}`, margem, 30)

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

    doc.setFillColor(temItem ? 29 : 220, temItem ? 158 : 38, temItem ? 117 : 38)
    doc.circle(x + 3, yItem + 2, 2, 'F')

    doc.setFont('helvetica', temItem ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(temItem ? 29 : 150, temItem ? 158 : 150, temItem ? 117 : 150)
    doc.text(item, x + 7, yItem + 4)
  })

  y += Math.ceil(todosItens.length / colunas) * 8 + 8

  // Rodapé
  doc.setFillColor(...verde)
  doc.rect(0, 287, largura, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Rotacar Locadora — Sistema de Vistoria Digital', margem, 293)
  doc.text(`Gerado em ${dados.data} às ${dados.hora}`, largura - margem, 293, { align: 'right' })

  return doc.output('blob')
}