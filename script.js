// =============================
// MENU HAMBURGUER
// =============================

const menuToggle = document.getElementById("menuToggle");
const dropdownMenu = document.getElementById("dropdownMenu");

if (menuToggle && dropdownMenu) {

    menuToggle.addEventListener("click", () => {
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

            alert(dados.mensagem);

        } catch (erro) {

            console.error("Erro:", erro);
            alert("Erro ao conectar com o servidor.");

        }

    });

}
