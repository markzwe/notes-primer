# Ethics Reflection

This reflection considers the Messenger system in the [requirements](requirements.md) and [analysis](analysis.md): a small browser-based demonstration with private and group text messages, saved history, fixed membership, and manual refresh. The impacts below are potential consequences, not measured results. Additional mitigations are proposals unless already covered by a requirement.

## 1. Design Impact Analysis

| Dimension | Potential positive impact | Potential negative impact | Proposed mitigation |
| --- | --- | --- | --- |
| Cultural | People from different backgrounds could share ideas and coordinate group activities. | Unclear wording or poor handling of different writing systems could exclude users or cause misunderstandings. | Use plain interface language and test message display with different writing systems. Translation is not promised by this release. |
| Economic | Group messaging could reduce the effort needed to coordinate shared work. The proposed demonstration uses existing resources without paid services. | Hosting, storage, and maintenance still consume resources; users also need a device and network access. | Keep the demonstration small, document dependencies, and confirm resource costs before expanding access. |
| Environmental | A text-only release avoids the storage and transfer demands of image and video attachments. | Server operation, repeated refresh requests, and growing history consume energy and storage. | Reuse existing equipment, stop the demonstration server when unused, and agree on test-data retention. No measured environmental benefit is claimed. |
| Global | A future deployment could support communication across locations. | Unequal connectivity and language support could exclude users. The current demonstration has no established worldwide reach. | Test on the agreed network, state availability limits, and avoid promising global access or performance without further evaluation. |
| Public health | Small groups could use messages to maintain supportive contact. | Harassment or pressure to keep checking messages could cause distress. A small demonstration is unlikely to have a measurable population-level health impact. | Use voluntary participation and clear conduct expectations. Do not present Messenger as a health-support or crisis-response service. |
| Public safety | Users could coordinate routine plans and share practical information. | Threats, deceptive messages, or accidental sharing of a location could put users at risk. Manual refresh could delay urgent information. | Use fictional demonstration data, explain the limits of privacy, and state that Messenger must not be relied on for emergencies. |
| Public welfare | Shared conversations could help participants access group information. | Users without suitable devices, connectivity, or accessible controls could be excluded. | Keep important demonstration information available outside Messenger and propose keyboard, label, and contrast checks before wider use. Accessibility verification is not yet in the requirements. |
| Social | Private and group conversations could help users maintain relationships and collaborate. | Members could bully others, copy private messages, or add someone to an unwanted group. Fixed membership provides no in-app way to leave. | Obtain agreement before adding demonstration participants, provide an external contact for concerns, and pause the demonstration if abuse occurs. Wider use would require a review of blocking, reporting, and group-exit options. |

## 2. Connections to Engineering

### 2.1 Unauthorized access and persistent personal information

**Who could be affected and how:** Conversation participants could have their messages exposed if a user can access another conversation by changing its identifier. Saved history could also retain personal information longer than users expect, especially because message deletion is outside scope.

**Mitigation and engineering connection:** FR-08 requires participant-only access. The messaging service must check authentication and membership on every read and send request, including direct requests. AC-06 tests this protection. NFR-01 and AC-07 address password storage, but password hashing does not encrypt message content or stop a participant from copying a message.

For the demonstration, I propose fictional messages and test accounts, plus a retention and cleanup policy agreed with the client before use. That policy belongs in the operational guidance and setup/handover documentation. NFR-02 requires persistence through a normal restart; it does not require keeping test data forever. Any new user-facing deletion feature would require an explicit scope and requirements change.

### 2.2 Harassment and unwanted group participation

**Who could be affected and how:** A group member could receive insulting or unwanted messages from another authorized member. Under FR-05, membership stays fixed, so the affected user cannot leave through the application. FR-08 prevents outsiders from entering a conversation but does not prevent harm by its participants.

**Mitigation and engineering connection:** For the limited demonstration, I propose using only consenting participants, sharing conduct rules beforehand, identifying the student developer as an external contact for concerns, and pausing the demonstration when necessary. These are proposed operational policies, not existing moderation features.

Before broader use, the client and developer should reconsider group exit, blocking, or reporting. Allowing a user to leave would require revising FR-05 and AC-04, which currently reject membership changes, and defining access to earlier messages after departure. The revised behavior would also need new tests and updated diagrams. The current scope should not be described as fully addressing harassment.

## AI-Assisted Work

I utilized ChatGPT as an engineering assistant to help draft the Statement of Work, requirements, diagram source code, analysis, and ethics reflection.

**Human Review and Revision**: The most significant human intervention occurred during requirements generation. The initial AI output included excessive feature creep. I manually reviewed the suggestions and enforced strict boundaries, stripping out unnecessary capabilities like profile pictures, date-of-birth tracking, and group ownership transfers. I constrained the final artifact to exactly eight functional and three non-functional requirements to ensure a defensible, focused scope.

**Verification Process**: All AI-generated text and code were audited for hallucinations and scope drift. For the system modeling, I selected PlantUML and required the AI to justify the logical branches in its code and identify the engineering questions the diagrams addressed. This ensured the models were structurally sound, not just visually complete. I assume full responsibility for the contents of this submission and recognize that the documented acceptance criteria serve as a future verification plan, not evidence of a completed software build.