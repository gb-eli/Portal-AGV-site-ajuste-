// =============================
// MENU HAMBÚRGUER
// =============================
const menuToggle = document.getElementById('menuToggle');
const dropdownMenu = document.getElementById('dropdownMenu');

if (menuToggle && dropdownMenu) {
  menuToggle.addEventListener('click', () => {
    dropdownMenu.classList.toggle('show');
  });

  document.addEventListener('click', (event) => {
    const clickedOutside = !menuToggle.contains(event.target) && !dropdownMenu.contains(event.target);
    if (clickedOutside) {
      dropdownMenu.classList.remove('show');
    }
  });
}

// =============================
// LOGIN
// =============================
const form = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim().toLowerCase();
    const senha = document.getElementById('senha').value.trim();
    const consent = document.getElementById('consent').checked;

    if (!email || !senha) {
      showMessage('Preencha todos os campos.', true);
      return;
    }

    if (!consent) {
      showMessage('Você precisa aceitar os termos.', true);
      return;
    }

    try {
      const resposta = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        showMessage(dados.mensagem || 'Falha no login.', true);
        return;
      }

      showMessage(dados.mensagem, false);
      window.location.href = dados.redirect;
    } catch (erro) {
      console.error('Erro:', erro);
      showMessage('Erro ao conectar com o servidor.', true);
    }
  });
}

function showMessage(message, isError) {
  if (!loginMessage) {
    alert(message);
    return;
  }

  loginMessage.textContent = message;
  loginMessage.className = isError ? 'status-message error' : 'status-message success';
}

// =============================
// SESSÃO / LOGOUT / PERFIL
// =============================
const userNameEl = document.getElementById('userName');
const userRoleEl = document.getElementById('userRole');
const logoutButton = document.getElementById('logoutButton');

async function loadSession() {
  const needsSession = document.body?.dataset?.requireAuth === 'true';
  if (!needsSession && !userNameEl && !logoutButton) return;

  try {
    const response = await fetch('/me', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });

    if (response.status === 401) {
      if (needsSession) {
        window.location.href = '/login';
      }
      return;
    }

    const data = await response.json();

    if (userNameEl && data.usuario?.nome) {
      userNameEl.textContent = data.usuario.nome;
    }

    if (userRoleEl && data.usuario?.tipo) {
      userRoleEl.textContent = formatRole(data.usuario.tipo);
    }
  } catch (error) {
    console.error('Falha ao consultar sessão:', error);
  }
}

function formatRole(role) {
  if (role === 'admin') return 'Administrador';
  if (role === 'responsavel') return 'Responsável';
  return 'Aluno';
}

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    try {
      await fetch('/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } finally {
      window.location.href = '/login';
    }
  });
}

loadSession();
