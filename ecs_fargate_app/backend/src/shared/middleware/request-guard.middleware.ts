import { Request, Response, NextFunction } from 'express';

/**
 * Request guard middleware that validates state-changing requests (POST, PUT,
 * DELETE, PATCH) originate from the application's own frontend clients by
 * requiring the custom header "X-Requested-With: XMLHttpRequest".
 *
 * HTML forms and simple cross-origin requests cannot set custom headers,
 * so this check ensures that only legitimate application-initiated requests
 * are processed by state-changing endpoints.
 */
export function requestGuardMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Safe HTTP methods do not cause state changes — allow them through
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method.toUpperCase())) {
    return next();
  }

  // Exclude Socket.IO transport polling requests, which use POST
  // at the transport layer but do not perform application-level actions
  if (req.path.startsWith('/socket.io')) {
    return next();
  }

  // Require the custom header on all state-changing requests
  const requestedWith = req.headers['x-requested-with'];
  if (requestedWith !== 'XMLHttpRequest') {
    res.status(403).json({
      statusCode: 403,
      message: 'Forbidden',
    });
    return;
  }

  next();
}