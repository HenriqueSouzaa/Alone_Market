const { validationResult, matchedData } = require('express-validator');


const Produto = require('../models/Produto');
const Estoque = require('../models/Estoque');

module.exports = {
    addEstoque: async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({error: errors.mapped()});
            return;
        }

        const data = matchedData(req);
        let produto = await Produto.findOne({codigoDeBarras: data.codigoDeBarras});

        if(!produto){
            res.json({error: 'Produto não cadastrado!'});
            return;
        }

        const newEstoque = new Estoque({
            idProduto: produto._id,
            qtd: data.qtd,
            vencido: false,
            qtdMinima: data.qtdMinima,
            dataValidade: data.dataValidade
        });
        await newEstoque.save();
    
        res.json({codigoDeBarras: produto.codigoDeBarras, name: produto.name, qtd: data.qtd,
            qtdMinima: data.qtdMinima, preco: produto.preco, status: produto.status, dataCadastro: produto.dataCadastro,
            dataValidade: data.dataValidade, unidadeDeMedida: produto.unidadeDeMedida, pesoVolume: produto.pesoVolume, 
            fabricante: produto.fabricante, fornecedor: produto.fornecedor, vencido: data.vencido});
        
    },
    listarEstoque: async (req, res) => {
        let produto = await Produto.find({status: "Ativo"});
        let estoque = await Estoque.find();

        let listaEstoque = [];

        for(let j in estoque){
            for(let i in produto){
                if(String(estoque[j].idProduto) == produto[i]._id){
                    listaEstoque.push({
                        
                        codigoDeBarras: produto[i].codigoDeBarras,
                        name: produto[i].name,
                        preco: produto[i].valorVenda,
                        qtd: estoque[j].qtd,
                        qtdMinima: estoque[j].qtdMinima,
                        valorEstoque: (parseFloat(produto[i].valorVenda) * estoque[j].qtd).toFixed(2),
                        dataValidade: estoque[j].dataValidade,
                        dataCadastro: produto[i].dataCadastro,
                        unidadeDeMedida: produto[i].unidadeDeMedida,
                        pesoVolume: produto[i].pesoVolume,
                        fabricante: produto[i].fabricante,
                        fornecedor: produto[i].fornecedor,
                        vencido: estoque[j].vencido,


                        _id: estoque[j]._id
                    });
                }
            }
        }

        res.json({listaEstoque});
    },

    listarEstolMobile: async (req, res) => {
        let produto = await Produto.find({status: "Ativo"});
        let estoque = await Estoque.find({vencido: false});

        let listaEstoque = [];

        for(let j in estoque){
            for(let i in produto){
                if(String(estoque[j].idProduto) == produto[i]._id){
                    listaEstoque.push({
                        
                        codigoDeBarras: produto[i].codigoDeBarras,
                        name: produto[i].name,
                        preco: produto[i].valorVenda,
                        qtd: estoque[j].qtd,                                                
                        dataValidade: estoque[j].dataValidade,                                                                        
                        _id: estoque[j]._id
                    });
                }
            }
        }
        res.json(listaEstoque);
    },

    estokUpdate: async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({error: errors.mapped()});
            return;
        }

        const data = matchedData(req);

        const estoque = await Estoque.findOne({_id: data._id});

        let updates = {};

        
        if(data.novaQTD){
	        updates.qtd = data.novaQTD;
        }

        if(data.novaDataValidade){
            updates.dataValidade = data.novaDataValidade;
        }

        if(data.novaQtdMinima){
            updates.qtdMinima = data.novaQtdMinima;
        }

        await Estoque.findOneAndUpdate({_id: data._id}, {$set: updates});

        res.json({});
    },

    getItemEstoque: async (req, res) =>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({error: errors.mapped()});
            return;
        }

        const data = matchedData(req);

        let prodCheck = await Produto.findOne({codigoDeBarras: data.codigoDeBarras});
        if(!prodCheck){
            res.json({error: 'Código inválido!'});
            return;
        }
        let stokCheck = await Estoque.find({idProduto: prodCheck._id});
        
        let itemStok = {};
        for(let j in stokCheck){
            if(stokCheck[j].dataValidade == data.dataValidade){                
                itemStok = {codigoDeBarras: prodCheck.codigoDeBarras,
                                name: prodCheck.name,                                
                                valorVenda: prodCheck.valorVenda,
                                pesoVolume: prodCheck.pesoVolume,
                                unidadeDeMedida: prodCheck.unidadeDeMedida,
                                dataValidade: stokCheck[j].dataValidade,
                                vencido: stokCheck[j].vencido}                                
            }
        }
         
        res.json({itemStok});
    },

    altProdVencido: async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({error: errors.mapped()});
            return;
        }

        const data = matchedData(req);

        const calcularData = (dataNew) => {
            let dataNova = dataNew.split("/");
            let data = new Date(dataNova[2] + "/" + dataNova[1] + "/" + dataNova[0]);   
            let dataAtual = new Date();            
            let diferenca = Date.parse(dataConverter(data)) - Date.parse(dataConverter(dataAtual));            
            let days = diferenca/(1000* 3600 * 24);                    
            return days;        
        }
    
        const dataConverter = (data) =>{
            return data.getFullYear() + "/" + String(data.getMonth()).padStart(2, '0') + "/" + String(data.getDate()).padStart(2, '0');
        }
        
        let updates = {};
        let estoque = await Estoque.find();

        for(let index in estoque){
            if(data.identificador == 1){
                if(calcularData(estoque[index].dataValidade) < 0){
                    updates.vencido = data.vencido;
                    await Estoque.findOneAndUpdate({_id: estoque[index]._id}, {$set: updates});
                    res.json({});
                }                
            }
            if(data.identificador == 2){
                if(data._id == estoque[index]._id){
                    updates.vencido = data.vencido;
                    await Estoque.findOneAndUpdate({_id: estoque[index]._id}, {$set: updates});
                    res.json({});
                }
            }
            
        }
                  
    }
};
