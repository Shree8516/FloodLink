// Middleware that prints one line per HTTP request, e.g. "[http] POST /api/v1/events 202 - 12 ms".
// Registered in app.js before the routes so it sees every request.

// We log on 'finish' (after the response is sent) so we know the final status code and how long it took
function requestLogger(req, res, next) {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[http] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration} ms`);
  });
  next();
}

module.exports = requestLogger;
