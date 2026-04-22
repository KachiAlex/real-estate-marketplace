const db = require('../config/sequelizeDb');

const DOC_ID = 'global';

const DEFAULT_SETTINGS = {
  verificationFee: 50000,
  verificationBadgeColor: '#10B981',
  vendorListingFee: 100000,
  escrowTimeoutDays: 7,
  platformFee: 0.025,
  maxFileSize: 10485760,
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  maintenanceMode: false,
  emailNotifications: true,
  smsNotifications: false,
  autoApproveProperties: false,
  autoApproveUsers: false
};

const AdminSettingsModel = db.AdminSettings;

const getSettings = async () => {
  const [settings] = await AdminSettingsModel.findOrCreate({
    where: { id: DOC_ID },
    defaults: { id: DOC_ID, ...DEFAULT_SETTINGS }
  });

  return settings.toJSON();
};

const updateSettings = async (updates) => {
  await AdminSettingsModel.update(updates, { where: { id: DOC_ID } });
  const settings = await AdminSettingsModel.findByPk(DOC_ID);
  return settings ? settings.toJSON() : null;
};

module.exports = {
  getSettings,
  updateSettings
};
