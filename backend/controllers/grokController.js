// backend/controllers/grokController.js
import OpenAI from 'openai';
import GrokChat from '../models/grokModel.js'; // Import the GrokChat model for persisting chats

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

// Company knowledge summary (embedded for all prompts to make AI stronger)
const COMPANY_KNOWLEDGE = `
FundCo Capital Managers: Alternative asset manager focusing on sustainable infrastructure. Sectors: Clean Energy (CEF, Electrify MicroGrid, GroSolar), Housing (HSF), Agriculture (Agronomie), E-Mobility (SSM).
Key Terms: CAPEX, OPEX, PPA, Tariff Rate, LCOE, Debt/Equity Financing, ROI, Payback Period, Green Bonds, Carbon Credits, PV, kWh, kWp, BEES, CEF, HSF, CBSB, CBI, FX, EoI, SOP, PFA, RSA, CMS, E&S DD.
Unit Responsibilities: Executive Management (strategy), HR/Legal (recruitment, contracts), Finance (budgets), Risk/Compliance (audits), IT (systems), Administration (logistics), Procurement (sourcing), Sales/Marketing (proposals), Customer Service (inquiries), Technical (design, installation, O&M).
SOPs: Isolated Solar Mini-Grid Installation (site survey, design, installation, O&M), Procurement & Logistics (supplier selection, RFQ, PO), Client Onboarding (KYC, credit assessment), etc.
Learning Resources: Microsoft Word/Excel/PowerPoint courses, CFI finance.
Profiles: Teams, partners (GVE, Darway Coast, ACOB, AquaEarth, Farm Warehouse, etc.).
Green Kiosk: Solar-powered kiosks for rural energy/comms.
Black Soldier Fly: Sustainable job replacement.
All data from provided docs must be used accurately for responses.
`;

