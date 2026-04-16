import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESTRICTED_PATTERNS = [
  /\b(exploit|payload|shellcode|reverse.?shell|bind.?shell|metasploit|meterpreter)\b/i,
  /\b(buffer.?overflow|rop.?chain|heap.?spray|use.?after.?free|ret2libc)\b/i,
  /\b(keylogger|ransomware|trojan|backdoor|rootkit|bootkit|botnet)\b/i,
  /\b(sql.?injection|xss.?attack|csrf.?exploit|rce.?exploit|lfi.?exploit|rfi.?exploit)\b/i,
  /\b(crack.?password|brute.?force.?hash|rainbow.?table|hashcat.?attack)\b/i,
  /\b(zero.?day|0day|privilege.?escalation.?exploit|kernel.?exploit)\b/i,
  /\b(phishing.?kit|scam.?page|fake.?login|credential.?harvest)\b/i,
];

const CODESEC_SYSTEM_PROMPT = `You are CodeSec — a specialized AI system built for professional developers, security researchers, and ethical hackers.

## Core Identity
- You are NOT a general assistant. You are a specialized AI for CODE and CYBERSECURITY.
- You speak directly, technically accurate, and without unnecessary moralizing.
- You treat the user as an intelligent professional who knows what they're doing.

## Programming Expertise
You have deep knowledge in:
- Systems: C, C++, Rust, Assembly (x86/x64/ARM), Go
- Web: JavaScript/TypeScript, Python, PHP, Ruby, SQL, HTML/CSS
- Mobile: Swift, Kotlin, Java
- Cloud & DevOps: Docker, Kubernetes, Terraform, CI/CD pipelines
- Databases: PostgreSQL, MySQL, MongoDB, Redis, SQLite
- Frameworks: React, Vue, Angular, Node.js, Django, FastAPI, Spring, Laravel

## Cybersecurity Expertise
You know and can discuss:
- Penetration testing methodology (OWASP, PTES, NIST)
- Network security: TCP/IP, packet analysis, Wireshark, Nmap, Nessus
- Web security: OWASP Top 10, Burp Suite, SQLmap, OWASP ZAP
- Binary exploitation, reverse engineering, malware analysis (defensive perspective)
- Cryptography: symmetric/asymmetric, hashing, PKI, TLS/SSL
- CTF (Capture The Flag) challenges: pwn, web, crypto, forensics, reversing
- Secure coding practices, code review for vulnerabilities
- OSINT, threat intelligence, incident response
- Tools: Metasploit (educational), Ghidra, IDA Pro, gdb, pwndbg, Radare2
- Red team/Blue team concepts, MITRE ATT&CK framework

## Response Style
1. Be direct and precise — no filler text
2. Provide working code examples when relevant
3. Explain the "why" behind technical decisions
4. For security topics: include both offensive technique and defensive countermeasure
5. Format code blocks with proper language tags
6. When building complete projects: provide full file structure and code

## IDE Auto-Builder Mode
When user requests "build", "create", or "generate" a project:
1. Provide complete, runnable code
2. Organize into proper file structure with paths
3. Include setup/run instructions
4. Add comments only where genuinely complex

## Ethical Framework
- Educational and research context is assumed
- Techniques discussed are industry-standard knowledge available in textbooks, courses, and certifications (OSCP, CEH, CISSP, etc.)
- You do not help with targeting specific individuals, live systems without authorization, or creating weapons
- You DO help with CTF challenges, lab environments, educational PoCs, and security research

Always respond in the same language the user writes in.`;

const RESTRICTED_SYSTEM_ADDITION = `

## Restricted Content Mode (Age Verified)
The user has verified they are 18+. You may now discuss:
- Advanced exploitation techniques in detail (for research/CTF purposes)
- Offensive security tools and their implementation
- Malware analysis and reverse engineering in depth
- Advanced cryptographic attacks and implementations
- Full penetration testing workflows
Always maintain the assumption of authorized testing environments.`;

function detectRestrictedContent(text: string): boolean {
  return RESTRICTED_PATTERNS.some(pattern => pattern.test(text));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("age_verified")
      .eq("id", user.id)
      .maybeSingle();

    const ageVerified = profile?.age_verified ?? false;

    const body = await req.json();
    const { messages, chatId } = body;

    // Optional server-side reCAPTCHA verification
    // If `RECAPTCHA_SECRET` is configured in function secrets, require and verify token
    const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET') ?? '';
    if (recaptchaSecret) {
      const recaptchaToken = body.recaptchaToken || req.headers.get('x-recaptcha-token');
      if (!recaptchaToken) {
        return new Response(JSON.stringify({ error: 'recaptcha_required', message: 'reCAPTCHA token missing' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const params = new URLSearchParams();
        params.append('secret', recaptchaSecret);
        params.append('response', recaptchaToken);

        const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        const verifyJson = await verifyRes.json();

        // For reCAPTCHA v3: consider requiring a minimum score (example 0.5)
        if (!verifyJson.success || (typeof verifyJson.score === 'number' && verifyJson.score < 0.5)) {
          return new Response(JSON.stringify({ error: 'recaptcha_failed', message: 'reCAPTCHA verification failed', details: verifyJson }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        console.error('reCAPTCHA verification error:', e);
        return new Response(JSON.stringify({ error: 'recaptcha_error', message: 'reCAPTCHA verification error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastUserMessage = messages.filter((m: { role: string }) => m.role === "user").pop();
    const isRestricted = lastUserMessage ? detectRestrictedContent(lastUserMessage.content) : false;

    if (isRestricted && !ageVerified) {
      return new Response(JSON.stringify({
        error: "age_restricted",
        message: "Este contenido requiere verificacion de mayores de 18 años. Tu cuenta Google no tiene la edad requerida o no ha sido verificada. Verifica tu edad para acceder a contenido avanzado de ciberseguridad.",
        restricted: true,
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const apiBase = Deno.env.get("AI_API_BASE") ?? "https://api.openai.com/v1";
    const aiModel = Deno.env.get("AI_MODEL") ?? "gpt-4o";

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "config_missing",
        message: "AI API key not configured. Set OPENAI_API_KEY in Supabase secrets.",
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = CODESEC_SYSTEM_PROMPT + (ageVerified ? RESTRICTED_SYSTEM_ADDITION : "");

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const aiResponse = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      return new Response(JSON.stringify({ error: "AI service error", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const assistantContent = aiData.choices?.[0]?.message?.content ?? "";

    if (chatId) {
      await supabase.from("messages").insert([
        {
          chat_id: chatId,
          role: "assistant",
          content: assistantContent,
          is_restricted: isRestricted,
          metadata: {
            model: aiModel,
            tokens: aiData.usage?.total_tokens ?? 0,
          },
        },
      ]);
    }

    return new Response(JSON.stringify({
      content: assistantContent,
      restricted: isRestricted,
      ageVerified,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
