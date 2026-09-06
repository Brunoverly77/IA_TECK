// ENDPOINT DESATIVADO
//
// Este era o fluxo antigo do IA TECK, que criava uma planilha no Google Sheets
// por usuario. O app hoje usa Supabase (ver src/pages/Painel/Painel.jsx) e nada
// mais chama esta rota.
//
// Ficou desativado porque a versao anterior:
//   - nao exigia login, entao qualquer um podia disparar criacao de planilhas
//     e envio de e-mails pela conta do Gmail configurada;
//   - compartilhava cada planilha com `role: 'reader', type: 'anyone'`, ou seja,
//     os dados financeiros ficavam acessiveis publicamente por link.
//
// O codigo original continua no historico do git, caso o fluxo precise voltar.
// Se voltar, precisa nascer com autenticacao e sem compartilhamento publico.

export default async function handler(req, res) {
  return res.status(410).json({
    error: 'Esta rota foi descontinuada. Use o painel em https://iateck.com.br'
  })
}
