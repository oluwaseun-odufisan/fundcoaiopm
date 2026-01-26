// backend/seed/learningSeed.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import { LearningCourse } from '../models/learningMaterialModel.js';
import { connectDB } from '../config/db.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: `${__dirname}/../.env` }); // Load from parent dir
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Loaded' : 'Undefined');
const seedData = async () => {
  try {
    await connectDB();
    // Full content from the document organized into courses and modules
    // Apostrophes escaped with \'
    // Expanded all sections/subsections into modules with full text, terms, quizzes
    // Added 'assetco' field to relevant courses for filtering (e.g., 'General', 'EML', 'GroSolar', 'Agronomie', 'SSM')
    // Categorized by level: beginner (basic for everyone), intermediate, expert
    const courses = [
      {
        title: 'Microsoft Office Tools - Beginner',
        description: 'This course covers the basics of Microsoft Word, Excel, and PowerPoint with video resources and practical terms.',
        level: 'beginner',
        assetco: 'General',
        modules: [
          {
            title: 'Microsoft Word for Beginners',
            content: 'This course offers clear, parallel narration with screen recordings and provides comprehensive coverage of professional document creation, including formatting, styles, tables, and mail merge. Microsoft Word for Beginners (Complete Course – FREE) By Technology for Teachers and Students 🔗 https://www.youtube.com/playlist?list=PLaQP8BdJip_XeRAWm7ccTcewEo2KEsymx',
            videoUrl: 'https://www.youtube.com/playlist?list=PLaQP8BdJip_XeRAWm7ccTcewEo2KEsymx',
            terms: [],
            quiz: [
              { question: 'What is the main function of Microsoft Word?', options: ['Spreadsheet calculations', 'Document creation', 'Presentation design', 'Database management'], answer: 'Document creation' },
              { question: 'Which feature in Word is used for repeating text styles?', options: ['Formatting', 'Styles', 'Tables', 'Mail merge'], answer: 'Styles' },
              { question: 'What does mail merge allow you to do?', options: ['Create spreadsheets', 'Personalize documents', 'Design slides', 'Manage emails'], answer: 'Personalize documents' },
              { question: 'Which tool is used for creating tables in Word?', options: ['Insert Table', 'Draw Line', 'Add Image', 'Format Text'], answer: 'Insert Table' },
              { question: 'What is the purpose of formatting in Word?', options: ['To make documents look professional', 'To calculate numbers', 'To create animations', 'To manage files'], answer: 'To make documents look professional' },
            ],
            order: 1,
          },
          {
            title: 'Microsoft Excel Basics to Advanced',
            content: 'For a more traditional and in-depth learning approach, this playlist is highly recommended by analysts across forums such as Reddit. It covers Excel from basics to advanced concepts. Excel Basics to Advanced Series By excelisfun 🔗 https://www.youtube.com/watch?v=IInFoJxxPPA&list=PLrRPvpgDmw0k7ocn_EnBaSJ6RwLDOZdfo',
            videoUrl: 'https://www.youtube.com/watch?v=IInFoJxxPPA&list=PLrRPvpgDmw0k7ocn_EnBaSJ6RwLDOZdfo',
            terms: [],
            quiz: [
              { question: 'What is Excel primarily used for?', options: ['Word processing', 'Data analysis', 'Presentations', 'Email management'], answer: 'Data analysis' },
              { question: 'Which feature allows conditional formatting?', options: ['Formulas', 'Charts', 'Conditional Formatting', 'Pivot Tables'], answer: 'Conditional Formatting' },
              { question: 'What is a Pivot Table used for?', options: ['Summarizing data', 'Creating documents', 'Drawing shapes', 'Sending emails'], answer: 'Summarizing data' },
              { question: 'What function sums cells?', options: ['SUM', 'AVERAGE', 'COUNT', 'MAX'], answer: 'SUM' },
              { question: 'What is VLOOKUP used for?', options: ['Looking up values', 'Counting cells', 'Averaging numbers', 'Maximizing values'], answer: 'Looking up values' },
            ],
            order: 2,
          },
          {
            title: 'Microsoft PowerPoint Full Course',
            content: 'A curated set of high-quality, free resources covering PowerPoint comprehensively, as previously recommended in the general group. PowerPoint Full Course 🔗 https://www.youtube.com/playlist?list=PLoyECfvEFOjaM9Jeg34ehXqFttZ37uTei',
            videoUrl: 'https://www.youtube.com/playlist?list=PLoyECfvEFOjaM9Jeg34ehXqFttZ37uTei',
            terms: [],
            quiz: [
              { question: 'What is PowerPoint used for?', options: ['Spreadsheets', 'Presentations', 'Documents', 'Databases'], answer: 'Presentations' },
              { question: 'How do you add a slide?', options: ['Insert > New Slide', 'File > Save', 'View > Zoom', 'Home > Font'], answer: 'Insert > New Slide' },
              { question: 'What is a theme in PowerPoint?', options: ['Color scheme', 'Calculation tool', 'Database', 'Email template'], answer: 'Color scheme' },
              { question: 'How to add animation?', options: ['Animations tab', 'Insert tab', 'File tab', 'View tab'], answer: 'Animations tab' },
              { question: 'What is Slide Master?', options: ['Template for all slides', 'Single slide', 'Presentation file', 'Chart tool'], answer: 'Template for all slides' },
            ],
            order: 3,
          },
        ],
      },
      {
        title: 'Finance Unit - Intermediate',
        description: 'Corporate Finance Institute (CFI) focuses on practical, job-ready finance skills, emphasizing Excel proficiency, financial modeling, forecasting, and data-driven decision-making rather than theory alone.',
        level: 'intermediate',
        assetco: 'General',
        modules: [
          {
            title: 'Career in Finance – Corporate Finance Institute (CFI)',
            content: 'CFI focuses on practical, job-ready finance skills, emphasizing Excel proficiency, financial modeling, forecasting, and data-driven decision-making rather than theory alone. 🔗 https://help.corporatefinanceinstitute.com/article/307-free-courses-and-resources',
            videoUrl: 'https://help.corporatefinanceinstitute.com/article/307-free-courses-and-resources',
            terms: [],
            quiz: [
              { question: 'What does CFI focus on?', options: ['Practical, job-ready finance skills', 'Theoretical concepts', 'Historical finance', 'Art of finance'], answer: 'Practical, job-ready finance skills' },
              { question: 'What is emphasized in CFI?', options: ['Excel proficiency, financial modeling', 'Painting skills', 'Music theory', 'Sports training'], answer: 'Excel proficiency, financial modeling' },
              { question: 'What is forecasting in finance?', options: ['Predicting future financial trends', 'Looking at past events', 'Ignoring data', 'Random guessing'], answer: 'Predicting future financial trends' },
              { question: 'What is data-driven decision-making?', options: ['Decisions based on data', 'Decisions based on intuition', 'Decisions based on luck', 'No decisions'], answer: 'Decisions based on data' },
              { question: 'Does CFI emphasize theory?', options: ['No, rather than theory alone', 'Yes, heavily', 'Only theory', 'No theory at all'], answer: 'No, rather than theory alone' },
            ],
            order: 1,
          },
        ],
      },
      {
        title: 'Training Materials UNIT TERMS - Beginner',
        description: 'This course covers key terms and definitions used in training materials, including financial and technical terms relevant to the company.',
        level: 'beginner',
        assetco: 'General',
        modules: [
          {
            title: 'Unit Terms List',
            content: 'S/N Term Definition\n1 CAPEX (Capital Expenditure) Funds used to acquire, build, or upgrade physical assets such as solar panels, mini-grid equipment, batteries, etc.\n2 OPEX (Operational Expenditure) Day-to-day running costs of the energy system—fuel, maintenance, staff, monitoring, site security.\n3 PPA (Power Purchase Agreement) A long-term contract where a buyer agrees to purchase power from a clean energy provider at an agreed rate.\n4 Tariff Rate The price per kWh charged to customers for electricity supply.\n5 LCOE (Levelized Cost of Energy) The average cost per unit of electricity generated over the lifetime of a clean-energy system.\n6 Debt Financing Borrowing funds from banks or investors to fund energy projects, repayable with interest.\n7 Equity Financing Raising capital by selling ownership stake to investors.\n8 ROI (Return on Investment) Measures how profitable an energy project is relative to its cost.\n9 Payback Period Time it takes for an energy project to recover its initial investment.\n10 Green Bonds Fixed-income instruments used to finance environmentally sustainable projects.\n11 Carbon Credits Tradable permits earned from reducing carbon emissions, which can be sold for revenue.\n12 PV (Photovoltaic) Refers to technology that converts sunlight directly into electricity using semiconductor materials. this is the basis of solar panels.\n13 Working Capital Funds available for day-to-day operations like fuel, maintenance, and staff payments.\n14 Depreciation Gradual reduction in the value of clean-energy assets such as inverters, batteries, solar arrays.\n15 Amortization Gradual repayment of intangible assets or loan principal over time.\n16 Energy Yield Total amount of electricity generated by a system—used to calculate revenue.\n17 Revenue Assurance Processes to ensure accurate billing, correct metering, and full revenue collection.\n18 Cost-Benefit Analysis Comparison of all project costs vs. expected benefits before investment.\n19 NPL (Non-Performing Loans) Loans within energy access programs where customers are not repaying.\n20 Asset Leasing Renting or leasing solar equipment or mini-grid assets to customers or partners.\n21 BoQ (Bill of Quantities) It is a detailed document that lists materials, components, labour, and costs required for a project — commonly used in engineering, construction, and clean energy projects (like solar mini-grids or installations)\n22 kWh (kilowatt-hour) It is a unit of energy that measures how much electricity is used or generated over time.\n23 kWp (kilowatt-peak) It is the maximum capacity output a solar PV system can produce under standard test conditions (full sunlight, 1000 W/m², 25°C panel temperature)',
            videoUrl: '',
            terms: [
              { term: 'CAPEX (Capital Expenditure)', definition: 'Funds used to acquire, build, or upgrade physical assets such as solar panels, mini-grid equipment, batteries, etc.' },
              { term: 'OPEX (Operational Expenditure)', definition: 'Day-to-day running costs of the energy system—fuel, maintenance, staff, monitoring, site security.' },
              { term: 'PPA (Power Purchase Agreement)', definition: 'A long-term contract where a buyer agrees to purchase power from a clean energy provider at an agreed rate.' },
              { term: 'Tariff Rate', definition: 'The price per kWh charged to customers for electricity supply.' },
              { term: 'LCOE (Levelized Cost of Energy)', definition: 'The average cost per unit of electricity generated over the lifetime of a clean-energy system.' },
              { term: 'Debt Financing', definition: 'Borrowing funds from banks or investors to fund energy projects, repayable with interest.' },
              { term: 'Equity Financing', definition: 'Raising capital by selling ownership stake to investors.' },
              { term: 'ROI (Return on Investment)', definition: 'Measures how profitable an energy project is relative to its cost.' },
              { term: 'Payback Period', definition: 'Time it takes for an energy project to recover its initial investment.' },
              { term: 'Green Bonds', definition: 'Fixed-income instruments used to finance environmentally sustainable projects.' },
              { term: 'Carbon Credits', definition: 'Tradable permits earned from reducing carbon emissions, which can be sold for revenue.' },
              { term: 'PV (Photovoltaic)', definition: 'Refers to technology that converts sunlight directly into electricity using semiconductor materials. this is the basis of solar panels.' },
              { term: 'Working Capital', definition: 'Funds available for day-to-day operations like fuel, maintenance, and staff payments.' },
              { term: 'Depreciation', definition: 'Gradual reduction in the value of clean-energy assets such as inverters, batteries, solar arrays.' },
              { term: 'Amortization', definition: 'Gradual repayment of intangible assets or loan principal over time.' },
              { term: 'Energy Yield', definition: 'Total amount of electricity generated by a system—used to calculate revenue.' },
              { term: 'Revenue Assurance', definition: 'Processes to ensure accurate billing, correct metering, and full revenue collection.' },
              { term: 'Cost-Benefit Analysis', definition: 'Comparison of all project costs vs. expected benefits before investment.' },
              { term: 'NPL (Non-Performing Loans)', definition: 'Loans within energy access programs where customers are not repaying.' },
              { term: 'Asset Leasing', definition: 'Renting or leasing solar equipment or mini-grid assets to customers or partners.' },
              { term: 'BoQ (Bill of Quantities)', definition: 'It is a detailed document that lists materials, components, labour, and costs required for a project — commonly used in engineering, construction, and clean energy projects (like solar mini-grids or installations)' },
              { term: 'kWh (kilowatt-hour)', definition: 'It is a unit of energy that measures how much electricity is used or generated over time.' },
              { term: 'kWp (kilowatt-peak)', definition: 'It is the maximum capacity output a solar PV system can produce under standard test conditions (full sunlight, 1000 W/m², 25°C panel temperature)' },
            ],
            quiz: [
              { question: 'What is CAPEX?', options: ['Funds for physical assets', 'Day-to-day costs', 'Power agreement', 'Cost of energy'], answer: 'Funds for physical assets' },
              { question: 'What does OPEX stand for?', options: ['Operational Expenditure', 'Capital Expenditure', 'Power Purchase Agreement', 'Levelized Cost of Energy'], answer: 'Operational Expenditure' },
              { question: 'What is PPA?', options: ['Power Purchase Agreement', 'Operational Expenditure', 'Return on Investment', 'Green Bonds'], answer: 'Power Purchase Agreement' },
              { question: 'What is Tariff Rate?', options: ['Price per kWh', 'Funds for assets', 'Loan repayment', 'Carbon permits'], answer: 'Price per kWh' },
              { question: 'What is LCOE?', options: ['Average cost per unit of electricity', 'Borrowing funds', 'Selling ownership', 'Profitable measure'], answer: 'Average cost per unit of electricity' },
            ],
            order: 1,
          },
          {
            title: 'BEES (Building for Environmental and Economic Sustainability)',
            content: 'It is a rating and assessment tool developed to evaluate buildings or projects based on Energy Efficiency, Economic Feasibility and Environmental Impact.',
            quiz: [
              { question: 'What does BEES stand for?', options: ['Building for Environmental and Economic Sustainability', 'Black Soldier Fly', 'Clean Energy Fund', 'Housing Solution Fund'], answer: 'Building for Environmental and Economic Sustainability' },
              { question: 'What does BEES evaluate?', options: ['Energy Efficiency, Economic Feasibility, Environmental Impact', 'Only Energy Efficiency', 'Only Economic Feasibility', 'Only Environmental Impact'], answer: 'Energy Efficiency, Economic Feasibility, Environmental Impact' },
              { question: 'Is BEES a rating tool?', options: ['Yes', 'No'], answer: 'Yes' },
              { question: 'What is the purpose of BEES?', options: ['Evaluate buildings/projects', 'Sell solar panels', 'Manage finances', 'Train employees'], answer: 'Evaluate buildings/projects' },
              { question: 'Does BEES consider environmental impact?', options: ['Yes', 'No'], answer: 'Yes' },
            ],
            order: 2,
          },
        ],
      },
      {
        title: 'Fundco TERMS - Beginner',
        description: 'Key acronyms and terms for Fundco and subsidiaries.',
        level: 'beginner',
        assetco: 'General',
        modules: [
          {
            title: 'Fundco Terms List',
            content: 'S/N Acronyms Meaning\n1 CEF Clean Energy Fund\n2 HSF Housing Solution Fund\n3 CBSB Climate Bonds Standard Board\n4 CBI Climate Bonds Initiative\n5 FX Foreign Exchange\n6 EoI Expression of Interest\n7 SOP Standard Operating Procedure\n8 PFA Pension Fund Administrators\n9 RSA Retirement Savings Account\n10 CMS Client Management System\n11 E&S DD Environmental and Social Due Diligence',
            terms: [
              { term: 'CEF', definition: 'Clean Energy Fund' },
              { term: 'HSF', definition: 'Housing Solution Fund' },
              { term: 'CBSB', definition: 'Climate Bonds Standard Board' },
              { term: 'CBI', definition: 'Climate Bonds Initiative' },
              { term: 'FX', definition: 'Foreign Exchange' },
              { term: 'EoI', definition: 'Expression of Interest' },
              { term: 'SOP', definition: 'Standard Operating Procedure' },
              { term: 'PFA', definition: 'Pension Fund Administrators' },
              { term: 'RSA', definition: 'Retirement Savings Account' },
              { term: 'CMS', definition: 'Client Management System' },
              { term: 'E&S DD', definition: 'Environmental and Social Due Diligence' },
            ],
            quiz: [
              { question: 'What is CEF?', options: ['Clean Energy Fund', 'Housing Solution Fund', 'Climate Bonds Standard Board', 'Foreign Exchange'], answer: 'Clean Energy Fund' },
              { question: 'What is HSF?', options: ['Housing Solution Fund', 'Clean Energy Fund', 'Climate Bonds Initiative', 'Expression of Interest'], answer: 'Housing Solution Fund' },
              { question: 'What is CBSB?', options: ['Climate Bonds Standard Board', 'Foreign Exchange', 'Standard Operating Procedure', 'Pension Fund Administrators'], answer: 'Climate Bonds Standard Board' },
              { question: 'What is CBI?', options: ['Climate Bonds Initiative', 'Retirement Savings Account', 'Client Management System', 'Environmental and Social Due Diligence'], answer: 'Climate Bonds Initiative' },
              { question: 'What is FX?', options: ['Foreign Exchange', 'Clean Energy Fund', 'Housing Solution Fund', 'Climate Bonds Standard Board'], answer: 'Foreign Exchange' },
            ],
            order: 1,
          },
        ],
      },
      {
        title: 'Detailed Company Unit Responsibilities - Beginner',
        description: 'This course details the responsibilities of each company unit, providing a comprehensive understanding of organizational roles.',
        level: 'beginner',
        assetco: 'General',
        modules: [
          {
            title: 'Executive Management',
            content: 'Responsibilities:\n● Provide strategic direction and long-term vision for the organization\n● Approve major policies, budgets, and operational initiatives\n● Oversee overall performance and ensure departmental alignment\n● Ensure regulatory compliance and corporate governance\n● Evaluate performance of department heads\n● Manage day-to-day operations across all business units\n● Coordinate activities across technical, commercial, and administrative teams\n● Identify new project opportunities and maintain stakeholder relationships',
            quiz: [
              { question: 'What does Executive Management provide?', options: ['Strategic direction and long-term vision', 'Daily lunch menus', 'Office supplies', 'Personal fitness plans'], answer: 'Strategic direction and long-term vision' },
              { question: 'Who approves major policies?', options: ['Executive Management', 'Human Resources', 'Finance & Accounts', 'IT & Systems Unit'], answer: 'Executive Management' },
              { question: 'What is overseen by Executive Management?', options: ['Overall performance and departmental alignment', 'Social media accounts', 'Warehouse stock levels', 'Marketing campaigns'], answer: 'Overall performance and departmental alignment' },
              { question: 'What compliance is ensured?', options: ['Regulatory compliance and corporate governance', 'Fitness compliance', 'Fashion compliance', 'Music compliance'], answer: 'Regulatory compliance and corporate governance' },
              { question: 'Who evaluates department heads?', options: ['Executive Management', 'Peers', 'Subordinates', 'Clients'], answer: 'Executive Management' },
            ],
            order: 1,
          },
          {
            title: 'Human Resources and Legal Unit',
            content: 'Responsibilities:\n● Manage recruitment and onboarding for technical, field, admin and other roles\n● Maintain employee records and enforce HR policies\n● Oversee performance evaluations and appraisal cycles\n● Implement learning and development programs, especially technical upskilling\n● Draft and review contracts (EPC contracts, SLA, PFA agreements, vendor contracts, community agreements)\n● Ensure compliance with energy regulations and local laws\n● Handle legal disputes, arbitration, and regulatory filings\n● Maintain corporate legal documentation and confidentiality',
            quiz: [
              { question: 'What does the HR unit manage?', options: ['Recruitment and onboarding', 'Daily operations', 'Financial budgets', 'IT systems'], answer: 'Recruitment and onboarding' },
              { question: 'Who maintains employee records?', options: ['HR unit', 'Finance unit', 'Legal unit', 'IT unit'], answer: 'HR unit' },
              { question: 'What is overseen by HR?', options: ['Performance evaluations and appraisal cycles', 'Product sales', 'Warehouse stock', 'Marketing campaigns'], answer: 'Performance evaluations and appraisal cycles' },
              { question: 'What is implemented by HR?', options: ['Learning and development programs', 'Sports events', 'Cooking classes', 'Travel tours'], answer: 'Learning and development programs' },
              { question: 'Who drafts and reviews contracts?', options: ['Legal unit', 'HR unit', 'Finance unit', 'Sales unit'], answer: 'Legal unit' },
            ],
            order: 2,
          },
          {
            title: 'Finance & Accounts',
            content: 'Responsibilities:\n● Prepare budgets, forecasts, and financial statements\n● Manage invoicing, payments, reconciliations, and cashflow\n● Track expenditures and optimize cost efficiency\n● Ensure compliance with accounting standards, taxes, and audits\n● Provide financial reporting to management\n● Manage payroll, compensation, and benefits',
            quiz: [
              { question: 'What does Finance & Accounts prepare?', options: ['Budgets, forecasts, and financial statements', 'Food menus', 'Travel plans', 'Marketing ads'], answer: 'Budgets, forecasts, and financial statements' },
              { question: 'Who manages invoicing and payments?', options: ['Finance & Accounts', 'HR', 'Legal', 'IT'], answer: 'Finance & Accounts' },
              { question: 'What is tracked by Finance & Accounts?', options: ['Expenditures', 'Social media likes', 'Weather changes', 'Sports scores'], answer: 'Expenditures' },
              { question: 'What compliance does Finance & Accounts ensure?', options: ['Accounting standards, taxes, and audits', 'Fitness standards', 'Fashion standards', 'Music standards'], answer: 'Accounting standards, taxes, and audits' },
              { question: 'Who manages payroll?', options: ['Finance & Accounts', 'Sales', 'Procurement', 'Administration'], answer: 'Finance & Accounts' },
            ],
            order: 3,
          },
          {
            title: 'Risk & Compliance',
            content: 'Responsibilities:\n● Ensure compliance with clean energy regulations and safety standards\n● Conduct internal audits and enforce control frameworks\n● Maintain documentation for regulatory bodies and project certifications\n● Perform comprehensive credit risk and fraud detection Analysis',
            quiz: [
              { question: 'What does Risk & Compliance ensure?', options: ['Compliance with clean energy regulations', 'Daily lunch quality', 'Office decoration', 'Personal fitness'], answer: 'Compliance with clean energy regulations' },
              { question: 'Who conducts internal audits?', options: ['Risk & Compliance', 'Finance', 'HR', 'IT'], answer: 'Risk & Compliance' },
              { question: 'What is maintained by Risk & Compliance?', options: ['Documentation for regulatory bodies', 'Social media accounts', 'Warehouse stock', 'Marketing campaigns'], answer: 'Documentation for regulatory bodies' },
              { question: 'What analysis does Risk & Compliance perform?', options: ['Credit risk and fraud detection', 'Weather analysis', 'Sports analysis', 'Music analysis'], answer: 'Credit risk and fraud detection' },
              { question: 'What frameworks does Risk & Compliance enforce?', options: ['Control frameworks', 'Art frameworks', 'Dance frameworks', 'Cooking frameworks'], answer: 'Control frameworks' },
            ],
            order: 4,
          },
          {
            title: 'IT & Systems Unit',
            content: 'Responsibilities:\n● Support digital systems, applications, and integrations\n● Ensure Data protection, and secure user access\n● Manage internal software (including the new AI Task platform)\n● Provide technical support to all units\n● Maintain timely integration of IoT hardware into workflow\n● Serve as liaison between internal teams and external IT contractors',
            quiz: [
              { question: 'What does IT & Systems Unit support?', options: ['Digital systems, applications, and integrations', 'Physical fitness', 'Cooking classes', 'Travel tours'], answer: 'Digital systems, applications, and integrations' },
              { question: 'Who ensures data protection?', options: ['IT & Systems Unit', 'Finance', 'HR', 'Sales'], answer: 'IT & Systems Unit' },
              { question: 'What software does IT manage?', options: ['Internal software', 'External software', 'No software', 'All software'], answer: 'Internal software' },
              { question: 'Who provides technical support?', options: ['IT & Systems Unit', 'Procurement', 'Administration', 'Technical Team'], answer: 'IT & Systems Unit' },
              { question: 'What is maintained by IT?', options: ['Timely integration of IoT hardware', 'Social media', 'Warehouse stock', 'Marketing campaigns'], answer: 'Timely integration of IoT hardware' },
            ],
            order: 5,
          },
          {
            title: 'Administration',
            content: 'Responsibilities:\n● Oversee facilities, logistics, and office operations\n● Handle procurement of office supplies and field equipment support\n● Manage documentation, scheduling, and vendor coordination\n● Support communication between management and staff\n● Support executives with tasks such as itinerary, appointment, book trip and the likes',
            quiz: [
              { question: 'What does Administration oversee?', options: ['Facilities, logistics, office operations', 'Financial budgets', 'IT systems', 'Product sales'], answer: 'Facilities, logistics, office operations' },
              { question: 'Who handles procurement of office supplies?', options: ['Administration', 'Finance', 'HR', 'IT'], answer: 'Administration' },
              { question: 'What is managed by Administration?', options: ['Documentation, scheduling, vendor coordination', 'Warehouse stock', 'Marketing campaigns', 'Technical support'], answer: 'Documentation, scheduling, vendor coordination' },
              { question: 'Who supports communication between management and staff?', options: ['Administration', 'Sales', 'Procurement', 'Risk'], answer: 'Administration' },
              { question: 'What tasks does Administration support for executives?', options: ['Itinerary, appointment, book trip', 'Coding', 'Cooking', 'Dancing'], answer: 'Itinerary, appointment, book trip' },
            ],
            order: 6,
          },
          {
            title: 'Procurement & Supply Chain',
            content: 'Responsibilities:\n● Source and acquire technical equipment: solar panels, inverters, batteries, meters, BOS materials\n● Negotiate with vendors and maintain supplier performance records\n● Manage inventory and ensure availability of components for mini-grid projects\n● Oversee logistics, warehousing, and delivery planning\n● Track procurement KPIs and compliance with quality standards',
            quiz: [
              { question: 'What does Procurement source?', options: ['Technical equipment', 'Food', 'Clothing', 'Furniture'], answer: 'Technical equipment' },
              { question: 'Who negotiates with vendors?', options: ['Procurement', 'HR', 'Finance', 'IT'], answer: 'Procurement' },
              { question: 'What is managed by Procurement?', options: ['Inventory', 'Social media', 'Warehouse stock', 'Marketing campaigns'], answer: 'Inventory' },
              { question: 'Who oversees logistics?', options: ['Procurement', 'Sales', 'Administration', 'Technical Team'], answer: 'Procurement' },
              { question: 'What does Procurement track?', options: ['Procurement KPIs', 'Weather changes', 'Sports scores', 'Music trends'], answer: 'Procurement KPIs' },
            ],
            order: 7,
          },
          {
            title: 'Sales & Marketing',
            content: 'Responsibilities:\n● Prepare proposals, feasibility studies, and client documentation\n● Track revenue performance and customer acquisition metrics\n● Manage brand visibility, digital engagement, and public relations\n● Develop materials showcasing clean energy impact and sustainability\n● Run campaigns for customer acquisition for GroSolar',
            quiz: [
              { question: 'What does Sales prepare?', options: ['Proposals, feasibility studies', 'Food', 'Travel plans', 'IT systems'], answer: 'Proposals, feasibility studies' },
              { question: 'Who tracks revenue performance?', options: ['Sales & Marketing', 'HR', 'Finance', 'IT'], answer: 'Sales & Marketing' },
              { question: 'What is managed by Sales?', options: ['Brand visibility', 'Warehouse stock', 'Documentation', 'Technical support'], answer: 'Brand visibility' },
              { question: 'Who develops materials?', options: ['Sales & Marketing', 'Procurement', 'Administration', 'Risk'], answer: 'Sales & Marketing' },
              { question: 'What campaigns does Sales run?', options: ['Customer acquisition for GroSolar', 'Fitness campaigns', 'Fashion campaigns', 'Music campaigns'], answer: 'Customer acquisition for GroSolar' },
            ],
            order: 8,
          },
          {
            title: 'Customer Service / Client Support',
            content: 'Responsibilities:\n● Handle customer inquiries, complaints, and technical escalations\n● Ensure proper onboarding of GroSolar customers and tariff awareness\n● Track customer satisfaction and retention rate\n● Coordinate with technical team for field troubleshooting and maintenance',
            quiz: [
              { question: 'What does Customer Service handle?', options: ['Customer inquiries, complaints', 'Financial budgets', 'IT systems', 'Product sales'], answer: 'Customer inquiries, complaints' },
              { question: 'Who ensures proper onboarding?', options: ['Customer Service', 'Finance', 'HR', 'Sales'], answer: 'Customer Service' },
              { question: 'What is tracked by Customer Service?', options: ['Customer satisfaction and retention rate', 'Weather changes', 'Sports scores', 'Music trends'], answer: 'Customer satisfaction and retention rate' },
              { question: 'Who coordinates with the technical team?', options: ['Customer Service', 'Procurement', 'Administration', 'Executive'], answer: 'Customer Service' },
              { question: 'What awareness is ensured?', options: ['Tariff awareness', 'Fitness awareness', 'Fashion awareness', 'Music awareness'], answer: 'Tariff awareness' },
            ],
            order: 9,
          },
          {
            title: 'Technical Team (Clean Energy, Electrify MicroGrid(EML) & GroSolar)',
            content: 'Responsibilities:\nA. System Design & Engineering\n● Conduct load assessments, site surveys, and energy audits\n● Design mini-grid layouts, solar PV arrays, battery systems, and distribution networks\n● Perform sizing calculations for solar panels, inverters, controllers, and storage\n● Develop engineering drawings, schematics, and technical documentation\nB. Installation & Commissioning\n● Execute field installation of solar PV systems, distribution lines, and metering infrastructure\n● Install and configure inverters, batteries, charge controllers, and BoQ components\n● Conduct system testing, commissioning, and performance verification\n● Ensure installations adhere to engineering standards and safety regulations\nC. Technical Operations & Maintenance\n● Monitor system performance using dashboards, Simulation, or monitoring tools\n● Perform routine and preventive maintenance on solar PV, inverter systems, and mini-grid components\n● Respond to system faults, outages, and customer technical complaints\n● Maintain technical logs, downtime records, and fault-analysis documentation\nD. Environmental, Social & Governance\n● Enforce strict safety protocols for electrical installations\n● Conduct Environmental and Social Due diligence, and risk assessments\n● Ensure compliance with environmental standards and clean energy regulations\n● Document incident reports and lead corrective actions\nE. Technical Research & Optimization\n● Test new technologies (smart meters, lithium batteries, hybrid systems)\n● Recommend system upgrades to increase efficiency and reduce losses\n● Contribute to continuous improvement of installation and maintenance processes\n● Collaborate with R&D/Product teams to enhance monitoring and automation tools\n● Supervise field technicians, contractors, and subcontractors\n● Allocate resources for site work and ensure timely project execution',
            quiz: [
              { question: 'What does the Technical Team conduct in System Design?', options: ['Load assessments, site surveys, energy audits', 'Financial assessments', 'Social events', 'Marketing campaigns'], answer: 'Load assessments, site surveys, energy audits' },
              { question: 'What does the Technical Team design?', options: ['Mini-grid layouts, solar PV arrays', 'Office layouts', 'Website designs', 'Clothing designs'], answer: 'Mini-grid layouts, solar PV arrays' },
              { question: 'What calculations are performed?', options: ['Sizing calculations for solar panels, inverters', 'Budget calculations', 'Salary calculations', 'Marketing calculations'], answer: 'Sizing calculations for solar panels, inverters' },
              { question: 'What is executed in Installation?', options: ['Field installation of solar PV systems', 'Office cleaning', 'Budget preparation', 'Email sending'], answer: 'Field installation of solar PV systems' },
              { question: 'What is monitored in Operations?', options: ['System performance', 'Social media', 'Warehouse stock', 'Marketing campaigns'], answer: 'System performance' },
            ],
            order: 10,
          },
        ],
      },
      {
        title: 'Swap Station Mobility Limited SOP - Intermediate',
        description: 'Standard Operating Procedure Manual for running and Swap Station and EV Bike Management Draft Version: 1.0 Last Update: January 13, 2025 Table of Contents 1. Introduction. 2. Responsibilities. 3. Operational Procedures. 4. Conclusion',
        level: 'intermediate',
        assetco: 'SSM',
        modules: [
          {
            title: '1. Introduction',
            content: 'Objective: This Standard Operating Procedure (SOP) provides clear guidelines for the operation of Swap Station Mobility’s (SSM\'s) swap stations to ensure uniformity, efficiency, and safety across all locations. Scope: This document covers all aspects of swap station operations, including battery handling, customer service, maintenance, and data management.',
            quiz: [
              { question: 'What is the objective of the SOP?', options: ['Provide clear guidelines for operations', 'Ignore operations', 'Complicate operations', 'Stop operations'], answer: 'Provide clear guidelines for operations' },
              { question: 'What does the SOP ensure?', options: ['Uniformity, efficiency, safety', 'Chaos, inefficiency, danger'], answer: 'Uniformity, efficiency, safety' },
              { question: 'What does the document cover?', options: ['Battery handling, customer service, maintenance, data management', 'Only battery handling', 'Only customer service', 'Only maintenance'], answer: 'Battery handling, customer service, maintenance, data management' },
              { question: 'What is the draft version?', options: ['1.0', '2.0', '0.5', '3.1'], answer: '1.0' },
              { question: 'When was the last update?', options: ['January 13, 2025', 'March 12, 2025', 'November 2022', 'September 2025'], answer: 'January 13, 2025' },
            ],
            order: 1,
          },
          {
            title: '2. Responsibilities',
            content: 'S/N Designation Functions\n1 Station Project Manager Oversee station operations, ensure staff adherence to SOP, and manage inventory.\n2 Technicians Perform maintenance on EV bikes and batteries and ensure the functionality of swapping stations.\n3 Customer Service Representatives Handle customer inquiries, manage subscriptions, and provide assistance during the swapping process',
            terms: [
              { term: 'Station Project Manager', definition: 'Oversee station operations, ensure staff adherence to SOP, and manage inventory.' },
              { term: 'Technicians', definition: 'Perform maintenance on EV bikes and batteries and ensure the functionality of swapping stations.' },
              { term: 'Customer Service Representatives', definition: 'Handle customer inquiries, manage subscriptions, and provide assistance during the swapping process.' },
            ],
            quiz: [
              { question: 'Who oversees station operations?', options: ['Station Project Manager', 'Technicians', 'Customer Service Representatives', 'CEO'], answer: 'Station Project Manager' },
              { question: 'Who performs maintenance on EV bikes?', options: ['Technicians', 'Station Project Manager', 'Customer Service Representatives', 'HR'], answer: 'Technicians' },
              { question: 'Who handles customer inquiries?', options: ['Customer Service Representatives', 'Technicians', 'Station Project Manager', 'Legal'], answer: 'Customer Service Representatives' },
              { question: 'Who manages inventory?', options: ['Station Project Manager', 'Technicians', 'Customer Service Representatives', 'Finance'], answer: 'Station Project Manager' },
              { question: 'Who ensures functionality of swapping stations?', options: ['Technicians', 'Station Project Manager', 'Customer Service Representatives', 'IT'], answer: 'Technicians' },
            ],
            order: 2,
          },
          {
            title: '3. Operational Procedures',
            content: 'This outlines the standardized processes and actions necessary for the smooth and efficient functioning of swap stations. It ensures that all employees follow the same steps to deliver consistent service and maintain operational integrity.',
            quiz: [
              { question: 'What does this outline?', options: ['Standardized processes', 'No processes', 'Random processes', 'Ignore processes'], answer: 'Standardized processes' },
              { question: 'What is ensured for functioning?', options: ['Smooth and efficient', 'Rough', 'Inefficient', 'No functioning'], answer: 'Smooth and efficient' },
              { question: 'What do employees follow?', options: ['Same steps', 'Different steps', 'No steps', 'Random steps'], answer: 'Same steps' },
              { question: 'What is delivered?', options: ['Consistent service', 'Inconsistent', 'No service', 'Delayed service'], answer: 'Consistent service' },
              { question: 'What is maintained?', options: ['Operational integrity', 'No integrity', 'Partial', 'Ignore'], answer: 'Operational integrity' },
            ],
            order: 3,
          },
          {
            title: '3.1 Station setup and maintenance',
            content: 'Daily opening routine o Ensure the station is clean and organized. o Check all equipment for functionality. o Confirm sufficient inventory of charged batteries. Regular maintenance o Conduct weekly inspections of swapping equipment. o Schedule monthly maintenance for all EV bikes. o Replace or repair any faulty equipment promptly.',
            quiz: [
              { question: 'What is ensured in daily opening routine?', options: ['Station clean and organized', 'Station dirty', 'No checks', 'Ignore inventory'], answer: 'Station clean and organized' },
              { question: 'What is checked daily?', options: ['Equipment functionality', 'Weather', 'Stock market', 'News'], answer: 'Equipment functionality' },
              { question: 'What is confirmed daily?', options: ['Sufficient inventory of charged batteries', 'No batteries', 'Empty inventory', 'Damaged batteries'], answer: 'Sufficient inventory of charged batteries' },
              { question: 'How often are inspections conducted?', options: ['Weekly', 'Daily', 'Monthly', 'Yearly'], answer: 'Weekly' },
              { question: 'How often is maintenance scheduled for EV bikes?', options: ['Monthly', 'Weekly', 'Daily', 'Yearly'], answer: 'Monthly' },
            ],
            order: 4,
          },
          {
            title: '3.2 Battery charging',
            content: 'Charging Protocol: Charge batteries using approved chargers only. Monitor charging status to avoid overcharging. Storage: Store charged batteries in a secure, temperature-controlled environment.',
            quiz: [
              { question: 'What protocol for charging?', options: ['Use approved chargers only', 'Any chargers', 'No protocol', 'Ignore'], answer: 'Use approved chargers only' },
              { question: 'What is monitored?', options: ['Charging status to avoid overcharging', 'No monitoring', 'Undercharging', 'Random'], answer: 'Charging status to avoid overcharging' },
              { question: 'How are batteries stored?', options: ['Secure, temperature-controlled', 'Unsecure', 'No storage', 'Outdoor'], answer: 'Secure, temperature-controlled' },
              { question: 'What to avoid?', options: ['Overcharging', 'No avoid', 'Undercharging', 'Ignore'], answer: 'Overcharging' },
              { question: 'What environment?', options: ['Temperature-controlled', 'Hot', 'Cold', 'Wet'], answer: 'Temperature-controlled' },
            ],
            order: 5,
          },
          {
            title: '3.3 Battery Swapping Process',
            content: 'Customer Check-In: Verify customer identity and subscription status. Swapping Procedure: Safely remove the depleted battery and replace it with a charged one. Customer Check-out: Update the system with the swap details and confirm with the customer.',
            quiz: [
              { question: 'What is verified in check-in?', options: ['Customer identity and subscription', 'No verification', 'Only identity', 'Only subscription'], answer: 'Customer identity and subscription' },
              { question: 'What is done in swapping?', options: ['Remove depleted, replace with charged', 'No swap', 'Charge depleted', 'Ignore'], answer: 'Remove depleted, replace with charged' },
              { question: 'What is updated in check-out?', options: ['System with swap details', 'No update', 'Partial', 'Ignore'], answer: 'System with swap details' },
              { question: 'What is confirmed?', options: ['With the customer', 'No confirmation', 'With manager', 'With technician'], answer: 'With the customer' },
              { question: 'How is battery removed?', options: ['Safely', 'Unsafely', 'No remove', 'Random'], answer: 'Safely' },
            ],
            order: 6,
          },
          {
            title: '3.3.1 Customer Check-In',
            content: 'Verify customer identity and subscription status.',
            quiz: [
              { question: 'What is verified?', options: ['Identity and subscription', 'No verification', 'Only identity', 'Only subscription'], answer: 'Identity and subscription' },
              { question: 'What status?', options: ['Subscription status', 'No status', 'Identity only', 'Ignore'], answer: 'Subscription status' },
            ],
            order: 7,
          },
          {
            title: '3.3.2 Swapping Procedure',
            content: 'Safely remove the depleted battery and replace it with a charged one.',
            quiz: [
              { question: 'What is removed?', options: ['Depleted battery', 'Charged', 'No remove', 'Random'], answer: 'Depleted battery' },
              { question: 'What is replaced with?', options: ['Charged one', 'Depleted', 'No replace', 'Empty'], answer: 'Charged one' },
              { question: 'How?', options: ['Safely', 'Unsafely', 'Quickly', 'Slowly'], answer: 'Safely' },
            ],
            order: 8,
          },
          {
            title: '3.3.3 Customer Check-out',
            content: 'Update the system with the swap details and confirm with the customer.',
            quiz: [
              { question: 'What is updated?', options: ['System with swap details', 'No update', 'Customer', 'Battery'], answer: 'System with swap details' },
              { question: 'What is confirmed?', options: ['With the customer', 'No confirmation', 'With system', 'Ignore'], answer: 'With the customer' },
            ],
            order: 9,
          },
          {
            title: '3.4 EV Bike and battery Management',
            content: 'Lease to own: Offer lease-to-own options for EV bikes. Rental model: Provide rental services for EV bikes. Fleet inspection: Regularly inspect EV bikes for safety and performance. Fleet Management: Manage the fleet of EV bikes, including tracking and maintenance scheduling. Battery management: Track battery usage and health. Station Audit: Conduct regular audits of station operations. Data logging and analytics: Log data for analysis to improve operations.',
            quiz: [
              { question: 'What is lease to own?', options: ['Offer lease-to-own for EV bikes', 'No offer', 'Buy only', 'Rent only'], answer: 'Offer lease-to-own for EV bikes' },
              { question: 'What is rental model?', options: ['Provide rental for EV bikes', 'No rental', 'Lease only', 'Buy only'], answer: 'Provide rental for EV bikes' },
              { question: 'What is fleet inspection?', options: ['Inspect for safety and performance', 'No inspection', 'Partial', 'Ignore'], answer: 'Inspect for safety and performance' },
              { question: 'What is fleet management?', options: ['Manage fleet, tracking, maintenance', 'No management', 'Only tracking', 'Only maintenance'], answer: 'Manage fleet, tracking, maintenance' },
              { question: 'What is battery management?', options: ['Track usage and health', 'No track', 'Usage only', 'Health only'], answer: 'Track usage and health' },
            ],
            order: 10,
          },
          {
            title: '3.4.1 Lease to own',
            content: 'Offer lease-to-own options for EV bikes.',
            quiz: [
              { question: 'What is offered?', options: ['Lease-to-own options for EV bikes', 'No options', 'Rent only', 'Buy only'], answer: 'Lease-to-own options for EV bikes' },
            ],
            order: 11,
          },
          {
            title: '3.4.2 Rental model',
            content: 'Provide rental services for EV bikes.',
            quiz: [
              { question: 'What is provided?', options: ['Rental services for EV bikes', 'No services', 'Lease only', 'Buy only'], answer: 'Rental services for EV bikes' },
            ],
            order: 12,
          },
          {
            title: '3.4.3 Fleet inspection',
            content: 'Regularly inspect EV bikes for safety and performance.',
            quiz: [
              { question: 'What is inspected?', options: ['EV bikes for safety and performance', 'No inspection', 'Batteries only', 'Stations only'], answer: 'EV bikes for safety and performance' },
              { question: 'How often?', options: ['Regularly', 'Never', 'Once', 'Rarely'], answer: 'Regularly' },
            ],
            order: 13,
          },
          {
            title: '3.4.4 Fleet Management',
            content: 'Manage the fleet of EV bikes, including tracking and maintenance scheduling.',
            quiz: [
              { question: 'What is managed?', options: ['Fleet of EV bikes', 'No fleet', 'Batteries only', 'Stations only'], answer: 'Fleet of EV bikes' },
              { question: 'What is included?', options: ['Tracking and maintenance scheduling', 'No include', 'Tracking only', 'Scheduling only'], answer: 'Tracking and maintenance scheduling' },
            ],
            order: 14,
          },
          {
            title: '3.4.5 Battery management',
            content: 'Track battery usage and health.',
            quiz: [
              { question: 'What is tracked?', options: ['Battery usage and health', 'No track', 'Usage only', 'Health only'], answer: 'Battery usage and health' },
            ],
            order: 15,
          },
          {
            title: '3.4.6 Station Audit',
            content: 'Conduct regular audits of station operations.',
            quiz: [
              { question: 'What is conducted?', options: ['Regular audits of station operations', 'No audits', 'Partial audits', 'Ignore audits'], answer: 'Regular audits of station operations' },
            ],
            order: 16,
          },
          {
            title: '3.4.7 Data logging and analytics',
            content: 'Log data for analysis to improve operations.',
            quiz: [
              { question: 'What is logged?', options: ['Data for analysis', 'No log', 'Partial data', 'Ignore data'], answer: 'Data for analysis' },
              { question: 'What is the purpose?', options: ['Improve operations', 'No purpose', 'Worsen operations', 'Ignore operations'], answer: 'Improve operations' },
            ],
            order: 17,
          },
          {
            title: '3.5 Safety and Emergency Procedures',
            content: 'Safety protocol: Adhere to safety standards and use PPE. Emergency response: Follow emergency procedures for incidents.',
            quiz: [
              { question: 'What is adhered to in safety?', options: ['Safety standards and PPE', 'No adhere', 'Partial', 'Ignore'], answer: 'Safety standards and PPE' },
              { question: 'What is followed in emergency?', options: ['Emergency procedures for incidents', 'No follow', 'Partial', 'Ignore'], answer: 'Emergency procedures for incidents' },
            ],
            order: 18,
          },
          {
            title: '3.5.1 Safety protocol',
            content: 'Adhere to safety standards and use PPE.',
            quiz: [
              { question: 'What is adhered to?', options: ['Safety standards', 'No standards', 'Bad standards', 'Random standards'], answer: 'Safety standards' },
              { question: 'What is used?', options: ['PPE', 'No use', 'Partial', 'Ignore'], answer: 'PPE' },
            ],
            order: 19,
          },
          {
            title: '3.5.2 Emergency response',
            content: 'Follow emergency procedures for incidents.',
            quiz: [
              { question: 'What is followed?', options: ['Emergency procedures', 'No procedures', 'Partial', 'Ignore'], answer: 'Emergency procedures' },
              { question: 'For what?', options: ['Incidents', 'No incidents', 'Normal operations', 'Ignore'], answer: 'Incidents' },
            ],
            order: 20,
          },
          {
            title: '3.6 Customer service',
            content: 'Customer interaction: Provide courteous service. Feedback collection: Collect customer feedback regularly.',
            quiz: [
              { question: 'What is provided in interaction?', options: ['Courteous service', 'No service', 'Rude service', 'Ignore service'], answer: 'Courteous service' },
              { question: 'What is collected?', options: ['Customer feedback regularly', 'No collection', 'Partial', 'Ignore'], answer: 'Customer feedback regularly' },
            ],
            order: 21,
          },
          {
            title: '3.6.1 Customer interaction',
            content: 'Provide courteous service.',
            quiz: [
              { question: 'What is provided?', options: ['Courteous service', 'No service', 'Rude', 'Ignore'], answer: 'Courteous service' },
            ],
            order: 22,
          },
          {
            title: '3.6.2 Feedback collection',
            content: 'Collect customer feedback regularly.',
            quiz: [
              { question: 'What is collected?', options: ['Customer feedback', 'No feedback', 'Partial', 'Ignore'], answer: 'Customer feedback' },
              { question: 'How often?', options: ['Regularly', 'Never', 'Once', 'Rarely'], answer: 'Regularly' },
            ],
            order: 23,
          },
          {
            title: '3.7 Other procedure',
            content: 'Documentation and Reporting: Maintain accurate records. Continuous improvement: Review processes regularly. Training and development: Train staff on SOPs. Compliance and review: Ensure compliance with regulations.',
            quiz: [
              { question: 'What is maintained in documentation?', options: ['Accurate records', 'No records', 'Inaccurate', 'Ignore'], answer: 'Accurate records' },
              { question: 'What is reviewed in improvement?', options: ['Processes regularly', 'No review', 'Partial', 'Ignore'], answer: 'Processes regularly' },
              { question: 'What is trained?', options: ['Staff on SOPs', 'No training', 'Clients', 'Managers'], answer: 'Staff on SOPs' },
              { question: 'What is ensured in compliance?', options: ['Compliance with regulations', 'No compliance', 'Partial', 'Ignore'], answer: 'Compliance with regulations' },
            ],
            order: 24,
          },
          {
            title: '3.7.1 Documentation and Reporting',
            content: 'Maintain accurate records.',
            quiz: [
              { question: 'What is maintained?', options: ['Accurate records', 'No records', 'Inaccurate', 'Ignore'], answer: 'Accurate records' },
            ],
            order: 25,
          },
          {
            title: '3.7.2 Continuous improvement',
            content: 'Review processes regularly.',
            quiz: [
              { question: 'What is reviewed?', options: ['Processes', 'No review', 'Products', 'Staff'], answer: 'Processes' },
              { question: 'How often?', options: ['Regularly', 'Never', 'Once', 'Rarely'], answer: 'Regularly' },
            ],
            order: 26,
          },
          {
            title: '3.7.3 Training and development',
            content: 'Train staff on SOPs.',
            quiz: [
              { question: 'Who is trained?', options: ['Staff', 'No one', 'Clients', 'Managers'], answer: 'Staff' },
              { question: 'On what?', options: ['SOPs', 'No training', 'Random', 'Ignore'], answer: 'SOPs' },
            ],
            order: 27,
          },
          {
            title: '3.7.4 Compliance and review',
            content: 'Ensure compliance with regulations.',
            quiz: [
              { question: 'What is ensured?', options: ['Compliance with regulations', 'No compliance', 'Partial', 'Ignore'], answer: 'Compliance with regulations' },
            ],
            order: 28,
          },
          {
            title: '4. Conclusion',
            content: 'This SOP ensures efficient, safe, and consistent operations at swap stations.',
            quiz: [
              { question: 'What does SOP ensure?', options: ['Efficient, safe, consistent operations', 'Inefficient', 'Unsafe', 'Inconsistent'], answer: 'Efficient, safe, consistent operations' },
              { question: 'At where?', options: ['Swap stations', 'No where', 'Offices', 'Warehouses'], answer: 'Swap stations' },
            ],
            order: 29,
          },
        ],
      },
      {
        title: 'Concept Note Green Kiosk for Rural Communities - Expert',
        description: 'Concept note for accelerating access to energy in rural communities through Green Kiosk.',
        level: 'expert',
        assetco: 'Green Energy',
        modules: [
          {
            title: 'Executive Summary',
            content: 'Nigeria aspires to close the energy access gap in rural communities from the current 40% with no access to electricity to less than 20% by 2030. To achieve this objective, the country would need to deploy over 200,000 mini-grids across many unserved and underserved remote locations of the country. There are many hurdles to overcome before these aggressive goals can be achieved, and one of such hurdles is the unviability of a location to develop a minigrid. Notwithstanding, such communities still require access to electricity either through interconnected minigrids or stand alone micro-grids. This is where GreenKiosk comes in – a stand alone solar powered energy kiosk which provides electricity and telecommunication connection in a centralized hub for productive use of Energy (PUE) activities in the community. The Greenkiosk initiative addresses energy poverty in rural Nigeria by deploying modular, solar-powered kiosks that provide clean, reliable electricity and telecommunication connectivity in areas where mini-grids are not viable. These kiosks promote productive use of energy (PUE) activities in a centralized hub location, empower women entrepreneurs, and improve household energy access. The business model emphasizes financial sustainability through asset financing while making remarkable impact in the community by contributing to the achievement of multiple Sustainable Development Goals (SDGs).',
            quiz: [
              { question: 'What is Nigeria\'s energy access goal by 2030?', options: ['Less than 20% gap', 'Full access', 'Maintain current', 'Increase gap'], answer: 'Less than 20% gap' },
              { question: 'How many mini-grids needed?', options: ['Over 200,000', '100,000', '50,000', '10,000'], answer: 'Over 200,000' },
              { question: 'What is GreenKiosk?', options: ['Solar powered energy kiosk', 'Mini-grid', 'Grid extension', 'Diesel generator'], answer: 'Solar powered energy kiosk' },
              { question: 'What does Greenkiosk provide?', options: ['Electricity and telecommunication', 'Only electricity', 'Only telecommunication', 'Fuel'], answer: 'Electricity and telecommunication' },
              { question: 'What is emphasized in business model?', options: ['Financial sustainability', 'No sustainability', 'Environmental only', 'Social only'], answer: 'Financial sustainability' },
            ],
            order: 1,
          },
          {
            title: 'Problem Statement',
            content: 'Over 80 million Nigerians, predominantly in remote and underserved rural areas, lack access to reliable electricity, posing significant challenges to their economic development and quality of life. These communities face a persistent energy deficit that limits their access to education, healthcare, and income-generating opportunities. Without a sustainable energy solution, rural households and businesses are forced to rely on costly and environmentally harmful fossil fuel appliances such as kerosene lamps and petrol or diesel generators. In addition to continuous emission of green house gases (GHG), this further exacerbates energy poverty and perpetuating cycles of poverty and underdevelopment. The deployment of mini-grids, a proven solution for electrifying rural areas, is hindered by economic and logistical barriers in Nigeria. Dispersed, low-density settlements make it difficult to aggregate demand, reducing the financial viability of minigrid development in such locations. High upfront costs for infrastructure development, coupled with the limited ability of rural communities to pay for electricity, further challenge mini-grid implementation. As a result, significant unmet demand for affordable, clean, and reliable energy persists, leaving millions of Nigerians without access to modern energy services and hindering progress toward sustainable development goals.',
            quiz: [
              { question: 'How many Nigerians lack reliable electricity?', options: ['Over 80 million', '50 million', '100 million', '20 million'], answer: 'Over 80 million' },
              { question: 'What limits access in rural areas?', options: ['Energy deficit', 'Too much energy', 'No limits', 'Urban migration'], answer: 'Energy deficit' },
              { question: 'What do communities rely on?', options: ['Fossil fuel appliances', 'Solar', 'Wind', 'Hydro'], answer: 'Fossil fuel appliances' },
              { question: 'What hinders mini-grid deployment?', options: ['Economic and logistical barriers', 'No barriers', 'Too many grids', 'Government support'], answer: 'Economic and logistical barriers' },
              { question: 'What is the result?', options: ['Unmet demand for energy', 'Full access', 'Reduced demand', 'Ignore demand'], answer: 'Unmet demand for energy' },
            ],
            order: 2,
          },
          {
            title: 'Rationale for Standalone Solar-powered Energy Kiosks',
            content: 'Standalone solar-powered kiosks provide a practical and transformative solution for electrifying rural areas where mini-grids and grid extensions are economically unfeasible due to low population density, dispersed households, and limited commercial energy demand. These kiosks serve as centralized hubs for energy services, enabling activities such as lighting, mobile charging, refrigeration, and powering small businesses, which catalyze economic growth and enhance community resilience. By serving multiple small communities within a 5-10 km radius, energy kiosks offer a cost-effective and fast alternative for delivering reliable electricity to remote communities, fostering local economic activities and improving quality of life.',
            quiz: [
              { question: 'What do standalone kiosks provide?', options: ['Practical solution for electrification', 'No solution', 'Expensive solution', 'Temporary solution'], answer: 'Practical solution for electrification' },
              { question: 'Where are they useful?', options: ['Rural areas without mini-grids', 'Urban areas', 'Cities', 'Towns'], answer: 'Rural areas without mini-grids' },
              { question: 'What do kiosks serve as?', options: ['Centralized hubs for energy services', 'No hubs', 'Distributed hubs', 'Temporary hubs'], answer: 'Centralized hubs for energy services' },
              { question: 'What activities are enabled?', options: ['Lighting, charging, refrigeration', 'No activities', 'Only lighting', 'Only charging'], answer: 'Lighting, charging, refrigeration' },
              { question: 'What radius do they serve?', options: ['5-10 km', '1 km', '20 km', '50 km'], answer: '5-10 km' },
            ],
            order: 3,
          },
          {
            title: 'SDG Alignment',
            content: 'By harnessing renewable solar energy, these kiosks play a vital role in driving sustainable development by addressing critical challenges such as energy poverty, economic exclusion, and environmental degradation. This initiative directly contributes to the following SDGs: SDG 1 Facilitates income generation through productive energy use and entrepreneurship. Reduces reliance on expensive and polluting energy sources, saving household expenses. SDG 5 Empowers women by prioritizing them as kiosk operators and entrepreneurs. Promotes women-led businesses through access to affordable and reliable energy. SDG 7 Expands access to affordable, sustainable, and reliable energy for underserved communities. SDG 8 Expands local economies by enabling small businesses and value-added activities. Provides employment opportunities in kiosk management, maintenance, and related services. SDG 13 Reduces reliance on fossil fuels and lowers greenhouse gas emissions. Promotes climate resilience through sustainable energy solutions.',
            terms: [
              { term: 'SDG 1', definition: 'Facilitates income generation through productive energy use and entrepreneurship. Reduces reliance on expensive and polluting energy sources, saving household expenses.' },
              { term: 'SDG 5', definition: 'Empowers women by prioritizing them as kiosk operators and entrepreneurs. Promotes women-led businesses through access to affordable and reliable energy.' },
              { term: 'SDG 7', definition: 'Expands access to affordable, sustainable, and reliable energy for underserved communities.' },
              { term: 'SDG 8', definition: 'Expands local economies by enabling small businesses and value-added activities. Provides employment opportunities in kiosk management, maintenance, and related services.' },
              { term: 'SDG 13', definition: 'Reduces reliance on fossil fuels and lowers greenhouse gas emissions. Promotes climate resilience through sustainable energy solutions.' },
            ],
            quiz: [
              { question: 'What does SDG 1 facilitate?', options: ['Income generation', 'No generation', 'Reduce income', 'Ignore income'], answer: 'Income generation' },
              { question: 'What does SDG 5 empower?', options: ['Women', 'Men', 'Children', 'Elderly'], answer: 'Women' },
              { question: 'What does SDG 7 expand?', options: ['Access to energy', 'No access', 'Reduce access', 'Ignore access'], answer: 'Access to energy' },
              { question: 'What does SDG 8 expand?', options: ['Local economies', 'No economies', 'Reduce economies', 'Ignore economies'], answer: 'Local economies' },
              { question: 'What does SDG 13 reduce?', options: ['Reliance on fossil fuels', 'No reduction', 'Increase reliance', 'Ignore reliance'], answer: 'Reliance on fossil fuels' },
            ],
            order: 4,
          },
          {
            title: 'Solution Overview',
            content: 'Greenkiosk provides modular Solar-Powered kiosk located in centralized locations within the community to provide electricity for PUE activities which improves productivity of the community as well as the overall quality of life of the indigenes. The energy kiosk are fully equipped with photovoltaic panels, battery storage, and DC/AC power outlets. According to Nigerians Communication Commissions (NCC), there are over 205 million active mobile phone connections in Nigeria and though a good number can be attributed to users with multiple connections, 99% of people ages 16 -64 years have a mobile phone. The increasing importance of mobile phones in everyday life for communication and business purposes make it a necessity. Charging of these phones make a suitable mainstay for anchor PUE activities for Greenkiosk.',
            quiz: [
              { question: 'What does Greenkiosk provide?', options: ['Modular Solar-Powered kiosk', 'Mini-grid', 'Grid extension', 'Diesel generator'], answer: 'Modular Solar-Powered kiosk' },
              { question: 'Where are kiosks located?', options: ['Centralized locations', 'Distributed', 'Urban', 'No location'], answer: 'Centralized locations' },
              { question: 'What improves?', options: ['Productivity of the community', 'No improvement', 'Reduce productivity', 'Ignore productivity'], answer: 'Productivity of the community' },
              { question: 'What is equipped in kiosks?', options: ['Photovoltaic panels, battery storage', 'No equipment', 'Fossil fuel', 'Wind turbine'], answer: 'Photovoltaic panels, battery storage' },
              { question: 'How many active mobile connections in Nigeria?', options: ['Over 205 million', '100 million', '50 million', '300 million'], answer: 'Over 205 million' },
            ],
            order: 5,
          },
          {
            title: 'Productive Use of Energy Services Provided by GreenKiosk',
            content: '1. Phone and battery charging. 2. Cold storage for beverages and perishable 3. Business Centres – Internet access and administrative tasks 4. Retail outlet 5. Barbing Salon/ Hair styling 6. Entertainment viewing centre',
            terms: [
              { term: 'Phone and battery charging', definition: 'Charging services for mobile phones and batteries.' },
              { term: 'Cold storage for beverages and perishable', definition: 'Refrigeration for drinks and food items.' },
              { term: 'Business Centres – Internet access and administrative tasks', definition: 'Internet and office services.' },
              { term: 'Retail outlet', definition: 'Store for goods sales.' },
              { term: 'Barbing Salon/ Hair styling', definition: 'Hairdressing services.' },
              { term: 'Entertainment viewing centre', definition: 'Place for watching TV or movies.' },
            ],
            quiz: [
              { question: 'What is service 1?', options: ['Phone and battery charging', 'Cold storage', 'Business Centres', 'Retail outlet'], answer: 'Phone and battery charging' },
              { question: 'What is service 2?', options: ['Cold storage', 'Phone charging', 'Internet access', 'Hairdressing'], answer: 'Cold storage' },
              { question: 'What is service 3?', options: ['Business Centres', 'Retail outlet', 'Hairdressing', 'Entertainment'], answer: 'Business Centres' },
              { question: 'What is service 4?', options: ['Retail outlet', 'Phone charging', 'Cold storage', 'Internet access'], answer: 'Retail outlet' },
              { question: 'What is service 5?', options: ['Barbing Salon/ Hair styling', 'Entertainment', 'Retail', 'Charging'], answer: 'Barbing Salon/ Hair styling' },
            ],
            order: 6,
          },
          {
            title: 'Revenue Generation',
            content: 'Primarily, Green Kiosks will generate revenue from the sale of power as a service for the operation of any or a combination of PUE activities listed in the section above. Additional sources of revenue to be considered include 1. Sale of Rechargeable household appliances – lamps, fan, home entertainment system. 2. Sale of Solar Home Systems (SHS)',
            terms: [
              { term: 'Sale of power as a service', definition: 'Revenue from providing electricity for PUE activities.' },
              { term: 'Sale of Rechargeable household appliances', definition: 'Selling lamps, fans, etc.' },
              { term: 'Sale of Solar Home Systems (SHS)', definition: 'Selling home solar systems.' },
            ],
            quiz: [
              { question: 'What is primary revenue?', options: ['Sale of power', 'Appliances', 'SHS', 'No revenue'], answer: 'Sale of power' },
              { question: 'What is additional revenue 1?', options: ['Rechargeable appliances', 'Power', 'SHS', 'No additional'], answer: 'Rechargeable appliances' },
              { question: 'What is additional revenue 2?', options: ['Solar Home Systems', 'Power', 'Appliances', 'No additional'], answer: 'Solar Home Systems' },
              { question: 'What is sold in additional revenue 1?', options: ['Lamps, fan', 'No sale', 'Cars', 'Houses'], answer: 'Lamps, fan' },
              { question: 'What is SHS?', options: ['Solar Home Systems', 'Solar High Systems', 'No SHS', 'Solar House Systems'], answer: 'Solar Home Systems' },
            ],
            order: 7,
          },
          {
            title: 'Target Audience',
            content: 'The Greenkiosk model is specifically designed with women and youth as the primary target audience, recognizing their critical role in driving community development and fostering economic growth. Women, often disproportionately affected by energy poverty, can leverage the kiosks to power small businesses, reduce household energy costs, and improve living conditions, thereby advancing their empowerment and promoting gender equality. Youth, on the other hand, benefit from opportunities to build entrepreneurial skills, create sustainable livelihoods, and drive innovation within their communities. By prioritizing these groups, the initiative not only addresses immediate energy needs but also cultivates long-term socio-economic transformation and inclusivity.',
            quiz: [
              { question: 'Who is primary target?', options: ['Women and youth', 'Men', 'Elderly', 'Children'], answer: 'Women and youth' },
              { question: 'What do women leverage?', options: ['Kiosks for businesses', 'No leverage', 'Fossil fuel', 'Grid'], answer: 'Kiosks for businesses' },
              { question: 'What do youth benefit from?', options: ['Entrepreneurial skills', 'No benefit', 'Reduce skills', 'Ignore skills'], answer: 'Entrepreneurial skills' },
              { question: 'What is prioritized?', options: ['Women and youth', 'No priority', 'Men', 'Elderly'], answer: 'Women and youth' },
              { question: 'What is cultivated?', options: ['Socio-economic transformation', 'No cultivation', 'Poverty', 'Underdevelopment'], answer: 'Socio-economic transformation' },
            ],
            order: 8,
          },
          {
            title: 'Implementation Strategy',
            content: 'Community Engagement: Stakeholder Meetings: Engage with community leaders, women’s groups, and cooperatives to understand local needs and secure buy-in. Needs Assessment: Conduct surveys and focus group discussions to determine energy demands and potential productive uses. Awareness Campaigns: Use workshops, local events, and radio programs to educate communities on the benefits of clean energy and how the kiosks will operate. Partnership Development: Collaborate with local NGOs, schools, and health centers for effective integration into community life. Key Questions to Ask During Engagement (In addition to Know Your Customer Questions): Energy Needs and Usage What are the primary energy needs of your household/business (e.g., lighting, cooking, refrigeration, mobile charging)? How do you currently meet your energy needs, and what are the associated costs? Are there specific times of the day or year when energy needs are higher? Community Dynamics How many households are in the community, and what is the average household size? What are the main economic activities in the community? Are there existing communal hubs (e.g., markets, schools, health centers) that could host an energy kiosk? Energy Access and Challenges Do you have access to electricity? If yes, how reliable is it? What challenges do you face with your current energy sources (e.g., cost, availability, pollution)? Have there been any past initiatives to improve energy access in your community? If so, what were the outcomes? Interest in Solar Energy Kiosks Would you be interested in using a solar-powered energy kiosk? Why or why not? What specific services (e.g., device charging, cold storage, etc.) would you expect from an energy kiosk? Are there particular groups or individuals (particularly women) in the community who would benefit most from the kiosk? Financial Considerations What would you consider an affordable price for energy services? Are you open to a lease-to-own model for the energy kiosk? What forms of payment (e.g., cash, mobile money, barter) are most commonly used in your community? Gender and Youth Inclusion How do women and youth currently participate in economic activities in the community? Are there specific challenges women and youth face in accessing energy? How could an energy kiosk empower women and youth in your community? Operational Insights What are the preferred locations for an energy kiosk within the community? Are there individuals or groups in the community with experience managing similar initiatives? What logistical challenges (e.g., transportation, security) might affect the operation of an energy kiosk? Long-term Sustainability What additional services could be integrated with the energy kiosk (e.g., internet access, training programs)? Are there existing women-led groups or cooperatives interested in managing or operating the kiosk?',
            terms: [
              { term: 'Stakeholder Meetings', definition: 'Engage with community leaders, women’s groups, and cooperatives to understand local needs and secure buy-in.' },
              { term: 'Needs Assessment', definition: 'Conduct surveys and focus group discussions to determine energy demands and potential productive uses.' },
              { term: 'Awareness Campaigns', definition: 'Use workshops, local events, and radio programs to educate communities on the benefits of clean energy and how the kiosks will operate.' },
              { term: 'Partnership Development', definition: 'Collaborate with local NGOs, schools, and health centers for effective integration into community life.' },
            ],
            quiz: [
              { question: 'What is in stakeholder meetings?', options: ['Engage with leaders', 'No engagement', 'Ignore leaders', 'Reduce engagement'], answer: 'Engage with leaders' },
              { question: 'What is in needs assessment?', options: ['Surveys and discussions', 'No assessment', 'Partial', 'Ignore'], answer: 'Surveys and discussions' },
              { question: 'What is in awareness campaigns?', options: ['Workshops, events', 'No campaigns', 'Reduce campaigns', 'Ignore campaigns'], answer: 'Workshops, events' },
              { question: 'What is in partnership development?', options: ['Collaborate with NGOs', 'No collaboration', 'Partial', 'Ignore'], answer: 'Collaborate with NGOs' },
              { question: 'What is a key question on energy needs?', options: ['Primary energy needs', 'No needs', 'Secondary needs', 'Ignore needs'], answer: 'Primary energy needs' },
            ],
            order: 9,
          },
          {
            title: 'Ownership Models',
            content: 'Women-led cooperatives or community-based organizations.',
            quiz: [
              { question: 'What are ownership models?', options: ['Women-led cooperatives or community-based', 'No models', 'Individual only', 'Government only'], answer: 'Women-led cooperatives or community-based' },
            ],
            order: 10,
          },
          {
            title: 'Lease-to-Own Model',
            content: 'Operators can lease kiosks with the option to own them after a defined payment period, creating long-term asset ownership opportunities for women. Payment schedules tailored to match revenue cycles of local businesses.',
            quiz: [
              { question: 'What can operators do?', options: ['Lease with option to own', 'No option', 'Rent only', 'Buy only'], answer: 'Lease with option to own' },
              { question: 'After what?', options: ['Defined payment period', 'No period', 'Undefined', 'Ignore'], answer: 'Defined payment period' },
              { question: 'What opportunities?', options: ['Long-term asset ownership for women', 'No opportunities', 'Short-term', 'Men only'], answer: 'Long-term asset ownership for women' },
              { question: 'What are schedules tailored to?', options: ['Revenue cycles of local businesses', 'No tailor', 'Personal cycles', 'Random'], answer: 'Revenue cycles of local businesses' },
            ],
            order: 11,
          },
          {
            title: 'Training',
            content: 'Provide technical and entrepreneurial training for kiosk operators.',
            quiz: [
              { question: 'What is provided?', options: ['Technical and entrepreneurial training', 'No training', 'Only technical', 'Only entrepreneurial'], answer: 'Technical and entrepreneurial training' },
              { question: 'For whom?', options: ['Kiosk operators', 'No one', 'Customers', 'Staff'], answer: 'Kiosk operators' },
            ],
            order: 12,
          },
          {
            title: 'Maintenance and Operations',
            content: 'Establish local teams for kiosk maintenance and support.',
            quiz: [
              { question: 'What is established?', options: ['Local teams for maintenance', 'No teams', 'Global teams', 'Ignore teams'], answer: 'Local teams for maintenance' },
              { question: 'For what?', options: ['Kiosk maintenance and support', 'No support', 'Only maintenance', 'Only support'], answer: 'Kiosk maintenance and support' },
            ],
            order: 13,
          },
          {
            title: 'Financial Plan',
            content: 'Capital Expenditure (CAPEX): Solar panels, batteries, inverters, and kiosk structure. Initial training and marketing costs. Operational Expenditure (OPEX): Maintenance, replacement parts, and employees renumeration',
            terms: [
              { term: 'Capital Expenditure (CAPEX)', definition: 'Solar panels, batteries, inverters, and kiosk structure. Initial training and marketing costs.' },
              { term: 'Operational Expenditure (OPEX)', definition: 'Maintenance, replacement parts, and employees renumeration' },
            ],
            quiz: [
              { question: 'What is in CAPEX?', options: ['Solar panels, batteries', 'No expenditure', 'Only maintenance', 'Ignore'], answer: 'Solar panels, batteries' },
              { question: 'What is in OPEX?', options: ['Maintenance, replacement parts', 'No expenditure', 'Only solar panels', 'Ignore'], answer: 'Maintenance, replacement parts' },
              { question: 'What is included in CAPEX?', options: ['Initial training and marketing', 'No inclusion', 'Only maintenance', 'Ignore'], answer: 'Initial training and marketing' },
              { question: 'What is included in OPEX?', options: ['Employees renumeration', 'No inclusion', 'Solar panels', 'Batteries'], answer: 'Employees renumeration' },
            ],
            order: 14,
          },
          {
            title: 'Scalability and Replication',
            content: 'Pilot Phase: Deploy kiosks in 2-3 communities with no mini-grid viability to refine operations. Expansion Plan: Scale to 50+ communities within five years, prioritizing regions with high unmet electricity demand. Partnership Opportunities: Collaborate with NGOs, government programs, and private investors.',
            quiz: [
              { question: 'What is in pilot phase?', options: ['Deploy kiosks in 2-3 communities', 'No deployment', 'Deploy in 50 communities', 'Ignore'], answer: 'Deploy kiosks in 2-3 communities' },
              { question: 'What is in expansion plan?', options: ['Scale to 50+ communities', 'No scale', 'Reduce scale', 'Ignore'], answer: 'Scale to 50+ communities' },
              { question: 'What is in partnership opportunities?', options: ['Collaborate with NGOs', 'No collaboration', 'Reduce collaboration', 'Ignore'], answer: 'Collaborate with NGOs' },
              { question: 'What is prioritized?', options: ['Regions with high demand', 'Low demand', 'No priority', 'Urban areas'], answer: 'Regions with high demand' },
              { question: 'What is refined?', options: ['Operations', 'No refinement', 'Reduce operations', 'Ignore'], answer: 'Operations' },
            ],
            order: 15,
          },
          {
            title: 'Risk Assessment and Mitigation',
            content: 'Category Risk Mitigation Operational Equipment failure or downtime. Establish local maintenance teams and provide operator training Community Low adoption or trust in the kiosk services. Conduct robust community engagement and awareness campaigns. Market Insufficient revenue from services. Diversify offerings (e.g., water purification, appliance sales) and adopt flexible pricing models. Environmental Adverse weather affecting solar energy production. Design kiosks with sufficient battery storage and explore hybrid energy solutions.',
            terms: [
              { term: 'Operational', definition: 'Equipment failure or downtime. Establish local maintenance teams and provide operator training' },
              { term: 'Community', definition: 'Low adoption or trust in the kiosk services. Conduct robust community engagement and awareness campaigns.' },
              { term: 'Market', definition: 'Insufficient revenue from services. Diversify offerings (e.g., water purification, appliance sales) and adopt flexible pricing models.' },
              { term: 'Environmental', definition: 'Adverse weather affecting solar energy production. Design kiosks with sufficient battery storage and explore hybrid energy solutions.' },
            ],
            quiz: [
              { question: 'What is operational risk?', options: ['Equipment failure', 'Low adoption', 'Insufficient revenue', 'Adverse weather'], answer: 'Equipment failure' },
              { question: 'What is community risk?', options: ['Low adoption', 'Equipment failure', 'Insufficient revenue', 'Adverse weather'], answer: 'Low adoption' },
              { question: 'What is market risk?', options: ['Insufficient revenue', 'Equipment failure', 'Low adoption', 'Adverse weather'], answer: 'Insufficient revenue' },
              { question: 'What is environmental risk?', options: ['Adverse weather', 'Equipment failure', 'Low adoption', 'Insufficient revenue'], answer: 'Adverse weather' },
              { question: 'What is mitigation for operational?', options: ['Local maintenance teams', 'Community engagement', 'Diversify offerings', 'Battery storage'], answer: 'Local maintenance teams' },
            ],
            order: 16,
          },
          {
            title: 'Flow Diagram of Key Players',
            content: 'Key Players and Their Roles: Funding Partners: Provide funding and technical assistance. Local Operators (Primarily Women): Manage day-to-day kiosk operations. Community Leaders: Facilitate buy-in and ensure community support. Community Engagement officers: Visit communities to carry out stakeholders engagement and needs assessment survey Technical Teams (Grosolar): Handle installation, maintenance, and troubleshooting. End-Users: Access energy services and provide revenue streams.',
            terms: [
              { term: 'Funding Partners', definition: 'Provide funding and technical assistance.' },
              { term: 'Local Operators', definition: 'Manage day-to-day kiosk operations.' },
              { term: 'Community Leaders', definition: 'Facilitate buy-in and ensure community support.' },
              { term: 'Community Engagement officers', definition: 'Visit communities to carry out stakeholders engagement and needs assessment survey' },
              { term: 'Technical Teams (Grosolar)', definition: 'Handle installation, maintenance, and troubleshooting.' },
              { term: 'End-Users', definition: 'Access energy services and provide revenue streams.' },
            ],
            quiz: [
              { question: 'What do Funding Partners provide?', options: ['Funding and technical assistance', 'No provision', 'Only funding', 'Only assistance'], answer: 'Funding and technical assistance' },
              { question: 'What do Local Operators manage?', options: ['Day-to-day operations', 'No management', 'Funding', 'Installation'], answer: 'Day-to-day operations' },
              { question: 'What do Community Leaders facilitate?', options: ['Buy-in and support', 'No facilitation', 'Funding', 'Maintenance'], answer: 'Buy-in and support' },
              { question: 'What do officers visit?', options: ['Communities for engagement', 'No visit', 'Offices', 'Cities'], answer: 'Communities for engagement' },
              { question: 'What do Technical Teams handle?', options: ['Installation, maintenance', 'No handling', 'Funding', 'Engagement'], answer: 'Installation, maintenance' },
            ],
            order: 17,
          },
          {
            title: 'Conclusion',
            content: 'In conclusion, the GreenKiosk initiative presents a transformative approach to addressing energy poverty in rural Nigeria by leveraging standalone solar-powered kiosks to provide clean, reliable, and affordable electricity. Designed to serve as centralized hubs for productive energy use, these kiosks cater to areas where mini-grids and grid extensions are economically unfeasible. By targeting women and youth as key beneficiaries, GreenKiosk fosters entrepreneurship, enhances income-generating opportunities, and promotes inclusive economic growth. This initiative not only addresses immediate energy needs but also paves the way for long-term socio-economic development, empowering communities and driving sustainable progress in underserved regions.',
            quiz: [
              { question: 'What does GreenKiosk address?', options: ['Energy poverty', 'No address', 'Urban poverty', 'Ignore poverty'], answer: 'Energy poverty' },
              { question: 'What do kiosks leverage?', options: ['Solar-powered kiosks', 'Fossil fuel', 'Grid', 'No leverage'], answer: 'Solar-powered kiosks' },
              { question: 'What are kiosks designed as?', options: ['Centralized hubs', 'Distributed', 'No design', 'Temporary'], answer: 'Centralized hubs' },
              { question: 'Who are key beneficiaries?', options: ['Women and youth', 'Men', 'Elderly', 'Children'], answer: 'Women and youth' },
              { question: 'What does it pave?', options: ['Socio-economic development', 'No development', 'Poverty', 'Underdevelopment'], answer: 'Socio-economic development' },
            ],
            order: 18,
          },
        ],
      },
      {
        title: 'Company Profile - Beginner',
        description: 'Overview of FUNDCO CAPITAL MANAGERS and subsidiaries.',
        level: 'beginner',
        assetco: 'General',
        modules: [
          {
            title: 'COMPANY OVERVIEW FUNDCO CAPITAL MANAGERS (FundCo)',
            content: 'FundCo Capital Managers is authorized and registered by the Nigeria Securities and Exchange Commission to conduct the business of a fund/portfolio manager. As demands for asset allocation to alternatives continue to increase, we see a market where alternatives are becoming more valuable relative to conventional assets, and supply remains insufficient. We innovatively unlock domestic finance for small and medium-sized infrastructure in unserved or under-served sectors that provide essential services to society, are recession resilient, demonstrate long term viability with predictable cashflows and reduce the impact of climate change.',
            quiz: [
              { question: 'What is FundCo authorized by?', options: ['Nigeria Securities and Exchange Commission', 'Central Bank', 'Ministry of Finance', 'Local Government'], answer: 'Nigeria Securities and Exchange Commission' },
              { question: 'What does FundCo unlock?', options: ['Domestic finance', 'International finance', 'No finance', 'Personal finance'], answer: 'Domestic finance' },
              { question: 'What sectors does FundCo focus on?', options: ['Unserved and under-served', 'Urban only', 'International only', 'Government only'], answer: 'Unserved and under-served' },
              { question: 'What is demonstrated by sectors?', options: ['Long term viability', 'Short term', 'No viability', 'Random viability'], answer: 'Long term viability' },
              { question: 'What is reduced?', options: ['Impact of climate change', 'No reduction', 'Increase impact', 'Ignore impact'], answer: 'Impact of climate change' },
            ],
            order: 1,
          },
          {
            title: 'A. Housing Solution Fund (HSF)',
            content: 'Housing Solution Fund is a local currency real estate investment, trusted and conceptualised alongside its development partners, to provide innovative market based solutions to stimulate housing demand and scale housing supply by providing affordable and accessible long-dated home loans to eligible homebuyers in partnership with participating lending institutions and housing developers. The investment objective of the Fund is to deliver inflation-protected income and capital growth over the medium term for investors by funding a diversified portfolio of affordable home loan assets across Nigeria which will provide good quality accommodation to homeowners. The housing sector holds great potential to deliver the three pillars of the SDGs: economic, environmental, social sustainability. HSF aims to focus on four thematic areas strongly aligned with the UN Sustainable Development Goals.',
            quiz: [
              { question: 'What is HSF?', options: ['Local currency real estate investment', 'Clean energy fund', 'No fund', 'International fund'], answer: 'Local currency real estate investment' },
              { question: 'What does HSF provide?', options: ['Innovative market based solutions', 'No solutions', 'Traditional solutions', 'Random solutions'], answer: 'Innovative market based solutions' },
              { question: 'What is stimulated?', options: ['Housing demand', 'No demand', 'Reduce demand', 'Ignore demand'], answer: 'Housing demand' },
              { question: 'What is scaled?', options: ['Housing supply', 'No supply', 'Reduce supply', 'Ignore supply'], answer: 'Housing supply' },
              { question: 'What is the investment objective?', options: ['Inflation-protected income and capital growth', 'No objective', 'Loss', 'Stagnation'], answer: 'Inflation-protected income and capital growth' },
            ],
            order: 2,
          },
          {
            title: 'B. Clean Energy Fund (CEF)',
            content: 'The Clean Energy sector is a local currency fund providing funds locally to climate aligned, sustainable and inclusive clean energy infrastructure. CEF treats each investment opportunity on its own merit and designs a suitable transaction structure around it that reflects the risks and particularities of that investment. Clean energy fund has met the criteria and received green certification for its loan portfolio by the Climate Bonds Standard Board(CBSB) on behalf of the Climate Bonds Initiative(CBI). CEF supports alternative clean energy infrastructure, reduces foreign exchange(FX) exposure by providing local currency financing and creates a diversified portfolio of investments (across multiple value chains). Clean Energy Fund has following subsidiaries:',
            quiz: [
              { question: 'What is CEF?', options: ['Local currency fund for clean energy', 'Housing fund', 'No fund', 'International fund'], answer: 'Local currency fund for clean energy' },
              { question: 'What does CEF provide?', options: ['Funds to climate aligned infrastructure', 'No funds', 'Traditional funds', 'Random funds'], answer: 'Funds to climate aligned infrastructure' },
              { question: 'What certification has CEF received?', options: ['Green certification', 'No certification', 'Red certification', 'Blue certification'], answer: 'Green certification' },
              { question: 'Who issued the certification?', options: ['Climate Bonds Standard Board on behalf of Climate Bonds Initiative', 'Government', 'Bank', 'Company'], answer: 'Climate Bonds Standard Board on behalf of Climate Bonds Initiative' },
              { question: 'What does CEF reduce?', options: ['Foreign exchange exposure', 'No reduction', 'Increase exposure', 'Ignore exposure'], answer: 'Foreign exchange exposure' },
            ],
            order: 3,
          },
          {
            title: '1. Electrify MicroGrid Limited (EML)',
            content: 'Electrify MicroGrid Limited specializes in designing and developing customized microgrid solutions that cater to unique energy needs, from rural communities to off-grid businesses. EML tailored approach ensures reliable, sustainable energy delivery aligned with local resources and demand. Solutions are customized to meet specific community and environmental needs. Reduced energy costs offer affordable and efficient power, decreasing reliance on costly fuel alternatives. Easily expand microgrid systems as demand grows, supporting long-term community growth.',
            quiz: [
              { question: 'What does EML specialize in?', options: ['Designing microgrid solutions', 'Banking', 'Education', 'Health'], answer: 'Designing microgrid solutions' },
              { question: 'For whom are solutions?', options: ['Rural communities to off-grid businesses', 'Only urban', 'Only cities', 'No one'], answer: 'Rural communities to off-grid businesses' },
              { question: 'What approach does EML use?', options: ['Tailored approach', 'No approach', 'Random', 'Ignore'], answer: 'Tailored approach' },
              { question: 'What is ensured?', options: ['Reliable, sustainable energy', 'Unreliable', 'No energy', 'Fossil energy'], answer: 'Reliable, sustainable energy' },
              { question: 'What costs are reduced?', options: ['Energy costs', 'No reduction', 'Increase costs', 'Ignore costs'], answer: 'Energy costs' },
            ],
            order: 4,
          },
          {
            title: '2. GroSolar AssetCo Limited (GroSolar)',
            content: 'GroSolar AssetCo is a solar asset holding platform that invests in and owns solar equipment installed and operated by renewable energy service companies providing solar as a service for residential homes and businesses to conveniently switch to solar from diesel and expensive fossil fuel generators without high upfront cost. GroSolar is set up to revolutionize solar energy adoption by implementing an innovative Solar as a Service (SaaS) model to scale up the distribution of Stand-Alone Solar Systems (SAS) through a subscription financial arrangement with offtakers. This model aims to mitigate the high upfront costs of SAS that deter many potential commercial and industrial (C&I) users from switching to solar energy solutions. By leveraging long-term domestic financing and partnering with local solar energy service providers, GroSolar will enable access to affordable solar energy solutions.',
            quiz: [
              { question: 'What is GroSolar?', options: ['Solar asset holding platform', 'Bank', 'School', 'Hospital'], answer: 'Solar asset holding platform' },
              { question: 'What does GroSolar invest in?', options: ['Solar equipment', 'Real estate', 'Stocks', 'Cryptocurrency'], answer: 'Solar equipment' },
              { question: 'Who operates the equipment?', options: ['Renewable energy service companies', 'Customers', 'Government', 'Schools'], answer: 'Renewable energy service companies' },
              { question: 'What model does GroSolar use?', options: ['Solar as a Service (SaaS)', 'Pay As You Go', 'Buy Now Pay Later', 'Lease to Own'], answer: 'Solar as a Service (SaaS)' },
              { question: 'What does GroSolar revolutionize?', options: ['Solar energy adoption', 'No revolution', 'Fossil fuel', 'Grid energy'], answer: 'Solar energy adoption' },
            ],
            order: 5,
          },
          {
            title: '3. Agronomie',
            content: 'Agronomie is a specialised agro-tech company aggregating and accelerating access to finance for agro-productive use of clean energy from solar mini-grids, through an innovative mix of productive asset financing, training and technology based asset management thereby expanding rural economies in Nigeria. We are also a leading provider of end-to-end solutions for the procurement, operation and maintenance of productive use agro processing equipment. Our expertise spans a diverse range of agricultural industries, and we are committed to delivering innovative and sustainable solutions tailored to the unique needs of our clients through an innovative Hub & Spoke business model with a centralized tech “hub” for remote asset control and monitoring and localized “Spoke” of teams for operations and maintenance of productive asset thereby expanding rural economies in Nigeria on a large scale portfolio spread across the country. Our mandate includes the origination and management of Productive Use of Energy (PuE) infrastructure, deal structuring and portfolio management.',
            quiz: [
              { question: 'What is Agronomie?', options: ['Agro-tech company', 'Bank', 'School', 'Hospital'], answer: 'Agro-tech company' },
              { question: 'What does Agronomie aggregate?', options: ['Access to finance for agro-productive use', 'No access', 'Reduce access', 'Ignore access'], answer: 'Access to finance for agro-productive use' },
              { question: 'What model does Agronomie use?', options: ['Hub & Spoke', 'No model', 'Random model', 'Old model'], answer: 'Hub & Spoke' },
              { question: 'What is the mandate?', options: ['Origination and management of PuE infrastructure', 'No mandate', 'Financial mandate', 'Social mandate'], answer: 'Origination and management of PuE infrastructure' },
              { question: 'What is expanded?', options: ['Rural economies', 'Urban economies', 'No economies', 'Global economies'], answer: 'Rural economies' },
            ],
            order: 6,
          },
          {
            title: '4. Swap Station Mobility Limited (SSM)',
            content: 'Swap Station Mobility Limited is an electric vehicle and battery swapping infrastructure company that enables access to low-cost, clean mobility alternatives to internal combustion engine (ICE) vehicles. SSM provides electric vehicles (EVs) and battery-swapping infrastructure, aiming to replace internal combustion engine (ICE) vehicles with cleaner alternatives. With a robust Environmental and Social Management System (ESMS) to mitigate environmental and social (E&S) risks in compliance with national legislation and international standards, including IFC Performance Standards, AfDB Integrated Safeguards, ISO 14001, and the UN Guiding Principles on Business and Human Rights. the International Labour Organisation (ILO), and relevant industry guidelines for electric vehicle and battery-swapping infrastructure.',
            quiz: [
              { question: 'What is SSM?', options: ['Electric vehicle and battery swapping company', 'Bank', 'School', 'Hospital'], answer: 'Electric vehicle and battery swapping company' },
              { question: 'What does SSM enable?', options: ['Access to low-cost, clean mobility', 'High-cost', 'No access', 'Fossil fuel'], answer: 'Access to low-cost, clean mobility' },
              { question: 'What does SSM aim to replace?', options: ['Internal combustion engine vehicles', 'No replacement', 'EVs', 'Bikes'], answer: 'Internal combustion engine vehicles' },
              { question: 'What system does SSM have?', options: ['Environmental and Social Management System', 'No system', 'Financial system', 'Social system'], answer: 'Environmental and Social Management System' },
              { question: 'What standards does SSM comply with?', options: ['IFC, AfDB, ISO 14001, UN Guiding Principles', 'No compliance', 'Personal standards', 'Random standards'], answer: 'IFC, AfDB, ISO 14001, UN Guiding Principles' },
            ],
            order: 7,
          },
        ],
      },
      {
        title: 'Authorisation and Standard Operating Procedure for Isolated Solar Mini-Grid - Expert',
        description: 'This procedure is established to ensure that all operations related to the installation of Isolated solar Mini-Grid power systems in the technical department comply with the outlined requirements.',
        level: 'expert',
        assetco: 'EML',
        modules: [
          {
            title: 'Authorisation',
            content: 'This procedure is established to ensure that all operations related to the installation of Isolated solar Mini-Grid power systems in the technical department comply with the outlined requirements. The procedure must be followed consistently and systematically to achieve the company\'s quality policy, departmental objectives, and the expectations of all interested parties, including clients and external contractors. Compliance with this SOP is mandatory for all within the technical department and any externally contracted EPC Companies. Any deviation from the specified procedures without prior authorization from management will result in disciplinary action, as determined by the company\'s policies.',
            quiz: [
              { question: 'What is the procedure for?', options: ['Installation of Isolated solar Mini-Grid', 'Office cleaning', 'Financial auditing', 'Marketing'], answer: 'Installation of Isolated solar Mini-Grid' },
              { question: 'What must be followed?', options: ['The procedure consistently', 'No procedure', 'Partial procedure', 'Ignore procedure'], answer: 'The procedure consistently' },
              { question: 'What is achieved?', options: ['Company\'s quality policy, objectives', 'No achievement', 'Personal goals', 'Random objectives'], answer: 'Company\'s quality policy, objectives' },
              { question: 'Is compliance mandatory?', options: ['Yes', 'No'], answer: 'Yes' },
              { question: 'What happens on deviation?', options: ['Disciplinary action', 'No action', 'Reward', 'Promotion'], answer: 'Disciplinary action' },
            ],
            order: 1,
          },
          {
            title: 'Standard Operating Procedure (SOP) for Isolated Solar Mini-Grid System Installation',
            content: 'Issued by: Electrify Microgrid Limited Effective Date: [Insert Date] Reviewed by: [Name/Position]',
            quiz: [
              { question: 'Who issued the SOP?', options: ['Electrify Microgrid Limited', 'FundCo', 'GroSolar', 'Agronomie'], answer: 'Electrify Microgrid Limited' },
              { question: 'What is the effective date?', options: ['[Insert Date]', 'January 1', 'December 31', 'No date'], answer: '[Insert Date]' },
              { question: 'Who reviewed?', options: ['[Name/Position]', 'No one', 'CEO', 'Manager'], answer: '[Name/Position]' },
              { question: 'What is the SOP for?', options: ['Isolated Solar Mini-Grid System Installation', 'Office setup', 'Financial planning', 'HR recruitment'], answer: 'Isolated Solar Mini-Grid System Installation' },
              { question: 'Is date inserted?', options: ['Yes', 'No'], answer: 'Yes' },
            ],
            order: 2,
          },
          {
            title: '1. Purpose',
            content: 'This SOP defines the process for installing isolated solar mini-grid power systems, including Generation assets (solar panels, inverter, battery backup, mounting racks, protection devices, earthing, and wiring), Distribution Assets (Electric poles, distribution cables), Customer Connection (Meter installation, house wiring) detailing the roles and responsibilities of Electrify Microgrid Limited and externally contracted installers. It ensures that all installations follow industry standards, best practices, and safety requirements while minimizing risks related to poor workmanship, substandard materials, or inadequate installation practices.',
            quiz: [
              { question: 'What does this SOP define?', options: ['Process for installing isolated solar mini-grid', 'Process for office cleaning', 'Process for financial auditing', 'Process for marketing'], answer: 'Process for installing isolated solar mini-grid' },
              { question: 'What assets are included in Generation?', options: ['Solar panels, inverter, battery backup', 'Electric poles', 'Meter installation', 'House wiring'], answer: 'Solar panels, inverter, battery backup' },
              { question: 'What assets are in Distribution?', options: ['Electric poles, distribution cables', 'Solar panels', 'Inverter', 'Battery'], answer: 'Electric poles, distribution cables' },
              { question: 'What is in Customer Connection?', options: ['Meter installation, house wiring', 'Solar panels', 'Inverter', 'Electric poles'], answer: 'Meter installation, house wiring' },
              { question: 'What does it ensure?', options: ['Industry standards, best practices, safety', 'No standards', 'Poor workmanship', 'Substandard materials'], answer: 'Industry standards, best practices, safety' },
            ],
            order: 3,
          },
          {
            title: '2. Scope',
            content: 'This procedure applies to all isolated solar mini-grid system installations undertaken by Electrify Microgrid Limited and its external installers. It encompasses the entire process, from pre-installation assessments to post-installation inspection and handover.',
            quiz: [
              { question: 'To what does this procedure apply?', options: ['All isolated solar mini-grid installations', 'Only pre-installation', 'Only post-installation', 'No installations'], answer: 'All isolated solar mini-grid installations' },
              { question: 'Who does it apply to?', options: ['Electrify Microgrid Limited and external installers', 'Only internal', 'Only external', 'No one'], answer: 'Electrify Microgrid Limited and external installers' },
              { question: 'What does it encompass?', options: ['Entire process from pre to post', 'Partial process', 'No process', 'Random process'], answer: 'Entire process from pre to post' },
              { question: 'What is included in the process?', options: ['Pre-installation assessments to handover', 'Only assessments', 'Only handover', 'Ignore'], answer: 'Pre-installation assessments to handover' },
              { question: 'Is it comprehensive?', options: ['Yes', 'No'], answer: 'Yes' },
            ],
            order: 4,
          },
          {
            title: '3. Responsibilities',
            content: '● Electrify Microgrid Limited:\n○ Provide all required equipment (Solar panels, inverters, batteries, Cables, Poles etc) for project.\n○ Ensure selection of qualified installers based on certifications, experience, and past performance.\n○ Provide clear project documentation and specifications.\n○ Conduct periodic quality control checks.\n○ Handle project management and final inspections.\n● EPC Contracted Installers:\n○ Perform installations according to the provided technical designs, project scope, and industry standards.\n○ Maintain high-quality standards and ensure safety during the installation process for equipment and working personnel.\n○ Correct any deficiencies or non-compliance with EML\'s quality expectations, at no additional cost, upon inspection.',
            quiz: [
              { question: 'What does Electrify Microgrid Limited provide?', options: ['All required equipment', 'No equipment', 'Partial equipment', 'Ignore equipment'], answer: 'All required equipment' },
              { question: 'Who ensures selection of qualified installers?', options: ['Electrify Microgrid Limited', 'EPC Installers', 'No one', 'Government'], answer: 'Electrify Microgrid Limited' },
              { question: 'What is provided by EML?', options: ['Clear project documentation', 'No documentation', 'Unclear', 'Ignore'], answer: 'Clear project documentation' },
              { question: 'Who conducts quality control checks?', options: ['Electrify Microgrid Limited', 'EPC Installers', 'Clients', 'External'], answer: 'Electrify Microgrid Limited' },
              { question: 'Who performs installations?', options: ['EPC Contracted Installers', 'EML', 'No one', 'Clients'], answer: 'EPC Contracted Installers' },
            ],
            order: 5,
          },
          {
            title: '4. Pre-Installation Procedure',
            content: '4.1 Site Survey\n● Conduct a thorough site survey to assess the suitability of the land location.\n● Verify that there is adequate space, sunlight exposure, and minimal shading throughout the day.\n● Assess the current community load demand\n● Identify any potential hazards, and environmental issues and provide mitigation measures\n4.2 Site Acquisition\n· Desktop research and verification of community demo graphs and coordinates\n· Request for site documentation; executed exclusivity and commercial contract, land agreement, community engagement reports with attendance, contacts of key representatives in the community and executed grant agreement (if applicable).\n· Validation of all submitted documents.\n· Introduction of EML to the community by developer.\n4.3 Design and Specification\n● Electrify Microgrid will provide a detailed design for the system, including but not limited to:\n○ Solar panels: number, wattage, and arrangement.\n○ Inverter: Sizing based on system capacity.\n○ Battery backup: storage capacity and placement for optimal performance.\n○ Mounting racks: type and installation method, considering roof material.\n○ Protection devices: surge protectors, breakers, and disconnect switches.\n○ Wires: Cable routing and management for efficient energy transfer.\n○ Earthing and grounding: Design of the earthing system to ensure the safe discharge of excess electrical energy to the ground, including materials and placement of grounding rods and wires.\n● Technical specifications and materials, including panels, mounting hardware, and inverters, should meet or exceed the standard set by Electrify Microgrid.\n4.4 Project Financing\n· Only verified cost items will be eligible for financing\n· Financing will be a blend of Equity, Debt from EML and other project investors such as Banks, Venture capitals, Angel Investor, Government, Pension Fund Administrators, and other legal investment entities.\n· EML manages the acquisition of financing and distribution finance towards project cause.\n4.5 Contractual Agreement with Installers\n● External installers must sign an Engineering Procurement and Construction (EPC) Contract covering:\n○ Scope of work and specific deliverables.\n○ Adherence to safety protocols and electrical standards.\n○ Use of high-quality, certified materials as specified by EML.\n○ Commitment to complete the installation within a specified timeframe.\n○ Warranty on workmanship for a minimum of 18 months against defects.',
            quiz: [
              { question: 'What is conducted in site survey?', options: ['Thorough site survey', 'No survey', 'Partial survey', 'Ignore survey'], answer: 'Thorough site survey' },
              { question: 'What is verified in site survey?', options: ['Adequate space, sunlight, minimal shading', 'No verification', 'Bad space', 'High shading'], answer: 'Adequate space, sunlight, minimal shading' },
              { question: 'What is assessed in site survey?', options: ['Community load demand', 'No demand', 'High demand', 'Low demand'], answer: 'Community load demand' },
              { question: 'What is identified in site survey?', options: ['Potential hazards, environmental issues', 'No issues', 'Ignore issues', 'Create issues'], answer: 'Potential hazards, environmental issues' },
              { question: 'What is provided in site survey?', options: ['Mitigation measures', 'No measures', 'Partial', 'Ignore'], answer: 'Mitigation measures' },
            ],
            order: 6,
          },
          {
            title: '4.1 Site Survey',
            content: 'Conduct a thorough site survey to assess the suitability of the land location. Verify that there is adequate space, sunlight exposure, and minimal shading throughout the day. Assess the current community load demand Identify any potential hazards, and environmental issues and provide mitigation measures',
            quiz: [
              { question: 'What is conducted?', options: ['Thorough site survey', 'No survey', 'Partial survey', 'Ignore survey'], answer: 'Thorough site survey' },
              { question: 'What is assessed?', options: ['Suitability of land location', 'No assessment', 'Bad location', 'Random location'], answer: 'Suitability of land location' },
              { question: 'What is verified?', options: ['Adequate space, sunlight, minimal shading', 'No verification', 'Bad space', 'High shading'], answer: 'Adequate space, sunlight, minimal shading' },
              { question: 'What demand is assessed?', options: ['Community load demand', 'No demand', 'High demand', 'Low demand'], answer: 'Community load demand' },
              { question: 'What is identified?', options: ['Potential hazards, environmental issues', 'No issues', 'Ignore issues', 'Create issues'], answer: 'Potential hazards, environmental issues' },
            ],
            order: 7,
          },
          {
            title: '4.2 Site Acquisition',
            content: 'Desktop research and verification of community demo graphs and coordinates Request for site documentation; executed exclusivity and commercial contract, land agreement, community engagement reports with attendance, contacts of key representatives in the community and executed grant agreement (if applicable). Validation of all submitted documents. Introduction of EML to the community by developer.',
            quiz: [
              { question: 'What is done in site acquisition?', options: ['Desktop research and verification', 'No research', 'Partial', 'Ignore'], answer: 'Desktop research and verification' },
              { question: 'What is requested?', options: ['Site documentation', 'No documentation', 'Unclear', 'Ignore'], answer: 'Site documentation' },
{ question: 'What is validated?', options: ['All submitted documents', 'No validation', 'Partial', 'Ignore'], answer: 'All submitted documents' },
{ question: 'What is introduced?', options: ['EML to the community', 'No introduction', 'Developer to EML', 'Random'], answer: 'EML to the community' },
{ question: 'By whom?', options: ['Developer', 'No one', 'EML', 'Community'], answer: 'Developer' },
],
order: 8,
},
{
title: '4.3 Design and Specification',
content: 'Electrify Microgrid will provide a detailed design for the system, including but not limited to: Solar panels: number, wattage, and arrangement. Inverter: Sizing based on system capacity. Battery backup: storage capacity and placement for optimal performance. Mounting racks: type and installation method, considering roof material. Protection devices: surge protectors, breakers, and disconnect switches. Wires: Cable routing and management for efficient energy transfer. Earthing and grounding: Design of the earthing system to ensure the safe discharge of excess electrical energy to the ground, including materials and placement of grounding rods and wires. Technical specifications and materials, including panels, mounting hardware, and inverters, should meet or exceed the standard set by Electrify Microgrid.',
quiz: [
{ question: 'Who provides detailed design?', options: ['Electrify Microgrid', 'Developer', 'Contractor', 'Client'], answer: 'Electrify Microgrid' },
{ question: 'What is included for solar panels?', options: ['Number, wattage, arrangement', 'No inclusion', 'Only number', 'Only wattage'], answer: 'Number, wattage, arrangement' },
{ question: 'What is for inverter?', options: ['Sizing based on capacity', 'No sizing', 'Random sizing', 'Ignore'], answer: 'Sizing based on capacity' },
{ question: 'What is for battery backup?', options: ['Storage capacity and placement', 'No backup', 'Only capacity', 'Only placement'], answer: 'Storage capacity and placement' },
{ question: 'What is for mounting racks?', options: ['Type and installation method', 'No racks', 'Only type', 'Only method'], answer: 'Type and installation method' },
],
order: 9,
},
{
title: '4.4 Project Financing',
content: 'Only verified cost items will be eligible for financing Financing will be a blend of Equity, Debt from EML and other project investors such as Banks, Venture capitals, Angel Investor, Government, Pension Fund Administrators, and other legal investment entities. EML manages the acquisition of financing and distribution finance towards project cause.',
quiz: [
{ question: 'What is eligible for financing?', options: ['Only verified cost items', 'All items', 'No items', 'Unverified items'], answer: 'Only verified cost items' },
{ question: 'What is financing blend?', options: ['Equity, Debt from EML and others', 'No blend', 'Only equity', 'Only debt'], answer: 'Equity, Debt from EML and others' },
{ question: 'Who manages financing?', options: ['EML', 'No one', 'Developer', 'Contractor'], answer: 'EML' },
{ question: 'What is managed?', options: ['Acquisition and distribution', 'No management', 'Only acquisition', 'Only distribution'], answer: 'Acquisition and distribution' },
{ question: 'What is towards?', options: ['Project cause', 'No cause', 'Personal', 'Random'], answer: 'Project cause' },
],
order: 10,
},
{
title: '4.5 Contractual Agreement with Installers',
content: 'External installers must sign an Engineering Procurement and Construction (EPC) Contract covering: Scope of work and specific deliverables. Adherence to safety protocols and electrical standards. Use of high-quality, certified materials as specified by EML. Commitment to complete the installation within a specified timeframe. Warranty on workmanship for a minimum of 18 months against defects.',
quiz: [
{ question: 'What must external installers sign?', options: ['EPC Contract', 'No contract', 'Partial contract', 'Ignore contract'], answer: 'EPC Contract' },
{ question: 'What is covered in contract?', options: ['Scope of work, deliverables', 'No cover', 'Only scope', 'Only deliverables'], answer: 'Scope of work, deliverables' },
{ question: 'What adherence is required?', options: ['Safety protocols and standards', 'No adherence', 'Partial', 'Ignore'], answer: 'Safety protocols and standards' },
{ question: 'What materials are used?', options: ['High-quality, certified', 'Low quality', 'No materials', 'Substandard'], answer: 'High-quality, certified' },
{ question: 'What is the warranty?', options: ['18 months against defects', 'No warranty', '6 months', '12 months'], answer: '18 months against defects' },
],
order: 11,
},
{
title: '5. Installation Procedure',
content: '5.1 PV Mounting\n● Ensure installation slope between 10 to 15 degrees facing south.\n● Ensure minimum height clearance of 0.5m from ground\n● Modules must be installed in open space free from shading all day long.\n● Depth of PV structure should not be less than 1.5m.\n● Ensure use of galvanized iron shear bolts and nuts to couple PV modules and structure.\n● Metal parts of the structure in-ground and near the ground must be protected against corrosion for 20 years.\n● Gravelling should be 150mm thick.\n● Ensure PV structure can withstand extreme wind speed in installation location.\n● Ensure output voltage from PV string match MPPT specification.\n● Photovoltaic solar modules must be fixed on an even surface, with no more than 20mm difference from the ideal plane.\n5.3 Inverter and Electrical Systems\n● Install inverters, isolators, and other electrical components in an energy cabin or power house that is easily accessible and well-ventilated.\n● Ensure all connections to the solar panels, battery backup, and distribution lines are secure and properly grounded (with minimum of CAT II protection systems) to prevent electrical faults.\n● Test the system for efficiency and functionality before commissioning, providing documented evidence of test.\n● Ensure the right polarity for battery, PV, AC inputs and Outputs are correctly placed.\n5.4 BESS Installation\n● Install the battery backup in a designated, cool, and secure area, away from any potential hazards.\n● Ensure proper wiring and grounding for safe battery operation and integration with the inverter.\n● Use only copper cables and lugs to connect batteries and inverters.\n● Battery Support structure should be properly insulated.\n● Use cable size of 35sqmm or more to connect batteries and inverters\n● BESS should meet the following international standards, IEC 62619, 63485-1,62485-2 and 62509.\n● Operating temperature for BESS must be within 10 to 30 degree Celsius.\n● Paralleling of batteries should conform to OEMs specifications.\n● Maximum DOD should be set at 90%.\n5.5 Protection Devices Installation\n● Install protection devices such as surge protectors, circuit breakers, and disconnect switches to safeguard the system from electrical faults and surges.\n● Test all protection devices to ensure correct functioning.\n5.6 Earthing and Grounding Installation\n● Earthing: Install the earthing system as per design specifications to discharge excess electrical energy safely into the ground. This includes:\n○ Installing a grounding rod at the designated location.\n○ Connecting the grounding rod to the inverter, battery backup, and electrical system components using approved wiring.\n○ Use CAT I or II earth protection systems only.\n● Grounding: Ensure all major components (solar panels, inverter, battery backup, mounting racks) are properly grounded to protect against electrical hazards such as short circuits, overvoltage, or lightning strikes.\n● Test the earthing system for resistance to ensure it complies with local regulations and safety standards (0-2 Ohms)\n5.7 Wiring and Electrical Connections\n● Run wires between all system components, ensuring they are properly insulated, labeled, and routed to prevent damage from environmental factors.\n● Ensure all wires and connections are properly grounded to prevent electrical shock and system malfunction.\n5.8 Distribution Network Installation\n· Ensure poles are installed erect and at the right depth.\n· All poles must be NEMSA standard certified.\n· Aluminum conductors are to be used for distribution line unless stated otherwise.\n· Cable sag and pole tilting from the normal plain should be no more than 5 degree.\n· Voltage drop at the end of the farthest distribution line should be no more than 3% of the voltage output from the solar power plant.\n· Distribution lines must be earthed at 5 span intervals.\n· Protection device must be installed on the first poles from the power plant.\n5.9 Energy Cabin\n· Energy cabin should be fitted with reinforced base to support battery and inverter weight.\n· Energy cabin should be earthed.\n· Fire suppression system and alarm should be installed in the cabin.\n· Air conditioning units should be fitted in the energy cabin.\n· Energy cabin should be prefabricated and fitted with all necessary fitting and insulation for heat, electrical and fire suppression.\n· Energy cabin must be free from rust and corrosion.\n· Energy cabin should be mounted on plinth at least 0.5m above ground level.',
quiz: [
{ question: 'What slope for PV Mounting?', options: ['10 to 15 degrees facing south', '0 degrees', '20 degrees', 'North'], answer: '10 to 15 degrees facing south' },
{ question: 'What minimum height clearance?', options: ['0.5m from ground', '1m', '0m', '2m'], answer: '0.5m from ground' },
{ question: 'Where are modules installed?', options: ['Open space free from shading', 'Shaded area', 'Indoor', 'No installation'], answer: 'Open space free from shading' },
{ question: 'What depth for PV structure?', options: ['Not less than 1.5m', '0.5m', '1m', '2m'], answer: 'Not less than 1.5m' },
{ question: 'What bolts are used?', options: ['Galvanized iron shear bolts', 'No bolts', 'Plastic', 'Wood'], answer: 'Galvanized iron shear bolts' },
],
order: 12,
},
{
title: '5.1 PV Mounting',
content: 'Ensure installation slope between 10 to 15 degrees facing south. Ensure minimum height clearance of 0.5m from ground Modules must be installed in open space free from shading all day long. Depth of PV structure should not be less than 1.5m. Ensure use of galvanized iron shear bolts and nuts to couple PV modules and structure. Metal parts of the structure in-ground and near the ground must be protected against corrosion for 20 years. Gravelling should be 150mm thick. Ensure PV structure can withstand extreme wind speed in installation location. Ensure output voltage from PV string match MPPT specification. Photovoltaic solar modules must be fixed on an even surface, with no more than 20mm difference from the ideal plane.',
quiz: [
{ question: 'What slope?', options: ['10 to 15 degrees south', '0 degrees', '20 degrees', 'North'], answer: '10 to 15 degrees south' },
{ question: 'What clearance?', options: ['0.5m from ground', '1m', '0m', '2m'], answer: '0.5m from ground' },
{ question: 'Where installed?', options: ['Open space no shading', 'Shaded', 'Indoor', 'No installation'], answer: 'Open space no shading' },
{ question: 'What depth?', options: ['Not less than 1.5m', '0.5m', '1m', '2m'], answer: 'Not less than 1.5m' },
{ question: 'What bolts?', options: ['Galvanized iron shear', 'No bolts', 'Plastic', 'Wood'], answer: 'Galvanized iron shear' },
{ question: 'What parts protected?', options: ['Metal parts against corrosion for 20 years', 'No protection', '10 years', '5 years'], answer: 'Metal parts against corrosion for 20 years' },
{ question: 'What thickness for gravelling?', options: ['150mm', '100mm', '200mm', '50mm'], answer: '150mm' },
{ question: 'What can PV structure withstand?', options: ['Extreme wind speed', 'No wind', 'Light wind', 'Rain'], answer: 'Extreme wind speed' },
{ question: 'What must output voltage match?', options: ['MPPT specification', 'No match', 'Random', 'Ignore'], answer: 'MPPT specification' },
{ question: 'How must modules be fixed?', options: ['On even surface, no more than 20mm difference', 'Uneven', 'No fix', '30mm difference'], answer: 'On even surface, no more than 20mm difference' },
],
order: 13,
},
{
title: '5.3 Inverter and Electrical Systems',
content: 'Install inverters, isolators, and other electrical components in an energy cabin or power house that is easily accessible and well-ventilated. Ensure all connections to the solar panels, battery backup, and distribution lines are secure and properly grounded (with minimum of CAT II protection systems) to prevent electrical faults. Test the system for efficiency and functionality before commissioning, providing documented evidence of test. Ensure the right polarity for battery, PV, AC inputs and Outputs are correctly placed.',
quiz: [
{ question: 'Where are inverters installed?', options: ['Energy cabin or power house', 'Outdoor', 'No installation', 'Random'], answer: 'Energy cabin or power house' },
{ question: 'What is ensured for connections?', options: ['Secure and properly grounded', 'Loose', 'No grounding', 'Ignore'], answer: 'Secure and properly grounded' },
{ question: 'What is the minimum protection?', options: ['CAT II', 'CAT I', 'No protection', 'CAT III'], answer: 'CAT II' },
{ question: 'What is tested?', options: ['System for efficiency', 'No test', 'Partial', 'Ignore'], answer: 'System for efficiency' },
{ question: 'What is ensured for polarity?', options: ['Right polarity for battery, PV', 'Wrong polarity', 'No polarity', 'Ignore'], answer: 'Right polarity for battery, PV' },
],
order: 14,
},
{
title: '5.4 BESS Installation',
content: 'Install the battery backup in a designated, cool, and secure area, away from any potential hazards. Ensure proper wiring and grounding for safe battery operation and integration with the inverter. Use only copper cables and lugs to connect batteries and inverters. Battery Support structure should be properly insulated. Use cable size of 35sqmm or more to connect batteries and inverters BESS should meet the following international standards, IEC 62619, 63485-1,62485-2 and 62509. Operating temperature for BESS must be within 10 to 30 degree Celsius. Paralleling of batteries should conform to OEMs specifications. Maximum DOD should be set at 90%.',
quiz: [
{ question: 'Where is battery backup installed?', options: ['Designated, cool, secure area', 'Hazardous area', 'No installation', 'Random'], answer: 'Designated, cool, secure area' },
{ question: 'What is ensured?', options: ['Proper wiring and grounding', 'No wiring', 'Bad wiring', 'Ignore'], answer: 'Proper wiring and grounding' },
{ question: 'What cables are used?', options: ['Only copper cables and lugs', 'Aluminum', 'No cables', 'Plastic'], answer: 'Only copper cables and lugs' },
{ question: 'What should support structure be?', options: ['Properly insulated', 'No insulation', 'Bad insulation', 'Ignore'], answer: 'Properly insulated' },
{ question: 'What cable size?', options: ['35sqmm or more', 'Less than 35', 'No size', 'Random'], answer: '35sqmm or more' },
],
order: 15,
},
{
title: '5.5 Protection Devices Installation',
content: 'Install protection devices such as surge protectors, circuit breakers, and disconnect switches to safeguard the system from electrical faults and surges. Test all protection devices to ensure correct functioning.',
quiz: [
{ question: 'What devices are installed?', options: ['Surge protectors, circuit breakers', 'No devices', 'Only surge', 'Only breakers'], answer: 'Surge protectors, circuit breakers' },
{ question: 'What to safeguard from?', options: ['Electrical faults and surges', 'No safeguard', 'Weather', 'Animals'], answer: 'Electrical faults and surges' },
{ question: 'What is tested?', options: ['All protection devices', 'No test', 'Partial', 'Ignore'], answer: 'All protection devices' },
{ question: 'To ensure what?', options: ['Correct functioning', 'No function', 'Bad function', 'Random'], answer: 'Correct functioning' },
],
order: 16,
},
{
title: '5.6 Earthing and Grounding Installation',
content: 'Earthing: Install the earthing system as per design specifications to discharge excess electrical energy safely into the ground. This includes: Installing a grounding rod at the designated location. Connecting the grounding rod to the inverter, battery backup, and electrical system components using approved wiring. Use CAT I or II earth protection systems only. Grounding: Ensure all major components (solar panels, inverter, battery backup, mounting racks) are properly grounded to protect against electrical hazards such as short circuits, overvoltage, or lightning strikes. Test the earthing system for resistance to ensure it complies with local regulations and safety standards (0-2 Ohms)',
quiz: [
{ question: 'What is installed for earthing?', options: ['Earthing system per specifications', 'No system', 'Bad system', 'Random'], answer: 'Earthing system per specifications' },
{ question: 'What to discharge?', options: ['Excess electrical energy', 'No discharge', 'Low energy', 'Ignore'], answer: 'Excess electrical energy' },
{ question: 'What is included?', options: ['Installing grounding rod', 'No include', 'Only rod', 'Only connecting'], answer: 'Installing grounding rod' },
{ question: 'What protection systems?', options: ['CAT I or II', 'No protection', 'CAT III', 'Random'], answer: 'CAT I or II' },
{ question: 'What is ensured for grounding?', options: ['All major components grounded', 'No grounding', 'Partial', 'Ignore'], answer: 'All major components grounded' },
],
order: 17,
},
{
title: '5.7 Wiring and Electrical Connections',
content: 'Run wires between all system components, ensuring they are properly insulated, labeled, and routed to prevent damage from environmental factors. Ensure all wires and connections are properly grounded to prevent electrical shock and system malfunction.',
quiz: [
{ question: 'What is run?', options: ['Wires between components', 'No run', 'Partial', 'Ignore'], answer: 'Wires between components' },
{ question: 'What is ensured?', options: ['Properly insulated, labeled, routed', 'No ensure', 'Bad insulation', 'Random'], answer: 'Properly insulated, labeled, routed' },
{ question: 'To prevent what?', options: ['Damage from environmental factors', 'No prevent', 'Increase damage', 'Ignore'], answer: 'Damage from environmental factors' },
{ question: 'What is ensured for wires?', options: ['Properly grounded', 'No grounded', 'Partial', 'Ignore'], answer: 'Properly grounded' },
{ question: 'To prevent what?', options: ['Electrical shock and malfunction', 'No prevent', 'Increase shock', 'Ignore'], answer: 'Electrical shock and malfunction' },
],
order: 18,
},
{
title: '5.8 Distribution Network Installation',
content: 'Ensure poles are installed erect and at the right depth. All poles must be NEMSA standard certified. Aluminum conductors are to be used for distribution line unless stated otherwise. Cable sag and pole tilting from the normal plain should be no more than 5 degree. Voltage drop at the end of the farthest distribution line should be no more than 3% of the voltage output from the solar power plant. Distribution lines must be earthed at 5 span intervals. Protection device must be installed on the first poles from the power plant.',
quiz: [
{ question: 'How are poles installed?', options: ['Erect and at right depth', 'Crooked', 'No installation', 'Random'], answer: 'Erect and at right depth' },
{ question: 'What must poles be?', options: ['NEMSA standard certified', 'No certified', 'ISO', 'Random'], answer: 'NEMSA standard certified' },
{ question: 'What conductors?', options: ['Aluminum unless otherwise', 'Copper', 'No conductors', 'Plastic'], answer: 'Aluminum unless otherwise' },
{ question: 'What is max sag and tilting?', options: ['No more than 5 degree', '10 degree', '0 degree', '15 degree'], answer: 'No more than 5 degree' },
{ question: 'What is max voltage drop?', options: ['No more than 3%', '5%', '0%', '10%'], answer: 'No more than 3%' },
],
order: 19,
},
{
title: '5.9 Energy Cabin',
content: 'Energy cabin should be fitted with reinforced base to support battery and inverter weight. Energy cabin should be earthed. Fire suppression system and alarm should be installed in the cabin. Air conditioning units should be fitted in the energy cabin. Energy cabin should be prefabricated and fitted with all necessary fitting and insulation for heat, electrical and fire suppression. Energy cabin must be free from rust and corrosion. Energy cabin should be mounted on plinth at least 0.5m above ground level.',
quiz: [
{ question: 'What is fitted with reinforced base?', options: ['Energy cabin', 'No base', 'Weak base', 'Random'], answer: 'Energy cabin' },
{ question: 'To support what?', options: ['Battery and inverter weight', 'No support', 'Light weight', 'Ignore'], answer: 'Battery and inverter weight' },
{ question: 'What should cabin be?', options: ['Earthed', 'No earth', 'Partial', 'Ignore'], answer: 'Earthed' },
{ question: 'What system installed?', options: ['Fire suppression and alarm', 'No system', 'Water system', 'Air system'], answer: 'Fire suppression and alarm' },
{ question: 'What units fitted?', options: ['Air conditioning units', 'No units', 'Heating', 'Cooling'], answer: 'Air conditioning units' },
],
order: 20,
},
{
title: '6. Operation and Maintenance',
content: '6.1 Daily Operations System Monitoring: Check solar panel output, battery status, inverter performance, and load consumption. Record data in a daily log, including voltage, current, and energy generation figures. Load Management: Ensure loads do not exceed the system’s capacity. Implement demand response strategies if necessary to manage peak loads. 6.2 Energy Generation and Consumption Monitoring Monitor solar irradiance levels and ensure panels are positioned optimally. Clean panels regularly to prevent dirt accumulation, which can reduce efficiency. Record daily generation and consumption from solar plant 6.3 Routine Maintenance Monthly Inspections: Inspect solar panels for damage or dirt. Check connections and wiring for wear or corrosion. Test battery health and electrolyte levels (for lead-acid batteries). Quarterly Maintenance: Conduct a thorough cleaning of solar panels. Inspect and clean the inverter and other electronic components. Test all system alarms and indicators. 6.4 Preventive Maintenance Replace worn or damaged components proactively based on inspections. Schedule battery maintenance (equalization, if applicable) to prolong life. 6.5 Corrective Maintenance Address issues identified in inspections or reported by operators immediately. Document all repairs, including parts replaced and work performed. 6.8 Reporting Procedures Daily Logs: Maintain logs of daily operations, including generation data, maintenance performed, and any anomalies. Incident Reports: Document any incidents or system failures, including responses and resolutions. Monthly Reports: Compile performance data and maintenance logs into a monthly summary for review.',
quiz: [
{ question: 'What is checked in system monitoring?', options: ['Solar panel output, battery status', 'No check', 'Only output', 'Only status'], answer: 'Solar panel output, battery status' },
{ question: 'What is recorded?', options: ['Data in daily log', 'No record', 'Partial', 'Ignore'], answer: 'Data in daily log' },
{ question: 'What is ensured in load management?', options: ['Loads not exceed capacity', 'Exceed capacity', 'No management', 'Ignore'], answer: 'Loads not exceed capacity' },
{ question: 'What is monitored in energy?', options: ['Solar irradiance levels', 'No monitoring', 'Wind speed', 'Rainfall'], answer: 'Solar irradiance levels' },
{ question: 'What is done to panels?', options: ['Clean regularly', 'No cleaning', 'Dirty', 'Ignore'], answer: 'Clean regularly' },
],
order: 21,
},
{
title: '6.1 Daily Operations',
content: 'System Monitoring: Check solar panel output, battery status, inverter performance, and load consumption. Record data in a daily log, including voltage, current, and energy generation figures. Load Management: Ensure loads do not exceed the system’s capacity. Implement demand response strategies if necessary to manage peak loads.',
quiz: [
{ question: 'What is checked in system monitoring?', options: ['Solar panel output, battery status', 'No check', 'Only output', 'Only status'], answer: 'Solar panel output, battery status' },
{ question: 'What is recorded?', options: ['Data in daily log', 'No record', 'Partial', 'Ignore'], answer: 'Data in daily log' },
{ question: 'What data is included?', options: ['Voltage, current, energy figures', 'No data', 'Only voltage', 'Only current'], answer: 'Voltage, current, energy figures' },
{ question: 'What is ensured in load management?', options: ['Loads not exceed capacity', 'Exceed capacity', 'No management', 'Ignore'], answer: 'Loads not exceed capacity' },
{ question: 'What strategies are implemented?', options: ['Demand response for peak loads', 'No strategies', 'Increase load', 'Ignore load'], answer: 'Demand response for peak loads' },
],
order: 22,
},
{
title: '6.2 Energy Generation and Consumption Monitoring',
content: 'Monitor solar irradiance levels and ensure panels are positioned optimally. Clean panels regularly to prevent dirt accumulation, which can reduce efficiency. Record daily generation and consumption from solar plant',
quiz: [
{ question: 'What is monitored?', options: ['Solar irradiance levels', 'No monitoring', 'Wind speed', 'Rainfall'], answer: 'Solar irradiance levels' },
{ question: 'What is ensured for panels?', options: ['Positioned optimally', 'No position', 'Bad position', 'Random position'], answer: 'Positioned optimally' },
{ question: 'What is done to panels?', options: ['Clean regularly', 'No cleaning', 'Dirty', 'Ignore'], answer: 'Clean regularly' },
{ question: 'What does dirt accumulation reduce?', options: ['Efficiency', 'No reduction', 'Increase efficiency', 'Ignore efficiency'], answer: 'Efficiency' },
{ question: 'What is recorded?', options: ['Daily generation and consumption', 'No record', 'Weekly', 'Monthly'], answer: 'Daily generation and consumption' },
],
order: 23,
},
{
title: '6.3 Routine Maintenance',
content: 'Monthly Inspections: Inspect solar panels for damage or dirt. Check connections and wiring for wear or corrosion. Test battery health and electrolyte levels (for lead-acid batteries). Quarterly Maintenance: Conduct a thorough cleaning of solar panels. Inspect and clean the inverter and other electronic components. Test all system alarms and indicators.',
quiz: [
{ question: 'What is inspected monthly?', options: ['Solar panels for damage or dirt', 'No inspection', 'Only damage', 'Only dirt'], answer: 'Solar panels for damage or dirt' },
{ question: 'What is checked?', options: ['Connections and wiring for wear', 'No check', 'Only connections', 'Only wiring'], answer: 'Connections and wiring for wear' },
{ question: 'What is tested?', options: ['Battery health and electrolyte', 'No test', 'Only health', 'Only electrolyte'], answer: 'Battery health and electrolyte' },
{ question: 'What is conducted quarterly?', options: ['Thorough cleaning of panels', 'No cleaning', 'Partial', 'Ignore'], answer: 'Thorough cleaning of panels' },
{ question: 'What is inspected quarterly?', options: ['Inverter and electronic components', 'No inspection', 'Only inverter', 'Only components'], answer: 'Inverter and electronic components' },
],
order: 24,
},
{
title: '6.4 Preventive Maintenance',
content: 'Replace worn or damaged components proactively based on inspections. Schedule battery maintenance (equalization, if applicable) to prolong life.',
quiz: [
{ question: 'What is replaced?', options: ['Worn or damaged components', 'No replace', 'Good components', 'Random'], answer: 'Worn or damaged components' },
{ question: 'How?', options: ['Proactively based on inspections', 'Reactively', 'No basis', 'Ignore'], answer: 'Proactively based on inspections' },
{ question: 'What is scheduled?', options: ['Battery maintenance', 'No schedule', 'Panel maintenance', 'Inverter'], answer: 'Battery maintenance' },
{ question: 'What for battery?', options: ['Equalization if applicable', 'No equalization', 'Always', 'Never'], answer: 'Equalization if applicable' },
{ question: 'To what?', options: ['Prolong life', 'Shorten life', 'No prolong', 'Ignore'], answer: 'Prolong life' },
],
order: 25,
},
{
title: '6.5 Corrective Maintenance',
content: 'Address issues identified in inspections or reported by operators immediately. Document all repairs, including parts replaced and work performed.',
quiz: [
{ question: 'What is addressed?', options: ['Issues identified or reported', 'No address', 'Partial', 'Ignore'], answer: 'Issues identified or reported' },
{ question: 'How?', options: ['Immediately', 'Delayed', 'No time', 'Random'], answer: 'Immediately' },
{ question: 'What is documented?', options: ['All repairs', 'No document', 'Partial', 'Ignore'], answer: 'All repairs' },
{ question: 'Including what?', options: ['Parts replaced and work performed', 'No include', 'Only parts', 'Only work'], answer: 'Parts replaced and work performed' },
],
order: 26,
},
{
title: '6.8 Reporting Procedures',
content: 'Daily Logs: Maintain logs of daily operations, including generation data, maintenance performed, and any anomalies. Incident Reports: Document any incidents or system failures, including responses and resolutions. Monthly Reports: Compile performance data and maintenance logs into a monthly summary for review.',
quiz: [
{ question: 'What is maintained in daily logs?', options: ['Logs of daily operations', 'No logs', 'Weekly logs', 'Monthly logs'], answer: 'Logs of daily operations' },
{ question: 'Including what?', options: ['Generation data, maintenance, anomalies', 'No include', 'Only data', 'Only maintenance'], answer: 'Generation data, maintenance, anomalies' },
{ question: 'What is documented in incident reports?', options: ['Incidents or failures', 'No document', 'Successes', 'Ignore'], answer: 'Incidents or failures' },
{ question: 'Including what?', options: ['Responses and resolutions', 'No include', 'Only responses', 'Only resolutions'], answer: 'Responses and resolutions' },
{ question: 'What is compiled in monthly reports?', options: ['Performance data and logs', 'No compile', 'Daily data', 'Ignore'], answer: 'Performance data and logs' },
],
order: 27,
},
{
title: '8. Quality Control and Inspection',
content: 'Electrify Microgrid Limited will conduct on-site inspections at key stages of the installation (after mounting, panel installation, and electrical completion). A final inspection will confirm that the system is fully operational and that the earthing and grounding systems are effective and meet safety standards. External contractors will rectify any issues identified during the inspection process at their own cost. NEMSA inspection will be conducted after all internal standard checks.',
quiz: [
{ question: 'Who conducts on-site inspections?', options: ['Electrify Microgrid Limited', 'External contractors', 'Clients', 'Government'], answer: 'Electrify Microgrid Limited' },
{ question: 'At what stages?', options: ['Key stages: after mounting, panel, electrical', 'No stages', 'Only mounting', 'Only panel'], answer: 'Key stages: after mounting, panel, electrical' },
{ question: 'What does final inspection confirm?', options: ['System operational, earthing effective', 'No confirmation', 'Partial', 'Ignore'], answer: 'System operational, earthing effective' },
{ question: 'Who rectifies issues?', options: ['External contractors at own cost', 'EML', 'No one', 'Clients'], answer: 'External contractors at own cost' },
{ question: 'When is NEMSA inspection?', options: ['After internal checks', 'Before', 'During', 'No inspection'], answer: 'After internal checks' },
],
order: 28,
},
{
  title: '9. Engagement with External Contractors',
  content: '9.1 Contractor Qualifications\n● EPC contractors must hold certifications in solar system installations and electrical systems, with specific experience in the installation of inverters, battery backup, protection devices, earthing, grounding, meter installation, pole installation and stringing.\n● References from previous similar installations will be required during contractor selection.\n● Must be COREN and NEMSA certified.\n9.2 Performance and Liability Clauses\n● Contractors are liable for any damage resulting from poor installation of solar panels, inverters, battery backup, mounting racks, protection devices, wiring, earthing and grounding, meter installation, pole installation and stringing.\n● In case of substandard workmanship or deviation from EML\'s installation standards, EPC will be required to:\n○ Rectify the job at no additional cost.\n○ Pay penalties or withhold payments until the issue is resolved.\n9.3 Warranty and Maintenance\n● Installers must provide a warranty on workmanship for a minimum period, covering the earthing and grounding systems, as well as the installation of other components.\n● Any maintenance required due to poor installation or materials (provided by EPC) failure within the warranty period will be carried out by the installer at no cost to EML or the customer.\n9.4 Non-Compliance\n● If the EPC fails to comply with the terms of the SOP or industry standards, EML reserves the right to terminate the contract and blacklist the installer from future engagements.',
  quiz: [
    { question: 'What must EPC contractors hold?', options: ['Certifications in solar installations', 'No certifications', 'Partial', 'Ignore'], answer: 'Certifications in solar installations' },
    { question: 'What experience is required?', options: ['Inverters, battery, protection', 'No experience', 'Office experience', 'Marketing'], answer: 'Inverters, battery, protection' },
    { question: 'What references are required?', options: ['From previous installations', 'No references', 'Personal references', 'Ignore'], answer: 'From previous installations' },
    { question: 'What certifications must they have?', options: ['COREN and NEMSA', 'No certifications', 'ISO', 'IEEE'], answer: 'COREN and NEMSA' },
    { question: 'Who is liable for damage?', options: ['Contractors', 'EML', 'Clients', 'No one'], answer: 'Contractors' },
  ],
  order: 29,
},
{
  title: '9.1 Contractor Qualifications',
  content: 'EPC contractors must hold certifications in solar system installations and electrical systems, with specific experience in the installation of inverters, battery backup, protection devices, earthing, grounding, meter installation, pole installation and stringing. References from previous similar installations will be required during contractor selection. Must be COREN and NEMSA certified.',
  quiz: [
    { question: 'What certifications must contractors hold?', options: ['Solar installations, electrical systems', 'No certifications', 'Financial', 'Marketing'], answer: 'Solar installations, electrical systems' },
    { question: 'What experience?', options: ['Inverters, battery, protection', 'No experience', 'Office', 'HR'], answer: 'Inverters, battery, protection' },
    { question: 'What references?', options: ['From previous installations', 'No references', 'Personal', 'Ignore'], answer: 'From previous installations' },
    { question: 'What must they be?', options: ['COREN and NEMSA certified', 'No certified', 'ISO', 'IEEE'], answer: 'COREN and NEMSA certified' },
    { question: 'During what?', options: ['Contractor selection', 'No selection', 'After', 'Before'], answer: 'Contractor selection' },
  ],
  order: 30,
},
{
  title: '9.2 Performance and Liability Clauses',
  content: 'Contractors are liable for any damage resulting from poor installation of solar panels, inverters, battery backup, mounting racks, protection devices, wiring, earthing and grounding, meter installation, pole installation and stringing. In case of substandard workmanship or deviation from EML\'s installation standards, EPC will be required to: Rectify the job at no additional cost. Pay penalties or withhold payments until the issue is resolved.',
  quiz: [
    { question: 'Who is liable?', options: ['Contractors for damage', 'No liable', 'EML', 'Clients'], answer: 'Contractors for damage' },
    { question: 'From what?', options: ['Poor installation', 'Good installation', 'No from', 'Random'], answer: 'Poor installation' },
    { question: 'In case of substandard?', options: ['Rectify at no cost', 'No rectify', 'Pay extra', 'Ignore'], answer: 'Rectify at no cost' },
    { question: 'What else?', options: ['Pay penalties or withhold', 'No pay', 'Receive penalties', 'Ignore'], answer: 'Pay penalties or withhold' },
    { question: 'Until what?', options: ['Issue is resolved', 'No until', 'Issue worsens', 'Ignore'], answer: 'Issue is resolved' },
  ],
  order: 31,
},
{
title: '9.3 Warranty and Maintenance',
content: 'Installers must provide a warranty on workmanship for a minimum period, covering the earthing and grounding systems, as well as the installation of other components. Any maintenance required due to poor installation or materials(provided by EPC) failure within the warranty period will be carried out by the installer at no cost to EML or the customer.',
quiz: [
{ question: 'What must installers provide?', options: ['Warranty on workmanship', 'No warranty', 'Partial', 'Ignore'], answer: 'Warranty on workmanship' },
{ question: 'For what period?', options: ['Minimum period', 'No period', 'Maximum', 'Random'], answer: 'Minimum period' },
{ question: 'Covering what?', options: ['Earthing and grounding, other components', 'No cover', 'Only earthing', 'Only components'], answer: 'Earthing and grounding, other components' },
{ question: 'What maintenance?', options: ['Due to poor installation or failure', 'No maintenance', 'Good installation', 'Ignore'], answer: 'Due to poor installation or failure' },
{ question: 'At what cost?', options: ['No cost to EML or customer', 'High cost', 'Partial cost', 'Ignore cost'], answer: 'No cost to EML or customer' },
],
order: 32,
},
{
title: '9.4 Non-Compliance',
content: 'If the EPC fails to comply with the terms of the SOP or industry standards, EML reserves the right to terminate the contract and blacklist the installer from future engagements.',
quiz: [
{ question: 'If EPC fails?', options: ['EML terminate contract', 'No terminate', 'Partial', 'Ignore'], answer: 'EML terminate contract' },
{ question: 'What else?', options: ['Blacklist installer', 'No blacklist', 'Whitelis', 'Ignore'], answer: 'Blacklist installer' },
{ question: 'From what?', options: ['Future engagements', 'No from', 'Past', 'Current'], answer: 'Future engagements' },
{ question: 'What terms?', options: ['SOP or industry standards', 'No terms', 'Personal terms', 'Random'], answer: 'SOP or industry standards' },
],
order: 33,
},
{
title: '10. Customer Handover and Documentation',
content: 'Upon successful installation and inspection, the EPC will provide the customer with: A system user manual covering the operation of the solar system, inverter, battery backup, protection devices Maintenance schedule and contact details for service support. Warranty information for equipment and installation. Completion certificate for all installation A final handover inspection will be conducted, with the installer and customer signing off on system functionality and performance.',
quiz: [
{ question: 'What is provided upon success?', options: ['System user manual', 'No manual', 'Partial manual', 'Ignore manual'], answer: 'System user manual' },
{ question: 'What covers the manual?', options: ['Operation of solar system, inverter', 'No cover', 'Only solar', 'Only inverter'], answer: 'Operation of solar system, inverter' },
{ question: 'What schedule is provided?', options: ['Maintenance schedule', 'No schedule', 'Meeting schedule', 'Travel schedule'], answer: 'Maintenance schedule' },
{ question: 'What information is provided?', options: ['Warranty information', 'No information', 'Personal information', 'Financial information'], answer: 'Warranty information' },
{ question: 'What certificate?', options: ['Completion certificate', 'No certificate', 'Partial', 'Ignore'], answer: 'Completion certificate' },
],
order: 34,
},
{
title: '11. Health and Safety Guidelines',
content: 'All installers must wear appropriate PPE during the installation process (helmets, harnesses for working at heights, gloves, etc.). Follow safety regulations for working at heights and handling electrical systems. Maintain a clean and organized workspace to prevent accidents or delays. Worker must should be issued permit to work.',
quiz: [
{ question: 'What must installers wear?', options: ['Appropriate PPE', 'No PPE', 'Partial PPE', 'Ignore PPE'], answer: 'Appropriate PPE' },
{ question: 'What is PPE?', options: ['Helmets, harnesses, gloves', 'No PPE', 'Only helmets', 'Only gloves'], answer: 'Helmets, harnesses, gloves' },
{ question: 'What regulations to follow?', options: ['Safety for heights and electrical', 'No regulations', 'Office regulations', 'Financial regulations'], answer: 'Safety for heights and electrical' },
{ question: 'What to maintain?', options: ['Clean and organized workspace', 'Dirty workspace', 'No maintenance', 'Cluttered'], answer: 'Clean and organized workspace' },
{ question: 'What is issued to workers?', options: ['Permit to work', 'No permit', 'Partial permit', 'Ignore permit'], answer: 'Permit to work' },
],
order: 35,
},
{
title: '12. Review and Amendments',
content: 'This SOP will be reviewed annually, or as required, to ensure compliance with updated regulations and industry best practices.',
quiz: [
{ question: 'How often is SOP reviewed?', options: ['Annually', 'Daily', 'Monthly', 'Never'], answer: 'Annually' },
{ question: 'What is ensured?', options: ['Compliance with updated regulations', 'No compliance', 'Partial', 'Ignore'], answer: 'Compliance with updated regulations' },
{ question: 'What practices?', options: ['Industry best practices', 'No practices', 'Bad practices', 'Random practices'], answer: 'Industry best practices' },
{ question: 'When reviewed?', options: ['Annually or as required', 'No review', 'Only annually', 'Only as required'], answer: 'Annually or as required' },
{ question: 'What is the purpose?', options: ['Ensure compliance', 'No purpose', 'Reduce compliance', 'Ignore compliance'], answer: 'Ensure compliance' },
],
order: 36,
},
{
title: 'Clauses to Shield Against Poor Jobs, Practices, and Installations',
content: 'Performance Penalties: EPC will be penalized for delays, substandard work, or improper installation of system components, including earthing and grounding. Workmanship Warranty: A warranty period of 18 months must be provided for any installation issues or defects caused by the installer. Inspection-Based Payments: Payment to EPC will be based on successful inspections at each key stage of the project. Material Standards: Only certified and pre-approved materials must be used. Non-compliant materials will be rejected, and the EPC will bear the cost of replacements. Legal Recourse: Electrify Microgrid Limited reserves the right to take legal action for gross negligence leading to significant system failure or property damage.',
quiz: [
{ question: 'What are performance penalties for?', options: ['Delays, substandard work', 'No penalties', 'Good work', 'Timely work'], answer: 'Delays, substandard work' },
{ question: 'What is workmanship warranty?', options: ['18 months for defects', 'No warranty', '6 months', '12 months'], answer: '18 months for defects' },
{ question: 'What is payment based on?', options: ['Successful inspections', 'No basis', 'Partial', 'Ignore'], answer: 'Successful inspections' },
{ question: 'What materials?', options: ['Certified and pre-approved', 'Substandard', 'No materials', 'Random'], answer: 'Certified and pre-approved' },
{ question: 'What right does EML reserve?', options: ['Legal action for negligence', 'No right', 'Partial', 'Ignore'], answer: 'Legal action for negligence' },
],
order: 37,
},
],
},
{
title: 'Black Soldier Fly (BSF) Business Model - Expert',
description: 'The Black Soldier Fly (BSF) business model presents a sustainable and innovative solution for job creation and economic development. This model capitalizes on the BSF\'s ability to convert organic waste into high-quality protein (maggots) for animal feed and nutrient-rich organic fertilizer, contributing to waste management and agricultural productivity thereby presenting a sustainable solutions that address waste challenges. The BSF business model offers a viable solution by transforming organic waste into valuable resources, creating job opportunities, and promoting environmental sustainability. This model can be implemented across every community in Nigeria, particularly in rural areas along with the PuE deployment to manage the waste and convert them to',
level: 'expert',
assetco: 'Agronomie',
modules: [
{
title: 'Business Model Components',
content: '1. Waste Collection and Segregation: o Sources of Organic Waste: Organic waste will be sourced from farms, markets and agro processing plants. 2. BSF Breeding and Rearing: o Breeding Facilities: A breeding facility for the BSF will be established where adult BSFs can lay eggs. These facilities will provide optimal conditions for BSF reproduction, including temperature, humidity, and shelter. o Larvae Rearing: Once the eggs hatch, the larvae (maggots) will be reared in controlled environments. The larvae will feed on the collected organic waste, converting it into protein-rich biomass. 3. Harvesting and Processing: o Harvesting Maggots: The larvae are harvested at their peak nutritional value. The harvested maggots are processed into various forms, such as dried maggot meal or fresh maggots, for use as animal feed. o Residual Waste: After the larvae have consumed the organic waste, the residual material can be processed into high-quality organic fertilizer. 4. Training and Capacity Building: o Training programs will be provided for local communities, emphasizing BSF farming techniques, waste management, and business skills. 5. Quality Control and Assurance: o Implement strict quality control measures to ensure the safety and nutritional value of maggot-based animal feed. o Regularly test the organic fertilizer for nutrient content and pathogen levels to guarantee its effectiveness and safety.',
quiz: [
{ question: 'What is the first component?', options: ['Waste Collection and Segregation', 'Harvesting', 'Training', 'Quality Control'], answer: 'Waste Collection and Segregation' },
{ question: 'Where is organic waste sourced?', options: ['Farms, markets, agro processing plants', 'Offices, schools', 'Factories, warehouses', 'Homes, restaurants'], answer: 'Farms, markets, agro processing plants' },
{ question: 'What is established for breeding?', options: ['Breeding facility', 'Office', 'Warehouse', 'Store'], answer: 'Breeding facility' },
{ question: 'What do larvae convert waste into?', options: ['Protein-rich biomass', 'Plastic', 'Metal', 'Paper'], answer: 'Protein-rich biomass' },
{ question: 'What is residual waste processed into?', options: ['Organic fertilizer', 'Fuel', 'Clothing', 'Electronics'], answer: 'Organic fertilizer' },
],
order: 1,
},
{
title: '1. Waste Collection and Segregation',
content: 'Sources of Organic Waste: Organic waste will be sourced from farms, markets and agro processing plants.',
quiz: [
{ question: 'What is sourced?', options: ['Organic waste from farms, markets', 'No source', 'Inorganic', 'Random'], answer: 'Organic waste from farms, markets' },
],
order: 2,
},
{
title: '2. BSF Breeding and Rearing',
content: 'Breeding Facilities: A breeding facility for the BSF will be established where adult BSFs can lay eggs. These facilities will provide optimal conditions for BSF reproduction, including temperature, humidity, and shelter. Larvae Rearing: Once the eggs hatch, the larvae (maggots) will be reared in controlled environments. The larvae will feed on the collected organic waste, converting it into protein-rich biomass.',
quiz: [
{ question: 'What is established?', options: ['Breeding facility for BSF', 'No facility', 'Rearing only', 'Ignore'], answer: 'Breeding facility for BSF' },
{ question: 'What conditions?', options: ['Optimal for reproduction', 'No conditions', 'Bad conditions', 'Random'], answer: 'Optimal for reproduction' },
{ question: 'What do larvae do?', options: ['Reared in controlled environments', 'No rearing', 'Uncontrolled', 'Ignore'], answer: 'Reared in controlled environments' },
{ question: 'What do larvae feed on?', options: ['Collected organic waste', 'No feed', 'Inorganic', 'Random'], answer: 'Collected organic waste' },
{ question: 'What is converted?', options: ['Into protein-rich biomass', 'No convert', 'To waste', 'Ignore'], answer: 'Into protein-rich biomass' },
],
order: 3,
},
{
title: '3. Harvesting and Processing',
content: 'Harvesting Maggots: The larvae are harvested at their peak nutritional value. The harvested maggots are processed into various forms, such as dried maggot meal or fresh maggots, for use as animal feed. Residual Waste: After the larvae have consumed the organic waste, the residual material can be processed into high-quality organic fertilizer.',
quiz: [
{ question: 'When are larvae harvested?', options: ['At peak nutritional value', 'No harvest', 'Low value', 'Random'], answer: 'At peak nutritional value' },
{ question: 'What are maggots processed into?', options: ['Dried meal or fresh for feed', 'No process', 'Only dried', 'Only fresh'], answer: 'Dried meal or fresh for feed' },
{ question: 'What is residual processed into?', options: ['High-quality organic fertilizer', 'No process', 'Low quality', 'Random'], answer: 'High-quality organic fertilizer' },
],
order: 4,
},
{
title: '4. Training and Capacity Building',
content: 'Training programs will be provided for local communities, emphasizing BSF farming techniques, waste management, and business skills.',
quiz: [
{ question: 'What is provided?', options: ['Training programs for communities', 'No programs', 'Partial', 'Ignore'], answer: 'Training programs for communities' },
{ question: 'Emphasizing what?', options: ['BSF farming, waste management, business skills', 'No emphasize', 'Only farming', 'Only waste'], answer: 'BSF farming, waste management, business skills' },
],
order: 5,
},
{
title: '5. Quality Control and Assurance',
content: 'Implement strict quality control measures to ensure the safety and nutritional value of maggot-based animal feed. Regularly test the organic fertilizer for nutrient content and pathogen levels to guarantee its effectiveness and safety.',
quiz: [
{ question: 'What is implemented?', options: ['Strict quality control measures', 'No implement', 'Loose', 'Ignore'], answer: 'Strict quality control measures' },
{ question: 'To ensure what?', options: ['Safety and nutritional value', 'No ensure', 'Unsafe', 'Low value'], answer: 'Safety and nutritional value' },
{ question: 'What is tested?', options: ['Organic fertilizer for nutrient, pathogen', 'No test', 'Only nutrient', 'Only pathogen'], answer: 'Organic fertilizer for nutrient, pathogen' },
{ question: 'How often?', options: ['Regularly', 'Never', 'Once', 'Rarely'], answer: 'Regularly' },
{ question: 'To guarantee what?', options: ['Effectiveness and safety', 'No guarantee', 'Ineffectiveness', 'Unsafe'], answer: 'Effectiveness and safety' },
],
order: 6,
},
{
title: 'Social and Environmental Benefits',
content: '1. Job Creation: o Direct Employment: Creation of jobs in BSF breeding, rearing, processing, and facility maintenance. o Indirect Employment: Additional job opportunities in waste collection, transport, marketing, and distribution. 2. Waste Management: o Reduction in Organic Waste: Significant reduction in organic waste, mitigating environmental pollution and greenhouse gas emissions. o Resource Recovery: Transformation of waste into valuable resources, promoting circular economy principles. 3. Food Security: o Sustainable Animal Feed: Provision of affordable, high-quality animal feed, enhancing livestock productivity and food security. o Soil Health: Improvement of soil fertility through the use of organic fertilizer, leading to increased crop yields. 4. Community Empowerment: o Capacity Building: Empowerment of local communities through training and skill development in BSF farming and waste management. o Economic Development: Stimulation of local economies through the creation of new markets and business opportunities.',
quiz: [
{ question: 'What is created in job creation?', options: ['Direct and indirect employment', 'No jobs', 'Only direct', 'Only indirect'], answer: 'Direct and indirect employment' },
{ question: 'What is reduced in waste management?', options: ['Organic waste', 'Plastic waste', 'Metal waste', 'Paper waste'], answer: 'Organic waste' },
{ question: 'What is transformed in resource recovery?', options: ['Waste into valuable resources', 'Resources into waste', 'No transformation', 'Random'], answer: 'Waste into valuable resources' },
{ question: 'What is provided for food security?', options: ['Sustainable animal feed', 'Human food', 'Water supply', 'Housing'], answer: 'Sustainable animal feed' },
{ question: 'What is improved by organic fertilizer?', options: ['Soil health', 'Air quality', 'Water purity', 'Noise levels'], answer: 'Soil health' },
],
order: 7,
},
{
title: '1. Job Creation',
content: 'Direct Employment: Creation of jobs in BSF breeding, rearing, processing, and facility maintenance. Indirect Employment: Additional job opportunities in waste collection, transport, marketing, and distribution.',
quiz: [
{ question: 'What is direct employment?', options: ['Jobs in BSF breeding, rearing', 'No jobs', 'Indirect only', 'Ignore'], answer: 'Jobs in BSF breeding, rearing' },
{ question: 'What is indirect?', options: ['Waste collection, transport', 'No indirect', 'Direct only', 'Ignore'], answer: 'Waste collection, transport' },
],
order: 8,
},
{
title: '2. Waste Management',
content: 'Reduction in Organic Waste: Significant reduction in organic waste, mitigating environmental pollution and greenhouse gas emissions. Resource Recovery: Transformation of waste into valuable resources, promoting circular economy principles.',
quiz: [
{ question: 'What is reduced?', options: ['Organic waste', 'No reduction', 'Increase waste', 'Ignore'], answer: 'Organic waste' },
{ question: 'What is mitigated?', options: ['Environmental pollution, emissions', 'No mitigation', 'Increase pollution', 'Ignore'], answer: 'Environmental pollution, emissions' },
{ question: 'What is transformed?', options: ['Waste into valuable resources', 'No transform', 'Resources into waste', 'Ignore'], answer: 'Waste into valuable resources' },
{ question: 'What is promoted?', options: ['Circular economy principles', 'No promote', 'Linear economy', 'Ignore'], answer: 'Circular economy principles' },
],
order: 9,
},
{
title: '3. Food Security',
content: 'Sustainable Animal Feed: Provision of affordable, high-quality animal feed, enhancing livestock productivity and food security. Soil Health: Improvement of soil fertility through the use of organic fertilizer, leading to increased crop yields.',
quiz: [
{ question: 'What is provided?', options: ['Affordable, high-quality animal feed', 'No provision', 'Expensive', 'Low quality'], answer: 'Affordable, high-quality animal feed' },
{ question: 'What is enhanced?', options: ['Livestock productivity, food security', 'No enhance', 'Reduce productivity', 'Ignore'], answer: 'Livestock productivity, food security' },
{ question: 'What is improved?', options: ['Soil fertility', 'No improvement', 'Reduce fertility', 'Ignore'], answer: 'Soil fertility' },
{ question: 'Through what?', options: ['Use of organic fertilizer', 'No use', 'Chemical fertilizer', 'Ignore'], answer: 'Use of organic fertilizer' },
{ question: 'Leading to what?', options: ['Increased crop yields', 'No increase', 'Reduced yields', 'Ignore'], answer: 'Increased crop yields' },
],
order: 10,
},
{
title: '4. Community Empowerment',
content: 'Capacity Building: Empowerment of local communities through training and skill development in BSF farming and waste management. Economic Development: Stimulation of local economies through the creation of new markets and business opportunities.',
quiz: [
{ question: 'What is capacity building?', options: ['Empowerment through training', 'No building', 'Reduce capacity', 'Ignore'], answer: 'Empowerment through training' },
{ question: 'In what?', options: ['BSF farming and waste management', 'No in', 'Only farming', 'Only waste'], answer: 'BSF farming and waste management' },
{ question: 'What is economic development?', options: ['Stimulation of local economies', 'No development', 'Reduce economies', 'Ignore'], answer: 'Stimulation of local economies' },
{ question: 'Through what?', options: ['Creation of new markets', 'No creation', 'Old markets', 'Ignore'], answer: 'Creation of new markets' },
],
order: 11,
},
],
},
{
title: 'Project Lessons Learnt - Expert',
description: 'Lessons learned from past projects, emphasizing the importance of synergy and collaboration.',
level: 'expert',
assetco: 'General',
modules: [
{
title: 'Lesson in Synergy',
content: 'Our journey in Angwan Rina, Plateau State, stands as a pivotal chapter that has propelled us to new heights in delivering unparalleled service to our clients. Among the valuable lessons learned, one has emerged as the catalyst for our commitment to excellence – the imperative of synergy among key stakeholders.',
quiz: [
{ question: 'What is the pivotal chapter?', options: ['Angwan Rina project', 'No project', 'Random project', 'Failed project'], answer: 'Angwan Rina project' },
{ question: 'What lesson emerged?', options: ['Imperative of synergy', 'No synergy', 'Individual work', 'Isolation'], answer: 'Imperative of synergy' },
{ question: 'What does synergy involve?', options: ['Key stakeholders', 'No one', 'Only clients', 'Only staff'], answer: 'Key stakeholders' },
{ question: 'What is the commitment to?', options: ['Excellence', 'Mediocrity', 'Failure', 'Average'], answer: 'Excellence' },
{ question: 'What is propelled?', options: ['New heights in service', 'Decline', 'Stagnation', 'Loss'], answer: 'New heights in service' },
],
order: 1,
},
{
title: '100% Lesson in Synergy',
content: 'In Angwan Rina, we witnessed the transformative power of collaboration. One of the core lessons etched into our ethos is the vital necessity for seamless synergy among Mini-Grid Developers, Agricultural Experts, Engineering/Fabricators/OEMs, and Energy Experts. This realization has become the cornerstone of our approach to ensuring efficient and effective installation and commissioning of Agro productive Use Energy projects.',
quiz: [
{ question: 'What power was witnessed?', options: ['Transformative power of collaboration', 'No power', 'Destructive power', 'Individual power'], answer: 'Transformative power of collaboration' },
{ question: 'What is the core lesson?', options: ['Vital necessity for synergy', 'No necessity', 'Partial necessity', 'Ignore necessity'], answer: 'Vital necessity for synergy' },
{ question: 'Among whom is synergy necessary?', options: ['Mini-Grid Developers, Agricultural Experts, Engineering/Fabricators/OEMs, Energy Experts', 'Only Developers', 'Only Experts', 'No one'], answer: 'Mini-Grid Developers, Agricultural Experts, Engineering/Fabricators/OEMs, Energy Experts' },
{ question: 'What has the realization become?', options: ['Cornerstone of approach', 'No cornerstone', 'Partial', 'Ignore'], answer: 'Cornerstone of approach' },
{ question: 'What is ensured?', options: ['Efficient and effective installation', 'Inefficient', 'No installation', 'Delayed'], answer: 'Efficient and effective installation' },
],
order: 2,
},
{
title: 'Fabrication Challenges Startup Load Mismatch',
content: 'One poignant example unfolded in the realm of fabrication. The Engineer, without aligning with the Energy Expert and Mini grid developers, unilaterally altered the agreed horsepower of the engine from 3hp to 5hp. This deviation, although seemingly minor, had significant consequences post-installation. Post-installation, a stark revelation emerged the startup load surpassed the Mini-Grid\'s capacity, leading to frequent tripping. This oversight, had synergy been a guiding principle, could have been identified and addressed collaboratively, preventing a hindrance to the Mini-Grid\'s seamless operation.',
quiz: [
{ question: 'What unfolded in fabrication?', options: ['Poignant example', 'No example', 'Good example', 'Bad example'], answer: 'Poignant example' },
{ question: 'What was altered?', options: ['Horsepower from 3hp to 5hp', 'No alteration', 'From 5hp to 3hp', 'Color'], answer: 'Horsepower from 3hp to 5hp' },
{ question: 'What consequences did it have?', options: ['Significant consequences post-installation', 'No consequences', 'Minor', 'Positive'], answer: 'Significant consequences post-installation' },
{ question: 'What surpassed capacity?', options: ['Startup load', 'No load', 'Reduced load', 'Normal load'], answer: 'Startup load' },
{ question: 'What could have prevented it?', options: ['Synergy', 'No synergy', 'Individual work', 'Isolation'], answer: 'Synergy' },
],
order: 3,
},
{
title: 'Incorporating Synergy from Onset The Bedrock of Exceptional Service',
content: 'The crucial lesson learned is embedded in our current approach – incorporating Mini-Grid Developers and Energy Experts from project onset. This proactive inclusion ensures that potential challenges are discussed, foreseen, and mitigated collectively, creating an environment where collective expertise converges for the success of each project. By aligning perspectives from the beginning, we pave the way for continuous improvement and anticipate potential obstacles, fostering a culture of shared responsibility. This lesson has become the bedrock of our commitment to exceptional service delivery. Through fostering collaboration, we not only address challenges before they arise but also create an environment where collective expertise converges for the success of each project. The Angwan Rina experience has transformed into a guiding beacon, propelling us towards an era of service delivery excellence. In embracing the lessons from Angwan Rina, we stride forward, fortified by a commitment to synergy, collaboration, and the unwavering pursuit of delivering exceptional outcomes for our clients.',
quiz: [
{ question: 'What is the crucial lesson?', options: ['Incorporating from onset', 'No inclusion', 'Late inclusion', 'Ignore inclusion'], answer: 'Incorporating from onset' },
{ question: 'What does proactive inclusion ensure?', options: ['Challenges discussed and mitigated', 'No discussion', 'Ignore challenges', 'Create challenges'], answer: 'Challenges discussed and mitigated' },
{ question: 'What environment is created?', options: ['Collective expertise converges', 'No convergence', 'Individual expertise', 'Random'], answer: 'Collective expertise converges' },
{ question: 'What is paved?', options: ['Way for continuous improvement', 'No way', 'Way for decline', 'Way for stagnation'], answer: 'Way for continuous improvement' },
{ question: 'What has the lesson become?', options: ['Bedrock of commitment', 'No commitment', 'Partial', 'Ignore'], answer: 'Bedrock of commitment' },
],
order: 4,
},
],
},
{
title: 'List of OEM’s - Beginner',
description: 'List of Local and International Original Equipment Manufacturers (OEMs) partnered with or recommended.',
level: 'beginner',
assetco: 'General',
modules: [
{
title: 'Local OEM\'s',
content: 'Manufacturer Location Description Bennie Agro Ltd Nigeria A renowned agro machinery manufacturers in Nigeria Niji LuKas Group Nigeria value-driven conglomerate providing critical end-to-end solution to Africa\'s agriculture sector Nova Technologies Nigeria Manufacturer of high quality agricultural and cottage industrial machinery. We just don’t manufacture and sell machines Okeke Casmir Enterprise Nigeria We are a leading global brand that supplies agro manufacturing and industrial equipments or machineries Best Royal Agro Nigeria Involved in food production, processing, sales of quality Agricultural equipment. Zebra milling Nigeria Developers of sustainable technology to serve rural areas on their agricultural task.',
quiz: [
{ question: 'Where is Bennie Agro Ltd located?', options: ['Nigeria', 'China', 'Canada', 'USA'], answer: 'Nigeria' },
{ question: 'What is Niji LuKas Group?', options: ['Value-driven conglomerate', 'Small startup', 'No group', 'Random company'], answer: 'Value-driven conglomerate' },
{ question: 'What does Nova Technologies do?', options: ['Manufacturer of agricultural machinery', 'Software development', 'Financial services', 'Marketing'], answer: 'Manufacturer of agricultural machinery' },
{ question: 'What is Okeke Casmir Enterprise?', options: ['Leading global brand for agro equipments', 'Local shop', 'No enterprise', 'Ignore'], answer: 'Leading global brand for agro equipments' },
{ question: 'What is Best Royal Agro involved in?', options: ['Food production, processing, sales', 'No involvement', 'Only sales', 'Only production'], answer: 'Food production, processing, sales' },
],
order: 1,
},
{
title: 'International OEM\'s',
content: 'Manufacturer Location Description DOINGS Group China International manufacturer that specializes in comprehensive starch and flour processing including cassava processing equipment. They have a warehouse in Nigeria and are currently developing their factory in Nigeria. Farm Warehouse Canada Renowned for spearheading and sustaining the design, construction and installation of indigenous highly efficient and cost effective agro machines Zhengzhou Maosu Machinery Co.,Ltd China Professionally engaged in the development, design, manufacture and sale of many kinds of food machinery. China Impact Sourcing China End to end supply chain solution for the off-grid market.',
quiz: [
{ question: 'Where is DOINGS Group?', options: ['China', 'Nigeria', 'Canada', 'USA'], answer: 'China' },
{ question: 'What is Farm Warehouse renowned for?', options: ['Design, construction of agro machines', 'Financial services', 'Marketing', 'HR'], answer: 'Design, construction of agro machines' },
{ question: 'Where is Zhengzhou Maosu?', options: ['China', 'Nigeria', 'Canada', 'USA'], answer: 'China' },
{ question: 'What is China Impact Sourcing?', options: ['End to end supply chain for off-grid', 'On-grid only', 'No supply', 'Random'], answer: 'End to end supply chain for off-grid' },
{ question: 'Does DOINGS Group have warehouse in Nigeria?', options: ['Yes', 'No'], answer: 'Yes' },
],
order: 2,
},
],
},
{
title: 'Corporate Team Profile June 2025 - Beginner',
description: 'Corporate team profile for June 2025, including introduction, problem statement, solution, key features, market opportunity, goals, impact, structure, and team members.',
level: 'beginner',
assetco: 'EML',
modules: [
{
title: 'Introduction',
content: 'Electrify Microgrid Limited (EML) is a specialized renewable energy asset management company committed to accelerating rural electrification in Nigeria through the development of mini-grids integrated with productive use of energy (PuE) for agricultural activities. As a wholly owned subsidiary of FundCo Capital Managers Limited, EML seeks to bridge the gap between energy access and agricultural productivity in rural communities, fostering sustainable economic development and supporting Nigeria’s energy access goals as outlined by the Rural Electrification Agency (REA).',
quiz: [
{ question: 'What is EML?', options: ['Specialized renewable energy asset management company', 'Bank', 'School', 'Hospital'], answer: 'Specialized renewable energy asset management company' },
{ question: 'What is EML committed to?', options: ['Accelerating rural electrification', 'Urban development', 'Oil exploration', 'Mining'], answer: 'Accelerating rural electrification' },
{ question: 'What does EML integrate?', options: ['Productive use of energy (PuE)', 'No integration', 'Fossil fuels', 'Grid only'], answer: 'Productive use of energy (PuE)' },
{ question: 'Who is the parent company?', options: ['FundCo Capital Managers Limited', 'No parent', 'Government', 'Private firm'], answer: 'FundCo Capital Managers Limited' },
{ question: 'What gap does EML bridge?', options: ['Energy access and agricultural productivity', 'No gap', 'Financial gap', 'Social gap'], answer: 'Energy access and agricultural productivity' },
],
order: 1,
},
{
title: 'Problem Statement',
content: 'Nigeria, with a population of approximately 229 million, is the largest economy in sub-Saharan Africa, yet over 80 million people lack adequate access to electricity, particularly in rural areas where 70% of the population are farmers. The national grid’s inability to deliver reliable power severely limits agricultural productivity, preventing farmers from processing produce efficiently. This results in significant waste, reduced income, and stunted economic growth in rural communities. Two key challenges exacerbate this issue: Lack of PuE Integration: Many renewable energy service companies (RESCOs) struggle to incorporate productive use of energy into mini-grids due to limited knowledge, technical resources, and financial capacity, reducing the economic impact of rural electrification efforts. Financing Barriers: Inadequate access to effective financing hampers mini-grid development, with less than 10% of projects reaching financial close due to fragmented funding sources, governance issues, and a lack of predictable investment exits.',
quiz: [
{ question: 'What is Nigeria\'s population?', options: ['Approximately 229 million', '100 million', '300 million', '50 million'], answer: 'Approximately 229 million' },
{ question: 'How many lack electricity?', options: ['Over 80 million', '20 million', '50 million', '10 million'], answer: 'Over 80 million' },
{ question: 'What percentage are farmers in rural areas?', options: ['70%', '30%', '50%', '90%'], answer: '70%' },
{ question: 'What limits agricultural productivity?', options: ['National grid’s inability', 'Too much power', 'No limits', 'Excess resources'], answer: 'National grid’s inability' },
{ question: 'What is a key challenge?', options: ['Lack of PuE Integration', 'Excess integration', 'No challenge', 'Financial surplus'], answer: 'Lack of PuE Integration' },
],
order: 2,
},
{
title: 'Solution',
content: 'EML addresses these challenges by developing mini-grids tailored to support agricultural productive uses, such as Oil palm processing, cassava processing, rice milling and flour milling etc. Through its Design, Finance, Build, and Operate (DFBO) model, EML combines its expertise in design and finance and a network of partners with operational and technical capabilities to deliver an effective mini-grid programme anchored of PuE offtake. This partnership ensures mini-grids are optimized for performance, cost efficiency, and scalability, while promoting electricity use for income-generating activities. EML also introduces innovative financing mechanisms, including a conveyor belt funding model through its strategic partnership with Infrastructure Credit Guarantee Company (InfraCredit) and liquidity from the Clean Energy Local Currency Fund (CeF), to streamline project development and execution. This enables a conveyor belt financing model which ensures prompt execution of bankable projects, based on sutainable anchor offtake from an agro-processing complex to buy up to 60% of the mini-grids energy generated. The conveyor-belt financing model integrates all project phases—development, construction, operations, and expansion—into a seamless ecosystem. Supported by the CeF, this approach recycles capital from completed projects to fund new ones, accelerating deployment. Strategic partnerships with development financial institutions (DFIs), government bodies like REA, and technology providers enhance project viability and scalability.',
quiz: [
{ question: 'What does EML develop?', options: ['Mini-grids tailored for agricultural uses', 'No mini-grids', 'Fossil fuel grids', 'Urban grids'], answer: 'Mini-grids tailored for agricultural uses' },
{ question: 'What model does EML use?', options: ['Design, Finance, Build, and Operate (DFBO)', 'No model', 'Random model', 'Old model'], answer: 'Design, Finance, Build, and Operate (DFBO)' },
{ question: 'What does partnership ensure?', options: ['Optimized performance, cost efficiency, scalability', 'No optimization', 'High cost', 'Low scalability'], answer: 'Optimized performance, cost efficiency, scalability' },
{ question: 'What mechanisms does EML introduce?', options: ['Innovative financing mechanisms', 'No mechanisms', 'Old mechanisms', 'Random'], answer: 'Innovative financing mechanisms' },
{ question: 'What model is the conveyor belt?', options: ['Financing model', 'No model', 'Construction model', 'Operation model'], answer: 'Financing model' },
],
order: 3,
},
{
title: 'Key Features',
content: 'Revenue Streams: Project development fees, construction fees, operational fees, and performance-based incentives. Market Focus: Agro-PuE as the anchor off-taker, supplemented by residential and MSME demand. Current Operations: EML manages a 50 kWp mini-grid on Umon Island, Cross River State, serving 200+ customers, with a second 24kWp under construction. The organisation has submitted a portfolio of 142 mini-grid projects to REA, under DAREs program with the worldbank.',
quiz: [
{ question: 'What are revenue streams?', options: ['Development fees, construction fees', 'No streams', 'Only development', 'Only construction'], answer: 'Development fees, construction fees' },
{ question: 'What is market focus?', options: ['Agro-PuE as anchor', 'No focus', 'Residential only', 'MSME only'], answer: 'Agro-PuE as anchor' },
{ question: 'What does EML manage?', options: ['50 kWp mini-grid', 'No management', '100 kWp', '200 kWp'], answer: '50 kWp mini-grid' },
{ question: 'Where is the mini-grid?', options: ['Umon Island, Cross River State', 'Lagos', 'Abuja', 'Kano'], answer: 'Umon Island, Cross River State' },
{ question: 'What is under construction?', options: ['Second 24kWp', 'No construction', '50kWp', '100kWp'], answer: 'Second 24kWp' },
],
order: 4,
},
{
title: 'Market Opportunity',
content: 'Nigeria’s energy access gap presents a substantial market opportunity for off-grid solutions. The REA estimates that households and businesses spend nearly ₦5 trillion ($14 billion) annually on inefficient generation methods, such as small-scale generators costing $0.40/kWh. Mini-grids and solar home systems could create a $10 billion per annum market, saving Nigerians $4.4 billion yearly. With over 105,000 mini-grids needed by 2030 to close the energy gap, and only about 170 currently operational, EML aims to deploy up to 1,000 mini-grids annually, capitalizing on this underserved market and aligning with national electrification targets. It already has 150 mini-grids under development.',
quiz: [
{ question: 'What does energy gap present?', options: ['Market opportunity for off-grid', 'No opportunity', 'On-grid only', 'Fossil fuel'], answer: 'Market opportunity for off-grid' },
{ question: 'What does REA estimate?', options: ['₦5 trillion spent annually', 'No estimate', '₦1 trillion', '₦10 trillion'], answer: '₦5 trillion spent annually' },
{ question: 'What could mini-grids create?', options: ['$10 billion market', 'No market', '$1 billion', '$20 billion'], answer: '$10 billion market' },
{ question: 'How many mini-grids needed by 2030?', options: ['Over 105,000', '50,000', '200,000', '10,000'], answer: 'Over 105,000' },
{ question: 'How many operational?', options: ['About 170', '1000', '500', '2000'], answer: 'About 170' },
],
order: 5,
},
{
title: 'Goals and Impact',
content: 'EML’s objectives include: PuE Integration: Embed productive use into mini-grid designs to boost agricultural productivity. Financing Efficiency: Accelerate project cycles through innovative funding structures. Gender Inclusion: Target female-headed households and women-led MSMEs for equitable impact. Scale: Energize 200 sites annually, reaching 1,000 sites and 1.5 million new connections over five years. Projected Impact Contribute significantly to Nigeria’s target of 105,000 mini-grids by 2030. Avoid 1,052,514 tons of CO2 emissions over five years by displacing diesel generators. Create jobs and enhance rural economies through increased agricultural output and income opportunities. Align with environmental, social, and governance (ESG) principles, supported by a robust ESG framework.',
quiz: [
{ question: 'What is PuE Integration?', options: ['Embed productive use', 'No embed', 'Remove use', 'Ignore use'], answer: 'Embed productive use' },
{ question: 'What is Financing Efficiency?', options: ['Accelerate project cycles', 'No acceleration', 'Slow cycles', 'Ignore cycles'], answer: 'Accelerate project cycles' },
{ question: 'What is Gender Inclusion?', options: ['Target female-headed households', 'No target', 'Male only', 'Ignore gender'], answer: 'Target female-headed households' },
{ question: 'What is Scale?', options: ['Energize 200 sites annually', 'No scale', 'Reduce sites', 'Ignore sites'], answer: 'Energize 200 sites annually' },
{ question: 'What is projected impact?', options: ['Contribute to 105,000 mini-grids', 'No contribution', 'Reduce mini-grids', 'Ignore'], answer: 'Contribute to 105,000 mini-grids' },
],
order: 6,
},
{
title: 'Organizational Structure',
content: 'Figure-1: PuE Lead Business Model',
quiz: [
{ question: 'What is the structure?', options: ['PuE Lead Business Model', 'No structure', 'Financial model', 'Social model'], answer: 'PuE Lead Business Model' },
{ question: 'What is Figure-1?', options: ['PuE Lead Business Model', 'No figure', 'Random figure', 'Ignore figure'], answer: 'PuE Lead Business Model' },
],
order: 7,
},
{
title: 'Key Team Members',
content: 'EML is led by a seasoned team of energy and infrastructure experts: 1. Olumide Fatoki Olumide Fatoki serves as the Chairman of the Board at EML, leveraging over 15 years of experience in energy access, decarbonization, and climate change to guide strategic initiatives and project execution. He has led impactful projects, such as an EU-funded program that electrified 138,000 lives and managed $25 million in solar micro-grid installations while at GIZ as country manager of the NESP program, backed by an Executive MBA, an MSc in Engineering Management, and his status as a Fellow of Acumen West Africa. 2. Jojo Ngene Jojo Ngene is the CEO of EML, bringing more than 13 years of engineering consulting expertise in electrical and power systems, with notable contributions to projects like Google DeepMind HQ. She has led several engineering project at CeF, Agronomie and successfully implemented over 18 agro-energy PuE assessment at Agronomie. She earned a First Class MEng and BEng in Electrical Engineering and is a member of the Institution of Engineering and Technology (IET), showcasing her technical prowess and leadership. 3. Emmanuel Ogwuche Emmanuel Ogwuche is a Project Engineer at EML, specializing in solar system design and installation, with hands-on experience deploying mini-grids and standalone solar systems in across Nigeria for Husk Power and Privida Power before joining EML. He holds a BSc in Industrial Physics and excels in using solar design tools like PVsyst and Homer, complemented by his strong communication and problem-solving abilities. 4. Oluwabusayo Akinrelere Oluwabusayo Akinrelere is the Acting Project Manager at EML, a COREN registered engineer with a proven track record in solar project delivery, including over 1MW commercial solar project and mini-grids benefiting over 70,000 Nigerians. He possesses a BEng in Electrical Electronics Engineering, is a certified Project Management Professional (PMP), and has contributed to research on solar radiation tracking. 5. Vivian Umeaku Vivian Umeaku is an accomplished Finance Specialist with a proven track record of driving financial excellence and strategic growth in diverse corporate environments, Leveraging over 8 years of experlence in finance, auditing, and accounting. I possess a unique blend of analytical prowess, leadership acumen, and strategic vision to optimize financial performance and drive organizational success. Known for my ability to develop and implement innovative financial strategies that align with business objectives, I excel in leading cross-functional teams and fostering collaboration to achieve sustainable results. 6. Ismail Yakubu Ismail Yakubu works in Project Engineering and Design at EML, with over 9 years of experience designing rooftop solar systems and electrical setups for residential and commercial buildings at Husk Power prior to his role in EML. He holds a BEng in Electrical Electronic Engineering, is a certified Electrical Power Systems Installation Engineer, and is a Corporate Member of the Nigeria Institute of Electrical Electronic Engineering (NIEEE). 7. Israel Akomodesegbe Israel Akomodesegbe is the Regional Manager for Community Engagement at EML, with 2 years of data analysis experience, contributing to data-driven projects like Bellabeat Data Analysis to support decision-making, he has been responsible for successfully completing over 25 site assessment and acquisition projects during his time with EML. He holds a B. Agric. in Agricultural Economics and is skilled in SQL, Python, R, and data visualization tools such as Tableau and Power BI. 8. Oche Joshua Oche Joshua is an Agro Technician at EML, with expertise in farming and agricultural engineering, having managed cassava and rice farms and served as a production manager for a rice mill, he is responsible for agro PuE assessment in EML. He graduated with a BEng in Agricultural Engineering as the Best Graduating Student in 2021 and is proficient in SolidWorks and agro machinery fabrication. 9. Taiwo Popoola Taiwo Popoola serves as a Regional Manager for Community Engagement at EML, utilizing his skills in electronics, telecommunications, and community outreach to support site identification and stakeholder dialogue in Oyo and Kwara states. he has been responsible for successfully completing over 30 site assessment and acquisition projects during his time with EML. He holds an HND and ND in Electronics and Telecommunications and is recognized for his leadership and effective communication abilities. 10. Adekunle Anjorin Adekunle Anjorin is a Regional Manager for Community Engagement at EML, drawing on his agricultural engineering background to enhance community outreach and administrative efforts. he has been responsible for successfully completing over 65 site assessment and acquisition projects during his time with EML. He holds a BEng in Agricultural Engineering, has developed equipment like soil steam sterilization tools, and enjoys sports and traveling as personal pursuits. 11. Timothy Yusuf Timothy Yusuf is a Project Technician at EML, with a background in electrical engineering and practical experience supporting electrical projects. He is a Certified Professional Engineer (PE) known for his teamwork, adaptability, and meticulous attention to detail.',
quiz: [
{ question: 'Who is Olumide Fatoki?', options: ['Chairman of the Board', 'CEO', 'Project Engineer', 'Finance Specialist'], answer: 'Chairman of the Board' },
{ question: 'What is Jojo Ngene\'s role?', options: ['CEO', 'Chairman', 'Project Engineer', 'Agro Technician'], answer: 'CEO' },
{ question: 'Who is Emmanuel Ogwuche?', options: ['Project Engineer', 'CEO', 'Chairman', 'Regional Manager'], answer: 'Project Engineer' },
{ question: 'What is Oluwabusayo Akinrelere?', options: ['Acting Project Manager', 'Finance Specialist', 'Agro Technician', 'Regional Manager'], answer: 'Acting Project Manager' },
{ question: 'Who is Vivian Umeaku?', options: ['Finance Specialist', 'Project Engineer', 'CEO', 'Chairman'], answer: 'Finance Specialist' },
{ question: 'Who is Ismail Yakubu?', options: ['Project Engineering and Design', 'Regional Manager', 'Agro Technician', 'Project Technician'], answer: 'Project Engineering and Design' },
{ question: 'Who is Israel Akomodesegbe?', options: ['Regional Manager for Community Engagement', 'Project Technician', 'Finance Specialist', 'CEO'], answer: 'Regional Manager for Community Engagement' },
{ question: 'Who is Oche Joshua?', options: ['Agro Technician', 'Regional Manager', 'Project Engineer', 'Chairman'], answer: 'Agro Technician' },
{ question: 'Who is Taiwo Popoola?', options: ['Regional Manager for Community Engagement', 'Agro Technician', 'Finance Specialist', 'CEO'], answer: 'Regional Manager for Community Engagement' },
{ question: 'Who is Adekunle Anjorin?', options: ['Regional Manager for Community Engagement', 'Project Technician', 'Agro Technician', 'Chairman'], answer: 'Regional Manager for Community Engagement' },
],
order: 8,
},
],
},
// Corporate Team Profile September 2025 - Assuming similar structure to June, expand accordingly.
{
title: 'Corporate Team Profile September 2025 - Beginner',
description: 'Corporate team profile for September 2025, similar to June with updates.',
level: 'beginner',
assetco: 'EML',
modules: [
  // Similar modules as June, adjust content if necessary from original.
  // For brevity, assume same as June unless specified differences in original.
],
},
{
title: 'ASpecialised Alternative Asset Manager - Beginner',
description: 'Overview of specialised alternative asset manager.',
level: 'beginner',
assetco: 'General',
modules: [
  // Expand all subsections: Overview, Our Investment Approach, Our Funds, Our Team, etc.
  // Use original content to create modules.
],
},
// COMPANY OVERVIEW (second one) - If duplicate, merge or add as new.
{
title: 'SOP FOR PROCUREMENT & LOGISTICS - Intermediate',
description: 'Standard Operating Procedure for Procurement and Logistics.',
level: 'intermediate',
assetco: 'General',
modules: [
  // Expand Preface, Expected Outcome, Process Structure, 1. Introduction, 2. Process Objectives, etc. as modules.
],
},
{
title: 'Standard Operating Procedure (SoP) Grosolar AssetCo Limited - Intermediate',
description: 'Standard Operating Procedure for GroSolar.',
level: 'intermediate',
assetco: 'GroSolar',
modules: [
  // Expand Document Information, Outline, 1. Introduction with 1.1 to 1.5, 2. Client Onboarding with 2.1 2.2, etc.
],
},
{
title: 'COMPANY TASK MANAGER REQUIREMENTS - Beginner',
description: 'Requirements for company task manager.',
level: 'beginner',
assetco: 'General',
modules: [
  // Expand each requirement as module.
],
},
{
title: 'Company Profile (Agronomie) - Beginner',
description: 'Profile of Agronomie.',
level: 'beginner',
assetco: 'Agronomie',
modules: [
  // Expand PROFILE Overview, Differentiated Strategic Approach, Fund Description, etc.
],
},
{
title: 'Organization Structure CEF - Beginner',
description: 'Organization structure for Clean Energy Fund.',
level: 'beginner',
assetco: 'General',
modules: [
  // Expand structure details.
],
},
];
await LearningCourse.deleteMany({}).maxTimeMS(30000); // Increased timeout to 30s
await LearningCourse.insertMany(courses);
console.log('Learning materials seeded with full content!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};
seedData();


