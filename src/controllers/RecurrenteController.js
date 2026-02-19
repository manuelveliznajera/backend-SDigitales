// controllers/RecurrenteController.js

export const createCheckout = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const { products, customer_email } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "No hay productos en la orden" });
    }

    // Validar productos
    const invalidProducts = products.filter(
      p => !p.name || typeof p.precio !== "number" || typeof p.cantidad !== "number" || p.cantidad <= 0
    );

    if (invalidProducts.length > 0) {
      return res.status(400).json({ error: "Algunos productos son inválidos", invalidProducts });
    }

    // Transformar productos al formato Recurrente
    const items = products.map(p => ({
      name: p.name,
      currency: "GTQ",
      amount_in_cents: Math.round(p.precio * 100),
      quantity: p.cantidad,
      image_url: p.url || undefined
    }));

    const totalAmount = items.reduce((acc, item) => acc + item.amount_in_cents * item.quantity, 0);

    const payload = JSON.stringify({
      items,
      success_url: "https://www.google.com",  // reemplaza con tu URL de éxito
      cancel_url: "https://www.amazon.com",   // reemplaza con tu URL de cancelación
      user_id: customer_email || "usuario_default",
      metadata: { totalAmount }
    });

    console.log("Payload Recurrente:", payload);

    const response = await fetch("https://app.recurrente.com/api/checkouts/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SECRET-KEY": process.env.SECRETKEY,
        "X-PUBLIC-KEY": process.env.PUBLICKEY
      },
      body: payload
    });

    const data = await response.json();
    console.log("Respuesta Recurrente:", data);

    if (!data.checkout_url) {
      return res.status(500).json({ error: "No se pudo crear el checkout", data });
    }

    res.json({ checkout_url: data.checkout_url });
  } catch (error) {
    console.error("Error creando checkout:", error);
    res.status(500).json({ error: error.message || error });
  }
};