const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Servidor do Portal AGV funcionando!");
});

app.post("/login", (req, res) => {

    const { email, senha } = req.body;

    if (email === "aluno@escola" && senha === "1234") {
        return res.json({
            mensagem: "Login realizado",
            tipo: "aluno"
        });
    }

    if (email === "admin@escola" && senha === "1234") {
        return res.json({
            mensagem: "Login realizado",
            tipo: "admin"
        });
    }

    if (email === "responsavel@escola" && senha === "1234") {
        return res.json({
            mensagem: "Login realizado",
            tipo: "responsavel"
        });
    }

    res.status(401).json({
        mensagem: "Email ou senha inválidos"
    });

});

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});