// backend/middleware/vendorOnboarding.js
module.exports = function vendorOnboarding(req, res, next) {
  // Only check for vendors
  if (req.user && req.user.role === 'vendor') {
    // Accept onboardingComplete on user or user.vendorData
    const complete = req.user.onboardingComplete === true ||
      (req.user.vendorData && req.user.vendorData.onboardingComplete === true);
    if (!complete) {
      // Always include a redirect URL for frontend to handle
      return res.status(403).json({
        success: false,
        message: 'Vendor onboarding incomplete. Please complete onboarding to access this resource.',
        redirect: '/vendor/register',
        code: 'VENDOR_ONBOARDING_REQUIRED'
      });
    }
  }
  next();
};
