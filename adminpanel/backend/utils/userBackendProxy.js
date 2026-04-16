const USER_API_BASE = (process.env.USER_API_URL || 'http://localhost:4001').replace(/\/+$/, '');

const buildTargetUrl = (originalUrl, sourceBasePath) => {
  if (!originalUrl.startsWith(sourceBasePath)) {
    throw new Error(`Cannot proxy request outside ${sourceBasePath}`);
  }
  const nextPath = originalUrl.slice(sourceBasePath.length) || '/';
  return `${USER_API_BASE}${nextPath}`;
};

const copyHeaders = (req, isMultipart, hasJsonBody) => {
  const headers = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (!value) continue;
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'connection' || lower === 'content-length') continue;
    headers[key] = value;
  }
  if (hasJsonBody) {
    headers['content-type'] = req.headers['content-type'] || 'application/json';
  }
  return headers;
};

export const createUserBackendProxy = (sourceBasePath) => async (req, res) => {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const contentType = String(req.headers['content-type'] || '');
    const isMultipart = contentType.toLowerCase().startsWith('multipart/form-data');
    const hasJsonBody =
      !isMultipart &&
      !['GET', 'HEAD'].includes(method) &&
      req.body &&
      Object.keys(req.body).length > 0;

    const targetUrl = buildTargetUrl(req.originalUrl, sourceBasePath);
    const headers = copyHeaders(req, isMultipart, hasJsonBody);
    const options = {
      method,
      headers,
      redirect: 'manual',
    };

    if (!['GET', 'HEAD'].includes(method)) {
      if (isMultipart) {
        options.body = req;
        options.duplex = 'half';
      } else if (hasJsonBody) {
        options.body = JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, options);
    const responseType = response.headers.get('content-type');
    const payload = await response.text();

    if (responseType) {
      res.set('content-type', responseType);
    }

    res.status(response.status);
    if (response.status === 204 || response.status === 304) {
      return res.end();
    }
    return res.send(payload);
  } catch (error) {
    console.error('Shared proxy error:', error.message);
    return res.status(502).json({
      success: false,
      message: 'Failed to reach shared service',
    });
  }
};
