import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// A chave da API do Resend NÃO fica mais escrita aqui no código — antes ela
// estava hardcoded, o que a deixava exposta publicamente no GitHub (o
// repositório é público). Agora ela vem de uma variável de ambiente
// configurada no Vercel (RESEND_API_KEY), que nunca aparece no código-fonte.
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY não está configurada nas variáveis de ambiente do Vercel.')
      return NextResponse.json(
        { success: false, error: 'Servidor de email não configurado (RESEND_API_KEY ausente).' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { pdfBase64, dadosVistoria } = body

    const { data, error } = await resend.emails.send({
      from: 'Rotacar Vistoria <onboarding@resend.dev>',
      to: ['vistoriasrotacar@gmail.com'],
      subject: `🚗 Nova vistoria — ${dadosVistoria.placa} | ${dadosVistoria.modelo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1D9E75; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">🚗 Nova Vistoria de Entrada</h1>
            <p style="color: #E1F5EE; margin: 4px 0 0; font-size: 14px;">Rotacar Locadora — Sistema Digital</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-size: 13px; color: #64748b; font-weight: bold;">PLACA</td>
                <td style="padding: 8px; font-size: 14px; color: #0f172a; font-weight: bold;">${dadosVistoria.placa}</td>
                <td style="padding: 8px; font-size: 13px; color: #64748b; font-weight: bold;">MODELO</td>
                <td style="padding: 8px; font-size: 14px; color: #0f172a;">${dadosVistoria.modelo}</td>
              </tr>
              <tr style="background: white;">
                <td style="padding: 8px; font-size: 13px; color: #64748b; font-weight: bold;">COR</td>
                <td style="padding: 8px; font-size: 14px; color: #0f172a;">${dadosVistoria.cor}</td>
                <td style="padding: 8px; font-size: 13px; color: #64748b; font-weight: bold;">ANO</td>
                <td style="padding: 8px; font-size: 14px; color: #0f172a;">${dadosVistoria.ano}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-size: 13px; color: #64748b; font-weight: bold;">KM</td>
                <td style="padding: 8px; font-size: 14px; color: #0f172a;">${dadosVistoria.km} km</td>
                <td style="padding: 8px; font-size: 13px; color: #64748b; font-weight: bold;">FIPE</td>
                <td style="padding: 8px; font-size: 14px; color: #0f172a;">${dadosVistoria.fipe}</td>
              </tr>
              <tr style="background: white;">
                <td style="padding: 8px; font-size: 13px; color: #64748b; font-weight: bold;">QUALIDADE</td>
                <td style="padding: 8px; font-size: 14px; color: #0f172a;">${dadosVistoria.qualidade}</td>
                <td style="padding: 8px; font-size: 13px; color: #64748b; font-weight: bold;">COMBUSTÍVEL</td>
                <td style="padding: 8px; font-size: 14px; color: #0f172a;">${dadosVistoria.combustivel}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-size: 13px; color: #64748b; font-weight: bold;">RESPONSÁVEL</td>
                <td style="padding: 8px; font-size: 14px; color: #0f172a;">${dadosVistoria.responsavel}</td>
                <td style="padding: 8px; font-size: 13px; color: #64748b; font-weight: bold;">VALIDAÇÃO</td>
                <td style="padding: 8px; font-size: 14px; color: #0f172a;">${dadosVistoria.validacao || '-'}</td>
              </tr>
              <tr style="background: white;">
                <td style="padding: 8px; font-size: 13px; color: #64748b; font-weight: bold;">DATA</td>
                <td style="padding: 8px; font-size: 14px; color: #0f172a;">${dadosVistoria.data}</td>
                <td style="padding: 8px; font-size: 13px; color: #64748b; font-weight: bold;">HORA</td>
                <td style="padding: 8px; font-size: 14px; color: #0f172a;">${dadosVistoria.hora}</td>
              </tr>
            </table>

            ${dadosVistoria.observacoes ? `
            <div style="margin-top: 16px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px; font-size: 13px; color: #64748b; font-weight: bold;">OBSERVAÇÕES</p>
              <p style="margin: 0; font-size: 14px; color: #0f172a;">${dadosVistoria.observacoes}</p>
            </div>` : ''}

            ${dadosVistoria.pneus?.length ? `
            <div style="margin-top: 16px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: bold;">PNEUS</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #0f172a;">
                ${dadosVistoria.pneus.map((p: any) => `
                <tr>
                  <td style="padding: 4px 8px 4px 0; font-weight: bold; white-space: nowrap;">${p.posicao}</td>
                  <td style="padding: 4px 8px;">${p.marcaReferencia || '-'}</td>
                  <td style="padding: 4px 0; white-space: nowrap;">${p.status || '-'}</td>
                </tr>`).join('')}
              </table>
            </div>` : ''}

            <div style="margin-top: 16px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: bold;">ITENS DO VEÍCULO</p>
              <p style="margin: 0; font-size: 14px; color: #0f172a;">${dadosVistoria.itens?.join(' ✅ ') || 'Nenhum item marcado'}</p>
            </div>
          </div>
          <div style="background: #1D9E75; padding: 12px 20px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="color: white; margin: 0; font-size: 12px;">O laudo completo em PDF está anexado neste email.</p>
          </div>
        </div>
      `,
      attachments: pdfBase64 ? [
        {
          filename: `vistoria_${dadosVistoria.placa}_${dadosVistoria.data}.pdf`,
          content: pdfBase64,
        }
      ] : [],
    })

    // PONTO-CHAVE DA CORREÇÃO: antes, mesmo quando "error" vinha preenchido aqui,
    // o page.tsx nunca checava a resposta desta API — então o card verde de
    // "sucesso" aparecia na tela mesmo quando o Resend recusava o envio. Este log
    // fica registrado nos Logs da Vercel (Deployments → clique no deploy →
    // Functions → Logs), útil para diagnosticar sem depender só do print da tela.
    if (error) {
      console.error('❌ Resend recusou o envio do email:', error)
      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    console.log('✅ Email enviado com sucesso via Resend. ID:', data?.id)
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('❌ Erro inesperado ao tentar enviar email:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
