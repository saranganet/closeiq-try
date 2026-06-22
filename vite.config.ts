import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// In-Memory Dev Stores for Vite dev server plugin
const viteDealStore = new Map();
const viteSessionStore = new Map();

function extractCompanyName(urlStr?: string): string {
  if (!urlStr) return 'Target Enterprise';
  try {
    const cleanUrl = urlStr.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    const domain = cleanUrl.split('/')[0].split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Target Enterprise';
  }
}

async function fetchCompanySnippet(urlStr: string): Promise<string> {
  if (!urlStr) return '';
  try {
    const formattedUrl = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    clearTimeout(timer);
    if (!res.ok) return '';
    const html = await res.text();
    
    // Extract title & meta description
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) || 
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i) ||
                          html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    
    const title = titleMatch ? titleMatch[1].trim() : '';
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';
    
    // Clean raw visible text
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1200);

    return `Website Title: ${title}\nMeta Summary: ${metaDesc}\nPage Text: ${cleanText}`;
  } catch (err) {
    return '';
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'backend-persona-api',
      configureServer(server) {
        server.middlewares.use(express.json({ limit: '10mb' }));

        server.middlewares.use(async (req: any, res, next) => {
          const url = req.url || '';

          // 1. DEAL GENERATOR / RESEARCH: POST /api/deal/generate & POST /api/deal/research
          if ((url.startsWith('/api/deal/generate') || url.startsWith('/api/deal/research')) && req.method === 'POST') {
            try {
              const body = req.body || {};
              const targetCompany = extractCompanyName(body.target_url);
              const sellerCompany = extractCompanyName(body.seller_url || 'https://closeiq.in');
              const dealId = `deal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

              const geminiApiKey = body.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
              const groqApiKey = body.customApiKey?.trim() || process.env.GROQ_API_KEY?.trim();

              const productName = body.product_name?.trim() || 'AI Sales Copilot & Roleplay Simulator';
              const productDescription = body.product_description?.trim() || 'Real-time call assistance, objection handling cues, and hyper-realistic roleplay training.';
              const personaTitle = body.target_persona_title?.trim() || 'VP of Sales';
              const personaName = body.target_persona_name?.trim() || 'Sarah Chen';

              // Fetch real live website snippets for ground truth
              const [targetScrapedData, sellerScrapedData] = await Promise.all([
                fetchCompanySnippet(body.target_url),
                fetchCompanySnippet(body.seller_url || 'https://closeiq.in'),
              ]);

              let dealContext: any = null;

              // Helper for timed promises
              const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
                return Promise.race([
                  promise,
                  new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
                ]);
              };

              const researchPrompt = `
You are an elite enterprise sales strategist and buyer persona researcher.
Perform authentic, highly-accurate intelligence gathering and sales strategy synthesis for an upcoming high-stakes sales call.

TARGET COMPANY:
- Website: ${body.target_url} (${targetCompany})
- Target Buyer Role: ${personaTitle} (${personaName})
- LIVE SCRAPED WEBSITE FOOTPRINT:
"""
${targetScrapedData || 'Target company domain: ' + targetCompany + ' (' + body.target_url + ')'}
"""

SELLER COMPANY:
- Website: ${body.seller_url || 'https://closeiq.in'} (${sellerCompany})
- Product Being Sold: ${productName}
- Product Capabilities & Pitch: ${productDescription}
- Playbook / Sales Collateral: ${body.playbook_text?.slice(0, 1500) || 'Focus on discovery, ROI quantification, and competitor objection handling.'}
- LIVE SCRAPED SELLER FOOTPRINT:
"""
${sellerScrapedData || 'Seller company platform: ' + sellerCompany}
"""

RESEARCH OBJECTIVES:
1. Target Company Reality Check: What does ${targetCompany} ACTUALLY do based on their website footprint? (e.g. if they are an AI interview / recruitment platform like InCruiter, explain their exact service). Describe their real industry, product offerings, target buyers, tech stack, and strategic priorities.
2. Seller Solution Mapping: How does ${sellerCompany}'s product (${productName}) specifically help ${targetCompany}'s team solve their acute bottlenecks?
3. Pain Points: Identify 4-6 specific, acute pain points ${targetCompany} faces in their daily operations, revenue generation, or team execution.
4. Value Propositions & How to Sell:
   - "How to Target": Strategic hook and angle of attack tailored to ${targetCompany}'s actual business.
   - "How to Sell": Value proposition points with quantifiable impact metrics.
   - Seller Action Playbook: "What to Mention" (3 items), "What to Do" (3 items), "What to Avoid" (3 items), and "Key Differentiators" (3 items).
5. Discovery Questions: 4-5 high-leverage questions to uncover pain, urgency, and budget.
6. Likely Objections & Battlecard: 3-4 realistic buyer objections (pricing, competition, timing, complexity) with winning counter-tactics.
7. Buyer Persona Profile:
   - Psychological Matrix: openness (0-100), conscientiousness (0-100), extraversion (0-100), agreeableness (0-100), neuroticism (0-100).
   - Behavioral Matrix: directness (0-100), priceSensitivity (0-100), riskAversion (0-100), decisionSpeed (0-100), technicalDepth (0-100), patienceDecayRate (1-10).
   - Skepticism rationale: why they are skeptical and what proof they demand to say yes.
   - Realistic phone call system prompt.

Return ONLY valid JSON with exact structure:
{
  "target_company": "${targetCompany}",
  "target_company_url": "${body.target_url}",
  "target_company_description": "...",
  "seller_company": "${sellerCompany}",
  "seller_company_url": "${body.seller_url || 'https://closeiq.in'}",
  "seller_product_name": "${productName}",
  "seller_product_description": "${productDescription}",
  "seller_product_summary": "...",
  "company_summary": "...",
  "company_research": {
    "industry": "...",
    "companySize": "...",
    "techStack": ["...", "..."],
    "initiatives": ["...", "..."]
  },
  "seller_research": {
    "overview": "...",
    "key_capabilities": ["...", "..."],
    "unique_advantages": ["...", "..."]
  },
  "pain_points": ["...", "...", "...", "..."],
  "buyer_priorities": ["...", "...", "..."],
  "value_proposition": "...",
  "seller_value_propositions": [
    {
      "title": "...",
      "hook": "...",
      "what_to_mention": "...",
      "impact_metric": "..."
    }
  ],
  "seller_action_playbook": {
    "what_to_mention": ["...", "...", "..."],
    "what_to_do": ["...", "...", "..."],
    "what_to_avoid": ["...", "...", "..."],
    "key_differentiators": ["...", "...", "..."]
  },
  "discovery_questions": ["...", "...", "..."],
  "likely_objections": [
    {
      "title": "...",
      "category": "competition",
      "description": "...",
      "suggestedHandling": "..."
    }
  ],
  "talking_points": ["...", "...", "..."],
  "call_objective": "...",
  "target_persona": {
    "name": "${personaName}",
    "title": "${personaTitle}",
    "company": "${targetCompany}",
    "avatarUrl": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80",
    "voiceGender": "female",
    "skepticism_reason": "...",
    "winning_criteria": "...",
    "personality": {
      "openness": 60,
      "conscientiousness": 85,
      "extraversion": 60,
      "agreeableness": 45,
      "neuroticism": 55
    },
    "behavior": {
      "directness": 85,
      "priceSensitivity": 75,
      "riskAversion": 85,
      "decisionSpeed": 50,
      "technicalDepth": 75,
      "patienceDecayRate": 6
    }
  }
}
`.trim();

              // Priority 1: High-Speed Groq API Engine (openai/gpt-oss-120b) with 15s timeout
              if (groqApiKey && (groqApiKey.startsWith('gsk_') || groqApiKey.length > 20)) {
                try {
                  const groqCall = fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${groqApiKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      model: 'openai/gpt-oss-120b',
                      messages: [{ role: 'user', content: researchPrompt }],
                      temperature: 0.2,
                      response_format: { type: 'json_object' },
                    }),
                  });

                  const response = await withTimeout(groqCall, 15000);
                  if (response.ok) {
                    const resData: any = await response.json();
                    const jsonText = resData.choices?.[0]?.message?.content || '';
                    dealContext = JSON.parse(jsonText);
                  }
                } catch (err: any) {
                  console.warn('Groq Deal Research error, trying Gemini fallback:', err?.message || err);
                }
              }

              // Priority 2: Gemini API Fallback (gemini-2.5-flash) with 15s timeout
              if (!dealContext && geminiApiKey) {
                try {
                  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                  const geminiCall = ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: researchPrompt,
                    config: {
                      responseMimeType: 'application/json',
                      temperature: 0.2,
                      maxOutputTokens: 2500,
                    },
                  });

                  const response = await withTimeout(geminiCall, 15000);
                  const jsonText = response.text || '';
                  dealContext = JSON.parse(jsonText);
                } catch (err: any) {
                  console.warn('Gemini Deal Research timed out or failed:', err?.message || err);
                }
              }

              // Priority 3: Scraped-Aware Deterministic Synthesizer Fallback
              if (!dealContext) {
                const isInterviewOrHR = targetScrapedData.toLowerCase().includes('interview') || targetCompany.toLowerCase().includes('cruit');
                const isSecurity = targetScrapedData.toLowerCase().includes('security') || targetScrapedData.toLowerCase().includes('dspm');
                
                let detectedIndustry = 'Enterprise Technology & Cloud Services';
                let detectedSummary = `${targetCompany} is an innovative enterprise scaling operations and technology infrastructure.`;
                let detectedPain1 = `Scaling customer onboarding while maintaining strict quality control`;
                let detectedPain2 = `Coaching sales and customer success reps across technical customer objections`;
                
                if (isInterviewOrHR) {
                  detectedIndustry = 'AI Recruitment & HR Tech Solutions';
                  detectedSummary = `${targetCompany} is an AI-powered interview and recruitment automation platform (Interview as a Service, automated candidate screening, and video assessments) helping companies scale hiring.`;
                  detectedPain1 = `High sales rep ramp time when pitching enterprise HR and engineering talent leaders`;
                  detectedPain2 = `Handling competitive objections against legacy staffing and video interview platforms (e.g. HireVue, Talview)`;
                } else if (isSecurity) {
                  detectedIndustry = 'Cybersecurity & Cloud Compliance';
                  detectedSummary = `${targetCompany} specializes in cloud security, vulnerability management, and infrastructure protection.`;
                  detectedPain1 = `Long sales cycles with CISOs requiring deep technical validation and compliance proof`;
                  detectedPain2 = `Sales reps struggling to articulate unique DSPM differentiators live on calls`;
                }

                dealContext = {
                  target_company: targetCompany,
                  seller_company: sellerCompany,
                  seller_product_name: productName,
                  seller_product_description: productDescription,
                  seller_product_summary: `${productName} empowers revenue teams with real-time call guidance and hyper-realistic roleplay training.`,
                  company_summary: detectedSummary,
                  company_research: {
                    industry: detectedIndustry,
                    companySize: '200 - 1,000 employees',
                    techStack: ['Cloud SaaS Infrastructure', 'Salesforce CRM', 'HubSpot', 'Slack'],
                    initiatives: ['Enterprise Pipeline Growth', 'Sales Team Scaling', 'Accelerated Deal Closing'],
                  },
                  seller_research: {
                    overview: `${sellerCompany} develops ${productName} to supercharge enterprise revenue teams.`,
                    key_capabilities: ['Sub-800ms live call assistance', 'Voice-first AI roleplay simulator', 'Real-time objection detection'],
                    unique_advantages: ['Live in-call assistance vs passive post-call recording', 'Custom persona calibration'],
                  },
                  pain_points: [
                    detectedPain1,
                    detectedPain2,
                    `Inconsistent qualification and discovery during high-stakes enterprise sales calls`,
                    `Sales managers overwhelmed with manual deal coaching and review sessions`,
                  ],
                  buyer_priorities: [
                    'Shorten sales cycle duration and increase rep win rate',
                    'Zero disruption to existing tech stack and workflow',
                    'Fast ROI with measurable quota attainment',
                  ],
                  value_proposition: `Empower ${targetCompany}'s sales team to practice realistic objection scenarios and receive live call guidance to close deals faster.`,
                  seller_value_propositions: [
                    {
                      title: 'Accelerate Enterprise Win Rates by 35%',
                      hook: `Enable reps to practice difficult competitor scenarios specific to ${detectedIndustry} before speaking to live prospects.`,
                      what_to_mention: 'Custom ICP simulations and automated objection battlecards.',
                      impact_metric: '35% increase in call-to-close conversion'
                    },
                    {
                      title: 'Live Real-Time Call Co-Piloting',
                      hook: 'Surface the exact differentiation cue and discovery question at the second the buyer hesitates.',
                      what_to_mention: 'Unobtrusive, sub-800ms cues triggered by buyer hesitations.',
                      impact_metric: 'Cut lost deals due to missed objections by 40%'
                    }
                  ],
                  seller_action_playbook: {
                    what_to_mention: ['Live in-call guidance', 'Pre-call roleplays tailored to your ICP', 'Instant post-call scorecard'],
                    what_to_do: ['Ask about current enterprise deal conversion', 'Acknowledge existing tools before showing live co-pilot difference', 'Tie to revenue attainment'],
                    what_to_avoid: ['Do not pitch generic features before identifying sales bottlenecks', 'Do not make vague claims without metrics'],
                    key_differentiators: ['Real-time active guidance vs retrospective recording', 'Interactive voice simulation']
                  },
                  discovery_questions: [
                    `How are your reps currently handling tough competitor and pricing pushbacks on live calls?`,
                    `What is the current ramp time for a new sales hire at ${targetCompany} to hit full quota?`,
                    `Where in your pipeline do winnable deals lose momentum most frequently?`
                  ],
                  likely_objections: [
                    {
                      title: 'We already use Gong or record our calls for coaching.',
                      category: 'competition',
                      description: 'Prospect believes post-call analytics are sufficient.',
                      suggestedHandling: `Acknowledge Gong's strength for recording, then demonstrate how ${productName} assists reps live while the call is actually happening.`
                    },
                    {
                      title: 'Our managers prefer 1-on-1 coaching directly.',
                      category: 'authority',
                      description: 'Relies solely on manual manager coaching.',
                      suggestedHandling: 'Explain that automated practice frees managers from repetitive drills to focus purely on high-value closing.'
                    },
                    {
                      title: 'Concern about adding another tool to the rep workflow.',
                      category: 'complexity',
                      description: 'Wants zero friction for sales reps.',
                      suggestedHandling: 'Highlight the lightweight, unobtrusive floating overlay that requires zero manual data entry.'
                    }
                  ],
                  talking_points: [
                    'Pre-call practice on hyper-realistic buyer personas',
                    'Sub-800ms live co-pilot guidance during live phone calls',
                    'Instant objective post-call scorecard and weakness detection'
                  ],
                  call_objective: 'Secure agreement for a 14-day live pilot evaluation with 5 sales reps.',
                  target_persona: {
                    name: personaName,
                    title: personaTitle,
                    company: targetCompany,
                    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80',
                    voiceGender: 'female',
                    skepticism_reason: `Demands clear proof that ${productName} will tangibly impact revenue without adding complexity.`,
                    winning_criteria: `Live demonstration showing how reps handle tough competitor objections with confidence.`
                  }
                };
              }

              dealContext.deal_id = dealId;
              dealContext.target_company_url = body.target_url;
              dealContext.seller_company_url = body.seller_url || 'https://closeiq.in';
              dealContext.seller_product_name = productName;
              dealContext.seller_product_description = productDescription;
              dealContext.sales_playbook = {
                filename: body.playbook_name || 'Uploaded_Playbook.pdf',
                summary: body.playbook_text ? body.playbook_text.slice(0, 300) : 'Playbook loaded: Focus on discovery, pain quantification, and competitor reframing.',
                contentSnippet: body.playbook_text?.slice(0, 1000) || '',
              };
              dealContext.created_at = Date.now();

              // Construct full Persona object for roleplay engine
              // Normalize seller_value_propositions to ensure complete objects
              if (!Array.isArray(dealContext.seller_value_propositions) || dealContext.seller_value_propositions.length === 0) {
                dealContext.seller_value_propositions = [
                  {
                    title: `Accelerate Operational Efficiency for ${targetCompany}`,
                    hook: `Empower ${targetCompany}'s team to streamline bottlenecks with high precision and faster turnaround.`,
                    what_to_mention: `Dedicated workflows tailored specifically to ${targetCompany}'s operational goals.`,
                    impact_metric: '40% efficiency boost'
                  },
                  {
                    title: 'Measurable Time-to-Value & ROI',
                    hook: `Reduce ramp-up friction and deliver quantifiable productivity metrics in under 30 days.`,
                    what_to_mention: `Automated benchmarks and performance tracking dashboards.`,
                    impact_metric: '3X faster adoption'
                  }
                ];
              } else {
                dealContext.seller_value_propositions = dealContext.seller_value_propositions.map((vp: any, idx: number) => {
                  if (typeof vp === 'string') {
                    return {
                      title: `Strategic Value Driver #${idx + 1}`,
                      hook: vp,
                      what_to_mention: vp,
                      impact_metric: 'High Impact'
                    };
                  }
                  return {
                    title: vp.title || vp.name || vp.headline || `Strategic Value Driver #${idx + 1}`,
                    hook: vp.hook || vp.pitch || vp.description || vp.value || 'Deliver measurable operational impact and team efficiency.',
                    what_to_mention: vp.what_to_mention || vp.mention || vp.tactics || vp.description || vp.hook || 'Highlight workflow integration and immediate efficiency gains.',
                    impact_metric: vp.impact_metric || vp.metric || vp.roi || vp.impact || 'Proven ROI'
                  };
                });
              }

              // Normalize likely_objections
              if (!Array.isArray(dealContext.likely_objections) || dealContext.likely_objections.length === 0) {
                dealContext.likely_objections = [
                  {
                    title: `We already have existing processes in place at ${targetCompany}.`,
                    category: 'competition',
                    description: 'Prospect relies on legacy workflows and tools.',
                    suggestedHandling: 'Acknowledge current setup and highlight the unique real-time differentiation.'
                  }
                ];
              } else {
                dealContext.likely_objections = dealContext.likely_objections.map((obj: any) => {
                  if (typeof obj === 'string') {
                    return {
                      title: obj,
                      category: 'competition',
                      description: obj,
                      suggestedHandling: 'Acknowledge their concern and provide verifiable data points.'
                    };
                  }
                  return {
                    title: obj.title || obj.objection || obj.name || 'Concern regarding tool adoption and workflow integration.',
                    category: obj.category || 'process',
                    description: obj.description || obj.reason || obj.title || 'Prospect is cautious about adopting new technology.',
                    suggestedHandling: obj.suggestedHandling || obj.response || obj.counter || obj.rebuttal || 'Demonstrate frictionless setup and measurable ROI.'
                  };
                });
              }

              const targetObj = dealContext.likely_objections?.[0] || {
                title: 'We already use an existing solution and our current process works fine.',
                suggestedHandling: 'Acknowledge their current setup and demonstrate how our live assistance eliminates lost deals.',
                category: 'competition'
              };

              const builtPersona = {
                id: `persona-${dealId}`,
                deal_id: dealId,
                name: dealContext.target_persona?.name || personaName,
                title: dealContext.target_persona?.title || personaTitle,
                company: targetCompany,
                avatarUrl: dealContext.target_persona?.avatarUrl || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80',
                voiceGender: dealContext.target_persona?.voiceGender || 'female',
                personality: dealContext.target_persona?.personality || { openness: 60, conscientiousness: 85, extraversion: 60, agreeableness: 45, neuroticism: 55 },
                behavior: dealContext.target_persona?.behavior || { directness: 85, priceSensitivity: 75, riskAversion: 85, decisionSpeed: 50, technicalDepth: 75, patienceDecayRate: 6 },
                communication: { speechRateMultiplier: 1.05, pauseFrequency: 'medium', hesitationFrequency: 'medium', vocabularyLevel: 'business', sentenceLengthTarget: 'short', interruptionSensitivity: 80 },
                knowledge: {
                  industry: dealContext.company_research?.industry || 'Enterprise Technology',
                  companySize: dealContext.company_research?.companySize || '500+ employees',
                  techStack: dealContext.company_research?.techStack || ['AWS', 'Salesforce CRM'],
                  currentPainPoints: dealContext.pain_points || [],
                  competitorsEvaluated: ['Gong', 'Legacy Coaching'],
                  budgetRange: '$50k - $150k / year',
                  companyDescription: dealContext.company_summary,
                  servicesProvided: dealContext.company_research?.initiatives?.join(', '),
                  currentNeeds: dealContext.value_proposition,
                },
                initialState: {
                  trustScore: 35,
                  mood: 'skeptical',
                  patienceLevel: 75,
                  buyingIntent: 30,
                  perceivedValue: 35,
                  riskPerception: 80,
                  turnCount: 0,
                  activeObjections: [
                    {
                      id: `obj-deal-${dealId}`,
                      category: targetObj?.category || 'competition',
                      title: targetObj?.title || 'We already use Gong and our managers coach reps.',
                      description: targetObj?.description || 'Prospect believes existing post-call recording tools are sufficient.',
                      triggerThreshold: { maxTrust: 60 },
                      hidden: false,
                      isResolved: false,
                      resolutionCriteria: targetObj?.suggestedHandling || 'Explain difference between live real-time call guidance vs. post-call recording.',
                    }
                  ],
                  resolvedObjections: [],
                },
                objectionPool: dealContext.likely_objections?.slice(1).map((obj: any, idx: number) => ({
                  id: `obj-pool-${dealId}-${idx}`,
                  category: obj.category || 'pricing',
                  title: obj.title,
                  description: obj.description,
                  triggerThreshold: { maxTrust: 50 },
                  hidden: true,
                  isResolved: false,
                  resolutionCriteria: obj.suggestedHandling || 'Demonstrate ROI',
                })) || [],
                systemContext: `You are ${dealContext.target_persona?.name || personaName}, ${dealContext.target_persona?.title || personaTitle} at ${targetCompany}. You are on a sales discovery phone call with ${sellerCompany} discussing ${productName}. Your core pain point is: ${dealContext.pain_points?.[0] || 'slow rep ramp'}. Your main objection is: ${targetObj?.title || 'We already use existing tools'}. Speak like a real busy executive on a phone call. Keep replies strictly under 2 short sentences.`,
              };

              dealContext.built_persona = builtPersona;
              viteDealStore.set(dealId, dealContext);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ deal_id: dealId, dealContext, persona: builtPersona }));
            } catch (err) {
              console.error('Vite Deal Generator error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Failed to generate deal context' }));
            }
          }

          // 2. GET DEAL CONTEXT: GET /api/deal/:deal_id
          if (url.startsWith('/api/deal/') && req.method === 'GET' && !url.includes('/session')) {
            const parts = url.split('/');
            const dealId = parts[parts.length - 1];
            const deal = viteDealStore.get(dealId);

            res.setHeader('Content-Type', 'application/json');
            if (!deal) {
              res.statusCode = 404;
              return res.end(JSON.stringify({ error: 'Deal Context not found' }));
            }
            res.statusCode = 200;
            return res.end(JSON.stringify(deal));
          }

          // 3. SAVE ROLEPLAY SESSION: POST /api/deal/:deal_id/session
          if (url.startsWith('/api/deal/') && url.includes('/session') && req.method === 'POST') {
            try {
              const body = req.body || {};
              const parts = url.split('/');
              const dealId = parts[2];

              const sessionId = body.session_id || `session_${Date.now().toString(36)}`;
              const roleplaySession = {
                session_id: sessionId,
                deal_id: dealId,
                transcript: body.transcript || [],
                score: body.score || 75,
                grade: body.grade || 'B',
                strengths: body.strengths || ['Good discovery question cadence'],
                weaknesses: body.weaknesses || ['Pitched solution too early before quantifying pain', 'Did not directly address competitor objection'],
                missed_opportunities: body.missed_opportunities || ['Failed to ask about decision timeline'],
                missed_objections: body.missed_objections || ['We already use Gong'],
                coaching_feedback: body.coaching_feedback || ['Focus on asking 2 pain questions before introducing product features.'],
                buyer_reactions: body.buyer_reactions || ['Prospect expressed skepticism regarding deployment timeline.'],
                call_progress: 100,
                scorecard: body.scorecard,
                created_at: Date.now(),
              };

              viteSessionStore.set(sessionId, roleplaySession);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ session_id: sessionId, roleplaySession }));
            } catch (err) {
              console.error('Vite Save Session error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Failed to save session' }));
            }
          }

          // 4. GET ROLEPLAY SESSION: GET /api/deal/:deal_id/session/:session_id
          if (url.startsWith('/api/deal/') && url.includes('/session/') && req.method === 'GET') {
            const parts = url.split('/');
            const sessionId = parts[parts.length - 1];
            const session = viteSessionStore.get(sessionId);

            res.setHeader('Content-Type', 'application/json');
            if (!session) {
              res.statusCode = 404;
              return res.end(JSON.stringify({ error: 'Session not found' }));
            }
            res.statusCode = 200;
            return res.end(JSON.stringify(session));
          }

          // 5. LIVE COPILOT CUE ENDPOINT: POST /api/copilot/cue
          if (url === '/api/copilot/cue' && req.method === 'POST') {
            try {
              const body = req.body || {};
              const deal = viteDealStore.get(body.deal_id);
              const session = viteSessionStore.get(body.session_id);

              const speechText = (body.user_speech || body.customer_speech || '').toLowerCase();
              const cues = [];

              if (speechText.includes('gong') || speechText.includes('competitor') || speechText.includes('already use')) {
                cues.push({
                  id: `cue-${Date.now()}-1`,
                  timestamp: Date.now(),
                  type: 'objection',
                  title: '⚠️ OBJECTION DETECTED: Existing Call Tool',
                  description: 'Prospect mentioned using Gong or an existing tool.',
                  suggestedAction: 'Ask how they currently use Gong before positioning CloseIQ live co-piloting.',
                  suggestedQuestion: '"How are your reps currently getting coaching while the call is actually happening?"',
                  relatedPracticeWeakness: session?.weaknesses?.[0] || 'Struggled with competitor objection in practice roleplay',
                });
              }

              if (speechText.includes('cost') || speechText.includes('expensive') || speechText.includes('budget')) {
                cues.push({
                  id: `cue-${Date.now()}-2`,
                  timestamp: Date.now(),
                  type: 'objection',
                  title: '⚠️ OBJECTION DETECTED: Budget / Pricing Concern',
                  description: 'Prospect expressed budget constraints.',
                  suggestedAction: 'Reframe pricing around rep ramp time reduction ROI.',
                  suggestedQuestion: '"If we can reduce your new rep ramp time by 3 weeks, what is that worth to your quarterly revenue goal?"',
                });
              }

              if (speechText.includes('feature') || speechText.includes('product') || speechText.includes('we offer')) {
                if (session?.weaknesses?.some((w: string) => w.toLowerCase().includes('early') || w.toLowerCase().includes('pitch'))) {
                  cues.push({
                    id: `cue-${Date.now()}-3`,
                    timestamp: Date.now(),
                    type: 'coaching_alert',
                    title: '⚠️ PRACTICE WARNING: Pitching Too Early',
                    description: 'In your practice call, you pitched before uncovering pain. Explore pain first!',
                    suggestedAction: 'Pivot back to discovery before explaining more features.',
                    suggestedQuestion: '"Before I dive deeper into the platform, how are you handling rep onboarding today?"',
                    relatedPracticeWeakness: 'In roleplay practice, you pitched early before quantifying prospect pain.',
                  });
                }
              }

              if (cues.length === 0) {
                cues.push({
                  id: `cue-${Date.now()}-4`,
                  timestamp: Date.now(),
                  type: 'discovery_question',
                  title: '💡 RECOMMENDED DISCOVERY QUESTION',
                  description: 'Maintain discovery momentum matching your call objective.',
                  suggestedAction: 'Ask about manager bandwidth constraints.',
                  suggestedQuestion: deal?.discovery_questions?.[0] || '"How long does it currently take a new rep to become productive?"',
                });
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ cues }));
            } catch (err) {
              console.error('Vite Copilot Cue Error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Failed to generate copilot cue' }));
            }
          }

          // 6. PERSONA CHAT ENDPOINT: POST /api/persona/chat (Powered by Groq API Key)
          if (url === '/api/persona/chat' && req.method === 'POST') {
            try {
              const body = req.body || {};
              const groqApiKey = body.customApiKey?.trim() || process.env.GROQ_API_KEY?.trim();
              const geminiApiKey = body.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

              const k = body.persona?.knowledge || {};
              const systemPrompt = `
You are strictly roleplaying as ${body.persona?.name || 'Sarah Chen'}, ${body.persona?.title || 'VP of Sales'} at ${body.persona?.company || 'InCruiter'}.
This is a live SCHEDULED discovery phone / Zoom call with a sales representative from CloseIQ.

CRITICAL DIRECTIVE: ULTRA-SHORT, PUNCHY PHONE CONVERSATION
1. STRICT SPOKEN BREVITY (UNDER 20-25 WORDS MAX):
   - Real humans on phone calls speak in rapid, concise conversational bursts (1 to 2 short sentences max).
   - NEVER recite long marketing paragraphs, lists of features, or multi-clause descriptions.
   - Be concise and punchy: give a quick 1-sentence answer and hand the mic back to the rep.
   - Example when asked about your company: "Yeah, sure—at InCruiter we provide AI interview automation to help companies screen candidates 4x faster. What's on your agenda today?" (23 words).

2. WARM, REALISTIC CALL OPENINGS (Turns 1-2):
   - If the rep says hello or asks how you are ("hi", "how are you doing", "good morning"):
     Respond with natural, friendly warmth: "Hey! Doing well, thanks. How are you doing today?"

3. SKEPTICISM & BUYER EVALUATION (Later Turns):
   - Ask about tangible ROI, integration, and differences from Gong in quick 1-sentence questions.

4. VOICE RECOGNITION ACOUSTIC TOLERANCE:
   - The caller speaks via live microphone speech-to-text.
   - Recognize that words like "include us", "in recruiter", "include a", or "include or" mean your company (${body.persona?.company || 'InCruiter'}).
   - NEVER question minor phonetic slips or say "what do you mean by include us". Seamlessly interpret their true business intent.

COMPANY CONTEXT:
- Company: ${body.persona?.company || 'InCruiter'} (${k.companySize || 'Enterprise'}, Industry: ${k.industry || 'AI Recruitment & HR Tech'})
- What You Do: ${k.companyDescription || 'AI candidate screening, automated video assessments, and Interview-as-a-Service.'}
- Current Needs & Pain Points: ${k.currentNeeds || (k.currentPainPoints && k.currentPainPoints.length > 0 ? k.currentPainPoints.join(' | ') : 'Sales ramp times and high recruiter workload')}
- Current Mood: ${(body.state?.mood || 'neutral').toUpperCase()} (Trust: ${body.state?.trustScore || 35}/100).

${body.memoryContext || ''}
`.trim();

              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');

              // 1. Primary Engine: Groq API Key
              if (groqApiKey && (groqApiKey.startsWith('gsk_') || groqApiKey.length > 20)) {
                const messages = [
                  { role: 'system', content: systemPrompt },
                  ...(body.history || []).slice(-6).map((h: any) => ({
                    role: h.speaker === 'user' ? 'user' : 'assistant',
                    content: h.text,
                  })),
                  { role: 'user', content: body.userText },
                ];

                const groqModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];
                let streamedSuccessfully = false;

                for (const model of groqModels) {
                  try {
                    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${groqApiKey}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        model,
                        messages,
                        temperature: 0.6,
                        max_tokens: 280,
                        stream: true,
                      }),
                    });

                    if (groqResponse.ok && groqResponse.body) {
                      const reader = groqResponse.body.getReader();
                      const decoder = new TextDecoder('utf-8');
                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        res.write(decoder.decode(value, { stream: true }));
                      }
                      streamedSuccessfully = true;
                      break;
                    }
                  } catch (modelErr) {
                    console.warn(`Groq model ${model} error, trying next:`, modelErr);
                  }
                }

                if (streamedSuccessfully) {
                  return res.end();
                }
              }

              // Option B: Stream via Gemini 2.5 Flash if available
              if (geminiApiKey) {
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                const chatContents = [
                  { role: 'user', parts: [{ text: systemPrompt }] },
                  ...(body.history || []).slice(-6).map((h: any) => ({
                    role: h.speaker === 'user' ? 'user' : 'model',
                    parts: [{ text: h.text }]
                  })),
                  { role: 'user', parts: [{ text: body.userText || 'hello' }] }
                ];

                const responseStream = await ai.models.generateContentStream({
                  model: 'gemini-2.5-flash',
                  contents: chatContents,
                  config: {
                    temperature: 0.6,
                    maxOutputTokens: 350,
                  }
                });

                for await (const chunk of responseStream) {
                  const textChunk = chunk.text || '';
                  if (textChunk) {
                    const ssePayload = JSON.stringify({
                      choices: [{ delta: { content: textChunk } }]
                    });
                    res.write(`data: ${ssePayload}\n\n`);
                  }
                }
                res.write('data: [DONE]\n\n');
                return res.end();
              }

              // Option C: Fallback simulated natural persona reply
              const fallbackReply = `Hey there. I'm just reviewing our current pipeline and team metrics. What's on your mind?`;
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: fallbackReply } }] })}\n\n`);
              res.write('data: [DONE]\n\n');
              return res.end();

            } catch (err) {
              console.error('Vite API Persona Chat Stream Error:', err);
              const fallbackReply = `Look, I'm pretty busy today with candidate evaluations. What's this regarding?`;
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: fallbackReply } }] })}\n\n`);
              res.write('data: [DONE]\n\n');
              return res.end();
            }
          }

          // 7. DEEPGRAM AURA NEURAL TTS ENDPOINT: POST /api/tts/speak
          if (url === '/api/tts/speak' && req.method === 'POST') {
            try {
              const body = req.body || {};
              const rawText = body.text || '';
              const voiceGender = body.voiceGender || 'female';
              const deepgramKey = process.env.DEEPGRAM_API_KEY?.trim();

              if (!deepgramKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'DEEPGRAM_API_KEY not configured' }));
              }

              // Speech normalization for authentic human pronunciation
              let spokenText = rawText
                .replace(/\b4x\b/gi, 'four times')
                .replace(/\b3x\b/gi, 'three times')
                .replace(/\b2x\b/gi, 'two times')
                .replace(/\b10x\b/gi, 'ten times')
                .replace(/\bROI\b/g, 'R.O.I.')
                .replace(/\bAI\b/g, 'A.I.')
                .replace(/\bB2B\b/gi, 'B to B')
                .replace(/\$([0-9]+)k\b/gi, '$1 thousand dollars')
                .replace(/—/g, ', ')
                .trim();

              const model = voiceGender === 'male' ? 'aura-orion-en' : 'aura-asteria-en';

              const dgRes = await fetch(`https://api.deepgram.com/v1/speak?model=${model}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Token ${deepgramKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: spokenText }),
              });

              if (!dgRes.ok) {
                const errText = await dgRes.text();
                throw new Error(`Deepgram error (${dgRes.status}): ${errText}`);
              }

              const audioBuffer = await dgRes.arrayBuffer();
              res.setHeader('Content-Type', 'audio/mpeg');
              res.setHeader('Content-Length', audioBuffer.byteLength.toString());
              return res.end(Buffer.from(audioBuffer));
            } catch (err: any) {
              console.error('Deepgram TTS Error:', err?.message || err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Deepgram TTS failed' }));
            }
          }

          next();
        });
      },
    },
  ],
});