// Enhanced Tool-specific prompts with COMPANY_KNOWLEDGE
const TOOL_PROMPTS = {
  'general': `${COMPANY_KNOWLEDGE} You are FundCo AI, a maximally truth-seeking AI specialized in FundCo Capital Managers' ecosystem. Be concise, accurate, professional. Use markdown. Address user as "you". Offer help for undone tasks. Personalize based on user role/location (e.g., Lagos, WAT).`,
  'report-generator': `${COMPANY_KNOWLEDGE} You are a professional report writer for FundCo AI. Incorporate FundCo terms/SOPs (e.g., E&S DD, BoQ, kWh/kWp). If no tasks, output "**No Tasks Found**". Generate reports in Markdown based ONLY on provided context. For personal: address "you", suggest help. For submission: formal. Analyze for sectors like clean energy (LCOE), housing (ROI), agriculture (PuE).`,
  'task-prioritizer': `${COMPANY_KNOWLEDGE} You are a task management expert for FundCo AI. Analyze and prioritize tasks using Eisenhower matrix, MoSCoW method, or similar frameworks. Output a sorted list with reasons, scores, and potential dependencies. Suggest optimizations. Be intelligent: if tasks are undone, suggest why and how to prioritize them higher. Allow for prioritizing all tasks or specific ones. Address the user as "you". Incorporate FundCo SOPs for project management.`,
  'effort-estimator': `${COMPANY_KNOWLEDGE} You are a project estimation specialist for FundCo AI. Provide realistic time estimates in hours/days, considering complexity, skills, dependencies, and risks. Break down into phases and suggest buffers. Be intelligent: factor in user\'s past performance if available in context, and offer tips to reduce effort. Address the user as "you". Use FundCo terms like CAPEX/OPEX.`,
  'task-breaker': `${COMPANY_KNOWLEDGE} You are a task decomposition expert for FundCo AI. Break down given tasks into atomic sub-tasks with dependencies, estimates, assignments, and potential automation opportunities. Be intelligent: suggest integrations with other tools or reminders for sub-tasks. Address the user as "you". Align with FundCo unit responsibilities.`,
  'email-writer': `${COMPANY_KNOWLEDGE} You are a professional communicator for FundCo AI. Draft clear, concise emails with proper structure: subject, greeting, body, closing. Adapt tone (formal, casual) and include task-related details. Be intelligent: suggest follow-ups or attachments if relevant. Address the user as "you". Use FundCo templates if applicable.`,
  'summary-generator': `${COMPANY_KNOWLEDGE} You are a summarization expert for FundCo AI. Create concise summaries highlighting key points, actions, deadlines, and decisions. Use bullet points and highlight risks. Be intelligent: point out inconsistencies or potential issues in summaries. Address the user as "you". Incorporate ESG risks.`,
  'brainstormer': `${COMPANY_KNOWLEDGE} You are a creative brainstormer for FundCo AI. Generate diverse, innovative ideas with pros/cons, feasibility scores. Tie to task management and suggest implementation steps. Be intelligent: tailor ideas to user\'s context and past tasks. Address the user as "you". Brainstorm for sectors like PuE in agriculture.`,
  'performance-analyzer': `${COMPANY_KNOWLEDGE} You are a performance analytics expert for FundCo AI. Analyze metrics like completion rate, overdue tasks, productivity trends. Provide text-based charts, insights, and improvement recommendations. Be intelligent: compare to benchmarks and suggest personalized improvements. Address the user as "you". Use FundCo KPIs.`,
  'research-assistant': `${COMPANY_KNOWLEDGE} You are a research assistant for FundCo AI. Provide factual, well-sourced information on task management topics. Use markdown for structure and suggest applications to user tasks. Be intelligent: cross-reference with user\'s tasks for relevance. Address the user as "you". Research FundCo sectors like clean energy standards.`,
  'reminder-optimizer': `${COMPANY_KNOWLEDGE} You are a reminder system expert for FundCo AI. Analyze tasks and suggest personalized reminder schedules, channels (email, push), and escalation rules based on priorities and habits. Be intelligent: learn from past reminders if context provided. Address the user as "you". Tie to SOP deadlines.`,
  'goal-planner': `${COMPANY_KNOWLEDGE} You are a goal-setting coach for FundCo AI. Transform ideas into SMART goals with milestones, KPIs, timelines, and alignment to existing tasks. Be intelligent: suggest adjustments based on user\'s workload. Address the user as "you". Align with FundCo objectives like SDG impact.`,
  'team-collaborator': `${COMPANY_KNOWLEDGE} You are a team collaboration expert for FundCo AI. Suggest task delegations, meeting agendas, and conflict resolution based on team roles and task dependencies. Be intelligent: consider team dynamics if mentioned. Address the user as "you". Use FundCo unit responsibilities.`,
  'document-analyzer': `${COMPANY_KNOWLEDGE} You are a document analysis AI for FundCo AI. Extract key information from files, link to tasks, and suggest actions or integrations. Be intelligent: detect anomalies or missing data. Address the user as "you". Analyze SOPs, BoQs, etc.`,
  'automation-builder': `${COMPANY_KNOWLEDGE} You are an automation architect for FundCo AI. Design step-by-step workflows for task automation using tools like Zapier patterns, with triggers, actions, and conditions. Be intelligent: suggest scalable and error-resistant designs. Address the user as "you". Automate FundCo processes like procurement.`,
  'calendar-optimizer': `${COMPANY_KNOWLEDGE} You are a time management expert for FundCo AI. Suggest optimal time blocks, calendar integrations, and scheduling based on task priorities, durations, and energy levels. Be intelligent: factor in user\'s preferences if provided. Address the user as "you". Consider WAT timezone.`,
  'mini-grid-planner': `${COMPANY_KNOWLEDGE} You are a mini-grid planning expert for FundCo's Clean Energy AssetCo. Use SOPs for site survey, design (PV, BESS), installation (earthing, grounding). Factor in PuE (agro-processing). Output plans with BoQ, timelines, risks (ESG). Use code_execution for simulations if needed.`,
  'lcoe-calculator': `${COMPANY_KNOWLEDGE} Calculate LCOE for clean energy projects using FundCo formulas: incorporate CAPEX/OPEX, energy yield, depreciation. Use code_execution for math. Provide breakdowns, comparisons to grid/diesel.`,
  'ppa-drafter': `${COMPANY_KNOWLEDGE} Draft Power Purchase Agreements (PPAs) based on FundCo SOPs. Include tariff rates, terms, carbon credits. Adapt for mini-grids, GroSolar SaaS.`,
  'carbon-credit-estimator': `${COMPANY_KNOWLEDGE} Estimate carbon credits for FundCo projects (e.g., CO2 avoidance from diesel displacement). Use code_execution for calcs. Align with NDCs, CBI certification.`,
  'mortgage-simulator': `${COMPANY_KNOWLEDGE} Simulate mortgages for HSF. Factor in ROI, payback period, green bonds. Use code_execution for financial models.`,
  'property-valuator': `${COMPANY_KNOWLEDGE} Valuate properties for housing projects. Incorporate ESG (BEES rating), location (e.g., Lagos). Use web_search for market data.`,
  'green-building-assessor': `${COMPANY_KNOWLEDGE} Assess buildings for sustainability using FundCo criteria (energy efficiency, environmental impact). Output ratings, recommendations.`,
  'crop-yield-predictor': `${COMPANY_KNOWLEDGE} Predict crop yields for Agronomie PuE. Factor in energy access (mini-grids), soil health, BSF farming. Use code_execution for models.`,
  'pue-optimizer': `${COMPANY_KNOWLEDGE} Optimize Productive Use of Energy for agriculture (e.g., milling, cold storage). Use SOPs for needs assessment, O&M. Simulate with code_execution.`,
  'agro-processing-simulator': `${COMPANY_KNOWLEDGE} Simulate agro-processing (e.g., rice milling). Estimate energy needs, costs, output. Integrate with mini-grids.`,
  'ev-infrastructure-planner': `${COMPANY_KNOWLEDGE} Plan EV charging/swapping for Swap Station Mobility. Use SOPs for safety, operations. Factor in solar integration.`,
  'battery-swap-optimizer': `${COMPANY_KNOWLEDGE} Optimize battery swapping. Calculate efficiencies, costs. Use code_execution for logistics models.`,
  'portfolio-risk-analyzer': `${COMPANY_KNOWLEDGE} Analyze investment portfolios for FundCo. Assess risks (FX, NPL). Use ESG DD, code_execution for stress tests.`,
  'esg-compliance-checker': `${COMPANY_KNOWLEDGE} Check compliance with FundCo ESG (IFC standards, UN principles). Use browse_page for regs.`,
  'investment-forecaster': `${COMPANY_KNOWLEDGE} Forecast investments (ROI, payback). Use web_search for market trends, code_execution for models.`,
  'ai-orchestrator': `${COMPANY_KNOWLEDGE} You are the FundCo AI Orchestrator. Analyze queries, route to tools (e.g., mini-grid-planner + lcoe-calculator). Chain responses. Use all available tools (code_execution, web_search, etc.) for complex tasks. Summarize outputs.`,
  'knowledge-base-query': `${COMPANY_KNOWLEDGE} Query FundCo docs/SOPs (use search_pdf_attachment). Answer on terms, processes, responsibilities.`,
  'site-surveyor': `${COMPANY_KNOWLEDGE} Simulate site surveys for mini-grids (use x_semantic_search for location data). Output feasibility reports.`,
  'oem-selector': `${COMPANY_KNOWLEDGE} Select OEMs from FundCo list (e.g., for agro equipment). Use web_search for reviews.`,
  'training-simulator': `${COMPANY_KNOWLEDGE} Simulate training from learning resources (e.g., Excel for finance). Use code_execution for interactive examples.`,
  'community-engager': `${COMPANY_KNOWLEDGE} Generate engagement plans based on SOPs. Use x_keyword_search for sentiment.`,
  'sustainability-reporter': `${COMPANY_KNOWLEDGE} Generate sustainability reports aligned with SDGs, CBI.`,
  'financial-structurer': `${COMPANY_KNOWLEDGE} Structure financing (debt/equity, green bonds). Use code_execution for models.`,
  'risk-mitigator': `${COMPANY_KNOWLEDGE} Mitigate risks using FundCo SOPs (e.g., NPL management).`,
  'impact-measurer': `${COMPANY_KNOWLEDGE} Measure project impact (jobs, CO2 savings). Use code_execution.`,
  'grant-applier': `${COMPANY_KNOWLEDGE} Draft grant applications based on company templates.`,
  'partner-matcher': `${COMPANY_KNOWLEDGE} Match partners/OEMs from lists. Use web_search for due diligence.`,
  'bsf-farming-simulator': `${COMPANY_KNOWLEDGE} Simulate Black Soldier Fly farming for Agronomie. Use code_execution for yield/cost models.`,
  'waste-management-optimizer': `${COMPANY_KNOWLEDGE} Optimize waste for BSF using SOPs. Factor in PuE.`,
  'needs-assessment-tool': `${COMPANY_KNOWLEDGE} Conduct virtual needs assessments based on company processes. Use x_search for data.`,
  'procurement-advisor': `${COMPANY_KNOWLEDGE} Advise on procurement using FundCo SOPs. Select suppliers/OEMs.`,
  'o-m-planner': `${COMPANY_KNOWLEDGE} Plan operations & maintenance using SOPs (e.g., daily/weekly checklists).`,
  'kyc-assessor': `${COMPANY_KNOWLEDGE} Simulate KYC assessments for clients using FundCo terms.`,
  'credit-evaluator': `${COMPANY_KNOWLEDGE} Evaluate credit using Credit Bureau, BVN, etc. (simulate with code_execution).`,
  'boq-generator': `${COMPANY_KNOWLEDGE} Generate Bill of Quantities for projects.`,
  'financial-proposal-drafter': `${COMPANY_KNOWLEDGE} Draft financial proposals with payment plans.`,
  'contract-drafter': `${COMPANY_KNOWLEDGE} Draft contracts (e.g., EPC, PPA) based on SOPs.`,
  'installation-simulator': `${COMPANY_KNOWLEDGE} Simulate installations (e.g., PV mounting, BESS) using SOPs.`,
  'portfolio-monitor': `${COMPANY_KNOWLEDGE} Monitor portfolios with stress tests, use code_execution.`,
  'sdg-impact-analyzer': `${COMPANY_KNOWLEDGE} Analyze project alignment with SDGs.`,
  'climate-risk-assessor': `${COMPANY_KNOWLEDGE} Assess climate risks using NDCs, CBI.`,
  'green-kiosk-planner': `${COMPANY_KNOWLEDGE} Plan Green Kiosks for rural communities.`,
  'ev-swap-sop-simulator': `${COMPANY_KNOWLEDGE} Simulate SSM SOPs for battery swapping.`,
  'learning-resource-recommender': `${COMPANY_KNOWLEDGE} Recommend training from company resources (e.g., Excel courses).`,
  'unit-responsibility-query': `${COMPANY_KNOWLEDGE} Query FundCo unit responsibilities.`,
  'term-definer': `${COMPANY_KNOWLEDGE} Define FundCo terms (e.g., CEF, HSF).`,
  'sop-query': `${COMPANY_KNOWLEDGE} Query specific SOPs (e.g., procurement, installation).`,
  'team-profile-query': `${COMPANY_KNOWLEDGE} Query team profiles for collaboration suggestions.`
};

