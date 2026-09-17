import {env,rpc} from '../_shared/server.ts';
import {handleReceipt} from '../../../shared/receipt-handler.ts';
Deno.serve(req=>handleReceipt(req,{
 enabled:env('NOTIFICATION_RECEIPTS_ENABLED')==='true',secret:env('RESEND_WEBHOOK_SECRET'),
 record:receipt=>rpc('thuraya_notification_receipt',{p_provider:receipt.provider,p_event:receipt.eventId,p_message:receipt.messageId,p_state:receipt.state,p_occurred:receipt.occurredAt})
}));
