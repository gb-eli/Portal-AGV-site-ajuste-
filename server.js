const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const ROOT = __dirname;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const users = [
  createUser('1', 'Aluno Exemplo', 'aluno@escola', '1234', 'aluno'),
  createUser('2', 'Administrador Exemplo', 'admin@escola', '1234', 'admin'),
  createUser('3', 'Responsável Exemplo', 'responsavel@escola', '1234', 'responsavel'),
];

const sessions = new Map();

function createUser(id, nome, email, plainPassword, tipo) {
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(plainPassword, salt);
  return { id, nome, email, tipo, salt, passwordHash };
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, user) {
  const hash = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf('=');
      if (index === -1) return acc;
      const key = part.slice(0, index);
      const value = decodeURIComponent(part.slice(index + 1));
      acc[key] = value;
      return acc;
    }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (typeof options.maxAge === 'number') parts.push(`Max-Age=${options.maxAge}`);
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

function setNoStore(res) {
  res.setHeader('Cache-Control', 'no-store');
}

function createSession(user) {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_TTL_MS;

  sessions.set(sessionId, {
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
    },
    expiresAt,
  });

  return { sessionId, expiresAt };
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies.portal_session;
  if (!sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session) return null;

  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  return { ...session, sessionId };
}

function destroySession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.portal_session) {
    sessions.delete(cookies.portal_session);
  }

  res.setHeader(
    'Set-Cookie',
    serializeCookie('portal_session', '', {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 0,
      secure: false,
    })
  );
}

function requireAuth(req, res, next) {
  setNoStore(res);
  const session = getSession(req);
  if (!session) {
    return res.redirect('/login');
  }
  req.sessionData = session;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    const session = getSession(req);
    setNoStore(res);

    if (!session) {
      return res.redirect('/login');
    }

    if (!roles.includes(session.user.tipo)) {
      return res.status(403).send('Acesso negado: perfil sem permissão para esta página.');
    }

    req.sessionData = session;
    next();
  };
}

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.get('/style.css', (req, res) => {
  res.sendFile(path.join(ROOT, 'style.css'));
});

app.get('/script.js', (req, res) => {
  res.sendFile(path.join(ROOT, 'script.js'));
});

app.use('/img', express.static(path.join(ROOT, 'img')));

app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.get('/login', (req, res) => {
  const session = getSession(req);
  if (session) {
    return res.redirect(getHomeRouteByRole(session.user.tipo));
  }
  setNoStore(res);
  res.sendFile(path.join(ROOT, 'login.html'));
});

app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: 'Informe email e senha.' });
  }

  const user = users.find((item) => item.email === String(email).trim().toLowerCase());

  if (!user || !verifyPassword(String(senha), user)) {
    return res.status(401).json({ mensagem: 'Email ou senha inválidos.' });
  }

  const { sessionId } = createSession(user);
  res.setHeader(
    'Set-Cookie',
    serializeCookie('portal_session', sessionId, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
      secure: false,
    })
  );

  setNoStore(res);
  return res.json({
    mensagem: 'Login realizado com sucesso.',
    usuario: {
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
    },
    redirect: getHomeRouteByRole(user.tipo),
  });
});

app.post('/logout', (req, res) => {
  destroySession(req, res);
  setNoStore(res);
  res.json({ mensagem: 'Logout realizado com sucesso.' });
});

app.get('/me', (req, res) => {
  const session = getSession(req);
  setNoStore(res);

  if (!session) {
    return res.status(401).json({ autenticado: false });
  }

  return res.json({
    autenticado: true,
    usuario: session.user,
  });
});

app.get('/painel/admin', requireRole('admin'), (req, res) => {
  res.sendFile(path.join(ROOT, 'painel-admin.html'));
});

app.get('/painel/aluno', requireRole('aluno'), (req, res) => {
  res.sendFile(path.join(ROOT, 'painel-aluno.html'));
});

app.get('/painel/responsavel', requireRole('responsavel'), (req, res) => {
  res.sendFile(path.join(ROOT, 'painel-responsavel.html'));
});

app.get('/biblioteca', requireRole('aluno', 'responsavel'), (req, res) => {
  res.sendFile(path.join(ROOT, 'biblioteca.html'));
});

app.get('/horarios', requireRole('aluno', 'responsavel'), (req, res) => {
  res.sendFile(path.join(ROOT, 'horarios.html'));
});

app.get('/suporte', requireRole('aluno', 'responsavel', 'admin'), (req, res) => {
  res.sendFile(path.join(ROOT, 'suporte.html'));
});

app.get(['/painel-admin.html', '/painel-aluno.html', '/painel-responsavel.html', '/biblioteca.html', '/horarios.html', '/suporte.html'], requireAuth, (req, res) => {
  res.redirect(getHomeRouteByRole(req.sessionData.user.tipo));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

function getHomeRouteByRole(tipo) {
  if (tipo === 'admin') return '/painel/admin';
  if (tipo === 'responsavel') return '/painel/responsavel';
  return '/painel/aluno';
}

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
