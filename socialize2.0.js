//Trabalho com imagens
//caminho de onde a imagem está na aplicação
// 1° - Colocar a imagem em uma pasta na raiz projeto - Não paga
// 2° - Contra serviços (API's) para adicionar imagem - Custo alto

import { createServer } from "node:http";
import { writeFile, readFile, rename } from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

//import e export 
import formidable from "formidable";
import { v4 as uuidv4 } from "uuid";

import lerDadosUsuarios from "./lerDadosUsuarios.js";
// idUsuario.png = nome da imagem

const PORT = 4444;

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(__filename)

const server = createServer(async (req, res) => {
  const { method, url } = req;
  if (method === "GET" && url === "/usuarios") {
    lerDadosUsuarios((err, usuarios) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Erro ao ler os dados" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(usuarios));
    });
  } else if (method === "POST" && url === "/usuarios/") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const novoUsuario = JSON.parse(body); // retorna só oq tem no body
      //Validações dos dados vindo do body ficaria aqui
      lerDadosUsuarios((err, usuarios) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Erro ao ler os dados" }));
          return;
        }
        novoUsuario.id = uuidv4();

        const verificaSeEmailExiste = usuarios.find(
          (usuario) => usuario.email === novoUsuario.email
        ); // )
        if (verificaSeEmailExiste) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Email já está em uso" }));
          return;
        }
        usuarios.push(novoUsuario);

        writeFile("usuarios.json", JSON.stringify(usuarios, null, 2), (err) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "Não foi possível cadastrar os dados no arquivo",
              })
            );
            return;
          }
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify(novoUsuario));
        });
      });
    });
  }else if(method == "POST" && url === "/perfil"){
    const form = formidable({});
    let fields;
    let files;
    try {
        [fields, files] = await form.parse(req);
    } catch (err) {
        // example to check for a very specific error
        if (err.code === formidableErrors.maxFieldsExceeded) {

        }
        console.error(err);
        res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
        res.end(String(err));
        return;
    }

    const {id, nome, bio} = fields;
    const imagemDePerfil = files.imagemDePerfil

    if(!nome || !bio || !imagemDePerfil){
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Preencha todos os campos" }));
        return;
    }

    lerDadosUsuarios((err, usuarios) => {
        if(err){
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Erro ao ler os dados" }));
                    return;
                }
                //verificar se existe usuário com o id
                const indexUsuario = usuaios.findIndex((usuario) => usuario.id === id[0]);

                if(!usuarios){
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Usuário não encontrado" }));
                    return;
                }
                
                if (indexUsuario === -1) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Deve fazer o cadastro!" }));
                    return;
                }

                //caminho/imagens/id.png
                const caminhoImagem = path.join(__dirname, "imagens", id+".png");
                const perfil = {
                    nome: nome[0],
                    bio: bio[0],
                    imagemDePerfil: caminhoImagem
                }
                usuarios[indexUsuario] = {...usuarios[indexUsuario], perfil}

                writeFile("usuarios.json", JSON.stringify(usuarios, null, 2), (err) => {
                    if (err) {
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "Não é possível escrever no arquivo JSON" }));
                        return;
                    }

                rename(files.imagemDePerfil[0].filepath, caminhoImagem, (err)=>{
                    if(err){
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "Erro ao salvar a imagem" }));
                        return;
                    }
                })
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify(usuarios[indexUsuario]));
            })
        })


  }else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Página não encontrada" }));
  }
});
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});
