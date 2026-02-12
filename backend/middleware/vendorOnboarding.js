// backend/middleware/vendorOnboarding.js
module.exports = function vendorOnboarding(req, res, next) {
  // Only check for vendors
  if (req.user && req.user.role === 'vendor') {
    // Accept onboardingComplete on user or user.vendorData
    const complete = req.user.onboardingComplete === true ||
      (req.user.vendorData && req.user.vendorData.onboardingComplete === true);
    if (!complete) {
      return res.status(403).json({
        success: false,
        message: 'Vendor onboarding incomplete. Please complete onboarding to access this resource.',
        redirect: '/vendor/register'
      });
    }
  }
  next();
};
