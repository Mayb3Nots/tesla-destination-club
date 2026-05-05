/**
 * Admin configuration — whitelist of emails allowed to access /admin routes.
 * Add new admin emails here.
 */
export const ADMIN_EMAILS: readonly string[] = [
    'samuelong135@gmail.com'
];

/**
 * Check if a given email is an admin.
 * Case-insensitive comparison.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}
