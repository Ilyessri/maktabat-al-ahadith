// Edge function: returns Arabic synonyms for a keyword via Lovable AI
// CORS-enabled, public (verify_jwt = false in config.toml)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { keyword } = await req.json();
    if (!keyword || typeof keyword !== "string") {
      return new Response(JSON.stringify({ error: "keyword required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "أنت معجم عربي متخصص. أعطِ مرادفات وكلمات قريبة المعنى للكلمة المعطاة باللغة العربية الفصحى فقط. أعد النتيجة كاستدعاء أداة فقط.",
          },
          {
            role: "user",
            content: `الكلمة: ${keyword}\nأعطني من 5 إلى 10 مرادفات أو كلمات قريبة المعنى.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_synonyms",
              description: "Return Arabic synonyms for the keyword",
              parameters: {
                type: "object",
                properties: {
                  synonyms: { type: "array", items: { type: "string" } },
                },
                required: ["synonyms"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_synonyms" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات. حاول لاحقا." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "نفدت رصيد الذكاء الاصطناعي. يرجى الإضافة." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let synonyms: string[] = [];
    try {
      synonyms = JSON.parse(args || "{}").synonyms ?? [];
    } catch (e) {
      console.error("parse error", e, args);
    }

    return new Response(JSON.stringify({ synonyms }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-synonyms error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
