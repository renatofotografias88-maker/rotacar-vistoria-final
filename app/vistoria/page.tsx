'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

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
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<string[]>([])
  const [buscando, setBuscando] = useState(false)
  const [encontrado, setEncontrado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const checklistItens = ['Documento','Chave roda','Estepe','Macaco','Bagagito','Som','Antena','Triângulo','Chave reserva','Manual','Rastreador','Seguro']
  const posicoesFoto = ['Frente','Traseira','Lateral direita','Lateral esquerda','Painel / interior','Hodômetro (KM)','Pneus','Motor','Outros']

  async function buscarPlaca() {
    if (!placa) return
    setBuscando(true)
    setEncontrado(false)
    await new Promise(r => setTimeout(r, 1200))
    setModelo('Honda Civic EXL')
    setAno('2022/2023')
    setCor('Prata')
    setCombustivel('Flex')
    setFipe('R$ 84.750')
    setEncontrado(true)
    setBuscando(false)
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
    const { error } = await supabase.from('vistorias').insert({
      placa: placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
      modelo,
      ano_veiculo: ano,
      cor,
      combustivel,
      fipe,
      qualidade,
      km_atual: parseInt(km),
      responsavel,
      observacoes,
      itens,
      data_vistoria: new Date().toISOString().split('T')[0],
      hora_vistoria: new Date().toTimeString().split(' ')[0],
    })
    setEnviando(false)
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      setSucesso(true)
      setTimeout(() => {
        setSucesso(false)
        setPlaca(''); setModelo(''); setAno(''); setCor('')
        setCombustivel(''); setFipe(''); setQualidade(''); setKm('')
        setResponsavel(''); setObservacoes(''); setItens([])
        setEncontrado(false)
      }, 3000)
    }
  }

  return (
    <main style={{ background: '#f1f5f9', minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

        {sucesso && (
          <div style={{ background: '#DCFCE7', border: '1px solid #16A34A', borderRadius: 10, padding: '1rem', marginBottom: '1rem', textAlign: 'center', color: '#15803D', fontWeight: 600 }}>
            ✅ Vistoria salva com sucesso!
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <img src="data:image/png;base64,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" alt="Rotacar" style={{ height: 48, objectFit: 'contain' }} />
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

        {buscando && <div style={{ padding: '10px 14px', background: '#f1f5f9', borderRadius: 8, marginBottom: 12, fontSize: 13, color: '#64748b' }}>⏳ Consultando base de dados e tabela FIPE...</div>}

        {encontrado && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#1D4ED8' }}>Tabela FIPE</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#1E3A8A' }}>{fipe}</p>
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

        <div style={{ marginBottom: 4 }}>
          <label style={labelStyle}>Responsável pela vistoria *</label>
          <input style={inputStyle} placeholder="Nome de quem está fazendo a vistoria" value={responsavel} onChange={e => setResponsavel(e.target.value)} />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {posicoesFoto.map(pos => (
            <label key={pos} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '14px 8px', cursor: 'pointer', minHeight: 90, fontSize: 12, color: '#64748b', textAlign: 'center', gridColumn: pos === 'Outros' ? 'span 3' : 'span 1' }}>
              <span style={{ fontSize: 22 }}>📷</span>
              {pos}
              <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} />
            </label>
          ))}
        </div>

        <button onClick={enviarVistoria} disabled={enviando} style={{ marginTop: '1.5rem', width: '100%', padding: 14, background: enviando ? '#94a3b8' : '#1D9E75', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: enviando ? 'not-allowed' : 'pointer' }}>
          {enviando ? 'Salvando...' : 'Enviar vistoria ↗'}
        </button>

      </div>
    </main>
  )
}

const sectionStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, margin: '1.5rem 0 12px' }
const labelStyle: React.CSSProperties = { fontSize: 13, color: '#64748b', display: 'block', marginBottom: 4 }
const inputStyle: React.CSSProperties = { width: '100%', fontSize: 15, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', color: '#0f172a', outline: 'none' }
const btnStyle: React.CSSProperties = { padding: '8px 16px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', height: 40 }