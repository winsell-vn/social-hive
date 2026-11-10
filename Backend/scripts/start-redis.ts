import { spawn } from 'child_process';
import * as net from 'net';
import * as path from 'path';
import { platform } from 'os';

const IS_WINDOWS = platform() === 'win32';
const REDIS_PATH = process.env.REDIS_PATH || (IS_WINDOWS ? 'D:\\Project\\SocialMedia\\Redis' : '/usr/bin');
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_EXECUTABLE = IS_WINDOWS
  ? path.join(REDIS_PATH, 'redis-server.exe')
  : path.join(REDIS_PATH, 'redis-server');

/**
 * Check if Redis is already running on the configured port
 */
async function isRedisRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 1000;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(REDIS_PORT, REDIS_HOST);
  });
}

/**
 * Wait for Redis to be ready
 */
async function waitForRedis(maxAttempts = 30, delayMs = 500): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[Redis] Waiting for Redis to be ready... (attempt ${attempt}/${maxAttempts})`);
    
    if (await isRedisRunning()) {
      console.log('[Redis] Redis is ready!');
      return true;
    }
    
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  
  return false;
}

/**
 * Start Redis server
 */
async function startRedisServer(): Promise<boolean> {
  console.log(`[Redis] Starting Redis server from: ${REDIS_EXECUTABLE}`);
  
  try {
    // Check if executable exists
    const fs = await import('fs');
    if (!fs.existsSync(REDIS_EXECUTABLE)) {
      console.error(`[Redis] ERROR: Redis executable not found at: ${REDIS_EXECUTABLE}`);
      console.error('[Redis] Please ensure Redis is installed at the configured REDIS_PATH');
      return false;
    }

    // Spawn Redis server as detached process
    const redisProcess = spawn(REDIS_EXECUTABLE, [], {
      cwd: REDIS_PATH,
      detached: true,
      stdio: 'ignore',
      ...(IS_WINDOWS && { windowsHide: true }),
    });

    redisProcess.unref();
    
    console.log(`[Redis] Redis server process spawned (PID: ${redisProcess.pid})`);
    
    // Wait for Redis to be ready
    return await waitForRedis();
  } catch (error) {
    console.error('[Redis] ERROR: Failed to start Redis server:', error);
    return false;
  }
}

/**
 * Main function to ensure Redis is running
 */
export async function ensureRedisRunning(): Promise<boolean> {
  console.log(`[Redis] Checking Redis connection at ${REDIS_HOST}:${REDIS_PORT}...`);
  
  // Check if Redis is already running
  if (await isRedisRunning()) {
    console.log('[Redis] Redis is already running');
    return true;
  }
  
  console.log('[Redis] Redis is not running. Attempting to start...');
  
  // Try to start Redis
  const started = await startRedisServer();
  
  if (!started) {
    console.error('[Redis] ERROR: Failed to start Redis server');
    console.error('[Redis] Please ensure Redis is installed and the path is correct');
    console.error(`[Redis] Expected Redis path: ${REDIS_PATH}`);
    return false;
  }
  
  return true;
}

// Run if executed directly
if (require.main === module) {
  ensureRedisRunning()
    .then((success) => {
      if (success) {
        console.log('[Redis] Redis startup check completed successfully');
        process.exit(0);
      } else {
        console.error('[Redis] Redis startup check failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('[Redis] Unexpected error:', error);
      process.exit(1);
    });
}

