const defaultTemplates = require('../data/defaultNotificationTemplates');

const renderString = (template, variables = {}) => {
  if (!template || typeof template !== 'string') return template || '';
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => (variables[key] != null ? variables[key] : match));
};

const renderTemplate = (template, variables = {}) => {
  if (!template || !template.channels) return { channels: {} };
  const result = { channels: {} };

  if (template.channels.email?.enabled) {
    result.channels.email = {
      subject: renderString(template.channels.email.subject, variables),
      htmlTemplate: renderString(template.channels.email.htmlTemplate, variables),
      textTemplate: renderString(template.channels.email.textTemplate, variables)
    };
  }

  if (template.channels.inApp?.enabled) {
    result.channels.inApp = {
      title: renderString(template.channels.inApp.title, variables),
      message: renderString(template.channels.inApp.message, variables)
    };
  }

  if (template.channels.sms?.enabled) {
    result.channels.sms = { message: renderString(template.channels.sms.message, variables) };
  }

  if (template.channels.push?.enabled) {
    result.channels.push = { title: renderString(template.channels.push.title, variables), body: renderString(template.channels.push.body, variables) };
  }

  return result;
};

const ensureDefaultTemplates = async () => true; // no-op for in-memory templates

const getTemplateByType = async (type) => {
  if (!type) return null;
  return defaultTemplates.find(t => t.type === type) || null;
};

const getTemplateById = getTemplateByType;

module.exports = { ensureDefaultTemplates, getTemplateByType, getTemplateById, renderTemplate };
