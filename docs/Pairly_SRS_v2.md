# PAIRLY

## Software Requirements Specification (SRS)

**Document version:** 2.0  
**Status:** Consolidated Product Requirements Baseline  
**Product category:** Real-time collaborative coding and AI-assisted development platform  
**Document purpose:** Requirements baseline for product design, implementation, testing, and release planning

---

## Document Control

| Field                | Description                                                                             |
| -------------------- | --------------------------------------------------------------------------------------- |
| Product              | Pairly                                                                                  |
| Document owner       | Pairly Product and Engineering                                                          |
| Intended audience    | Product, engineering, design, QA, security, operations, and business stakeholders       |
| Specification style  | Structured in accordance with the principles of ISO/IEC/IEEE 29148                      |
| Requirement language | “Shall” indicates a mandatory requirement; “should” indicates a recommended requirement |
| Priority             | M = Must; S = Should; C = Could                                                         |
| Release              | R1 = MVP; R2 = Growth; R3 = Scale                                                       |

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines Pairly’s product scope, user-facing capabilities, functional and non-functional requirements, external interfaces, data handling, security controls, acceptance criteria, and staged delivery plan. It is intended to provide a shared, testable baseline for implementation and product decisions.

### 1.2 Product Scope

Pairly is a browser-based collaborative development environment that lets two or more people create and edit code together, run programs, preview web projects, communicate, and work with an AI pair programmer in one shared room. Users can begin a session through a shareable link without installing software or creating an account. Registered users can retain work, connect repositories, and use team and workflow features.

The product is intended for:

- Software engineers pairing on implementation and debugging.
- Interviewers and candidates conducting technical interviews.
- Instructors, mentors, and learners working through code together.
- Distributed teams reviewing code and solving problems collaboratively.

**In scope:** web application, real-time rooms and synchronization, multi-file editing, execution and terminal, live preview, communication, shared notes and whiteboard, AI assistance, session history and replay, repository integration, accounts, teams, interview/classroom workflows, administration, analytics, and billing.

**Out of scope for the initial release:** native desktop applications, native mobile applications, on-premises deployment, unrestricted long-running production environments, arbitrary managed databases inside workspaces, and a third-party extension marketplace. Responsive mobile web access is in scope, with reduced functionality where screen size or browser capabilities require it.

### 1.3 Product Vision

**Code together. Instantly.** Pairly should make collaborative programming as simple as sharing a link while bringing the editor, execution, communication, and AI assistance into a single coordinated workspace.

### 1.4 Definitions and Acronyms

| Term           | Definition                                                              |
| -------------- | ----------------------------------------------------------------------- |
| Room           | A real-time collaborative session with a workspace and associated tools |
| Workspace      | The file and folder tree and its contents                               |
| Guest          | A participant using a temporary identity without registering            |
| Host           | The room creator or authorized owner responsible for room settings      |
| CRDT           | Conflict-free Replicated Data Type used to merge concurrent changes     |
| Yjs            | A CRDT framework used for collaborative document synchronization        |
| Durable Object | Stateful coordination unit used to manage room-level real-time state    |
| SFU            | Selective Forwarding Unit used to route WebRTC media                    |
| Pairly Agent   | Pairly’s shared AI pair-programming participant                         |
| Replay         | A navigable reconstruction of a session from saved collaboration events |
| RBAC           | Role-Based Access Control                                               |
| BYOK           | Bring Your Own Key                                                      |
| SRS            | Software Requirements Specification                                     |

### 1.5 Requirement Conventions

Requirements are uniquely identified using `FR-<AREA>-<NN>` for functional requirements, `NFR-<AREA>-<NN>` for non-functional requirements, and `SEC-<NN>` for security requirements. Each requirement includes a priority and planned release where appropriate. Requirements are expected to be verifiable through inspection, analysis, demonstration, or test.

## 2. Product Overview

### 2.1 Problem Statement

Collaborative coding workflows often require separate tools for editing, execution, preview, calls, notes, and AI assistance. This fragmentation increases setup time and makes it difficult for all participants to share the same code context and decisions. Pairly consolidates these workflows into a common room with shared state and clear participant permissions.

### 2.2 Product Objectives

1. Enable a new user to start a collaborative coding session with minimal setup.
2. Keep code, presence, chat, terminal output, and shared notes synchronized.
3. Provide safe, isolated execution of user-submitted code.
4. Make AI assistance transparent, reviewable, and available to room participants.
5. Support mentoring, interviews, and team collaboration through configurable roles and room modes.
6. Preserve useful work through snapshots, exports, repository integration, and session history.
7. Maintain strong security, privacy, accessibility, performance, and operational observability.

### 2.3 Product Principles

- **Low-friction access:** guest participation is supported for core collaboration.
- **Shared context:** participants can understand which file, execution, or AI proposal is being discussed.
- **Review before mutation:** AI-generated code changes are presented as proposals before being applied.
- **Secure by default:** untrusted code runs in isolated environments; secrets are never broadcast.
- **Graceful degradation:** a failure in video or AI should not interrupt core text collaboration.
- **Privacy by design:** retention and recording are visible, limited, and user-controllable.
- **Progressive delivery:** advanced capabilities are staged rather than required for the first public release.

### 2.4 Success Measures

The following are initial product targets to validate after launch, not guarantees of current production performance.

| Metric                                                    |            Initial target |
| --------------------------------------------------------- | ------------------------: |
| Median time from landing page to first editable keystroke |              ≤ 10 seconds |
| Same-region edit propagation latency                      | p50 ≤ 60 ms; p95 ≤ 150 ms |
| Crash-free sessions                                       |                   ≥ 99.5% |
| Registered-user week-four retention                       |                     ≥ 30% |
| Guest-to-account conversion                               |                      ≥ 8% |
| Free-to-paid conversion                                   |                      ≥ 3% |
| Core landing page Largest Contentful Paint                |      ≤ 2.0 seconds at p75 |

## 3. Users, Roles, and Operating Environment

### 3.1 User Classes

| User class               | Description and principal capabilities                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Guest participant        | Joins rooms through a link; can edit, comment, view, chat, or run code according to room permissions            |
| Registered user          | Manages profile, preferences, saved rooms, connected accounts, and personal usage                               |
| Host                     | Configures room access, assigns roles, controls features, moderates participants, and manages session lifecycle |
| Interviewer / instructor | Uses interview or classroom controls, manages candidate/student access, and reviews permitted session evidence  |
| Team administrator       | Manages team membership, shared settings, billing, and team-level policies                                      |
| Platform administrator   | Handles abuse reports, platform configuration, support, and operational incidents                               |

