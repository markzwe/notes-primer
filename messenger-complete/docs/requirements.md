# Requirements

## 1.1 System Context
Messenger is a browser-based application for private text messages and group text discussions. It manages accounts, authentication, conversation membership, message storage and access to saved conversation.

| Actor or external element | Interaction with Messenger                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Visitor                   | Submits registration or login information.                                                                                                |
| Registered user           | Logs in, selects another user, sends messages, views conversation history, and logs out.                                                  |
| Group creator             | Creates a named group and selects its initial members. The creator is also a member and has no special access to unrelated conversations. |
| Desktop browser           | Sends user requests to Messenger and displays responses in the demonstration environment.                                                 |

## 1.2 Functional Requirements

| ID     | Requirement                                                                                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01  | The system shall allow visitors to register using a unique username and a password.                                                                                     |
| FR-02  | The system shall authenticate users only when their username and password match an existing account.                                                                    |
| FR-03  | The system shall invalidate the current session when a user logs out.                                                                                                   |
| FR-04  | The system shall allow an authenticated user to open a private conversation with another registered user selected by username.                                          |
| FR-05  | The system shall allow an authenticated user to create a named group containing the creator and selected registered users, with membership fixed after creation.        |
| FR-06  | The system shall accept only nonblank text messages sent by conversation participants.                                                                                  |
| FR-07  | The system shall display saved conversation messages in acceptance order, including their sender username & date/time, when a participant opens or refreshes the conversation. |
| FR-08  | The system shall restrict reading and sending conversation messages to authenticated participants, including requests made directly to the system.                      |

 

## 1.3 Non functional requirements

| ID     | Requirement                                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-01 | The system shall store passwords as salted, one-way hashes rather than plaintext.                                                          |
| NFR-02 |2 messages shall remain available after logout/login and a normal application restart using the same storage.                       |
| NFR-03 | At least 95 of 100 conversation-refresh requests shall display history within two seconds under the proposed demonstration workload below. |

## 1.4 Acceptance Criteria

| ID    | Requirements  | Expected evidence                                                                                                                                               |
| ----- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | FR-01, FR-02  | A visitor registers with an unused username and can log in. Duplicate usernames create no account; incorrect credentials create no authenticated session.       |
| AC-02 | FR-03         | After logout, requests using the previous session cannot read or send messages.                                                                                 |
| AC-03 | FR-04, FR-06  | Alice opens a private conversation with Bob and sends a message. Bob retrieves it after refresh. Empty and whitespace-only messages are rejected with feedback. |
| AC-04 | FR-05, FR-06  | Alice creates a named group with Bob and Carol. Each member can send messages. Attempts to change membership are rejected.                                      |
| AC-05 | FR-07, NFR-02 | Private and group messages appear in acceptance order with sender and date/time, including after logout/login and an application restart.                       |
| AC-06 | FR-08         | An unauthenticated requester and an authenticated nonparticipant cannot read or send messages through either the interface or direct requests.                  |
| AC-07 | NFR-01        | Implementation and storage inspection confirm salted password hashing and no plaintext password storage.                                                        |
| AC-08 | NFR-03        | A timed test records 100 refresh requests; at least 95 display history within two seconds. Failed requests count as misses.                                     |
## 1.6. Assumptions and Unresolved Questions

- **Scope assumption:** The client accepts text-only messaging, manual refresh, and fixed group membership.
- **Proposed performance workload:** Five logged-in browser sessions on the server’s local network each refresh a 100-message conversation once every five seconds for 20 requests. Record the test hardware and browser versions.
- **Clarification needed:** Confirm username/password rules, minimum group size, message-length limits, and history-retention duration before implementation.

These are proposed decisions and open questions, not confirmed stakeholder answers.
## 1.7. Traceability

| ID | Requirement | Source or rationale | Model link | Acceptance evidence |
| --- | --- | --- | --- | --- |
| FR-01 | Register an account. | SOW section 3: account registration. | Not shown; registration is outside the diagram scope. | AC-01: An unused username creates an account; duplicates are rejected. |
| FR-02 | Authenticate users. | SOW section 3: login. | Not shown; the diagrams use an existing session. | AC-01: Correct credentials allow login; incorrect credentials are rejected. |
| FR-03 | Invalidate the session on logout. | SOW section 3: logout. | Not shown; logout is outside the diagram scope. | AC-02: The previous session cannot read or send messages after logout. |
| FR-04 | Open a private conversation. | Assignment scenario and SOW section 3: private messaging. | Not shown; the sequence assumes an existing conversation. | AC-03: Alice opens a private conversation with Bob and sends a message. |
| FR-05 | Create a group with fixed membership. | Assignment scenario and SOW section 3: group messaging. | Not shown; the diagrams use existing participant records. | AC-04: A group is created with selected users; membership changes are rejected. |
| FR-06 | Accept nonblank messages from participants. | SOW section 3: text messaging and input validation. | [DFD: P2](analysis.md#1-data-flow-diagram); [Sequence: validation and save paths](analysis.md#2-sequence-diagram). | AC-03 and AC-04: Participants send private/group messages; blank messages are rejected under AC-03. |
| FR-07 | Display ordered history with sender and date/time. | SOW section 3: saved history and refresh-based retrieval. | [DFD: P3 and D3](analysis.md#1-data-flow-diagram). | AC-05: History displays messages in acceptance order with sender and date/time. |
| FR-08 | Restrict conversation access to authenticated participants. | SOW sections 3 and 7: participant-only access. | [DFD: P1](analysis.md#1-data-flow-diagram); [Sequence: access check](analysis.md#2-sequence-diagram). | AC-06: Unauthenticated users and nonparticipants cannot read or send messages, including through direct requests. |
| NFR-01 | Store passwords as salted, one-way hashes. | SOW section 7: password protection. | Not shown; password storage is outside the diagram scope. | AC-07: Implementation and storage inspection confirm salted hashing and no plaintext passwords. |
| NFR-02 | Preserve accepted messages after logout/login and restart. | SOW section 7: message persistence. | [DFD: D3](analysis.md#1-data-flow-diagram); [Sequence: save before confirmation](analysis.md#2-sequence-diagram). | AC-05: Messages remain retrievable after logout/login and an application restart. |
| NFR-03 | Meet the proposed history-response target. | Proposed performance target for the demonstration workload. | [DFD: P3](analysis.md#1-data-flow-diagram) identifies the retrieval process; timing requires testing. | AC-08: At least 95 of 100 refresh requests display history within two seconds under the specified workload. |

Model links identify the relevant behavior or design responsibility. Acceptance evidence verifies whether the requirement is satisfied; a diagram alone does not prove correctness, persistence, or performance.