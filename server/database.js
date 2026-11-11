import dns from 'node:dns';
import mongoose from 'mongoose';

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required. Configure it in .env.');
  }

  const dnsServers = (process.env.MONGODB_DNS_SERVERS || '8.8.8.8,1.1.1.1')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers.length === 0) {
    throw new Error('MONGODB_DNS_SERVERS must contain at least one DNS server address.');
  }

  dns.setServers(dnsServers);

  try {
    return await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DATABASE || 'ember',
      serverSelectionTimeoutMS: 15000,
    });
  } catch (error) {
    if (error.syscall === 'querySrv' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEOUT') {
      throw new Error(
        `MongoDB Atlas DNS lookup failed. Check that MONGODB_URI has the correct Atlas cluster hostname and that DNS can reach ${dnsServers.join(', ')}. You can set MONGODB_DNS_SERVERS in .env to DNS servers allowed by your network.`,
        { cause: error },
      );
    }
    throw error;
  }
}