### 3.2 Operating Environment

- Supported desktop browsers: current and previous major versions of Chrome, Edge, Firefox, and Safari.
- Mobile web: current iOS Safari and Android Chrome, with feature availability adapted to device capabilities.
- Client: modern browser with JavaScript, WebSocket, and WebRTC support where applicable.
- Backend: cloud-hosted services with stateful room coordination, durable storage, isolated execution infrastructure, and managed database services.
- Network: HTTPS/WSS for application traffic and WebRTC with appropriate secure media transport for calls.

### 3.3 Constraints

- TypeScript shall be used for the main application and shared contracts.
- All client/server events and external payloads shall be schema-validated.
- User code shall never execute in the privileged application origin.
- API keys, session secrets, and provider credentials shall remain server-side or in encrypted secret storage.
- Third-party integrations shall be isolated behind interfaces to reduce provider lock-in.
- Mobile web functionality may be reduced where browser or viewport constraints prevent parity with desktop.

### 3.4 Assumptions and Dependencies

- Users have a modern browser and a stable internet connection.
- External identity, repository, AI, email, payment, and media providers expose supported APIs.
- Service limits and prices may change; the implementation must record provider decisions and operational limits.
- Code execution availability depends on secure sandbox capacity and language-runtime support.
- AI-generated content may be incorrect and must remain reviewable by users.

## 4. System Architecture

### 4.1 Architectural Overview

Pairly shall use a modular, edge-oriented architecture. The browser provides the collaborative workspace. A versioned API handles room metadata, accounts, integrations, and billing. A stateful room coordinator manages real-time documents and events. Persistent storage retains metadata, snapshots, and selected artifacts. Separate isolated execution infrastructure runs user code. Media services provide real-time audio, video, and screen sharing. An AI gateway brokers model requests and applies context, quota, and security policies.

### 4.2 Logical Components

1. **Web client:** landing page, room workspace, editor, terminal, preview, chat, calls, notes, whiteboard, account dashboard, and settings.
2. **API gateway:** authentication, authorization, request validation, quotas, and integrations.
3. **Room coordinator:** room membership, role enforcement, document synchronization, presence, chat events, terminal state, and room lifecycle.
4. **Persistence layer:** relational metadata, document snapshots, event logs, exports, and optional replay assets.
5. **Execution service:** isolated ephemeral environments with resource limits and output streaming.
6. **Preview sandbox:** separate-origin rendering for user-created web content.
7. **Media service:** WebRTC signaling, SFU routing, TURN relay, and media controls.
8. **AI gateway:** provider routing, streaming, context construction, usage metering, proposal generation, and safety controls.
9. **Integration services:** repository provider APIs, identity providers, email, and payments.
10. **Operations services:** metrics, logs, tracing, feature flags, abuse reports, and incident management.

### 4.3 Target Technology Direction

The following is a proposed implementation baseline. Final versions and provider choices shall be recorded in architecture decision records before implementation.

| Layer                       | Target direction                                                                  |
| --------------------------- | --------------------------------------------------------------------------------- |
| Web application             | Next.js App Router, React, TypeScript                                             |
| UI system                   | Tailwind CSS, accessible component primitives, responsive design tokens           |
| Backend API                 | NestJS + TypeScript                                                               |
| Collaborative state         | Yjs CRDTs over WebSockets                                                         |
| Room coordination           | Stateful edge workers / room coordinators                                         |
| Editor                      | CodeMirror 6 as the default; Monaco may be offered for desktop power users        |
| Database                    | PostgreSQL with a typed ORM                                                       |
| Object and snapshot storage | Managed object storage and key-value services as appropriate                      |
| Execution                   | Container or sandbox runner with a Piston-compatible internal interface           |
| Real-time communication     | WebRTC through an SFU/TURN provider abstraction                                   |
| AI                          | Server-side AI gateway supporting streaming and multiple model providers          |
| Authentication              | Guest tokens plus email/OAuth and passkey options                                 |
| Payments                    | Subscription and usage billing provider                                           |
| Validation                  | Shared typed contracts and runtime schema validation                              |
| Testing                     | Unit, integration, multi-client end-to-end, security, and load testing            |
| Observability               | Structured logs, metrics, distributed traces, error monitoring, and uptime checks |
| CI/CD                       | Automated checks, preview environments, staged deployment, and rollback support   |

### 4.4 Room Lifecycle

1. A visitor creates a room or follows an invitation link.
2. The system creates or validates a room identity and issues a scoped access token.
3. The room coordinator loads the current snapshot and required event state.
4. Clients connect, synchronize documents, and publish presence.
5. Authorized participants edit, chat, run code, use AI, and collaborate.
6. The system periodically persists snapshots and relevant events according to retention policy.
7. When the room becomes inactive, the system flushes required state and releases active resources.
8. A later visit restores the room only if it has not expired or been deleted.

## 5. Functional Requirements

Priority: **M** = Must; **S** = Should; **C** = Could. Release labels: **R1** = MVP, **R2** = Growth, **R3** = Scale.

### 5.1 Rooms, Identity, and Access

| ID         | Requirement                                                                                                   | Priority | Release |
| ---------- | ------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| FR-ROOM-01 | The system shall allow a visitor to create a basic room without registering.                                  | M        | R1      |
| FR-ROOM-02 | Each room shall have a unique, unguessable URL and a human-friendly short code where feasible.                | M        | R1      |
| FR-ROOM-03 | Guests shall receive a temporary identity with editable display name, avatar, and color.                      | M        | R1      |
| FR-ROOM-04 | Hosts shall configure access as link-accessible, passcode-protected, invite-only, or lobby-admitted.          | M        | R1      |
| FR-ROOM-05 | The system shall support Host, Editor, Commenter, and Viewer roles.                                           | M        | R1      |
| FR-ROOM-06 | Hosts shall be able to change participant roles while a room is active.                                       | M        | R1      |
| FR-ROOM-07 | Hosts shall be able to lock a room, remove participants, and ban a session from rejoining.                    | M        | R1      |
| FR-ROOM-08 | Rooms shall enforce configurable participant limits based on plan and room mode.                              | M        | R1      |
| FR-ROOM-09 | Hosts shall be able to configure room expiry and close a room.                                                | S        | R1      |
| FR-ROOM-10 | A guest shall be able to claim a room through account registration without losing eligible workspace content. | S        | R2      |
| FR-ROOM-11 | Registered users shall have a dashboard for recent, pinned, searched, and archived rooms.                     | S        | R2      |
| FR-ROOM-12 | Hosts shall be able to create a room from a template or fork an existing workspace.                           | S        | R2      |

