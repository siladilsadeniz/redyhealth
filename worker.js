const allowedRoles = new Set([
  "Araştırma kurumu",
  "Yatırımcı",
  "Klinik / sağlık partneri",
  "Topluluk ve medya"
]);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method Not Allowed" }, 405);
    }

    try {
      const data = await request.json();
      const email = String(data.email || "").trim();
      const role = String(data.role || "").trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({ error: "Geçerli bir e-posta adresi gerekli." }, 400);
      }

      if (!allowedRoles.has(role)) {
        return jsonResponse({ error: "Geçersiz ilgi alanı." }, 400);
      }

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "website@redyhealth.co",
          to: ["partnerships@redyhealth.co"],
          reply_to: email,
          subject: `Yeni REDY iletişim formu: ${role}`,
          text: `E-posta: ${email}\nİlgi alanı: ${role}`
        })
      });

      if (!resendResponse.ok) {
        return jsonResponse({ error: "E-posta gönderilemedi." }, 502);
      }

      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ error: "Geçersiz istek." }, 400);
    }
  }
};
