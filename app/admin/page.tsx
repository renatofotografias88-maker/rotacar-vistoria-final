'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

export default function Admin() {
  const [carregando, setCarregando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [preview, setPreview] = useState<any[]>([])

  async function processarExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCarregando(true)
    setResultado(null)
    setErro(null)
    setPreview([])

    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const dados = XLSX.utils.sheet_to_json(ws) as any[]

      const veiculos = dados.map((row: any) => ({
        placa: String(row['Placa'] || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
        modelo: row['Modelo'] || null,
        combustivel: row['Combustível'] || null,
        cor: row['Cor'] || null,
        chassi: row['Número do Chassi'] || null,
        renavan: String(row['Número do Renavan'] || ''),
        ano_veiculo: String(row['Ano do Veículo'] || ''),
        ano_modelo: String(row['Ano do Modelo'] || ''),
      })).filter(v => v.placa)

      setPreview(veiculos.slice(0, 5))

      // Apaga tudo e insere novamente
      await supabase.from('frota').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      const { error } = await supabase.from('frota').insert(veiculos)

      if (error) {
        setErro('Erro ao importar: ' + error.message)
      } else {
        setResultado(`✅ ${veiculos.length} veículos importados com sucesso!`)
      }
    } catch (err: any) {
      setErro('Erro ao ler o arquivo: ' + err.message)
    }

    setCarregando(false)
  }

  return (
    <main style={{ background: '#f1f5f9', minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <img src="data:image/png;base64,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" alt="Rotacar" style={{ height: 48, objectFit: 'contain' }} />
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#0f172a' }}>Área Administrativa</p>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Gerenciamento da base de veículos</p>
          </div>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            📂 Atualizar base de veículos
          </p>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            Selecione o arquivo Excel da frota. O sistema vai importar todos os veículos automaticamente.
          </p>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', background: '#1D9E75', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%' }}>
            {carregando ? '⏳ Importando...' : '📥 Selecionar arquivo Excel'}
            <input type="file" accept=".xlsx,.xls" onChange={processarExcel} style={{ display: 'none' }} disabled={carregando} />
          </label>
        </div>

        {resultado && (
          <div style={{ background: '#DCFCE7', border: '1px solid #16A34A', borderRadius: 10, padding: '1rem', marginBottom: '1rem', color: '#15803D', fontWeight: 500, fontSize: 14 }}>
            {resultado}
          </div>
        )}

        {erro && (
          <div style={{ background: '#FEE2E2', border: '1px solid #DC2626', borderRadius: 10, padding: '1rem', marginBottom: '1rem', color: '#B91C1C', fontWeight: 500, fontSize: 14 }}>
            {erro}
          </div>
        )}

        {preview.length > 0 && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Primeiros registros importados:</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={thStyle}>Placa</th>
                    <th style={thStyle}>Modelo</th>
                    <th style={thStyle}>Cor</th>
                    <th style={thStyle}>Ano</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((v, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={tdStyle}>{v.placa}</td>
                      <td style={tdStyle}>{v.modelo}</td>
                      <td style={tdStyle}>{v.cor}</td>
                      <td style={tdStyle}>{v.ano_veiculo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

const thStyle: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#64748b' }
const tdStyle: React.CSSProperties = { padding: '8px 10px', color: '#0f172a' }