### 5.2 Collaborative Editor and Workspace

| ID         | Requirement                                                                                                                            | Priority | Release |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| FR-EDIT-01 | The editor shall synchronize concurrent edits through a CRDT and converge without user-visible overwrites.                             | M        | R1      |
| FR-EDIT-02 | The workspace shall support multiple files and folders, including create, rename, move, delete, and tab switching.                     | M        | R1      |
| FR-EDIT-03 | The editor shall provide syntax highlighting, line numbers, bracket matching, indentation, code folding, search, and replace.          | M        | R1      |
| FR-EDIT-04 | The system shall support at least 20 executable languages at launch and syntax highlighting for at least 40 languages.                 | M        | R1      |
| FR-EDIT-05 | Remote cursors and selections shall be shown with participant labels and consistent colors.                                            | M        | R1      |
| FR-EDIT-06 | A presence panel shall show connected participants and their current activity or active file when available.                           | M        | R1      |
| FR-EDIT-07 | Participants shall be able to follow another participant’s active file, cursor, and scroll position, and exit follow mode at any time. | M        | R1      |
| FR-EDIT-08 | Hosts shall be able to spotlight a participant or broadcast the host’s current editor view.                                            | S        | R1      |
| FR-EDIT-09 | The editor shall support per-user undo/redo without unintentionally undoing another participant’s unrelated edits.                     | M        | R1      |
| FR-EDIT-10 | Users shall import files by upload, drag-and-drop, ZIP, or paste and export a workspace as ZIP.                                        | M        | R1      |
| FR-EDIT-11 | The editor shall support configurable font size, themes, and common keyboard preferences.                                              | S        | R1      |
| FR-EDIT-12 | The system should support anchored code comments and threaded discussions.                                                             | S        | R2      |
| FR-EDIT-13 | The system should provide language diagnostics and completion for selected launch languages.                                           | S        | R2      |
| FR-EDIT-14 | The system should support temporary offline editing and merge changes after reconnection where feasible.                               | S        | R2      |
| FR-EDIT-15 | The system could support suggestion-only editing and additional editor keybinding profiles.                                            | C        | R3      |

### 5.3 Code Execution and Shared Terminal

| ID         | Requirement                                                                                                                                                  | Priority | Release |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------- |
| FR-EXEC-01 | Users shall be able to run the active file or configured entry point in at least 20 languages at launch, with a target of 50 or more as the service matures. | M        | R1      |
| FR-EXEC-02 | The shared terminal shall display stdout, stderr, execution status, exit code, and duration to authorized participants.                                      | M        | R1      |
| FR-EXEC-03 | Interactive programs shall accept standard input from authorized participants while running.                                                                 | M        | R1      |
| FR-EXEC-04 | Every run shall execute in an isolated sandbox with CPU, memory, disk, process, wall-clock, and output limits.                                               | M        | R1      |
| FR-EXEC-05 | Sandboxes shall have outbound network access disabled by default.                                                                                            | M        | R1      |
| FR-EXEC-06 | The host shall be able to disable code execution for a room.                                                                                                 | M        | R1      |
| FR-EXEC-07 | The system shall apply configurable resource limits by plan and prevent one room from exhausting shared capacity.                                            | M        | R1      |
| FR-EXEC-08 | Terminal history shall be available to participants who join later, within the room’s configured retention and size limits.                                  | M        | R1      |
| FR-EXEC-09 | Users should be able to save run configurations, including command, arguments, and working directory. Secrets must be masked and must not be broadcast.      | S        | R2      |
| FR-EXEC-10 | The system should cache approved dependencies and use an allow-listed package proxy where package installation is supported.                                 | S        | R2      |
| FR-EXEC-11 | The system could offer browser-side WebAssembly execution for suitable languages.                                                                            | C        | R2      |
| FR-EXEC-12 | The system could support long-running development servers with controlled preview ports.                                                                     | C        | R3      |

### 5.4 Live Web Preview

| ID         | Requirement                                                                                                                              | Priority | Release |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| FR-PREV-01 | The system shall provide a sandboxed live preview for HTML, CSS, and JavaScript-based projects.                                          | M        | R1      |
| FR-PREV-02 | Preview updates shall be debounced and normally appear within 300 ms of a relevant source change.                                        | M        | R1      |
| FR-PREV-03 | Preview content shall run on a separate origin or equivalently isolated environment with no access to Pairly session cookies or storage. | M        | R1      |
| FR-PREV-04 | The preview shall support selected library presets, including common web frameworks and styling libraries.                               | S        | R1      |
| FR-PREV-05 | Console output and uncaught runtime errors shall be available in a preview console.                                                      | S        | R1      |
| FR-PREV-06 | Users should be able to open a preview in a separate tab or share a read-only preview link.                                              | S        | R2      |
| FR-PREV-07 | The system could provide responsive device frames and screenshot capture.                                                                | C        | R2      |

### 5.5 Chat, Audio, Video, and Screen Sharing

| ID         | Requirement                                                                                                       | Priority | Release |
| ---------- | ----------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| FR-COMM-01 | Room chat shall support plain text, Markdown, code blocks, message history, and basic reactions.                  | M        | R1      |
| FR-COMM-02 | Chat shall support participant mentions and reply-to-message references.                                          | S        | R1      |
| FR-COMM-03 | The system shall provide group voice and video calling where browser permissions and provider availability allow. | M        | R1      |
| FR-COMM-04 | Participants shall be able to mute/unmute microphones and enable/disable cameras with visible status indicators.  | M        | R1      |
| FR-COMM-05 | Participants shall be able to share a browser tab, application window, or screen, subject to browser support.     | M        | R1      |
| FR-COMM-06 | The default policy shall permit one active screen presenter at a time, with host override.                        | S        | R1      |
| FR-COMM-07 | Calls shall adapt media quality to available bandwidth and attempt reconnection after temporary disruptions.      | M        | R1      |
| FR-COMM-08 | The interface shall offer a compact call layout and a participant grid or sidebar.                                | S        | R1      |
| FR-COMM-09 | Quick reactions such as raise hand or “stuck” should be visible to other participants.                            | S        | R1      |
| FR-COMM-10 | If media permission or connectivity fails, code synchronization and text chat shall remain usable.                | M        | R1      |
| FR-COMM-11 | Optional captions, background effects, and noise suppression may be introduced in later releases.                 | C        | R3      |

### 5.6 Shared Notepad and Whiteboard

