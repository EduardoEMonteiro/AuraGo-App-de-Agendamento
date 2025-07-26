import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
const SibApiV3Sdk = require("@sendinblue/client");

admin.initializeApp();

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  functions.config().brevo.key
);

export const enviarConvite = functions
  .region("southamerica-east1")
  .firestore.document("saloes/{idSalao}/convites/{conviteId}")
  .onCreate(async (snap, context) => {
    const dadosConvite = snap.data();

    if (!dadosConvite) {
      console.error("Erro: Documento do convite não encontrado ou vazio.");
      return;
    }

    console.log(`[Início] Processando convite para: ${dadosConvite.email}`);

    // --- BUSCA O NOME DO SALÃO ---
    let nomeSalao = "";
    try {
      const salaoSnap = await admin.firestore().doc(`saloes/${context.params.idSalao}`).get();
      nomeSalao = salaoSnap.data()?.nome || "";
    } catch (e) {
      console.error("Erro ao buscar nome do salão:", e);
    }

    const idDoTemplate = 1; // ID do seu template Brevo
    const remetenteVerificado = "noreply@aura.bloomts.com.br";
    const nomeDoRemetente = "Aura Bloom";

    const linkDeCadastro = `https://aura.bloomts.com.br/convite?id=${context.params.conviteId}`;

    const emailParaEnviar = {
      to: [{ email: dadosConvite.email, name: dadosConvite.nome }],
      templateId: idDoTemplate,
      params: {
        NOME: dadosConvite.nome,
        NOME_SALAO: nomeSalao,
        LINK_CADASTRO: linkDeCadastro,
      },
      sender: {
        name: nomeDoRemetente,
        email: remetenteVerificado,
      },
    };

    try {
      const data = await apiInstance.sendTransacEmail(emailParaEnviar);
      console.log("[Sucesso] Email enviado pela API da Brevo. Resposta:", JSON.stringify(data));
    } catch (error) {
      console.error("[ERRO CRÍTICO] Falha ao enviar email:", error);
    }
  }); 