const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret_key);

admin.initializeApp();
const db = admin.firestore();

exports.createStripeCheckout = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
    return;
  }

  try {
    const { priceId, idSalao } = req.body;
    if (!priceId || !idSalao) {
      throw new Error("O ID do Preço (priceId) e o ID do Salão (idSalao) são obrigatórios.");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: idSalao,
      success_url: "meuapp://checkout/sucesso",
      cancel_url: "meuapp://checkout/cancelado",
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Erro em createStripeCheckout:", error);
    res.status(500).send("Erro interno do servidor.");
  }
});

exports.stripeWebhookHandler = functions.https.onRequest(async (req, res) => {
  const endpointSecret = "whsec_giDhXCdiziH2JZ8SoilySeHXUVy5y6Tl";
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("⚠️ Erro na verificação do webhook:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const idSalao = session.client_reference_id;

    try {
      console.log(`✅ Pagamento bem-sucedido para o salão: ${idSalao}`);
      
      const salaoRef = db.collection("saloes").doc(idSalao);
      await salaoRef.update({
        plano: "essencial",
        stripeCustomerId: session.customer,
        statusAssinatura: "ativa"
      });
      console.log(`Firestore atualizado com sucesso para o salão ${idSalao}.`);
    } catch (dbError) {
      console.error(`Erro ao atualizar o Firestore para o salão ${idSalao}:`, dbError);
    }
  }

  res.status(200).send();
});

exports.createStripePortalSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
  }

  const customerId = data.customerId;
  if (!customerId) {
    throw new functions.https.HttpsError("invalid-argument", "O ID do cliente Stripe (customerId) é obrigatório.");
  }

  const returnUrl = "meuapp://configuracoes";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  } catch (error) {
    console.error("Erro ao criar sessão do portal Stripe:", error);
    throw new functions.https.HttpsError("internal", "Não foi possível criar a sessão do portal.");
  }
});