| ID          | Requirement                                                                                                                  | Priority | Release |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| FR-BOARD-01 | Each room shall provide a shared Markdown-capable notepad with real-time synchronization.                                    | M        | R1      |
| FR-BOARD-02 | The notepad shall support headings, lists, links, code blocks, and standard Markdown export.                                 | M        | R1      |
| FR-BOARD-03 | Notepad content shall be synchronized separately from code buffers so document editing does not interfere with source files. | M        | R1      |
| FR-BOARD-04 | Users shall be able to export notes as Markdown or plain text.                                                               | M        | R1      |
| FR-BOARD-05 | The system should provide a shared whiteboard with drawing, text, shapes, arrows, and sticky notes.                          | S        | R2      |
| FR-BOARD-06 | Whiteboard content should support export to common image or vector formats.                                                  | S        | R2      |
| FR-BOARD-07 | The system could support rendered Mermaid diagrams and linked code snippets in notes.                                        | C        | R2/R3   |

### 5.7 Pairly Agent — AI Pair Programmer

| ID       | Requirement                                                                                                                                                                    | Priority | Release |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------- |
| FR-AI-01 | The AI assistant shall be represented as a shared room participant or clearly visible shared assistant panel.                                                                  | M        | R1      |
| FR-AI-02 | Users shall invoke AI through the assistant panel, selected code actions, or a room mention/command.                                                                           | M        | R1      |
| FR-AI-03 | Core actions shall include code explanation, bug analysis, refactoring, test generation, documentation, code generation, and error explanation.                                | M        | R1      |
| FR-AI-04 | Proposed code modifications shall be displayed as reviewable diffs before application.                                                                                         | M        | R1      |
| FR-AI-05 | Authorized participants shall be able to inspect, accept, reject, or edit a proposal according to room permissions.                                                            | M        | R1      |
| FR-AI-06 | AI responses shall stream to room participants who have permission to view them.                                                                                               | M        | R1      |
| FR-AI-07 | The context interface shall clearly identify which files, selections, terminal output, or chat context will be sent to the AI service.                                         | M        | R1      |
| FR-AI-08 | The system shall detect when a proposal was generated from a stale document version and require review or rebasing before applying it.                                         | M        | R1      |
| FR-AI-09 | The system shall provide an “Explain and fix” action for eligible execution errors, returning a reviewable patch rather than silently changing files.                          | M        | R1      |
| FR-AI-10 | Hosts shall be able to disable AI in a room, including interview or assessment rooms.                                                                                          | M        | R1      |
| FR-AI-11 | AI activity shall be labeled and recorded in a room audit trail with actor, time, action, and usage metadata subject to privacy policy.                                        | M        | R1      |
| FR-AI-12 | The AI service shall apply per-user or per-room quotas and provide clear feedback when a limit is reached.                                                                     | M        | R1      |
| FR-AI-13 | The system should support model routing, provider fallback, and configurable model tiers.                                                                                      | S        | R2      |
| FR-AI-14 | Users should be able to supply their own provider key; such keys must be encrypted and accessible only to the key owner and authorized server processes.                       | S        | R2      |
| FR-AI-15 | With explicit host permission, AI tools may search the workspace, inspect terminal output, and run bounded commands. Tool activity must be visible and subject to step limits. | S        | R2      |
| FR-AI-16 | The system should generate a session summary containing key changes, decisions, and follow-up tasks.                                                                           | S        | R2      |
| FR-AI-17 | The system could support learning-oriented hints, change explanations, and richer agent workflows.                                                                             | C        | R2      |

### 5.8 Session History, Snapshots, and Replay

| ID         | Requirement                                                                                                                                | Priority | Release |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------- |
| FR-HIST-01 | The system shall create named checkpoints and periodic workspace snapshots.                                                                | M        | R1      |
| FR-HIST-02 | Authorized users shall be able to inspect and restore eligible previous workspace versions.                                                | M        | R1      |
| FR-HIST-03 | The system should record a configurable event stream for replay, subject to host consent and retention settings.                           | S        | R2      |
| FR-HIST-04 | Replay should support play/pause, timeline scrubbing, playback speed, event navigation, and file-diff inspection.                          | S        | R2      |
| FR-HIST-05 | Replay should be searchable by text, file, participant, or event type where retained data supports it.                                     | S        | R2      |
| FR-HIST-06 | Users should be able to annotate a session timeline and share a replay through a permissioned link.                                        | S        | R2      |
| FR-HIST-07 | If recording or replay capture is active, the interface shall show a persistent indicator and record required consent.                     | M        | R2      |
| FR-HIST-08 | Audio/video call recording is not required for the MVP and shall require separate consent and a documented retention policy if introduced. | M        | R3      |

### 5.9 GitHub and File Integrations

| ID        | Requirement                                                                                                                  | Priority | Release |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| FR-INT-01 | Registered users shall be able to connect a GitHub account through an authorized OAuth or GitHub App flow.                   | M        | R1      |
| FR-INT-02 | Authorized users shall browse repositories and branches and import a repository or selected subdirectory into a room.        | M        | R1      |
| FR-INT-03 | Users shall be able to import from and export to ZIP.                                                                        | M        | R1      |
| FR-INT-04 | Users should be able to stage changes, commit with a message, and push to a selected branch.                                 | S        | R2      |
| FR-INT-05 | Before pushing, the system shall detect when the remote branch has changed and show an appropriate conflict or review flow.  | S        | R2      |
| FR-INT-06 | Users should be able to create a pull request from a room.                                                                   | S        | R2      |
| FR-INT-07 | The system could support Gists, public embeds, additional repository providers, and a public API/webhooks in later releases. | C        | R3      |

### 5.10 Interview and Classroom Modes

| ID         | Requirement                                                                                                                                                            | Priority | Release |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| FR-MODE-01 | A host shall be able to create an interview room with candidate and interviewer roles.                                                                                 | M        | R2      |
| FR-MODE-02 | Interview rooms shall support a timer and a problem statement panel.                                                                                                   | M        | R2      |
| FR-MODE-03 | Interviewer-only notes and evaluation rubrics shall not be visible to candidates.                                                                                      | M        | R2      |
| FR-MODE-04 | Interview rubrics shall support criteria, scores, and comments and shall be exportable in a documented format.                                                         | S        | R2      |
| FR-MODE-05 | Interviewers shall be able to configure whether AI assistance and code execution are enabled.                                                                          | M        | R2      |
| FR-MODE-06 | Any activity monitoring used during interviews shall be disclosed, proportionate, and presented as informational evidence rather than an automatic misconduct finding. | M        | R2      |
| FR-MODE-07 | Candidate participation shall not require account creation unless the host explicitly configures otherwise.                                                            | M        | R2      |
| FR-MODE-08 | Classroom mode should allow an instructor to view participant editors, broadcast a file, and spotlight a learner.                                                      | S        | R3      |
| FR-MODE-09 | The system could support question libraries, test cases, automatic grading, and hiring-system integrations.                                                            | C        | R3      |

