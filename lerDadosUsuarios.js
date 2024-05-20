import { readFile } from "node:fs"

const lerDadosUsuarios = (callback)=>{
    readFile('usuarios.json', 'utf-8', (err, data)=>{
        if(err){
            callback(err)
        }try{
            const usuarios = JSON.parse(data)
            callback(null, usuarios)
        }catch(err){
            callback(err)
        }
    })
}

export default lerDadosUsuarios;