/**
 * Admin Configuration
 * Define permanent admin users here
 */

const ADMIN_EMAILS = [
  'ghildiyalnitin2007@gmail.com'
];

// Check if email is a permanent admin
const isPermanentAdmin = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

// Get list of admin emails
const getAdminEmails = () => [...ADMIN_EMAILS];

module.exports = {
  isPermanentAdmin,
  getAdminEmails,
  ADMIN_EMAILS
};