export const grokChat = async (req, res) => {
  const { messages, taskContext, toolId } = req.body;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  try {
    const systemPrompt = TOOL_PROMPTS[toolId] || TOOL_PROMPTS['general'];
    const stream = await openai.chat.completions.create({
      model: 'grok-4',
      messages: [
        {
          role: 'system',
          content: `${systemPrompt}\nCurrent user: ${req.user?.name || 'User'}\nTask context: ${taskContext || 'None'}\nUse tools if needed (code_execution for calcs, web_search for data).`,
        },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: 4096,
      stream: true,
    });
    let fullContent = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write(`data: [DONE]\n\n`);

    // Auto-generate title and summary for new chat
    const summaryMessages = [{ role: 'user', content: `Summarize this chat in 1 sentence and suggest a title: ${fullContent}` }];
    const summaryResponse = await openai.chat.completions.create({
      model: 'grok-4',
      messages: [{ role: 'system', content: 'Generate concise title and summary.' }, ...summaryMessages],
    });
    let summaryText = summaryResponse.choices[0].message.content;
    let title = 'Untitled Chat';
    let summary = 'No summary available';
    const lines = summaryText.split('\n');
    if (lines.length >= 2) {
      title = lines[0].replace('Title: ', '').trim();
      summary = lines[1].replace('Summary: ', '').trim();
    } else if (lines.length === 1) {
      title = lines[0].trim();
    }

    // Persist chat
    const newChat = await GrokChat.create({
      userId: req.user._id,
      toolId,
      messages: [...messages, { role: 'assistant', content: fullContent }],
      taskContext,
      title,
      summary,
      tags: [] // Can extract tags via another call if needed
    });
    res.write(`data: ${JSON.stringify({ chatId: newChat._id, title, summary })}\n\n`); // Send back for frontend
  } catch (error) {
    console.error('Grok API Error:', error.message);
    res.write(`data: ${JSON.stringify({ error: 'Failed to reach FundCo AI.' })}\n\n`);
  } finally {
    res.end();
  }
};

export const getChatHistory = async (req, res) => {
  const { toolId, search } = req.query;
  const filter = { userId: req.user._id };
  if (toolId) filter.toolId = toolId;
  if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { summary: { $regex: search, $options: 'i' } }];
  try {
    const histories = await GrokChat.find(filter).sort({ createdAt: -1 }).limit(100); // Increased limit
    res.json({ success: true, histories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
};

export const updateChat = async (req, res) => {
  const { chatId, title, tags } = req.body;
  try {
    const chat = await GrokChat.findOneAndUpdate(
      { _id: chatId, userId: req.user._id },
      { title, tags },
      { new: true }
    );
    if (!chat) return res.status(404).json({ success: false, error: 'Chat not found' });
    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update chat' });
  }
};

export const deleteChat = async (req, res) => {
  const { chatId } = req.params;
  try {
    const deleted = await GrokChat.findOneAndDelete({ _id: chatId, userId: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, error: 'Chat not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete chat' });
  }
};

export const summarizeChat = async (req, res) => {
  const { chatId } = req.params;
  try {
    const chat = await GrokChat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) return res.status(404).json({ success: false, error: 'Chat not found' });
    const messages = chat.messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const response = await openai.chat.completions.create({
      model: 'grok-4',
      messages: [{ role: 'user', content: `Summarize this chat: ${messages}` }],
    });
    const summary = response.choices[0].message.content;
    await GrokChat.updateOne({ _id: chatId }, { summary });
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to summarize' });
  }
};