### 5.11 Accounts, Teams, and Billing

| ID         | Requirement                                                                                                                  | Priority | Release |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| FR-ACCT-01 | The system shall support optional account registration using email-based sign-in and at least one OAuth provider.            | M        | R1      |
| FR-ACCT-02 | The system should support passkeys and additional OAuth providers.                                                           | S        | R2      |
| FR-ACCT-03 | Users shall manage their profile, avatar, editor preferences, connected accounts, and active sessions.                       | M        | R1      |
| FR-ACCT-04 | Users shall be able to export their personal data and request account deletion.                                              | M        | R1      |
| FR-ACCT-05 | Team workspaces, invitations, and team-level roles should be supported.                                                      | S        | R2      |
| FR-ACCT-06 | Subscription management shall support defined plans, usage limits, and a self-service billing portal when paid plans launch. | M        | R2      |
| FR-ACCT-07 | Usage dashboards should report relevant room, AI, and execution consumption.                                                 | S        | R2      |
| FR-ACCT-08 | Enterprise SSO, automated provisioning, and detailed team audit exports may be added at scale.                               | C        | R3      |

### 5.12 Administration and Operations

| ID          | Requirement                                                                                                       | Priority | Release |
| ----------- | ----------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| FR-ADMIN-01 | The platform shall provide a mechanism to report abuse from a room.                                               | M        | R1      |
| FR-ADMIN-02 | Authorized administrators shall be able to review abuse reports and suspend abusive sessions or accounts.         | M        | R2      |
| FR-ADMIN-03 | Administrators should be able to manage feature flags and staged rollouts without a full application release.     | S        | R1      |
| FR-ADMIN-04 | The system shall collect privacy-conscious product analytics for essential funnel and feature usage measurements. | S        | R1      |
| FR-ADMIN-05 | The platform should provide a public status page and incident history.                                            | S        | R2      |
| FR-ADMIN-06 | Administrative actions affecting users or data shall be logged and access-controlled.                             | M        | R1      |

### 5.13 User Experience and Accessibility

| ID       | Requirement                                                                                                                                              | Priority | Release |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| FR-UX-01 | The landing page shall present a clear “Start a room” action without requiring the user to search for it.                                                | M        | R1      |
| FR-UX-02 | The room interface shall provide resizable panels for editor, files, terminal, preview, chat, AI, notes, and participants as supported by viewport size. | M        | R1      |
| FR-UX-03 | The interface shall provide light, dark, and system theme options.                                                                                       | M        | R1      |
| FR-UX-04 | Keyboard navigation and accessible labels shall be provided for core workflows.                                                                          | M        | R1      |
| FR-UX-05 | Connection state, reconnection progress, and save/synchronization status shall be visible.                                                               | M        | R1      |
| FR-UX-06 | The system should provide a skippable onboarding tour or sample room.                                                                                    | S        | R1      |
| FR-UX-07 | A command palette should make key actions discoverable from the keyboard.                                                                                | S        | R1      |
| FR-UX-08 | Interface text shall be designed for localization; English shall be the launch language.                                                                 | S        | R2      |

## 6. External Interface Requirements

### 6.1 User Interface Areas

- **Landing page:** product explanation, primary room-creation action, key capabilities, use cases, pricing when available, and documentation.
- **Room workspace:** file explorer, editor tabs, participant presence, chat, AI panel, notepad, call controls, terminal, preview, and room settings.
- **Dashboard:** recent and saved rooms, profile, integrations, usage, team settings, and billing as applicable.
- **Interview workspace:** candidate editor, problem statement, timer, and interviewer-only evaluation tools.
- **Replay viewer:** timeline, event navigation, file diffs, annotations, and session summary where available.
- **Administration:** abuse reports, moderation, feature flags, service health, and audit records.

### 6.2 Software Interfaces

| Interface              | Protocol                          | Purpose                                                      |
| ---------------------- | --------------------------------- | ------------------------------------------------------------ |
| Application API        | HTTPS, JSON, versioned routes     | Rooms, accounts, settings, integrations, billing             |
| Real-time room channel | WebSocket                         | CRDT updates, presence, chat, terminal events, room controls |
| Media                  | WebRTC with secure signaling      | Voice, video, screen sharing                                 |
| Repository provider    | HTTPS REST/GraphQL and OAuth      | Repository browsing, import, commit, push, pull requests     |
| AI gateway             | HTTPS streaming                   | AI requests, token streaming, proposals                      |
| Execution runner       | Internal authenticated API or RPC | Run code, provide stdin, stream output, terminate jobs       |
| Email provider         | HTTPS API                         | Sign-in links and optional notifications                     |
| Payment provider       | HTTPS API and signed webhooks     | Subscription and usage billing                               |

### 6.3 Event Contract Requirements

- Every event shall have a documented type, required fields, authorization rule, and versioning strategy.
- Incoming messages shall be schema-validated and size-limited.
- The server shall reject events that the sender’s role is not permitted to perform.
- The client shall handle unknown event types safely and display recoverable errors where appropriate.
- Example event families include `presence.update`, `chat.send`, `run.start`, `run.output`, `ai.invoke`, `ai.proposal`, `role.set`, and `room.error`.

### 6.4 API Principles

- API routes shall be versioned before public release.
- Authentication and authorization shall be applied server-side, not solely in the UI.
- Rate limits, pagination, idempotency where appropriate, and structured error responses shall be documented.
- Public API and webhook access are planned for a later release and are not a prerequisite for the MVP.

## 7. Non-Functional Requirements

### 7.1 Performance

| ID          | Requirement                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-PERF-01 | Under normal same-region broadband conditions, edit propagation should achieve p50 ≤ 60 ms and p95 ≤ 150 ms.                               |
| NFR-PERF-02 | For workspaces up to 5 MB, room joining should achieve p50 ≤ 1.5 seconds and p95 ≤ 3 seconds from successful navigation to editable state. |
| NFR-PERF-03 | The landing page shall target LCP ≤ 2.0 seconds, INP ≤ 200 ms, and CLS ≤ 0.1 at the 75th percentile on representative devices.             |
| NFR-PERF-04 | Heavy workspace modules shall be loaded on demand where practical to limit initial page payload.                                           |
| NFR-PERF-05 | Code execution startup targets shall be measured separately for cold and warm starts and documented by language/runtime.                   |
| NFR-PERF-06 | The editor should remain responsive for files up to 1 MB under the supported participant and collaboration load.                           |
| NFR-PERF-07 | Performance objectives shall be verified using representative multi-client tests and production telemetry.                                 |

