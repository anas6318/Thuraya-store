# WhatsApp

Customer-service links and automated transactional messages are separate features. Configure the business service number in international form. Public links do not contain private order details.

The worker supports official Meta template requests using server-only `WHATSAPP_PROVIDER=meta`, access token, phone-number ID and an explicitly selected supported Graph API version. Configure approved template names for AR, HE and EN. Current body parameter contract is one text parameter: the THURAYA order number.

Enable the channel and template only after approval. Checkout separately asks for WhatsApp updates. Unknown provider outcomes are marked uncertain and require reconciliation; they must not be automatically resent.

Provider webhook delivery/read receipts and complete staging verification remain launch tasks. No WhatsApp messages have been sent. Never substitute personal-account automation.

Owner/admin can now reconcile a held unknown send in Admin using the actual accepted provider message ID after independently checking the provider dashboard. Explicit confirmation and audit logging are required. This records operator-attested acceptance only; it neither resends nor claims delivery/read. Unknown or unaccepted outcomes remain held, and blind retries remain unavailable. An automated receipt endpoint must authenticate raw provider callbacks, correlate the accepted provider message ID, deduplicate event IDs and keep delivered/read state separate from acceptance before it can be enabled. No unauthenticated receipt endpoint exists.

Sending requires checkout WhatsApp consent, any applicable account preference, the enabled global channel, enabled mapped template and server credentials. Account preferred language takes precedence over checkout language. Any uncertain outcome after a Meta send attempt is held for reconciliation, including errors where acceptance cannot safely be excluded. Admin cannot blindly retry held jobs. `sent` records provider acceptance, not delivery/read receipts.
