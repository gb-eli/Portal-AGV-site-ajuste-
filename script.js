// =============================
// MENU HAMBURGUER
// =============================

console.log("script carregado");

const menuToggle = document.getElementById("menuToggle");
const dropdownMenu = document.getElementById("dropdownMenu");

console.log(menuToggle);
console.log(dropdownMenu);

if (menuToggle && dropdownMenu) {
    menuToggle.addEventListener("click", () => {
        console.log("clicou no menu");
        dropdownMenu.classList.toggle("show");
    });
}


// =============================
// LOGIN
// =============================

const form = document.getElementById("loginForm");

if (form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value.trim();
        const consent = document.getElementById("consent").checked;

        if (!email || !senha) {
            alert("Preencha todos os campos.");
            return;
        }

        if (!consent) {
            alert("Você precisa aceitar os termos.");
            return;
        }

        try {
            const resposta = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    senha: senha
                })
            });

            

const dados = await resposta.json();

if (resposta.ok) {

    alert(dados.mensagem);

    if (dados.tipo === "aluno") {
        window.location.href = "painel-aluno.html";
    }

    else if (dados.tipo === "admin") {
        window.location.href = "painel-admin.html";
    }

    else if (dados.tipo === "responsavel") {
        window.location.href = "painel-responsavel.html";
    }

} else {
    alert(dados.mensagem);
}

        } catch (erro) {
            console.error("Erro:", erro);
            alert("Erro ao conectar com o servidor.");
        }
    });
}
