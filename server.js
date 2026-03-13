const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// TESTE DO SERVIDOR

app.get("/", (req, res) => {
    res.send("Servidor do Portal AGV funcionando!");
});

// ROTA DE LOGIN

app.post("/login", (req, res) => {

    const { email, senha } = req.body;

    console.log("Login recebido:", email, senha);

    if (email === "aluno@escola" && senha === "1234") {

        return res.json({
            mensagem: "Login realizado com sucesso!"
        });

    }

    res.status(401).json({
        mensagem: "Email ou senha inválidos."
    });

});

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});

