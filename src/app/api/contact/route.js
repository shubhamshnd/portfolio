// src/app/api/contact/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { headers } from 'next/headers';
import { promises as fs } from 'fs';
import path from 'path';

const getIP = async () => {
  const headersList = headers();
  const forwardedFor = await headersList.get('x-forwarded-for');
  const realIP = await headersList.get('x-real-ip');
  
  if (forwardedFor) {
    const clientIP = forwardedFor.split(',')[0].trim();
    return clientIP;
  }
  
  return realIP || 'unknown';
};

// Rest of your database functions
const DB_PATH = path.join(process.cwd(), 'data', 'contacts.json');

const ensureDataDir = async () => {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

const initDB = async () => {
  await ensureDataDir();
  try {
    await fs.access(DB_PATH);
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    const initialData = { contacts: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
};

const storeContact = async (contact) => {
  const db = await initDB();
  const newContact = {
    ...contact,
    id: Date.now(),
    createdAt: new Date().toISOString()
  };
  db.contacts.push(newContact);
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
  return newContact;
};

const checkRateLimit = async (email, ipAddress) => {
  const db = await initDB();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const recentSubmissions = db.contacts.filter(contact => 
    (contact.email === email || contact.ipAddress === ipAddress) &&
    contact.createdAt > fiveMinutesAgo
  );

  return recentSubmissions.length < 2;
};

export async function POST(req) {
  try {
    const ip = await getIP();
    const { name, email, message } = await req.json();

    // Input validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check rate limit
    const canSubmit = await checkRateLimit(email, ip);
    if (!canSubmit) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a few minutes.' },
        { status: 429 }
      );
    }

    // Store contact
    await storeContact({ name, email, message, ipAddress: ip });

    // Configure email transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'shubhamshindesunil.work@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Email to sender
    const userMailOptions = {
      from: 'shubhamshindesunil.work@gmail.com',
      to: email,
      subject: 'Thanks for Contacting Me!',
      html: `
        <h2>Hello ${name}!</h2>
        <p>Thank you for reaching out. I appreciate your message and will get back to you soon.</p>
        <p>In the meantime, feel free to connect with me on my social platforms:</p>
        <ul>
          <li><a href="https://github.com/shubhamshnd">GitHub</a></li>
          <li><a href="https://www.linkedin.com/in/shubham-shnd/">LinkedIn</a></li>
          <li><a href="https://x.com/shubhamshnd">Twitter</a></li>
        </ul>
        <p>Best regards,<br>Shubham Shinde</p>
      `
    };

    // Email notification to yourself
    const adminMailOptions = {
      from: 'shubhamshindesunil.work@gmail.com',
      to: 'shubhamshindesunil.work@gmail.com',
      subject: 'New Contact Form Submission',
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>IP Address:</strong> ${ip}</p>
      `
    };

    // Send emails
    await Promise.all([
      transporter.sendMail(userMailOptions),
      transporter.sendMail(adminMailOptions)
    ]);

    return NextResponse.json({ 
      success: true,
      message: 'Contact form submitted successfully' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}