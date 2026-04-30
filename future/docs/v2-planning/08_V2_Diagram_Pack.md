# FundCo AI V2 Diagram Pack

Generated: April 28, 2026

This pack is intended to make V2 development faster and less ambiguous. The diagrams are written in Mermaid so they can be rendered in GitHub, VS Code Markdown preview with Mermaid support, and other Mermaid-capable tools.

These diagrams are not decorative. They are implementation maps. A senior developer should be able to use them together with the V2 planning documents to understand:

- the target system shape
- the runtime boundaries
- the domain breakdown
- the event architecture
- the AI management loop
- the admin operating surfaces
- the HR and Finance expansion path
- the multi-company global model
- the phase dependencies
- the module ownership model for the `future` directory

---

## 1. V2 System Context

```mermaid
flowchart TB
    subgraph People
        Staff["Staff / Standard Users"]
        Leads["Team Leads"]
        Execs["Executives"]
        Super["Super Admin"]
    end

    subgraph ExperienceLayer["Experience Layer"]
        UserApp["User App"]
        AdminApp["Admin App"]
        AdminSurfaces["AI Super Admin / Operations Console / Management Inbox"]
    end

    subgraph CorePlatform["Core Platform"]
        CoreAPI["Core Operational API"]
        AdminBFF["Admin Backend / BFF"]
        EventLayer["Operational Event Layer"]
        Intelligence["AI Management Layer"]
        ReadModels["Operational Read Models"]
    end

    subgraph Expansion["Expansion Layers"]
        HR["HR Platform Layer"]
        Finance["Finance Platform Layer"]
        MultiEntity["Multi-Company / Global Layer"]
    end

    subgraph External["External Integrations"]
        Mail["Email / Notification Providers"]
        Calendar["Calendar / Meeting Providers"]
        Identity["Identity / SSO"]
        Storage["File / Document Services"]
        AIProvider["LLM / AI Provider"]
    end

    Staff --> UserApp
    Leads --> AdminApp
    Execs --> AdminApp
    Super --> AdminApp

    UserApp --> CoreAPI
    AdminApp --> AdminBFF
    AdminBFF --> CoreAPI
    AdminApp --> AdminSurfaces
    AdminSurfaces --> ReadModels
    AdminSurfaces --> Intelligence

    CoreAPI --> EventLayer
    EventLayer --> Intelligence
    EventLayer --> ReadModels
    Intelligence --> ReadModels
    Intelligence --> CoreAPI

    EventLayer --> HR
    EventLayer --> Finance
    HR --> MultiEntity
    Finance --> MultiEntity
    CoreAPI --> MultiEntity

    CoreAPI --> Mail
    CoreAPI --> Calendar
    CoreAPI --> Identity
    CoreAPI --> Storage
    Intelligence --> AIProvider
```

---

## 2. V2 Container Architecture

```mermaid
flowchart LR
    subgraph Frontend
        FU["future/frontend\nUser React App"]
        FA["future/adminpanel/frontend\nAdmin React App"]
        FL["future/landing\nFuture Landing Experience"]
    end

    subgraph EdgeAndRealtime
        Socket["Socket.IO Real-Time Channel"]
    end

    subgraph Backends
        BU["future/backend\nCore Operational Backend"]
        BA["future/adminpanel/backend\nAdmin Backend / BFF"]
        Workers["Background Workers / Jobs"]
    end

    subgraph DataPlane
        Mongo["MongoDB\nTransactional Models"]
        EventStore["Operational Events"]
        Projections["Read Models / Projections"]
        Memory["AI Memory / Risk / Workload State"]
    end

    subgraph Integrations
        AI["AI Provider"]
        Notif["Email / Push / In-App Notifications"]
        Meet["Meeting / Calendar Providers"]
        Files["Storage / Documents"]
    end

    FU --> BU
    FA --> BA
    BA --> BU
    FU <--> Socket
    FA <--> Socket
    BU <--> Socket
    BA <--> Socket

    BU --> Mongo
    BU --> EventStore
    BU --> Projections
    BU --> Memory
    Workers --> EventStore
    Workers --> Projections
    Workers --> Memory
    Workers --> Mongo

    BU --> AI
    Workers --> AI
    BU --> Notif
    Workers --> Notif
    BU --> Meet
    BU --> Files
```

