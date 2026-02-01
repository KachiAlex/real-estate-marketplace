const { getFirestore, admin } = require('../config/firestore');
const defaultTemplates = require('../data/defaultNotificationTemplates');

const COLLECTION = 'notificationTemplates';
let ensurePromise = null;

const convertTimestamp = (value) => {
  if (!value) return value;
  return typeof value.toDate === 'function' ? value.toDate() : value;
};

const ensureDb = () => {
  const db = getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
};

const convertTemplateDoc = (doc) => {
  if (!doc) return null;
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;

  return {
    id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt)
  };
};

const renderString = (template, variables = {}) => {
  if (!template || typeof template !== 'string') {
    return template || '';
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined && value !== null ? value : match;
  });
};

const renderTemplate = (template, variables = {}) => {
  if (!template || !template.channels) {
    return { channels: {} };
  }

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
    result.channels.sms = {
      message: renderString(template.channels.sms.message, variables)
    };
  }

  if (template.channels.push?.enabled) {
    result.channels.push = {
      title: renderString(template.channels.push.title, variables),
      body: renderString(template.channels.push.body, variables)
    };
  }

  return result;
};

const ensureDefaultTemplates = async (force = false) => {
  if (!force && ensurePromise) {
    return ensurePromise;
  }

  const runner = async () => {
    const db = ensureDb();
    const collectionRef = db.collection(COLLECTION);

    const snapshots = await Promise.all(
      defaultTemplates.map((template) => collectionRef.doc(template.type).get())
    );

    const batch = db.batch();

    defaultTemplates.forEach((template, index) => {
      const docRef = collectionRef.doc(template.type);
      const existing = snapshots[index];
      const existingData = existing.exists ? existing.data() : {};

      batch.set(docRef, {
        ...template,
        createdAt: existingData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    return true;
  };

  ensurePromise = runner().catch((error) => {
    ensurePromise = null;
    throw error;
  });

  return ensurePromise;
};

const getTemplateDocument = async (docId) => {
  if (!docId) return null;
  const db = ensureDb();
  await ensureDefaultTemplates();
  const doc = await db.collection(COLLECTION).doc(docId).get();
  return doc.exists ? convertTemplateDoc(doc) : null;
};

const getTemplateByType = async (type) => {
  if (!type) return null;
  return getTemplateDocument(type);
};

const getTemplateById = async (templateId) => {
  if (!templateId) return null;
  return getTemplateDocument(templateId);
};

module.exports = {
  ensureDefaultTemplates,
  getTemplateByType,
  getTemplateById,
  renderTemplate
};