### 7.2 Scalability and Capacity

| ID           | Requirement                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| NFR-SCALE-01 | Room state shall be partitioned so that activity in one room does not block unrelated rooms.                                     |
| NFR-SCALE-02 | Execution, AI, and media services shall use independent quotas and capacity controls.                                            |
| NFR-SCALE-03 | The service shall define and enforce maximum file size, message size, room participants, execution duration, and stored history. |
| NFR-SCALE-04 | Capacity tests shall model bursts of room creation, simultaneous edits, execution requests, and media sessions.                  |
| NFR-SCALE-05 | The system shall support horizontal scaling of stateless API and worker components where applicable.                             |

### 7.3 Reliability and Availability

| ID         | Requirement                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-REL-01 | Temporary client disconnections shall trigger reconnection and state reconciliation without silently discarding confirmed edits.                                                     |
| NFR-REL-02 | Persisted snapshots shall allow recovery of eligible room state after coordinator restart or infrastructure failure.                                                                 |
| NFR-REL-03 | Failures in AI, video, or preview services shall not unnecessarily disable core editing and text chat.                                                                               |
| NFR-REL-04 | A production availability target shall be established and monitored before public launch; the initial target is 99.5% or better, with higher targets evaluated as operations mature. |
| NFR-REL-05 | Deployments shall support health checks, rollback, and documented incident response procedures.                                                                                      |
| NFR-REL-06 | Backups and restoration procedures shall be tested periodically.                                                                                                                     |

### 7.4 Security

| ID         | Requirement                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-SEC-01 | Application traffic shall use HTTPS and WSS; media shall use WebRTC security mechanisms such as DTLS-SRTP.                             |
| NFR-SEC-02 | Room URLs and access tokens shall use cryptographically secure randomness and appropriate expiry and scope.                            |
| NFR-SEC-03 | Authorization shall be enforced on the server for room joining, editing, execution, AI tools, moderation, and data export.             |
| NFR-SEC-04 | User code shall execute in isolated sandboxes with strict resource controls and no network access by default.                          |
| NFR-SEC-05 | Preview content shall be isolated from the main application origin and protected by restrictive sandbox and content security policies. |
| NFR-SEC-06 | Secrets shall not be included in client bundles, browser logs, terminal output, AI context, or broadcasts.                             |
| NFR-SEC-07 | Dependencies and build artifacts shall be scanned for known vulnerabilities in CI.                                                     |
| NFR-SEC-08 | Administrative and privileged actions shall be auditable.                                                                              |

### 7.5 Privacy and Data Protection

| ID          | Requirement                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| NFR-PRIV-01 | The system shall disclose what information is shared with room participants and external AI or integration providers.           |
| NFR-PRIV-02 | AI context shall be limited to the information necessary for the selected action and visible to the requesting user.            |
| NFR-PRIV-03 | Session recording and replay shall use clear consent and visible recording indicators where required.                           |
| NFR-PRIV-04 | Retention periods shall be defined for room metadata, chat, terminal output, snapshots, replay events, logs, and exports.       |
| NFR-PRIV-05 | Users shall be able to export eligible personal data and request account deletion.                                              |
| NFR-PRIV-06 | Operational logs shall avoid storing source code, credentials, and sensitive content unless explicitly necessary and protected. |
| NFR-PRIV-07 | Applicable privacy and data-protection obligations shall be assessed before launch in each target market.                       |

### 7.6 Usability and Accessibility

| ID        | Requirement                                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| NFR-UX-01 | Core workflows shall be testable without a mouse, including room creation, joining, editing, chat, and basic settings.              |
| NFR-UX-02 | Interactive controls shall have accessible names, focus indicators, and understandable error messages.                              |
| NFR-UX-03 | Color shall not be the sole means of communicating participant identity or status.                                                  |
| NFR-UX-04 | The interface should meet WCAG 2.2 AA for core workflows, subject to editor and third-party component limitations being documented. |
| NFR-UX-05 | Motion and animation shall respect reduced-motion preferences.                                                                      |
| NFR-UX-06 | Layouts shall adapt to supported desktop, tablet, and mobile viewports.                                                             |

### 7.7 Compatibility and Maintainability

| ID           | Requirement                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------- |
| NFR-MAINT-01 | Shared API and event contracts shall be typed, versioned, and validated at runtime.               |
| NFR-MAINT-02 | The codebase shall enforce formatting, linting, type checking, and automated tests in CI.         |
| NFR-MAINT-03 | Core providers such as AI, media, and execution shall be accessed through replaceable interfaces. |
| NFR-MAINT-04 | Major architectural decisions, operational limits, and deployment steps shall be documented.      |
| NFR-MAINT-05 | Production changes shall pass required automated checks before deployment.                        |

### 7.8 Observability and Cost Controls

| ID          | Requirement                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| NFR-OBS-01  | The system shall collect service health, latency, error rate, queue depth, execution usage, and AI usage metrics.                   |
| NFR-OBS-02  | Logs shall use structured fields and correlation identifiers while minimizing sensitive data.                                       |
| NFR-OBS-03  | Alerts shall cover significant outages, abnormal error rates, capacity saturation, and suspicious usage.                            |
| NFR-COST-01 | Execution, AI, storage, and media consumption shall be metered against configured quotas.                                           |
| NFR-COST-02 | The platform shall provide operational limits and cost dashboards sufficient to identify abnormal per-room or per-user consumption. |
| NFR-COST-03 | Idle rooms should release active compute resources after state is safely persisted.                                                 |

## 8. Data Requirements

### 8.1 Core Entities

| Entity                      | Principal data                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| User                        | ID, profile, authentication references, preferences, creation and deletion state         |
| Team                        | ID, name, members, roles, billing and policy settings                                    |
| Room                        | ID, access settings, owner, mode, expiry, participant limits, lifecycle status           |
| Room participant            | Room ID, identity, role, join/leave times, moderation state                              |
| Workspace                   | Room/project ID, file tree, file metadata, current document state                        |
| Document update / snapshot  | Workspace reference, update data, version metadata, timestamps                           |
| Chat message                | Room ID, sender, content, reply reference, timestamp                                     |
| Execution run               | Room ID, requester, language/runtime, status, resource usage, output reference           |
| AI invocation               | Requester, action, disclosed context references, provider/model metadata, usage, outcome |
| AI proposal                 | Base document version, proposed diff, status, decision history                           |
| Session event               | Event type, actor, timestamp, event payload subject to retention policy                  |
| Integration                 | Provider, owner, granted scopes, encrypted credential reference, status                  |
| Subscription / usage record | Account or team, plan, metered usage, billing state                                      |
| Audit event                 | Actor, action, target, timestamp, outcome                                                |