---

## 3. V2 Domain Map

```mermaid
flowchart TB
    Execution["Execution Domain\nTasks / Projects / Goals / Approvals / Dependencies"]
    Collaboration["Collaboration Domain\nChat / Meetings / Social / Comments"]
    Reporting["Reporting Domain\nReports / Review / Derived Actions"]
    Alerts["Notification and Escalation Domain\nNotifications / Reminders / Inbox / Exceptions"]
    Intelligence["Intelligence Domain\nWorkload / Risk / Assignment / Summaries / AI Actions"]
    Governance["Governance Domain\nPermissions / Policies / Audit / Autonomy Gates"]
    People["People Domain\nUsers / Roles / Teams / Org Structure"]
    HR["HR Domain\nEmployee Records / Attendance / Leave / Reviews / Promotions"]
    Finance["Finance Domain\nBudget / Payroll Inputs / Cost / Forecast / Profitability"]
    Entity["Entity Domain\nCompanies / AssetCos / Business Units / Regions"]

    Execution --> Intelligence
    Collaboration --> Intelligence
    Reporting --> Intelligence
    Alerts --> Intelligence

    People --> Execution
    People --> Governance
    Entity --> Governance
    Entity --> People

    Governance --> Execution
    Governance --> Collaboration
    Governance --> Reporting
    Governance --> Alerts
    Governance --> Intelligence

    Execution --> HR
    Intelligence --> HR
    Execution --> Finance
    Intelligence --> Finance

    HR --> Finance
    Entity --> HR
    Entity --> Finance
```

---

## 4. Operational Event Flow

```mermaid
flowchart LR
    subgraph EventSources
        Task["Task Events"]
        Project["Project Events"]
        Goal["Goal Events"]
        Meeting["Meeting Events"]
        Report["Report Events"]
        Chat["Chat Events"]
        Reminder["Reminder Events"]
        Training["Training / Performance Events"]
    end

    Outbox["Event Publisher / Outbox"]
    EventStore["Operational Event Store"]

    subgraph Consumers
        NotifProj["Notification Projection"]
        InboxProj["Management Inbox Projection"]
        Workload["Workload / Capacity Consumer"]
        Risk["Risk / Drift Consumer"]
        Summary["Company Summary Consumer"]
        AIEngines["AI Assignment / Escalation / Meeting / Report Engines"]
        Audit["Audit / Replay / Analytics"]
    end

    Task --> Outbox
    Project --> Outbox
    Goal --> Outbox
    Meeting --> Outbox
    Report --> Outbox
    Chat --> Outbox
    Reminder --> Outbox
    Training --> Outbox

    Outbox --> EventStore

    EventStore --> NotifProj
    EventStore --> InboxProj
    EventStore --> Workload
    EventStore --> Risk
    EventStore --> Summary
    EventStore --> AIEngines
    EventStore --> Audit
```

---

## 5. AI Management Decision Loop

```mermaid
flowchart TB
    Observe["Observe\nCapture operational events"]
    Normalize["Normalize\nProject events into workload, dependency, and risk state"]
    Analyze["Analyze\nDetect blockers, overload, slippage, silence, and unresolved decisions"]
    Decide["Decide\nGenerate recommendation or autonomous candidate action"]
    Policy["Policy Gate\nPermissions, confidence, approval rules, autonomy rules"]
    Inbox["Management Inbox\nHuman review if required"]
    Execute["Execute\nAssign, escalate, notify, reassign, or create action"]
    Emit["Emit New Events\nRecord action outcome and downstream effects"]
    Learn["Recalculate\nRefresh workload, risk, summaries, and memory"]

    Observe --> Normalize
    Normalize --> Analyze
    Analyze --> Decide
    Decide --> Policy
    Policy -->|Human review required| Inbox
    Inbox --> Execute
    Policy -->|Autonomy permitted| Execute
    Execute --> Emit
    Emit --> Learn
    Learn --> Observe
```

