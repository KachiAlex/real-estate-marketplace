const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
let SpeechClient, TTSClient;
try {
  SpeechClient = require('@google-cloud/speech').v1.SpeechClient;
  TTSClient = require('@google-cloud/text-to-speech').TextToSpeechClient;
} catch (_) {}

// Initialize Firebase Admin
admin.initializeApp();

// Inspection request trigger (simplified without FCM for now)
exports.onInspectionRequestWrite = functions.firestore
  .document('inspectionRequests/{requestId}')
  .onWrite(async (change, context) => {
    try {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;
      if (!after) return; // deleted

      console.log('Inspection request updated:', {
        requestId: context.params.requestId,
        before: before?.status,
        after: after?.status,
        buyerId: after.buyerId,
        vendorId: after.vendorId
      });

      // TODO: Add FCM notifications here once functions are stable
    } catch (e) {
      console.error('onInspectionRequestWrite error:', e);
    }
  });

// Health check function
exports.health = functions.https.onRequest((req, res) => {
  res.status(200).send('ok');
});

// Speech-to-Text endpoint
exports.stt = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
      if (!SpeechClient) return res.status(500).json({ success: false, message: 'Speech client not available' });
      const { audioBase64, languageCode = 'en-US' } = req.body || {};
      if (!audioBase64) return res.status(400).json({ success: false, message: 'audioBase64 is required' });
      const client = new SpeechClient();
      const [response] = await client.recognize({
        audio: { content: audioBase64 },
        config: { encoding: 'WEBM_OPUS', sampleRateHertz: 48000, languageCode }
      });
      const transcript = response.results?.map(r => r.alternatives?.[0]?.transcript).join(' ') || '';
      res.json({ success: true, transcript });
    } catch (e) {
      console.error('stt error:', e);
      res.status(500).json({ success: false, message: 'stt failed' });
    }
  });
});

// Text-to-Speech endpoint
exports.tts = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
      if (!TTSClient) return res.status(500).json({ success: false, message: 'TTS client not available' });
      const { text, voice = { languageCode: 'en-US', name: 'en-US-Neural2-C' }, audioConfig = { audioEncoding: 'MP3' } } = req.body || {};
      if (!text) return res.status(400).json({ success: false, message: 'text is required' });
      const client = new TTSClient();
      const [response] = await client.synthesizeSpeech({ input: { text }, voice, audioConfig });
      res.json({ success: true, audioBase64: response.audioContent.toString('base64') });
    } catch (e) {
      console.error('tts error:', e);
      res.status(500).json({ success: false, message: 'tts failed' });
    }
  });
});