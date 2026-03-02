import { Request, Response, NextFunction } from 'express';

/**
 * Request guard middleware that validates incoming requests originate from
 * the application's own frontend clients.
 */
export function requestGuardMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Reject cross-site requests using the Sec-Fetch-Site header.
  // This header is set by the browser and cannot be spoofed by web content.
  //   "same-origin" — legitimate app requests (browser → ALB → nginx → backend)
  //   "none"        — direct navigation, bookmarks, typed URLs
  //   absent        — non-browser clients (container health checks, curl, etc.)
  // Anything else ("cross-site", "same-site") indicates the request was
  // initiated from a different origin and should be rejected.
  const fetchSite = req.headers['sec-fetch-site'];
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    res.status(403).json({
      statusCode: 403,
      message: 'Forbidden',
    });
    return;
  }

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

  // Require a custom header on all state-changing requests.
  // This catches requests from environments that do not send
  // Sec-Fetch-Site (e.g. older browsers, non-browser API clients
  // making cross-origin calls).
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