// src/app/api/contact/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { headers } from 'next/headers';
import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);

// Handle Redis connection errors
redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

const getIP = async () => {
  const headersList = headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIP = headersList.get('x-real-ip');
  
  if (forwardedFor) {
    const clientIP = forwardedFor.split(',')[0].trim();
    return clientIP;
  }
  
  return realIP || 'unknown';
};

const storeContact = async (contact) => {
  const id = Date.now().toString();
  const newContact = {
    ...contact,
    id,
    createdAt: new Date().toISOString()
  };
  
  try {
    // Store the contact as a hash
    await redis.hset(`contact:${id}`, {
      ...newContact,
      ipAddress: contact.ipAddress // Ensure ipAddress is included
    });
    
    // Add to sorted set for time-based queries
    await redis.zadd('contacts-by-time', Date.now(), id);
    
    return newContact;
  } catch (error) {
    console.error('Redis store error:', error);
    throw error;
  }
};

const checkRateLimit = async (email, ipAddress) => {
  try {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    // Get recent submission IDs
    const recentIds = await redis.zrangebyscore('contacts-by-time', fiveMinutesAgo, '+inf');
    
    // Get contact details for recent submissions
    const recentContacts = await Promise.all(
      recentIds.map(id => redis.hgetall(`contact:${id}`))
    );
    
    // Filter submissions by email or IP
    const recentSubmissions = recentContacts.filter(
      contact => contact.email === email || contact.ipAddress === ipAddress
    );
    
    return recentSubmissions.length < 2;
  } catch (error) {
    console.error('Redis rate limit check error:', error);
    throw error;
  }
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

    // Email templates
    const [userMailOptions, adminMailOptions] = [
      {
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
      },
      {
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
      }
    ];

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
