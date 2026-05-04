// Firebase auth middleware — verifies Firebase ID tokens via admin SDK
import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { adminAuth } from './client.server'

export const requireFirebaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new Response('Unauthorized: No request headers available', { status: 401 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Response('Unauthorized: No or invalid authorization header provided', { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Response('Unauthorized: No token provided', { status: 401 });
    }

    try {
      const decoded = await adminAuth.verifyIdToken(token as string);
      return next({ context: { adminAuth, userId: decoded.uid, claims: decoded } });
    } catch (e) {
      throw new Response('Unauthorized: Invalid token', { status: 401 });
    }
  }
)
