'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { gerarPDFVistoria } from '../lib/gerarPDF'

interface FotoSlot {
  posicao: string
  multiplas: boolean
  fotos: { url: string; path: string }[]
}

function normalizarNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[()[\]{}]/g, '') // remove parênteses e colchetes
    .replace(/[^a-zA-Z0-9\s-]/g, '') // remove qualquer outro caractere especial (mantém letras, números, espaço e hífen)
    .trim()
    .replace(/\s+/g, '-') // troca espaços (um ou mais) por hífen
    .toLowerCase()
}

export default function Vistoria() {
  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [ano, setAno] = useState('')
  const [cor, setCor] = useState('')
  const [combustivel, setCombustivel] = useState('')
  const [fipe, setFipe] = useState('')
  const [qualidade, setQualidade] = useState('')
  const [km, setKm] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [validacao, setValidacao] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<string[]>([])
  const [buscando, setBuscando] = useState(false)
  const [encontrado, setEncontrado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [statusEnvio, setStatusEnvio] = useState('')
  const [erroEnvio, setErroEnvio] = useState('')
  const [uploadandoFoto, setUploadandoFoto] = useState<string | null>(null)

  const [fotoSlots, setFotoSlots] = useState<FotoSlot[]>([
    { posicao: 'Frente', multiplas: false, fotos: [] },
    { posicao: 'Traseira', multiplas: false, fotos: [] },
    { posicao: 'Lateral direita', multiplas: false, fotos: [] },
    { posicao: 'Lateral esquerda', multiplas: false, fotos: [] },
    { posicao: 'Painel / interior', multiplas: false, fotos: [] },
    { posicao: 'Hodometro KM', multiplas: false, fotos: [] },
    { posicao: 'Pneus', multiplas: true, fotos: [] },
    { posicao: 'Motor', multiplas: true, fotos: [] },
    { posicao: 'Outros', multiplas: true, fotos: [] },
  ])

  const checklistItens = ['Documento','Chave roda','Estepe','Macaco','Bagagito','Som','Antena','Triângulo','Chave reserva','Manual','Rastreador','Seguro']

  async function buscarFipe(modeloNome: string, anoVeiculo: string) {
    try {
      const marcasRes = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas')
      const marcas = await marcasRes.json()
      const nomeLower = modeloNome.toLowerCase()
      const mapasMarca: Record<string, string> = {
        'argo': 'fiat', 'pulse': 'fiat', 'cronos': 'fiat', 'mobi': 'fiat', 'strada': 'fiat',
        'saveiro': 'volkswagen', 'polo': 'volkswagen', 'gol': 'volkswagen', 'virtus': 'volkswagen',
        'yaris': 'toyota', 'corolla': 'toyota', 'hilux': 'toyota',
        'hb20': 'hyundai', 'creta': 'hyundai',
        'civic': 'honda', 'fit': 'honda', 'hr-v': 'honda', 'city': 'honda',
        'onix': 'chevrolet', 'tracker': 'chevrolet',
        'kwid': 'renault', 'sandero': 'renault', 'duster': 'renault',
        'l200': 'mitsubishi', 'ranger': 'ford',
      }
      let nomeMarca = ''
      for (const [chave, marca] of Object.entries(mapasMarca)) {
        if (nomeLower.includes(chave)) { nomeMarca = marca; break }
      }
      if (!nomeMarca) return null
      const marcaEncontrada = marcas.find((m: any) => m.nome.toLowerCase().includes(nomeMarca))
      if (!marcaEncontrada) return null
      const modelosRes = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaEncontrada.codigo}/modelos`)
      const { modelos } = await modelosRes.json()
      const palavrasModelo = nomeLower.split(' ').filter((p: string) => p.length > 2)
      let modeloEncontrado = null
      let maiorScore = 0
      for (const m of modelos) {
        const mLower = m.nome.toLowerCase()
        let score = 0
        for (const palavra of palavrasModelo) { if (mLower.includes(palavra)) score++ }
        if (score > maiorScore) { maiorScore = score; modeloEncontrado = m }
      }
      if (!modeloEncontrado || maiorScore === 0) return null
      const anosRes = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaEncontrada.codigo}/modelos/${modeloEncontrado.codigo}/anos`)
      const anos = await anosRes.json()
      const anoNum = parseInt(anoVeiculo)
      let anoEncontrado = anos.find((a: any) => a.nome.includes(String(anoNum)))
      if (!anoEncontrado) anoEncontrado = anos[0]
      if (!anoEncontrado) return null
      const valorRes = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaEncontrada.codigo}/modelos/${modeloEncontrado.codigo}/anos/${anoEncontrado.codigo}`)
      const valor = await valorRes.json()
      return valor.Valor || null
    } catch { return null }
  }

  async function buscarPlaca() {
    if (!placa) return
    setBuscando(true)
    setEncontrado(false)
    setFipe('')
    const placaFormatada = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const { data, error } = await supabase.from('frota').select('*').eq('placa', placaFormatada).single()
    if (error || !data) {
      alert('Placa não encontrada na base de veículos!')
      setBuscando(false)
      return
    }
    setModelo(data.modelo || '')
    setAno(data.ano_veiculo ? `${data.ano_veiculo}/${data.ano_modelo}` : '')
    setCor(data.cor || '')
    setCombustivel(data.combustivel || '')
    setEncontrado(true)
    setBuscando(false)
    setFipe('🔍 Consultando FIPE...')
    const valorFipe = await buscarFipe(data.modelo || '', data.ano_veiculo || '')
    setFipe(valorFipe || 'Não encontrado na FIPE')
  }

  async function handleFoto(posicao: string, file: File) {
    if (!file) return
    setUploadandoFoto(posicao)

    const placaFormatada = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'sem-placa'
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const pastaSegura = normalizarNome(posicao)
    const path = `${placaFormatada}/${pastaSegura}/${timestamp}.${ext}`

    const { error } = await supabase.storage
      .from('fotos-vistorias')
      .upload(path, file, { upsert: true })

    if (error) {
      alert('Erro ao fazer upload da foto: ' + error.message)
      setUploadandoFoto(null)
      return
    }

    const { data: urlData } = supabase.storage
      .from('fotos-vistorias')
      .getPublicUrl(path)

    setFotoSlots(prev => prev.map(slot => {
      if (slot.posicao === posicao) {
        const novasFotos = slot.multiplas
          ? [...slot.fotos, { url: urlData.publicUrl, path }]
          : [{ url: urlData.publicUrl, path }]
        return { ...slot, fotos: novasFotos }
      }
      return slot
    }))

    setUploadandoFoto(null)
  }

  function removerFoto(posicao: string, path: string) {
    setFotoSlots(prev => prev.map(slot => {
      if (slot.posicao === posicao) {
        return { ...slot, fotos: slot.fotos.filter(f => f.path !== path) }
      }
      return slot
    }))
    supabase.storage.from('fotos-vistorias').remove([path])
  }

  function toggleItem(item: string) {
    setItens(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])
  }

  async function enviarVistoria() {
    if (!placa || !responsavel || !km) {
      alert('Preencha pelo menos a placa, KM atual e responsável!')
      return
    }
    setEnviando(true)
    setErroEnvio('')
    setStatusEnvio('💾 Salvando vistoria...')

    const dataHoje = new Date().toISOString().split('T')[0]
    const horaAgora = new Date().toTimeString().split(' ')[0]
    const todasFotos = fotoSlots.flatMap(s => s.fotos.map(f => ({ posicao: s.posicao, url: f.url })))

    const { error } = await supabase.from('vistorias').insert({
      placa: placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
      modelo, ano_veiculo: ano, cor, combustivel, fipe, qualidade,
      km_atual: parseInt(km), responsavel, observacoes, itens,
      fotos: todasFotos,
      data_vistoria: dataHoje,
      hora_vistoria: horaAgora,
    })

    if (error) {
      alert('Erro ao salvar: ' + error.message)
      setEnviando(false)
      setStatusEnvio('')
      return
    }

    setStatusEnvio('📄 Gerando laudo em PDF...')
    const pdfBlob = await gerarPDFVistoria(
      {
        placa: placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
        modelo, cor, ano, combustivel, km, fipe, qualidade,
        responsavel, validacao, observacoes, itens,
        fotos: todasFotos,
        data: dataHoje, hora: horaAgora,
      },
      // Callback de progresso: chamado a cada foto que termina de carregar,
      // atualizando o texto na tela para o usuário ver que está avançando de verdade.
      (concluidas, total) => {
        setStatusEnvio(`📷 Processando fotos (${concluidas} de ${total})...`)
      }
    )

    const pdfBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.readAsDataURL(pdfBlob)
    })

    setStatusEnvio('📧 Enviando email...')

    // CORREÇÃO PRINCIPAL: antes, o resultado desse fetch era ignorado — a tela
    // mostrava "sucesso" mesmo se o email tivesse falhado. Agora a resposta é
    // checada de verdade: só mostramos sucesso se o email realmente foi enviado
    // pelo Resend. Se falhar, mostramos um aviso vermelho claro, sem apagar os
    // dados preenchidos — assim você não perde o trabalho e pode tentar reenviar.
    let emailEnviado = false
    let mensagemErroEmail = ''

    try {
      const respostaEmail = await fetch('/api/enviar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64,
          dadosVistoria: {
            placa: placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
            modelo, cor, ano, combustivel, km, fipe, qualidade,
            responsavel, validacao, observacoes, itens,
            data: dataHoje, hora: horaAgora,
          }
        })
      })

      const resultadoEmail = await respostaEmail.json()

      if (respostaEmail.ok && resultadoEmail.success) {
        emailEnviado = true
      } else {
        mensagemErroEmail = resultadoEmail.error?.message || resultadoEmail.error || 'Erro desconhecido ao enviar email'
      }
    } catch (erroFetch: any) {
      mensagemErroEmail = 'Não foi possível conectar ao servidor de email: ' + erroFetch.message
    }

    setEnviando(false)
    setStatusEnvio('')

    if (emailEnviado) {
      setSucesso(true)
      setTimeout(() => {
        setSucesso(false)
        setPlaca(''); setModelo(''); setAno(''); setCor('')
        setCombustivel(''); setFipe(''); setQualidade(''); setKm('')
        setResponsavel(''); setValidacao(''); setObservacoes(''); setItens([])
        setEncontrado(false)
        setFotoSlots(prev => prev.map(s => ({ ...s, fotos: [] })))
      }, 4000)
    } else {
      // A vistoria já foi salva no banco com sucesso (isso não falhou) — só o
      // envio do email deu problema. Por isso não limpamos o formulário: os
      // dados continuam ali, e nada foi perdido. O aviso deixa claro que só o
      // email precisa ser resolvido.
      setErroEnvio(`A vistoria foi salva, mas o email não foi enviado: ${mensagemErroEmail}`)
    }
  }

  return (
    <main style={{ background: '#f1f5f9', minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

        {sucesso && (
          <div style={{ background: '#DCFCE7', border: '1px solid #16A34A', borderRadius: 10, padding: '1rem', marginBottom: '1rem', textAlign: 'center', color: '#15803D', fontWeight: 600 }}>
            ✅ Vistoria salva e email enviado com sucesso!
          </div>
        )}

        {erroEnvio && (
          <div style={{ background: '#FEE2E2', border: '1px solid #DC2626', borderRadius: 10, padding: '1rem', marginBottom: '1rem', color: '#B91C1C', fontWeight: 500, fontSize: 14 }}>
            ⚠️ {erroEnvio}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <img src="https://ikqkipacxemgxtqkvgdb.supabase.co/storage/v1/object/public/fotos-vistorias/logo/logo%20rotacar.png" alt="Rotacar" style={{ height: 48, objectFit: 'contain' }} />
        </div>

        <p style={sectionStyle}>Dados do veículo</p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Placa *</label>
            <input style={inputStyle} placeholder="ABC1234" maxLength={8} value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && buscarPlaca()} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={buscarPlaca} style={btnStyle} disabled={buscando}>{buscando ? 'Buscando...' : '🔍 Buscar'}</button>
          </div>
        </div>

        {buscando && <div style={{ padding: '10px 14px', background: '#f1f5f9', borderRadius: 8, marginBottom: 12, fontSize: 13, color: '#64748b' }}>⏳ Consultando base de dados...</div>}

        {encontrado && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#1D4ED8' }}>Tabela FIPE</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1E3A8A' }}>{fipe || '🔍 Buscando...'}</p>
              <span style={{ fontSize: 11, background: '#BFDBFE', color: '#1D4ED8', padding: '2px 8px', borderRadius: 4 }}>Automático</span>
            </div>
            <div>
              <label style={labelStyle}>Qualidade *</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {['Bom', 'Regular', 'Repasse'].map(q => (
                  <button key={q} onClick={() => setQualidade(q)} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: '1px solid', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: qualidade === q ? (q === 'Bom' ? '#DCFCE7' : q === 'Regular' ? '#FEF9C3' : '#FEE2E2') : '#f8fafc', borderColor: qualidade === q ? (q === 'Bom' ? '#16A34A' : q === 'Regular' ? '#CA8A04' : '#DC2626') : '#e2e8f0', color: qualidade === q ? (q === 'Bom' ? '#15803D' : q === 'Regular' ? '#A16207' : '#B91C1C') : '#64748b' }}>{q}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label style={labelStyle}>Modelo *</label><input style={inputStyle} placeholder="Ex: Honda Civic" value={modelo} onChange={e => setModelo(e.target.value)} /></div>
          <div><label style={labelStyle}>Cor *</label><input style={inputStyle} placeholder="Prata" value={cor} onChange={e => setCor(e.target.value)} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label style={labelStyle}>Ano *</label><input style={inputStyle} placeholder="2022/2023" value={ano} onChange={e => setAno(e.target.value)} /></div>
          <div><label style={labelStyle}>Combustível *</label>
            <select style={inputStyle} value={combustivel} onChange={e => setCombustivel(e.target.value)}>
              <option value="">Selecione</option>
              <option>Flex</option><option>Gasolina</option><option>Diesel</option><option>Elétrico</option><option>Híbrido</option>
            </select>
          </div>
          <div><label style={labelStyle}>KM atual *</label><input style={inputStyle} type="number" placeholder="45000" value={km} onChange={e => setKm(e.target.value)} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label style={labelStyle}>Data da vistoria *</label><input style={inputStyle} type="date" defaultValue={new Date().toISOString().split('T')[0]} /></div>
          <div><label style={labelStyle}>Hora *</label><input style={inputStyle} type="time" /></div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Responsável pela vistoria *</label>
          <input style={inputStyle} placeholder="Nome de quem está fazendo a vistoria" value={responsavel} onChange={e => setResponsavel(e.target.value)} />
        </div>

        <div style={{ marginBottom: 4 }}>
          <label style={labelStyle}>Validação da vistoria</label>
          <input style={inputStyle} placeholder="Nome de quem está validando a vistoria" value={validacao} onChange={e => setValidacao(e.target.value)} />
        </div>

        <p style={sectionStyle}>Observações gerais</p>
        <textarea style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} rows={4} placeholder="Descreva qualquer observação sobre lataria, pintura, mecânica..." value={observacoes} onChange={e => setObservacoes(e.target.value)} />

        <p style={sectionStyle}>Itens do veículo — marque o que possui</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
          {checklistItens.map(item => (
            <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', background: itens.includes(item) ? '#DCFCE7' : '#f8fafc', border: `1px solid ${itens.includes(item) ? '#16A34A' : '#e2e8f0'}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, color: itens.includes(item) ? '#15803D' : '#0f172a' }}>
              <input type="checkbox" checked={itens.includes(item)} onChange={() => toggleItem(item)} style={{ width: 16, height: 16, accentColor: '#1D9E75' }} />
              {item}
            </label>
          ))}
        </div>

        <p style={sectionStyle}>Fotos do veículo</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fotoSlots.map(slot => (
            <div key={slot.posicao} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  📷 {slot.posicao}
                  {slot.multiplas && <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400, marginLeft: 6 }}>— múltiplas fotos</span>}
                </span>
                {uploadandoFoto === slot.posicao && (
                  <span style={{ fontSize: 12, color: '#1D9E75' }}>⏳ Enviando...</span>
                )}
              </div>

              {slot.fotos.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {slot.fotos.map((foto, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={foto.url} alt={slot.posicao} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #1D9E75' }} />
                      <button onClick={() => removerFoto(slot.posicao, foto.path)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, background: '#DC2626', color: 'white', border: 'none', borderRadius: '50%', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                      <div style={{ fontSize: 10, color: '#1D9E75', textAlign: 'center', marginTop: 2 }}>✅ OK</div>
                    </div>
                  ))}
                </div>
              )}

              {(slot.multiplas || slot.fotos.length === 0) && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'white', border: '1px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#64748b', width: 'fit-content' }}>
                  <span>{slot.fotos.length > 0 ? '➕ Adicionar foto' : '📸 Tirar foto'}</span>
                  <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFoto(slot.posicao, f); e.target.value = '' }} />
                </label>
              )}

              {!slot.multiplas && slot.fotos.length > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'white', border: '1px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#64748b', width: 'fit-content', marginTop: 4 }}>
                  <span>🔄 Substituir foto</span>
                  <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFoto(slot.posicao, f); e.target.value = '' }} />
                </label>
              )}
            </div>
          ))}
        </div>

        {enviando && (
          <div style={{ marginTop: '1rem', padding: '12px 16px', background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 10, fontSize: 14, color: '#1D4ED8', textAlign: 'center' }}>
            {statusEnvio}
          </div>
        )}

        <button onClick={enviarVistoria} disabled={enviando} style={{ marginTop: '1rem', width: '100%', padding: 14, background: enviando ? '#94a3b8' : '#1D9E75', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: enviando ? 'not-allowed' : 'pointer' }}>
          {enviando ? 'Processando...' : 'Enviar vistoria ↗'}
        </button>

      </div>
    </main>
  )
}

const sectionStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, margin: '1.5rem 0 12px' }
const labelStyle: React.CSSProperties = { fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }
const inputStyle: React.CSSProperties = { width: '100%', fontSize: 15, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', color: '#0f172a', outline: 'none' }
const btnStyle: React.CSSProperties = { padding: '8px 16px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', height: 40 }