---

## 6. V2 Admin UX Map

```mermaid
flowchart TB
    Overview["Overview / Navigation"]

    subgraph PrimarySurfaces["Primary V2 Admin Surfaces"]
        SuperAdmin["AI Super Admin"]
        OpsConsole["Operations Console"]
        Inbox["Management Inbox"]
    end

    subgraph Drilldowns["Operational Drilldowns"]
        Tasks["Tasks / Approvals"]
        Projects["Projects / Delivery Risk"]
        Goals["Goals / Outcome Tracking"]
        Meetings["Meetings / Generated Actions"]
        Reports["Reports / Extracted Risks"]
        Teams["Teams / Workload / Coverage"]
        Performance["Performance / Reliability / Output"]
    end

    Overview --> SuperAdmin
    Overview --> OpsConsole
    Overview --> Inbox

    SuperAdmin --> Inbox
    SuperAdmin --> Tasks
    SuperAdmin --> Projects
    SuperAdmin --> Teams

    OpsConsole --> Projects
    OpsConsole --> Teams
    OpsConsole --> Reports
    OpsConsole --> Meetings
    OpsConsole --> Performance

    Inbox --> Tasks
    Inbox --> Projects
    Inbox --> Meetings
    Inbox --> Reports
    Inbox --> Goals
```

---

## 7. HR and Finance Integration Model

```mermaid
flowchart LR
    subgraph OperationalCore
        Tasks["Tasks / Approvals"]
        Projects["Projects / Milestones"]
        Goals["Goals / Progress"]
        Meetings["Meetings / Actions"]
        Reports["Reports / Blockers"]
        Perf["Performance Signals"]
        Events["Operational Event Layer"]
    end

    subgraph HRLayer
        Employee["Employee Master"]
        Org["Org Structure"]
        Attendance["Attendance / Leave"]
        Reviews["Appraisals / KPI Cycles"]
        Talent["Promotions / Succession / Offboarding"]
        HRDocs["Contracts / Policies / HR Documents"]
    end

    subgraph FinanceLayer
        Payroll["Payroll Inputs / Bonus Validation"]
        Budget["Budget / Cost Control"]
        Forecast["Forecasting"]
        Profit["Profitability / Unit Economics"]
        Reporting["Finance Reporting"]
    end

    Tasks --> Events
    Projects --> Events
    Goals --> Events
    Meetings --> Events
    Reports --> Events
    Perf --> Events

    Events --> Employee
    Events --> Attendance
    Events --> Reviews
    Events --> Talent

    Reviews --> Payroll
    Attendance --> Payroll
    Events --> Budget
    Events --> Forecast
    Events --> Profit
    Budget --> Reporting
    Forecast --> Reporting
    Profit --> Reporting
```

---

## 8. Multi-Company Global Platform Model

```mermaid
flowchart TB
    Group["Portfolio / Group Control"]

    subgraph Entities
        CompanyA["Company A"]
        CompanyB["Company B"]
        CompanyN["Company N"]
    end

    subgraph CompanyStructure["Per Company Structure"]
        AssetCo["AssetCo / Subsidiary"]
        BU["Business Unit"]
        Team["Team"]
        User["Users / Roles"]
    end

    subgraph SharedPlatform
        SharedServices["Shared Operational Services"]
        SharedAI["Shared AI Management Layer"]
        SharedPolicies["Entity-Aware Governance / Policy Layer"]
        SharedAnalytics["Cross-Entity Analytics / Summaries"]
    end

    subgraph GlobalControls
        TZ["Timezone-Aware Workflows"]
        FX["Currency / Cost Views"]
        Regional["Regional Policy / Compliance"]
        Integrations["External Integrations"]
    end

    Group --> CompanyA
    Group --> CompanyB
    Group --> CompanyN

    CompanyA --> AssetCo
    CompanyB --> AssetCo
    CompanyN --> AssetCo
    AssetCo --> BU
    BU --> Team
    Team --> User

    CompanyA --> SharedServices
    CompanyB --> SharedServices
    CompanyN --> SharedServices

    SharedServices --> SharedAI
    SharedServices --> SharedPolicies
    SharedServices --> SharedAnalytics

    SharedPolicies --> TZ
    SharedPolicies --> FX
    SharedPolicies --> Regional
    SharedServices --> Integrations
```

