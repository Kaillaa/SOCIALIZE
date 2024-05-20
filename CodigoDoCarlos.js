//Trabalhando com imagens
//caminho de onde a imagem está na aplicação - PATH
//1º - Colocar a imagem em uma pasta na raiz projeto - Não paga
//2º - Contra serviços (API's) para adicionar imagem - Custo Alto

import { createServer } from "node:http";
import { writeFile, readFile, rename } from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import formidable, { errors as formidableErrors } from "formidable";
import { v4 as uuidv4 } from "uuid";

import lerDadosUsuarios from "./lerUsuarios.js";

const PORT = 3333;

//import e export
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = createServer(async (request, response) => {
  const { method, url } = request;
  if (method === "GET" && url === "/usuarios") {
    lerDadosUsuarios((err, usuarios) => {
      if (err) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ message: "Não possível ler o arquivo" }));
        return;
      }
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(usuarios));
    });
  } else if (method === "POST" && url === "/usuarios") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      const novoUsuario = JSON.parse(body);
      //Validações do dados vindo do body
      lerDadosUsuarios((err, usuarios) => {
        if (err) {
          response.writeHead(500, { "Content-Type": "application/json" });
          response.end(
            JSON.stringify({ message: "Não possível ler o arquivo" })
          );
          return;
        }

        novoUsuario.id = uuidv4();

        const verificaSeEmailExiste = usuarios.find(
          (usuario) => usuario.email === novoUsuario.email
        );

        if (verificaSeEmailExiste) {
          response.writeHead(400, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ message: "Email já está em uso" }));
          return;
        }

        usuarios.push(novoUsuario);

        writeFile("usuarios.json", JSON.stringify(usuarios, null, 2), (err) => {
          if (err) {
            response.writeHead(500, { "Content-Type": "application/json" });
            response.end(
              JSON.stringify({ message: "Não cadastrar os dados no arquivo" })
            );
            return;
          }
          response.writeHead(201, { "Content-Type": "application/json" });
          response.end(JSON.stringify(novoUsuario));
        });
      });
    });
  } else if (method === "POST" && url === "/perfil") {
    const form = formidable({});
    let fields;
    let files;
    try {
      [fields, files] = await form.parse(request);
    } catch (err) {
      // example to check for a very specific error
      if (err.code === formidableErrors.maxFieldsExceeded) {
      }
      console.error(err);
      response.writeHead(err.httpCode || 400, { "Content-Type": "text/plain" });
      response.end(String(err));
      return;
    }

    const { id, nome, bio } = fields;
    const imagemDePerfil = files.imagemDePerfil;
    //NORMALIZE O CAMINHO DA IMAGEM

    if (!nome || !bio || !imagemDePerfil) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          error:
            "Todos os campos são obrigatórios: nome, bio, Imagem do Perfil",
        })
      );
      return;
    }

    lerDadosUsuarios((err, usuarios) => {
      if (err) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ message: "Erro ao ler o Arquivo" }));
        return;
      }

      const indexUsuario = usuarios.findIndex(
        (usuario) => usuario.id === id[0]
      );

      if (indexUsuario === -1) {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            message: "Faça o cadastro antes de criar um perfil",
          })
        );
        return;
      }

      //caminho/imagens/id.png
      const caminhoImagem = path.join(__dirname, "imagens", id + ".png");

      const perfil = {
        nome: nome[0],
        bio: bio[0],
        caminhoImagem,
      };

      usuarios[indexUsuario] = { ...usuarios[indexUsuario], perfil };

      writeFile("usuarios.json", JSON.stringify(usuarios, null, 2), (err) => {
        if (err) {
          response.writeHead(500, { "Content-Type": "application/json" });
          response.end(
            JSON.stringify({message: "Não é possível escrever no arquivo JSON"})
          );
          return;
        }

        rename(files.imagemDePerfil[0].filepath, caminhoImagem, (err) => {
          if (err) {
            console.log("err: ", err)
            response.writeHead(500, { "Content-Type": "application/json" });
            response.end(JSON.stringify({message: "Não é salvar a imagem" }));
            return;
          }
        });

        response.writeHead(201, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ message: "Perfil Criado" }));

      });
    });
  } else {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ message: "Página não encontrada" }));
  }
});

server.listen(PORT, () => {
  console.log(`Servidor on PORT: ${PORT}`);
});