### 8.2 Data Integrity

- Every persistent record shall have a stable identifier and relevant timestamps.
- Access to records shall be scoped to the owner, team, or room permissions.
- Document snapshots shall be associated with a version or state identifier.
- Deletion shall remove or make inaccessible associated data according to documented retention and backup policies.
- Sensitive credentials shall be stored separately from ordinary room content.

### 8.3 Retention and Deletion

- Guest rooms shall have a defined default expiry and a visible notice of that expiry.
- Registered users may receive longer retention according to the selected plan.
- Terminal output, chat, AI logs, replay events, and snapshots shall have documented retention limits.
- Users shall be informed before enabling session recording.
- Account deletion shall trigger removal or anonymization of eligible data, subject to legal, security, billing, and backup retention obligations.
- Exact retention durations shall be finalized before public launch and reflected in the privacy notice.

## 9. Security, Privacy, and Abuse Prevention

### 9.1 Threat Areas

The security design shall consider unauthorized room access, room-link leakage, privilege escalation, malicious code execution, preview-origin escape, secret disclosure, AI prompt injection, spam, denial of service, abuse of paid resources, and unauthorized access to recordings or exports.

### 9.2 Mandatory Controls

| ID     | Control                                                                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SEC-01 | Validate and authorize every sensitive request and room event on the server.                                                                                       |
| SEC-02 | Apply rate limits to room creation, joining, chat, execution, AI requests, authentication, and exports.                                                            |
| SEC-03 | Use short-lived, scoped tokens for guest access and privileged operations.                                                                                         |
| SEC-04 | Apply CPU, memory, disk, process, time, and output limits to execution sandboxes.                                                                                  |
| SEC-05 | Disable outbound sandbox networking by default and require explicit policy for any later exception.                                                                |
| SEC-06 | Isolate preview content and prevent it from accessing application cookies, storage, and privileged APIs.                                                           |
| SEC-07 | Treat files, terminal output, chat, and repository content as untrusted input to AI. Such content shall not override system policy or grant tools new permissions. |
| SEC-08 | Require explicit authorization and visible bounded execution for AI tools that can run commands or modify files.                                                   |
| SEC-09 | Encrypt sensitive credentials at rest and use transport encryption in transit.                                                                                     |
| SEC-10 | Record moderation and privileged administrative actions in protected audit logs.                                                                                   |
| SEC-11 | Provide abuse reporting, moderation procedures, and emergency controls to disable affected capabilities.                                                           |
| SEC-12 | Conduct threat modeling and security testing before public release and after major execution or authentication changes.                                            |

## 10. Business and Usage Model

### 10.1 Proposed Plans

Pricing and quotas are product decisions to validate; the SRS does not fix final prices.

| Plan concept | Intended audience                                  | Potential limits and capabilities                                                      |
| ------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Free         | Individuals, learners, occasional pair programming | Guest rooms, basic collaboration, capped execution and AI usage                        |
| Pro          | Frequent individual developers and interviewers    | Higher quotas, longer retention, advanced history, additional AI/execution usage       |
| Team         | Engineering teams and education groups             | Shared workspaces, team administration, centralized billing, higher participant limits |
| Enterprise   | Larger organizations                               | SSO, policy controls, audit features, negotiated capacity and support                  |

### 10.2 Potential Revenue Streams

- Individual and team subscriptions.
- Metered AI and execution usage.
- Interview credits or interview-focused plans.
- Education and organizational licenses.
- Additional storage and advanced collaboration features where justified.

### 10.3 Product Growth Approach

The initial product should emphasize link-based collaboration, dependable real-time editing, a shared terminal, preview, communication, and transparent AI proposals. Later releases can expand retention and monetization through replay, interview workflows, team administration, and enterprise controls.

## 11. Release Plan

### R0 — Foundations

- Repository and application structure, design system, shared contracts, CI/CD.
- Guest identity and account foundation.
- Room coordination and CRDT synchronization.
- Initial persistence, logging, and deployment environments.

### R1 — MVP / Public Beta

- Guest room creation, shareable links, roles, and host controls.
- Multi-file collaborative editor, presence, and follow mode.
- Shared chat and Markdown notepad.
- Sandboxed execution and shared terminal.
- Sandboxed live web preview.
- Voice/video and screen sharing.
- Core AI actions with visible context and reviewable proposals.
- ZIP import/export, GitHub repository import, and workspace snapshots.
- Account settings, core analytics, abuse reporting, security review, and operational monitoring.

### R2 — Growth

- Session replay, annotations, and session summaries.
- Interview mode, rubrics, and interviewer-only notes.
- Team workspaces, billing, usage dashboards, and advanced repository workflows.
- Whiteboard, code comments, BYOK, AI tool use, and expanded templates.
- Improved language intelligence and localization foundations.

### R3 — Scale

- Classroom mode and larger managed sessions.
- Public API, webhooks, and additional integrations.
- Enterprise SSO and provisioning.
- Long-running development server sessions where safe and economically viable.
- Advanced replay, captions, additional repository providers, and extension ecosystem if justified.

### 11.1 MVP Definition of Done

The MVP is acceptable when:

1. A guest can create a room, share a link, and collaborate with at least one other participant without mandatory registration.
2. Multiple participants can edit files concurrently and converge to the same document state.
3. Users can run supported code in an isolated environment and see shared output.
4. Web preview refreshes safely after source changes.
5. Participants can communicate by chat and supported real-time media.
6. AI can explain or propose a fix, show the proposed diff, and require explicit acceptance before applying changes.
7. Workspace export and recovery from a saved snapshot work.
8. Core flows pass functional, accessibility, security, and multi-client tests.
9. Monitoring, incident response, quota enforcement, and rollback procedures are operational.

## 12. Risks and Mitigations

