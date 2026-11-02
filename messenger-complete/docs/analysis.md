# Messenger - Diagrams and Analysis

This analysis uses the eight functional requirements in `docs/requirements.md`. Both models support private and group text messaging with fixed membership and manual refresh. They are proposed design models, not evidence of completed implementation.

## 1. Data Flow Diagram

**What is this diagram intended to answer?**

Where does message information come from, how is it processed, where is it stored, and who can retrieve it?

The diagram shows how Messenger checks user access, validates and stores messages, and retrieves conversation history.

**Source:** [data-flow.puml](diagrams/data-flow.puml)

**How to read it:** The external rectangle represents the user, ellipses labeled process represent transformations (P), cylinders represent data stores where databases is stored (D), and labeled arrows represent data flows. PlantUML shapes are used to express a logical DFD, not a UML use case diagram. The arrows describe information movement, not the timing of operations.

**Scope:** This DFD covers sending and retrieving messages in existing private or group conversations. Registration, login/logout, and conversation creation are outside this model's slice; they provide the session and participant records used here. A logged-out or invalid session must not authorize access.

**Requirements:** FR-06 (nonblank messages), FR-07 (ordered history), FR-08 (participant-only access), and NFR-02 (saved messages).

**Responsibility revealed:** P1 checks the session and conversation membership before passing an authorized request to P2 or P3. P2 validates message text and stores it; P3 retrieves and orders history. The sender identity comes from the validated session. Users never access a data store directly. D1-D3 are logical data collections, not a commitment to three separate database products.

**Question revealed:** FR-07 does not specify whether a refresh loads all history or only a limited portion. Growing history could affect NFR-03's response-time target. The client and developer should decide on history limits or pagination before implementation and update FR-07 and its tests if necessary. Pagination is not assumed in this baseline.

## 2. Sequence Diagram

**What is this diagram intended to answer?**

Who interacts with whom when sending a message, in what order, and what happens if the request or storage operation fails?

The diagram shows the sender, messaging service, and data store exchanging requests and responses, including access denial, blank-message rejection, and successful or failed storage.

**Source:** [sequence.puml](diagrams/sequence.puml)

**Assumption:** The user has already registered and has a valid account in system.

**Scenario:** An existing conversation participant sends a message. The same interaction applies to private and group conversations. The data-store participant represents the logical records shown separately in the DFD.

**Requirements:** FR-06 (message validation), FR-08 (authentication and membership), and NFR-02 (persistence). FR-07 explains the later refresh, which is outside this send scenario.

**Responsibility revealed:** The messaging service validates the session, checks membership, and rejects blank text before saving. It uses the authenticated user's identity as the sender. A successful response follows confirmation that the message was saved. A known storage failure returns an error. Enforcement belongs in the service even when a request bypasses the normal interface.

**Question revealed:** A message might be saved but its confirmation lost because of a connection failure. The requirements do not define whether a user's retry should create a duplicate. The client and developer should decide the retry behavior and add a requirement and acceptance criterion if duplicate prevention is needed. This diagram's storage-failure path covers a known failure before saving; it does not resolve uncertain timeout outcomes.

## 3. Consistency and Traceability

| Model element | Requirements | Related acceptance evidence |
| --- | --- | --- |
| P1 and the sequence access check | FR-08 | AC-06: deny unauthenticated and nonparticipant requests. |
| P2 and the sequence message-validation path | FR-06 | AC-03 and AC-04: private/group sending; AC-03 also checks blank-message rejection. |
| P3 and D3 | FR-07, NFR-02 | AC-05: ordered history, sender/time, and persistence after restart. |
| Sequence save and confirmation | FR-06, NFR-02 | AC-03/AC-04: accepted messages are retrievable; AC-05: restart persistence. |

Neither model introduces live delivery, membership changes, attachments, or message deletion. A storage symbol alone does not prove persistence: AC-05 must still be executed. The history and retry questions remain unresolved.