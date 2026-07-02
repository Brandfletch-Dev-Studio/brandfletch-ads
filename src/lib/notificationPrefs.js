/**
 * Shared logic for whether an in-app Notification should be created for a
 * given recipient, based on their "In-App Notifications" preferences
 * (Settings > Notifications). These booleans default to true (opted in)
 * unless the user explicitly turned a category off.
 *
 * IMPORTANT: this only gates in-app Notification records, not emails —
 * emails are a separate concern the settings page never claimed to control.
 */
const TYPE_TO_PREF_KEY = {
  campaign_approved: 'notify_campaign_approved',
  campaign_rejected: 'notify_campaign_rejected',
  changes_requested: 'notify_campaign_rejected',
  campaign_completed: 'notify_campaign_completed',
  payment_confirmed: 'notify_payment_confirmed',
};

/**
 * @param {object} recipient - the User record the notification would go to
 * @param {string} type - the Notification.type being created
 * @returns {boolean} whether an in-app Notification should actually be created
 */
export function shouldNotify(recipient, type) {
  const prefKey = TYPE_TO_PREF_KEY[type];
  if (!prefKey) return true; // no matching preference category — always send
  if (!recipient) return true; // unknown recipient prefs — fail open, don't silently drop
  return recipient[prefKey] !== false;
}