| ID     | Risk                                             | Impact      | Mitigation                                                                                           |
| ------ | ------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------- |
| RSK-01 | Sandbox escape or malicious execution            | Critical    | Strong isolation, no network by default, strict quotas, security testing, emergency disable controls |
| RSK-02 | Execution or media costs exceed revenue          | High        | Plan quotas, metering, capacity limits, caching, budget alerts, gradual rollout                      |
| RSK-03 | AI hallucinations or incorrect patches           | High        | Diff-based review, stale-version checks, explicit acceptance, user-facing limitations                |
| RSK-04 | AI context leaks sensitive code or secrets       | High        | Context disclosure, minimization, secret filtering, provider controls, no silent uploads             |
| RSK-05 | Realtime state corruption or data loss           | High        | CRDT synchronization, snapshots, recovery tests, retention controls                                  |
| RSK-06 | Third-party provider outage                      | Medium/High | Provider abstractions, graceful degradation, timeouts, fallback where supported                      |
| RSK-07 | Abuse of guest rooms or public execution         | High        | Rate limits, quotas, moderation, expiring links, abuse reporting                                     |
| RSK-08 | Scope too broad for initial delivery             | High        | Release priorities, MVP definition of done, feature flags, staged delivery                           |
| RSK-09 | Accessibility gaps in editor or media components | Medium      | Accessibility testing, keyboard alternatives, documented limitations, iterative remediation          |
| RSK-10 | Privacy concerns about replay or interviews      | High        | Clear consent, visible indicators, restricted access, defined retention, deletion workflow           |

## 13. Verification and Acceptance Criteria

### 13.1 Verification Methods

- **Inspection:** verify UI states, permission rules, configuration, and documentation.
- **Unit testing:** validate pure logic, schemas, state transitions, and permission checks.
- **Integration testing:** validate database, execution, AI, media, and repository-provider contracts.
- **End-to-end testing:** validate full workflows in multiple browser contexts.
- **Load testing:** measure synchronization, room capacity, execution queue behavior, and service degradation.
- **Security testing:** test authentication, authorization, sandbox isolation, secret handling, rate limiting, and preview isolation.
- **Accessibility testing:** test keyboard navigation, screen-reader labels, contrast, focus management, and responsive layouts.

### 13.2 Acceptance Test Scenarios

**AT-01 — Guest room creation**

- Given a visitor on the Pairly landing page, when they select “Start a room,” then a room is created and an invitation link is provided without mandatory registration.

**AT-02 — Concurrent editing**

- Given two authorized participants in the same room, when both edit the same document concurrently, then both clients converge to the same content without silent loss of confirmed edits.

**AT-03 — Permission enforcement**

- Given a participant with Viewer role, when they attempt a write or execution action, then the server rejects the unauthorized action and the workspace remains unchanged.

**AT-04 — Shared execution**

- Given authorized participants and a supported program, when one participant runs the program, then output, error output, status, and exit code are shown to permitted room participants.

**AT-05 — Execution isolation**

- Given a program that exceeds configured limits, when it runs, then the execution service terminates it within the applicable enforcement window and does not affect other rooms.

**AT-06 — Live preview isolation**

- Given a preview containing untrusted scripts, when the preview is rendered, then it cannot access Pairly session cookies or privileged application storage.

**AT-07 — AI proposal review**

- Given an AI-generated code change, when the response completes, then the user sees a diff and the workspace is not modified until an authorized participant accepts the proposal.

**AT-08 — Stale AI proposal**

- Given that a source file changes after an AI request begins, when the proposal is returned, then the system identifies the stale base version and prevents silent application.

**AT-09 — Media degradation**

- Given that camera permission is denied or media connectivity fails, then collaborative editing and text chat remain available.

**AT-10 — Workspace recovery**

- Given a persisted snapshot, when an authorized user restores it, then the workspace returns to the selected state and the restore action is recorded where required.

**AT-11 — Data export and deletion**

- Given an authenticated user, when they request an eligible data export or account deletion, then the system verifies the request, processes it according to policy, and reports its status.

**AT-12 — Interview privacy**

- Given an interview room, when the interviewer creates private notes or rubric scores, then those records are inaccessible to the candidate.

### 13.3 Traceability

Every Must requirement shall map to at least one test case, inspection checklist, or other verification artifact before its release is accepted. Requirements deferred to R2 or R3 shall be tracked in the product backlog with explicit priority and release labels.

## 14. Appendices

### 14.1 Suggested Repository Structure

```text
pairly/
├── apps/
│   ├── web/                 # Next.js application and API routes
│   └── realtime/            # Room coordination and WebSocket handling
├── packages/
│   ├── contracts/           # Shared schemas and event types
│   ├── ui/                  # Shared design system
│   ├── collaboration/       # CRDT utilities and adapters
│   └── config/              # Shared tooling configuration
├── services/
│   ├── execution/           # Isolated code execution interface
│   └── ai-gateway/          # AI routing, context, quotas, and proposals
├── tests/
│   ├── integration/
│   ├── e2e/
│   ├── security/
│   └── load/
├── docs/
│   ├── adr/                 # Architecture decision records
│   ├── operations/
│   └── security/
└── pnpm-workspace.yaml
```

### 14.2 Initial Language Support

The MVP target is at least 20 executable languages, subject to runner availability, runtime versions, and safe resource profiles. The launch list should prioritize JavaScript/TypeScript, Python, Java, C, C++, C#, Go, Rust, PHP, Ruby, Kotlin, Swift, SQL, and other runtimes confirmed by integration testing. Syntax highlighting should support at least 40 languages. The final supported-language matrix shall be published and tested rather than inferred from a provider’s general claims.

### 14.3 Open Decisions

The following decisions shall be resolved and recorded before the relevant capability is released:

1. Final hosting, persistence, and execution providers.
2. Exact guest-room expiry and registered-user retention periods.
3. Supported languages and per-plan execution limits.
4. AI providers, default models, context limits, and data-processing terms.
5. Media provider, participant limits, and recording policy.
6. Final subscription prices, quotas, and overage behavior.
7. Exact service-level objective and incident-response ownership.
8. Applicable privacy and data residency requirements for target markets.

### 14.4 Glossary of Interaction Terms

- **Follow mode:** a participant’s editor view tracks another participant’s selected file, cursor, and scroll position.
- **Spotlight mode:** a host directs the room’s attention to a participant or editor view.
- **Proposal:** a suggested code change shown as a diff and not applied until accepted.
- **Snapshot:** a persisted representation of a workspace at a particular state.
- **Room replay:** a reconstruction of selected collaboration events, subject to consent and retention policy.

### 14.5 Revision History

| Version | Date            | Status                | Description                                                                                                                            |
| ------- | --------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 2.0     | 25 October 2026 | Consolidated baseline | Unified product requirements, release priorities, architecture, security, data, and acceptance criteria into one Pairly specification. |

---

**End of document**
