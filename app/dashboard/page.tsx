'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

interface Usuario {
  id: string
  login: string
  perfil: string
}

export default function Dashboard() {
  const [vistorias, setVistorias] = useState<any[]>([])
  const [filtradas, setFiltradas] = useState<any[]>([])
  const [filtroAno, setFiltroAno] = useState(String(new Date().getFullYear())) // usado pelos gráficos, atualiza em tempo real
  const [carregando, setCarregando] = useState(true)
  const [verTodosModelos, setVerTodosModelos] = useState(false)
  const router = useRouter()

  // ===== Estado dos filtros da TABELA/EXPORTAÇÃO (independentes do ano dos gráficos) =====
  // Cada filtro tem uma versão "rascunho" (o que a pessoa está digitando/selecionando
  // agora) e o valor "aplicado" só é atualizado quando ela clica em "Buscar" — assim
  // a lista não pisca a cada letra digitada, e dá pra combinar vários filtros de
  // uma vez antes de rodar a busca.
  const [buscaRascunho, setBuscaRascunho] = useState('')
  const [anoRascunho, setAnoRascunho] = useState('')
  const [mesRascunho, setMesRascunho] = useState('')
  const [qualidadeRascunho, setQualidadeRascunho] = useState('')

  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [anoAplicado, setAnoAplicado] = useState('')
  const [mesAplicado, setMesAplicado] = useState('')
  const [qualidadeAplicada, setQualidadeAplicada] = useState('')

  // ===== Estado da seção "Gerenciar usuários" =====
  const [painelUsuariosAberto, setPainelUsuariosAberto] = useState(false)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false)

  // Formulário de criação de novo usuário
  const [novoLogin, setNovoLogin] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [novoPerfil, setNovoPerfil] = useState('operacional')
  const [criandoUsuario, setCriandoUsuario] = useState(false)
  const [mensagemUsuarios, setMensagemUsuarios] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  // Controla qual usuário está com o campo de "alterar senha" aberto no momento
  const [usuarioAlterandoSenha, setUsuarioAlterandoSenha] = useState<string | null>(null)
  const [senhaTemporaria, setSenhaTemporaria] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  useEffect(() => {
    const perfil = sessionStorage.getItem('perfil')
    if (perfil !== 'gestao') { router.push('/'); return }
    carregarVistorias()
  }, [])

  async function carregarVistorias() {
    const { data } = await supabase
      .from('vistorias')
      .select('*')
      .order('created_at', { ascending: false })
    setVistorias(data || [])
    setFiltradas(data || [])
    setCarregando(false)
  }

  // Roda o filtro usando os valores APLICADOS (não os rascunhos), então só reage
  // quando o usuário clica em "Buscar" (função buscarNaTabela) ou quando a lista
  // de vistorias muda (ex: acabou de carregar do banco).
  useEffect(() => {
    let resultado = [...vistorias]
    if (buscaAplicada) resultado = resultado.filter(v =>
      v.placa?.toLowerCase().includes(buscaAplicada.toLowerCase()) ||
      v.modelo?.toLowerCase().includes(buscaAplicada.toLowerCase()) ||
      v.responsavel?.toLowerCase().includes(buscaAplicada.toLowerCase())
    )
    if (mesAplicado) resultado = resultado.filter(v => v.data_vistoria?.slice(5, 7) === mesAplicado)
    if (anoAplicado) resultado = resultado.filter(v => v.data_vistoria?.slice(0, 4) === anoAplicado)
    if (qualidadeAplicada) resultado = resultado.filter(v => v.qualidade === qualidadeAplicada)
    setFiltradas(resultado)
  }, [buscaAplicada, mesAplicado, anoAplicado, qualidadeAplicada, vistorias])

  // Chamado pelo botão "Buscar": copia os valores dos campos (rascunho) para os
  // valores aplicados, disparando o useEffect acima e atualizando a tabela.
  function buscarNaTabela() {
    setBuscaAplicada(buscaRascunho)
    setAnoAplicado(anoRascunho)
    setMesAplicado(mesRascunho)
    setQualidadeAplicada(qualidadeRascunho)
  }

  // Dados gráfico por mês (usa filtroAno)
  const vistoriasPorMes = MESES.map((_, i) => {
    const mes = String(i + 1).padStart(2, '0')
    return vistorias.filter(v =>
      v.data_vistoria?.slice(5, 7) === mes &&
      v.data_vistoria?.slice(0, 4) === filtroAno
    ).length
  })
  const maxMes = Math.max(...vistoriasPorMes, 1)

  // Dados gráfico por modelo (usa filtroAno)
  const contagemModelos: Record<string, number> = {}
  vistorias
    .filter(v => v.data_vistoria?.slice(0, 4) === filtroAno)
    .forEach(v => {
      const m = v.modelo || 'Desconhecido'
      contagemModelos[m] = (contagemModelos[m] || 0) + 1
    })
  const modelosOrdenados = Object.entries(contagemModelos).sort((a, b) => b[1] - a[1])
  const top10 = modelosOrdenados.slice(0, 10)
  const demais = modelosOrdenados.slice(10)
  const maxModelo = Math.max(...modelosOrdenados.map(m => m[1]), 1)

  function exportarExcel() {
    const dados = filtradas.map(v => ({
      'Placa': v.placa, 'Modelo': v.modelo, 'Cor': v.cor,
      'KM': v.km_atual, 'Ano': v.ano_veiculo, 'Combustível': v.combustivel,
      'FIPE': v.fipe, 'Qualidade': v.qualidade, 'Responsável': v.responsavel,
      'Validação': v.validacao, 'Data': v.data_vistoria, 'Hora': v.hora_vistoria,
      'Observações': v.observacoes,
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Vistorias')
    XLSX.writeFile(wb, `vistorias_${anoAplicado || 'todos'}_${mesAplicado || 'todos'}.xlsx`)
  }

  function sair() { sessionStorage.clear(); router.push('/') }

  const totalHoje = vistorias.filter(v => v.data_vistoria === new Date().toISOString().split('T')[0]).length
  const totalMes = vistorias.filter(v => v.data_vistoria?.slice(0, 7) === new Date().toISOString().slice(0, 7)).length
  const totalAno = vistorias.filter(v => v.data_vistoria?.slice(0, 4) === String(new Date().getFullYear())).length

  // ===== Funções da seção "Gerenciar usuários" =====

  async function carregarUsuarios() {
    setCarregandoUsuarios(true)
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, login, perfil')
      .order('login', { ascending: true })

    if (!error) setUsuarios(data || [])
    setCarregandoUsuarios(false)
  }

  function abrirPainelUsuarios() {
    const abrindoAgora = !painelUsuariosAberto
    setPainelUsuariosAberto(abrindoAgora)
    // Só busca os usuários na primeira vez que o painel é aberto, evitando
    // requisições desnecessárias toda vez que o admin abre e fecha o painel.
    if (abrindoAgora && usuarios.length === 0) carregarUsuarios()
  }

  async function criarUsuario() {
    if (!novoLogin.trim() || !novaSenha.trim()) {
      setMensagemUsuarios({ tipo: 'erro', texto: 'Preencha login e senha para criar o usuário.' })
      return
    }
    setCriandoUsuario(true)
    setMensagemUsuarios(null)

    const loginFormatado = novoLogin.trim().toLowerCase()

    // Confere se já existe um usuário com esse login antes de tentar criar,
    // para dar uma mensagem de erro clara em vez de uma falha genérica do banco.
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('login', loginFormatado)
      .maybeSingle()

    if (existente) {
      setMensagemUsuarios({ tipo: 'erro', texto: `Já existe um usuário com o login "${loginFormatado}".` })
      setCriandoUsuario(false)
      return
    }

    const { error } = await supabase.from('usuarios').insert({
      login: loginFormatado,
      senha: novaSenha.trim(),
      perfil: novoPerfil,
    })

    setCriandoUsuario(false)

    if (error) {
      setMensagemUsuarios({ tipo: 'erro', texto: 'Erro ao criar usuário: ' + error.message })
      return
    }

    setMensagemUsuarios({ tipo: 'sucesso', texto: `Usuário "${loginFormatado}" criado com sucesso!` })
    setNovoLogin('')
    setNovaSenha('')
    setNovoPerfil('operacional')
    carregarUsuarios()
  }

  function iniciarAlteracaoSenha(usuarioId: string) {
    setUsuarioAlterandoSenha(usuarioId)
    setSenhaTemporaria('')
    setMensagemUsuarios(null)
  }

  function cancelarAlteracaoSenha() {
    setUsuarioAlterandoSenha(null)
    setSenhaTemporaria('')
  }

  async function salvarNovaSenha(usuarioId: string, loginUsuario: string) {
    if (!senhaTemporaria.trim()) {
      setMensagemUsuarios({ tipo: 'erro', texto: 'Digite a nova senha antes de salvar.' })
      return
    }
    setSalvandoSenha(true)

    // CORREÇÃO: filtrar por "login" em vez de "id", e adicionar .select() no
    // final. Sem o .select(), o Supabase não avisa quando um update não
    // encontra nenhuma linha correspondente — ele retorna "sucesso" mesmo
    // tendo alterado ZERO linhas. Com o .select(), conseguimos ver a linha
    // devolvida e confirmar de verdade que a alteração aconteceu; se vier
    // vazio, sabemos que algo está errado com o filtro, não é sucesso real.
    const { data, error } = await supabase
      .from('usuarios')
      .update({ senha: senhaTemporaria.trim() })
      .eq('login', loginUsuario)
      .select()

    setSalvandoSenha(false)

    if (error) {
      setMensagemUsuarios({ tipo: 'erro', texto: 'Erro ao alterar senha: ' + error.message })
      return
    }

    if (!data || data.length === 0) {
      // Isso não deveria acontecer nunca (o login vem direto da lista já
      // carregada), mas se acontecer, é melhor avisar claramente do que
      // fingir sucesso — foi exatamente esse "fingir sucesso" que causou
      // a confusão anterior.
      setMensagemUsuarios({ tipo: 'erro', texto: `Não foi possível encontrar o usuário "${loginUsuario}" para atualizar. Nenhuma linha foi alterada.` })
      return
    }

    setMensagemUsuarios({ tipo: 'sucesso', texto: `Senha de "${loginUsuario}" alterada com sucesso!` })
    setUsuarioAlterandoSenha(null)
    setSenhaTemporaria('')
  }

  return (
    <main style={{ background: '#f1f5f9', minHeight: '100vh', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="data:image/png;base64,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" alt="Rotacar" style={{ height: 40, objectFit: 'contain' }} />
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Dashboard de gestão</p>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Vistorias de entrada</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={abrirPainelUsuarios} style={{ padding: '6px 14px', background: painelUsuariosAberto ? '#1D9E75' : '#E1F5EE', color: painelUsuariosAberto ? 'white' : '#1D9E75', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              👤 {painelUsuariosAberto ? 'Fechar usuários' : 'Gerenciar usuários'}
            </button>
            <button onClick={sair} style={{ padding: '6px 14px', background: '#FEE2E2', color: '#B91C1C', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Sair</button>
          </div>
        </div>

        {/* ===== Painel "Gerenciar usuários" (expansível) ===== */}
        {painelUsuariosAberto && (
          <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#0f172a' }}>👤 Gerenciar usuários</p>
            <p style={{ margin: '0 0 1rem', fontSize: 12, color: '#94a3b8' }}>
              Crie novos acessos ou altere a senha de usuários existentes.
            </p>

            {mensagemUsuarios && (
              <div style={{
                background: mensagemUsuarios.tipo === 'sucesso' ? '#DCFCE7' : '#FEE2E2',
                border: `1px solid ${mensagemUsuarios.tipo === 'sucesso' ? '#16A34A' : '#DC2626'}`,
                borderRadius: 8, padding: '10px 12px', marginBottom: 12,
                color: mensagemUsuarios.tipo === 'sucesso' ? '#15803D' : '#B91C1C',
                fontSize: 13, fontWeight: 500,
              }}>
                {mensagemUsuarios.texto}
              </div>
            )}

            {/* Formulário de criação de novo usuário */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>➕ Criar novo usuário</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  style={{ flex: 2, minWidth: 130, fontSize: 14, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', color: '#0f172a', outline: 'none' }}
                  placeholder="Login"
                  value={novoLogin}
                  onChange={e => setNovoLogin(e.target.value)}
                />
                <input
                  style={{ flex: 2, minWidth: 130, fontSize: 14, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', color: '#0f172a', outline: 'none' }}
                  placeholder="Senha"
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                />
                <select
                  style={{ flex: 1, minWidth: 120, fontSize: 14, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', color: '#0f172a', outline: 'none' }}
                  value={novoPerfil}
                  onChange={e => setNovoPerfil(e.target.value)}
                >
                  <option value="operacional">Operacional</option>
                  <option value="gestao">Gestão</option>
                </select>
                <button
                  onClick={criarUsuario}
                  disabled={criandoUsuario}
                  style={{ padding: '8px 16px', background: criandoUsuario ? '#94a3b8' : '#1D9E75', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: criandoUsuario ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                >
                  {criandoUsuario ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>

            {/* Lista de usuários existentes */}
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Usuários cadastrados</p>
            {carregandoUsuarios ? (
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Carregando usuários...</p>
            ) : usuarios.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Nenhum usuário encontrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {usuarios.map(u => (
                  <div key={u.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{u.login}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: u.perfil === 'gestao' ? '#EFF6FF' : '#F1F5F9', color: u.perfil === 'gestao' ? '#1D4ED8' : '#64748b', fontWeight: 500 }}>
                          {u.perfil === 'gestao' ? 'Gestão' : 'Operacional'}
                        </span>
                      </div>
                      {usuarioAlterandoSenha !== u.id && (
                        <button
                          onClick={() => iniciarAlteracaoSenha(u.id)}
                          style={{ fontSize: 12, color: '#1D9E75', background: '#E1F5EE', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 500 }}
                        >
                          🔑 Alterar senha
                        </button>
                      )}
                    </div>

                    {/* Campo de alteração de senha, aparece só para o usuário selecionado */}
                    {usuarioAlterandoSenha === u.id && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          style={{ flex: 1, minWidth: 140, fontSize: 13, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', color: '#0f172a', outline: 'none' }}
                          placeholder="Nova senha"
                          value={senhaTemporaria}
                          onChange={e => setSenhaTemporaria(e.target.value)}
                          autoFocus
                        />
                        <button
                          onClick={() => salvarNovaSenha(u.id, u.login)}
                          disabled={salvandoSenha}
                          style={{ padding: '7px 14px', background: salvandoSenha ? '#94a3b8' : '#1D9E75', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: salvandoSenha ? 'not-allowed' : 'pointer' }}
                        >
                          {salvandoSenha ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          onClick={cancelarAlteracaoSenha}
                          style={{ padding: '7px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Nota técnica visível apenas como lembrete de segurança para melhoria futura */}
            <p style={{ margin: '1rem 0 0', fontSize: 11, color: '#cbd5e1' }}>
              Nota: as senhas são armazenadas em texto simples no banco de dados atualmente.
            </p>
          </div>
        )}

        {/* Cards métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '1.5rem' }}>
          {[{ label: 'Hoje', valor: totalHoje }, { label: 'Este mês', valor: totalMes }, { label: 'Este ano', valor: totalAno }].map(card => (
            <div key={card.label} style={{ background: 'white', borderRadius: 12, padding: '1rem', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: '#64748b' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 600, color: '#0f172a' }}>{card.valor}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#1D9E75' }}>vistorias</p>
            </div>
          ))}
        </div>

        {/* Seletor de ano pros gráficos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Ano dos gráficos:</span>
          <select style={{ fontSize: 14, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', color: '#0f172a', outline: 'none' }} value={filtroAno} onChange={e => setFiltroAno(e.target.value)}>
            <option>2024</option><option>2025</option><option>2026</option>
          </select>
        </div>

        {/* Gráfico 1 — Vistorias por mês */}
        <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 1rem', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>📅 Vistorias por mês — {filtroAno}</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {vistoriasPorMes.map((qtd, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 10, color: '#64748b', fontWeight: qtd > 0 ? 600 : 400 }}>{qtd > 0 ? qtd : ''}</span>
                <div style={{ width: '100%', background: qtd > 0 ? '#1D9E75' : '#e2e8f0', borderRadius: '4px 4px 0 0', height: `${Math.max((qtd / maxMes) * 90, qtd > 0 ? 8 : 4)}px`, transition: 'height 0.3s' }} />
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{MESES[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 2 — Top 10 modelos */}
        <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>🚗 Top modelos vistorados — {filtroAno}</p>
            {demais.length > 0 && (
              <button onClick={() => setVerTodosModelos(!verTodosModelos)} style={{ fontSize: 12, color: '#1D9E75', background: '#E1F5EE', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 500 }}>
                {verTodosModelos ? 'Ver menos' : `Ver todos (${modelosOrdenados.length})`}
              </button>
            )}
          </div>
          {(verTodosModelos ? modelosOrdenados : top10).length === 0 ? (
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Nenhuma vistoria neste ano ainda.</p>
          ) : (
            (verTodosModelos ? modelosOrdenados : top10).map(([modelo, qtd], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#64748b', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: '#0f172a', width: 180, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{modelo}</span>
                <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${(qtd / maxModelo) * 100}%`, height: '100%', background: '#1D9E75', borderRadius: 4, transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', width: 24, textAlign: 'right', flexShrink: 0 }}>{qtd}</span>
              </div>
            ))
          )}
        </div>

        {/* Filtros + Exportar */}
        <div style={{ background: 'white', borderRadius: 12, padding: '1rem', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              style={{ flex: 2, minWidth: 160, fontSize: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', color: '#0f172a', outline: 'none' }}
              placeholder="Buscar por placa, modelo ou responsável..."
              value={buscaRascunho}
              onChange={e => setBuscaRascunho(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscarNaTabela()}
            />
            <select style={{ flex: 1, minWidth: 100, fontSize: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', color: '#0f172a', outline: 'none' }} value={anoRascunho} onChange={e => setAnoRascunho(e.target.value)}>
              <option value="">Todos os anos</option>
              <option>2024</option><option>2025</option><option>2026</option>
            </select>
            <select style={{ flex: 1, minWidth: 100, fontSize: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', color: '#0f172a', outline: 'none' }} value={mesRascunho} onChange={e => setMesRascunho(e.target.value)}>
              <option value="">Todos os meses</option>
              <option value="01">Janeiro</option><option value="02">Fevereiro</option>
              <option value="03">Março</option><option value="04">Abril</option>
              <option value="05">Maio</option><option value="06">Junho</option>
              <option value="07">Julho</option><option value="08">Agosto</option>
              <option value="09">Setembro</option><option value="10">Outubro</option>
              <option value="11">Novembro</option><option value="12">Dezembro</option>
            </select>
            <select style={{ flex: 1, minWidth: 110, fontSize: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', color: '#0f172a', outline: 'none' }} value={qualidadeRascunho} onChange={e => setQualidadeRascunho(e.target.value)}>
              <option value="">Todas as qualidades</option>
              <option value="Bom">Bom</option>
              <option value="Regular">Regular</option>
              <option value="Repasse">Repasse</option>
            </select>
            <button onClick={buscarNaTabela} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>🔍 Buscar</button>
            <button onClick={exportarExcel} style={{ padding: '8px 16px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>📥 Exportar Excel</button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>{filtradas.length} vistoria{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Tabela histórico */}
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 80px 90px 80px', gap: 8, padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {['Placa', 'Modelo', 'KM', 'Data', 'Qualidade'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>
          {carregando ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: 14 }}>Carregando vistorias...</div>
          ) : filtradas.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: 14 }}>Nenhuma vistoria encontrada.</div>
          ) : (
            filtradas.map((v, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 80px 90px 80px', gap: 8, padding: '11px 14px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1D9E75', fontFamily: 'monospace' }}>{v.placa}</span>
                <span style={{ fontSize: 13, color: '#0f172a' }}>{v.modelo}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{v.km_atual?.toLocaleString()} km</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{v.data_vistoria}</span>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: v.qualidade === 'Bom' ? '#DCFCE7' : v.qualidade === 'Regular' ? '#FEF9C3' : '#FEE2E2', color: v.qualidade === 'Bom' ? '#15803D' : v.qualidade === 'Regular' ? '#A16207' : '#B91C1C' }}>
                  {v.qualidade || '-'}
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  )
}
