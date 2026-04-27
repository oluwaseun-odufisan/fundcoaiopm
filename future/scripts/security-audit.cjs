const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const parseEnv = (relativePath) => {
  const content = read(relativePath);
  return content.split(/\r?\n/).reduce((accumulator, line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (!match) return accumulator;
    accumulator[match[1]] = match[2];
    return accumulator;
  }, {});
};

const checks = [];

const addCheck = (category, label, passed, details = '') => {
  checks.push({ category, label, passed, details });
};

const fileContains = (relativePath, pattern) => {
  const content = read(relativePath);
  if (pattern instanceof RegExp) return pattern.test(content);
  return content.includes(pattern);
};

const userEnv = parseEnv('backend/.env');
const adminEnv = parseEnv('adminpanel/backend/.env');

addCheck(
  'auth abuse',
  'legacy JWT_SECRET removed from runtime env files',
  !('JWT_SECRET' in userEnv) && !('JWT_SECRET' in adminEnv)
);
addCheck(
  'auth abuse',
  'split JWT secrets exist and differ',
  Boolean(userEnv.USER_JWT_SECRET) &&
    Boolean(userEnv.ADMIN_JWT_SECRET) &&
    Boolean(adminEnv.ADMIN_JWT_SECRET) &&
    userEnv.USER_JWT_SECRET !== userEnv.ADMIN_JWT_SECRET &&
    userEnv.ADMIN_JWT_SECRET === adminEnv.ADMIN_JWT_SECRET
);
addCheck(
  'auth abuse',
  'internal service tokens are present and isolated',
  Boolean(userEnv.INTERNAL_API_TOKEN) &&
    Boolean(adminEnv.INTERNAL_API_TOKEN) &&
    Boolean(adminEnv.USER_BACKEND_INTERNAL_TOKEN) &&
    userEnv.INTERNAL_API_TOKEN === adminEnv.USER_BACKEND_INTERNAL_TOKEN &&
    userEnv.INTERNAL_API_TOKEN !== adminEnv.INTERNAL_API_TOKEN
);
addCheck(
  'auth abuse',
  'self-profile role escalation path removed',
  !fileContains('backend/controllers/userController.js', /const\s*\{\s*[^}]*\brole\b/) &&
    !fileContains('backend/controllers/userController.js', /updateData\s*=\s*\{[^}]*\brole\b/s)
);
addCheck(
  'auth abuse',
  'user refresh/login/logout routes are wired',
  fileContains('backend/routes/userRoute.js', "userRouter.post('/refresh'") &&
    fileContains('backend/routes/userRoute.js', "userRouter.post('/logout'")
);
addCheck(
  'auth abuse',
  'admin refresh/login/logout routes are wired',
  fileContains('adminpanel/backend/routes/authRoutes.js', "router.post('/refresh'") &&
    fileContains('adminpanel/backend/routes/authRoutes.js', "router.post('/logout'")
);
addCheck(
  'auth abuse',
  'frontend refresh helpers exist for both apps',
  exists('frontend/src/security/authClient.js') &&
    exists('adminpanel/frontend/src/security/authClient.js')
);

addCheck(
  'socket abuse',
  'generic emit endpoint is event-whitelisted',
  fileContains('backend/server.js', 'ALLOWED_SOCKET_EMIT_EVENTS') &&
    fileContains('backend/server.js', "Event not allowed")
);
addCheck(
  'socket abuse',
  'dangerous client-originated social and meeting rebroadcast handlers are gone',
  !fileContains('backend/server.js', "socket.on('post:new'") &&
    !fileContains('backend/server.js', "socket.on('post:updated'") &&
    !fileContains('backend/server.js', "socket.on('post:deleted'") &&
    !fileContains('backend/server.js', "socket.on('newMeeting'") &&
    !fileContains('backend/server.js', "socket.on('meetingUpdated'") &&
    !fileContains('backend/server.js', "socket.on('meetingDeleted'")
);
addCheck(
  'socket abuse',
  'user socket auth supports active-account validation with refresh-cookie fallback',
  fileContains('backend/server.js', 'findUserByRefreshToken') &&
    fileContains('backend/socket/roomSignaling.js', 'findUserByRefreshToken')
);
addCheck(
  'socket abuse',
  'admin socket auth supports active-account validation with refresh-cookie fallback',
  fileContains('adminpanel/backend/server.js', 'findAdminByRefreshToken')
);

addCheck(
  'file upload abuse',
  'early upload limits are enforced on backend middleware',
  fileContains('backend/server.js', 'fileSize: 50 * 1024 * 1024') &&
    fileContains('backend/server.js', 'abortOnLimit: true')
);
addCheck(
  'file upload abuse',
  'social upload route restricts content types',
  fileContains('backend/routes/postRoutes.js', 'ALLOWED_UPLOAD_MIME_PREFIXES') &&
    fileContains('backend/routes/postRoutes.js', 'Unsupported media type')
);
addCheck(
  'file upload abuse',
  'chat upload controller restricts content types',
  fileContains('backend/controllers/chatController.js', 'ALLOWED_CHAT_UPLOAD_MIME_PREFIXES') &&
    fileContains('backend/controllers/chatController.js', 'Unsupported file type')
);
addCheck(
  'file upload abuse',
  'document preview no longer renders unsafe inner HTML',
  !fileContains('frontend/src/pages/FileStorage.jsx', 'dangerouslySetInnerHTML') &&
    fileContains('frontend/src/pages/FileStorage.jsx', 'extractRawText')
);
addCheck(
  'file upload abuse',
  'shared file access is tokenized',
  fileContains('backend/models/fileModel.js', 'shareTokenHash') &&
    fileContains('backend/routes/fileRoutes.js', "/share/:token") &&
    fileContains('backend/controllers/fileController.js', 'shareTokenHash')
);

addCheck(
  'proxy abuse',
  'admin shared proxy allowlists forwarded headers',
  fileContains('adminpanel/backend/utils/userBackendProxy.js', 'ALLOWED_HEADER_NAMES') &&
    fileContains('adminpanel/backend/utils/userBackendProxy.js', 'x-internal-token')
);
addCheck(
  'proxy abuse',
  'user->admin and admin->user realtime channels use dedicated internal tokens',
  fileContains('backend/utils/adminRealtime.js', 'INTERNAL_API_TOKEN') &&
    fileContains('adminpanel/backend/utils/userRealtime.js', 'USER_BACKEND_INTERNAL_TOKEN')
);
addCheck(
  'proxy abuse',
  'internal notification routes require internal tokens only',
  fileContains('backend/routes/notificationRoutes.js', 'x-internal-token') &&
    fileContains('adminpanel/backend/routes/notificationRoutes.js', 'x-internal-token')
);

const grouped = checks.reduce((accumulator, item) => {
  const list = accumulator[item.category] || [];
  list.push(item);
  accumulator[item.category] = list;
  return accumulator;
}, {});

let failed = 0;
for (const [category, items] of Object.entries(grouped)) {
  console.log(`\n[${category}]`);
  for (const item of items) {
    const mark = item.passed ? 'PASS' : 'FAIL';
    console.log(`- ${mark}: ${item.label}${item.details ? ` (${item.details})` : ''}`);
    if (!item.passed) failed += 1;
  }
}

if (failed > 0) {
  console.error(`\nSecurity audit failed with ${failed} issue(s).`);
  process.exit(1);
}

console.log('\nSecurity audit passed.');