---

## 9. Phase Dependency Map

```mermaid
flowchart LR
    A["Phase A\nPlatform and Event Foundations"]
    B["Phase B\nOperational Intelligence Core"]
    C["Phase C\nRecommendation-First AI Management"]
    D["Phase D\nAdmin Operating Surfaces"]
    E["Phase E\nUpgrade Existing V1 Modules"]
    F["Phase F\nHR Foundation"]
    G["Phase G\nFinance Foundation"]
    H["Phase H\nMulti-Company and Global Platform"]

    A --> B
    B --> C
    C --> D
    C --> E
    D --> E
    E --> F
    E --> G
    F --> H
    G --> H
```

---

## 10. Future Directory Module Ownership Map

```mermaid
flowchart TB
    subgraph CorePlatformWorkstream
        BConfig["future/backend/config"]
        BMiddleware["future/backend/middleware"]
        BModels["future/backend/models"]
        BServices["future/backend/services\nand future services/intelligence"]
        BUtils["future/backend/utils"]
        BTests["future/backend/__tests__"]
    end

    subgraph ExecutionWorkstream
        BControllers["future/backend/controllers"]
        BRoutes["future/backend/routes"]
        BSocket["future/backend/socket"]
    end

    subgraph AdminBackendWorkstream
        ABControllers["future/adminpanel/backend/controllers"]
        ABRoutes["future/adminpanel/backend/routes"]
        ABMiddleware["future/adminpanel/backend/middleware"]
        ABUtils["future/adminpanel/backend/utils"]
    end

    subgraph UserFrontendWorkstream
        FPages["future/frontend/src/pages"]
        FComponents["future/frontend/src/components"]
        FContext["future/frontend/src/context"]
        FSecurity["future/frontend/src/security"]
    end

    subgraph AdminFrontendWorkstream
        AFPages["future/adminpanel/frontend/src/pages"]
        AFComponents["future/adminpanel/frontend/src/components"]
        AFContext["future/adminpanel/frontend/src/context"]
        AFSecurity["future/adminpanel/frontend/src/security"]
    end

    CorePlatformWorkstream --> ExecutionWorkstream
    ExecutionWorkstream --> UserFrontendWorkstream
    ExecutionWorkstream --> AdminBackendWorkstream
    AdminBackendWorkstream --> AdminFrontendWorkstream
```

---

## 11. How to use this pack during implementation

- Use Diagram 1 and Diagram 2 when making architectural decisions.
- Use Diagram 3 and Diagram 4 before touching domain services or the event layer.
- Use Diagram 5 when implementing AI actions and governance.
- Use Diagram 6 while designing the V2 admin application.
- Use Diagram 7 before starting HR and Finance.
- Use Diagram 8 before adding multi-company support.
- Use Diagram 9 to enforce phase order and avoid building on unstable foundations.
- Use Diagram 10 when assigning module ownership and implementation responsibility.

## 12. Recommended next diagram set after coding begins

Once implementation starts, add a second diagram pack for:

- database entity relationship diagrams for new intelligence models
- sequence diagrams for task assignment, escalation, and management inbox actions
- API contract diagrams for admin surfaces
- queue and worker lifecycle diagrams
- deployment topology diagrams for staging and production
