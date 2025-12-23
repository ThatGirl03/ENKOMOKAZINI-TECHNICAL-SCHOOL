import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';

const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(process.cwd(), 'server', 'data.json');
const UPLOAD_DIR = path.join(process.cwd(), 'server', 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, unique);
  }
});

const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

// Configure mail transporter if SMTP env vars are set
let mailer = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  mailer.verify().then(() => console.log('SMTP transporter verified')).catch((e) => console.warn('SMTP verification failed', e.message));
} else {
  console.log('SMTP not configured. /api/contact will log emails to server but not send.');
}

// Ensure data.json exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');
}

app.get('/api/data', (req, res) => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const json = raw ? JSON.parse(raw) : {};
    res.json(json);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.post('/api/data', (req, res) => {
  try {
    // simple token protection: check header x-admin-token against env ADMIN_TOKEN if set
    const token = process.env.ADMIN_TOKEN;
    if (token) {
      const header = req.get('x-admin-token');
      if (!header || header !== token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const body = req.body || {};
    fs.writeFileSync(DATA_FILE, JSON.stringify(body, null, 2), 'utf8');
    res.json(body);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    // token guard for uploads as well
    const token = process.env.ADMIN_TOKEN;
    if (token) {
      const header = req.get('x-admin-token');
      if (!header || header !== token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    if (!req.file) return res.status(400).json({ error: 'No file' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (e) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Contact form endpoint: sends email to school and dev team
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });

    const recipients = ['enkomokazinitechnical@gmail.com', 'singaweinnovative@outlook.com'];

    const subject = `Website message from ${name}`;
    const text = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const html = `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><hr/><p>${message.replace(/\n/g, '<br/>')}</p>`;

    if (mailer) {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipients.join(','),
        subject,
        text,
        html,
      });
      return res.json({ ok: true });
    }

    // If mailer not configured, write to log file for developer review
    const logEntry = `--- ${new Date().toISOString()} ---\nTo: ${recipients.join(', ')}\nSubject: ${subject}\n${text}\n\n`;
    fs.appendFileSync(path.join(process.cwd(), 'server', 'contact.log'), logEntry, 'utf8');
    return res.json({ ok: true, note: 'mailer not configured; message written to server/contact.log' });
  } catch (e) {
    console.error('Contact send failed', e);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
