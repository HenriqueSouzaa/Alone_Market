import React, { useState, useRef, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom';
import Header from '../../../components/Header';
import Menu from '../../../components/Menu';
import Footer from '../../../components/Footer';
import useApi from '../../../helpers/AloneAPI';
import {mudarTitulo, isLogged, validarCNPJ, validarCPF} from '../../../helpers/AuthHandler';

import {ExportCSV} from './ExportCSV';

import { useReactToPrint } from 'react-to-print';

import { ComponentToPrint } from './ComponentToPrint';

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { Impressao } from './Impressao';
pdfMake.vfs = pdfFonts.pdfMake.vfs;


const Page = () => {

    let api = useApi();
    let logged = isLogged();
    mudarTitulo("Listar Fornecedores");

    const componentRef = useRef(0);
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
      });
    const fileName = "ListaFornecedores";

    const [fornecedorList, setFornecedorList] = useState([]);
    const [listarFornecedor, setListarFornecedor] = useState([]);
    const [id, setId] = useState('');
    const [nome, setNome] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [cpf, setCpf] = useState('');
    const [fone, setFone] = useState('');
    const [cep, setCep] = useState('');
    const [novoBairro, setNovoBairro] = useState('');
    const [status, setStatus] = useState('');
    const [busca, setBusca] = useState('');
    
    const [pessoaFisica, setPessoaFisica] = useState(false);
    const [pessoaJuridica, setPessoaJuridica] = useState(false);
    const [tipo, setTipo] = useState('');   
    const [novoTipo, setNovoTipo] = useState('');

    useEffect(()=>{
        const getListFornecedor = async () => {
            const fornecedores = await api.listarTodosFornecedores();
            setListarFornecedor(fornecedores);
        }
        
        getListFornecedor();
        
    }, []);

    const handleGerarDocumento = async () => {
        const classeImpressao = new Impressao(listarFornecedor);
        const documento = await classeImpressao.PreparaDocumento();
        pdfMake.createPdf(documento).open();
    }

    const handleAlterar = async (e) => {
        
        e.preventDefault();

        if(!logged){
            alert("Voc?? n??o est?? logado!");
        }

        if(cnpj === fornecedorList[handlePosicao(id)].cnpj &&
           cpf === fornecedorList[handlePosicao(id)].cpf &&
           nome === fornecedorList[handlePosicao(id)].name &&
           fone === fornecedorList[handlePosicao(id)].telefone &&
           novoBairro === fornecedorList[handlePosicao(id)].bairro &&
           cep === fornecedorList[handlePosicao(id)].cep &&
           novoTipo === fornecedorList[handlePosicao(id)].tipo)
           
           {
                alert("Ao menos um campo precisa ser alterado antes de ser enviado!");
                return;
           }    

        if(cnpj && pessoaFisica){ 
            alert("Tipo de fornecedor inv??lido! \nEscolha CNPJ para pessoa Jur??dica ou CPF para pessoa f??sica.");
            return;
        }

        if(cpf && pessoaJuridica){
            alert("Tipo de fornecedor inv??lido! \nEscolha CNPJ para pessoa Jur??dica ou CPF para pessoa f??sica.");
            return;
        }

        if(!novoBairro || !fone || !cep || !nome){
            alert("Os campos n??o devem ser salvos em branco!");
            return;
        }

        if(pessoaJuridica && !cnpj){
            alert("Informe o CNPJ da empresa!");
            return;
        }

        if(pessoaFisica && !cpf){
            alert("Informe o CPF do fornecedor!");
            return;
        }

        if(!pessoaFisica && cpf){
            alert("Marque o Checkbox correspondente a Pessoa F??sica!");
            return;
        }

        if(!pessoaJuridica && cnpj){
            alert("Marque o Checkbox correspondente a Pessoa Jur??dica!");
            return;
        }

        if(cnpj){
            let cnpjCheck = false, 
                foneCheck = false,
                cepCheck = false;
            if(cnpj.length < 18){ 
                cnpjCheck = true;
            }

            if(!validarCNPJ(cnpj)){
                alert("Os n??meros informados n??o correspondem a um CNPJ v??lido. \nInforme um CNPJ v??lido.");
                return;
            }
            
            if(fone.length < 14){
                foneCheck = true;
            }
            if(cep.length < 9){
                cepCheck = true;
            }
            if(cnpjCheck || foneCheck || cepCheck){
                alert((cnpjCheck ? "CNPJ Inv??lido. Faltando: "+(18 - cnpj.length)+" d??gito!" : '')
                +(foneCheck ? "\nTelefone inv??lido. Faltando: "+(14 - fone.length)+" d??gito!" : '')
                +(cepCheck ? "\nCEP Inv??lido. Faltando: "+(9 - cep.length)+" d??gito!" : ''));
                return;
            }
        } 

        if(cpf){
            let cpfCheck = false, 
                foneCheck = false,
                cepCheck = false;

            if(cpf.length < 14){
                cpfCheck = true;
            }

            if(!validarCPF(cpf)){
                alert("Os n??meros informados n??o correspondem a um CPF v??lido. \nInforme um CPF v??lido.");
                return;
            }

            if(fone.length < 14){
                foneCheck = true;
            }
            if(cep.length < 9){
                cepCheck = true;
            }
            if(cpfCheck || foneCheck || cepCheck){
                alert((cpfCheck ? "CPF Inv??lido. Faltando: "+(14 - cpf.length)+" d??gito!" : '')
                +(foneCheck ? "\nTelefone inv??lido. Faltando: "+(14 - fone.length)+" d??gito!" : '')
                +(cepCheck ? "\nCEP Inv??lido. Faltando: "+(9 - cep.length)+" d??gito!" : ''));
                return;
            }
        }       
        
        const json = await api.fornecedorUpdate(id, cnpj, cpf, nome, novoTipo, fone, novoBairro, cep);

        if(json.error){
            alert(JSON.stringify(json.error));
        }else{
            alert("O Fornecedor foi atualizado com sucesso!");
            
        }

        setCnpj('');
        setCpf('');
        setNome('');
        setFone('');                                    
        setNovoBairro('');
        setCep('');
        setStatus('');
        setNovoTipo('');
        setTipo('');
        window.location.reload("/listarFornecedor");

    }


    const handlePosicao = (n) => {
        for(let i in fornecedorList){
            if(fornecedorList[i]._id === n){
                return i;
            }
        }
    }

    const handleEditar = (index) => {
        setId(fornecedorList[handlePosicao(index)]._id);
        setCnpj(fornecedorList[handlePosicao(index)].cnpj);
        setCpf(fornecedorList[handlePosicao(index)].cpf);
        setNome(fornecedorList[handlePosicao(index)].name);
        setFone(fornecedorList[handlePosicao(index)].telefone);
        setNovoBairro(fornecedorList[handlePosicao(index)].bairro);
        setCep(fornecedorList[handlePosicao(index)].cep);
        setTipo(fornecedorList[handlePosicao(index)].tipo);

    }
    
    const fornecedorFiltro = fornecedorList.filter((fornecedor) => fornecedor.name.toLowerCase().includes(busca.toLowerCase()) ||
     fornecedor.telefone.includes(busca) ||
     (fornecedor.cpf ? fornecedor.cpf.includes(busca) : null) ||
     (fornecedor.cnpj ? fornecedor.cnpj.includes(busca) : null) ||
     fornecedor.bairro.toLowerCase().includes(busca.toLowerCase()) ||
     fornecedor.cep.includes(busca));

    const handlePessoaFisica = async () => {
        (pessoaFisica) ? setPessoaFisica(false) : setPessoaFisica(true);
        if(pessoaFisica){
            setFornecedorList([]);
            setTipo('');
        } else{
            const fornecedorPFisica = await api.listarFornecedor("pessoaFisica");
            setFornecedorList(fornecedorPFisica);
            setTipo("pessoaFisica");
            setPessoaJuridica(false);
        }
    }

    const handlePessoaJuridica = async () => {
        (pessoaJuridica) ? setPessoaJuridica(false) : setPessoaJuridica(true);
        if(pessoaJuridica){
            setFornecedorList([]);
            setTipo('');
        } else{
            const fornecedorPJuridica = await api.listarFornecedor("pessoaJuridica");
            setFornecedorList(fornecedorPJuridica);
            setTipo("pessoaJuridica");
            setPessoaFisica(false);
            
        }
    }

    const handleStatus = async (id, status) => {
        
        var res=window.confirm("Realmente deseja alterar o Status do Fornecedor?");

        if(!logged){
            alert("Voc?? n??o est?? logado!");
        }
        if(res){
            const json = await api.fornecedorStatus(id, status);
            if(json.error){
                alert(JSON.stringify(json.error));
            }            
            window.location.reload("/listarFornecedor");            
        }else{
            return;
        }

    }

    return (
        <BrowserRouter>
            <Header/>
            <Menu/>
            <div class="content-wrapper">
                    {/* Main content */}
                    <section className="content">
                    <div className="container-fluid">
                        <div className="row">
                        <div className="col-12">
                            <div className="card card-primary mt-1">
                                <div className="card-header">
                                    <h3 className="card-title">Listar Fornecedores</h3>
                                    
                                </div>

                                {/* /.card-header */}
                                <div className="card-body"> 
                                    <div class="card">
                                        <div className="card-body table-responsive pad d-flex flex-wrapper">
                                            <div className="btn-group ">
                                                <ExportCSV csvData={listarFornecedor} fileName={fileName} />

                                                <button type="button" className="btn btn-success" onClick={()=>{handleGerarDocumento()}}>
                                                    PDF
                                                </button>
                                                <div style={{ display: "none" }}>
                                                    <ComponentToPrint dadosParaImpressao={listarFornecedor} ref={componentRef} />                                                    
                                                </div>
                                                <button type="button" className="btn btn-success" onClick={handlePrint}>Print</button>                                                                                                                                                                               
                                            </div>
                                            
                                            <div style={{backgroundColor:"#FFF", width: 400, marginTop: 5}} class="ml-5">
                                                <label><input type="checkbox" checked={pessoaFisica} onChange={() => {handlePessoaFisica()}} /> F??sica</label>
                                                <label class="ml-3"><input type="checkbox" checked={pessoaJuridica} onChange={() => {handlePessoaJuridica()}} /> Jur??dica</label>
                                            </div>                                                                                                                                                                                                                        
                                            
                                            <div style={{marginLeft: 150}}>
                                                <div className="input-group">
                                                    <div className="input-group-prepend">
                                                        <div className="input-group-text">
                                                            <span className="fas fa-search" />
                                                        </div>
                                                        <input style={{wdith: 198}} type="text" className="form-control" value={busca} onChange={(e) => {setBusca(e.target.value)}}/>
                                                    </div>
                                                </div>    
                                            </div>
                                        </div>
                                        
                                    </div>                                    
                                        {tipo === 'pessoaFisica' ?
                                            <table style={{fontSize: 13}} className="table table-bordered table-hover">
                                                <thead>
                                                    <tr class="text-center">                                                    
                                                        <th>CPF</th>
                                                        <th>Raz??o Social</th>
                                                        <th>Telefone</th>
                                                        <th>Bairro</th>
                                                        <th>CEP</th>     
                                                        <th>Tipo</th>                                                                                                                                       
                                                        <th>Alterar</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>                                                                                   
                                                <tbody>
                                                    {fornecedorFiltro.map(( item ) => {                                                        
                                                        return(
                                                            item.status === 'Ativo' ?
                                                                <tr className="text-left" key={item}>                                                        
                                                                    <td>{item.cpf}</td>    
                                                                    <td>{item.name}</td>
                                                                    <td>{item.telefone}</td>
                                                                    <td>{item.bairro}</td>
                                                                    <td>{item.cep}</td>  
                                                                    <td>{item.tipo}</td>                                                      
                                                                    <td>
                                                                        <ul className="navbar-nav ml-auto text-center">
                                                                            <li data-toggle="modal" data-target="#modal-xl1"  onClick={() => {handleEditar(item._id); setCnpj('')}} className="nav-item dropdown">
                                                                                <a className="nav-link">
                                                                                    <i className="far fa-edit" />
                                                                                </a>
                                                                            </li>
                                                                        </ul>
                                                                    </td>
                                                                    <td>
                                                                        <ul className="navbar-nav ml-auto text-center">
                                                                            <li onClick={() => {handleStatus(item._id, "Inativo")}} className="nav-item dropdown">
                                                                                <a className="nav-link">
                                                                                    <i className="fas fa-toggle-on" />
                                                                                </a>
                                                                            </li>
                                                                        </ul>
                                                                    </td>                                                      
                                                                </tr>   
                                                               :                                                               
                                                                <tr className="text-left" key={item}>                                                        
                                                                    <td class="text-black-50">{item.cpf}</td>    
                                                                    <td class="text-black-50">{item.name}</td>
                                                                    <td class="text-black-50">{item.telefone}</td>
                                                                    <td class="text-black-50">{item.bairro}</td>
                                                                    <td class="text-black-50">{item.cep}</td>    
                                                                    <td class="text-black-50">{item.tipo}</td>                                                    
                                                                    <td>
                                                                        <ul className="navbar-nav ml-auto text-center">
                                                                            <li data-toggle="modal" data-target="#modal-xl1"  onClick={() => {handleEditar(item._id); setCnpj('')}} className="nav-item dropdown">
                                                                                <a className="nav-link">
                                                                                    <i className="far fa-edit" />
                                                                                </a>
                                                                            </li>
                                                                        </ul>
                                                                    </td>    
                                                                    <td>
                                                                        <ul className="navbar-nav ml-auto text-center">
                                                                            <li onClick={() => {handleStatus(item._id, "Ativo")}} className="nav-item dropdown">
                                                                                <a className="nav-link">
                                                                                    <i className="fas fa-toggle-off" />
                                                                                </a>
                                                                            </li>
                                                                        </ul>
                                                                    </td>                                                  
                                                                </tr>                                                   
                                                        );
                                                    })}                                                    
                                                </tbody>                                            
                                                <tfoot>
                                                    <tr class="text-center">                                                        
                                                        <th>CPF</th>
                                                        <th>Raz??o Social</th>
                                                        <th>Telefone</th>
                                                        <th>Bairro</th>
                                                        <th>CEP</th>      
                                                        <th>Tipo</th>                                                                                                                                      
                                                        <th>Alterar</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </tfoot>                                                                                        
                                            </table>
                                            :
                                            tipo === 'pessoaJuridica' ?
                                            <table style={{fontSize: 13}} className="table table-bordered table-hover">
                                                <thead>
                                                    <tr class="text-center">                                                    
                                                        <th>CNPJ</th>
                                                        <th>Raz??o Social</th>
                                                        <th>Telefone</th>
                                                        <th>Bairro</th>
                                                        <th>CEP</th>     
                                                        <th>Tipo</th>                                                                                                                                  
                                                        <th>Alterar</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>                                                                                   
                                                <tbody>
                                                    {fornecedorFiltro.map(( item ) => {
                                                        return(
                                                            item.status === 'Ativo' ?
                                                                <tr className="text-left" key={item}>                                                        
                                                                    <td>{item.cnpj}</td>    
                                                                    <td>{item.name}</td>
                                                                    <td>{item.telefone}</td>
                                                                    <td>{item.bairro}</td>
                                                                    <td>{item.cep}</td>    
                                                                    <td>{item.tipo}</td>                                                    
                                                                    <td>
                                                                        <ul className="navbar-nav ml-auto text-center">
                                                                            <li data-toggle="modal" data-target="#modal-xl1"  onClick={() => {handleEditar(item._id); setCpf('')}} className="nav-item dropdown">
                                                                                <a className="nav-link">
                                                                                    <i className="far fa-edit" />
                                                                                </a>
                                                                            </li>
                                                                        </ul>
                                                                    </td>  
                                                                    <td>
                                                                        <ul className="navbar-nav ml-auto text-center">
                                                                            <li onClick={() => {handleStatus(item._id, "Inativo")}} className="nav-item dropdown">
                                                                                <a className="nav-link">
                                                                                    <i className="fas fa-toggle-on" />
                                                                                </a>
                                                                            </li>
                                                                        </ul>
                                                                    </td>                                                             
                                                                </tr>   
                                                            :

                                                            <tr className="text-left" key={item}>                                                        
                                                                    <td class="text-black-50">{item.cnpj}</td>    
                                                                    <td class="text-black-50">{item.name}</td>
                                                                    <td class="text-black-50">{item.telefone}</td>
                                                                    <td class="text-black-50">{item.bairro}</td>
                                                                    <td class="text-black-50">{item.cep}</td> 
                                                                    <td class="text-black-50">{item.tipo}</td>                                                       
                                                                    <td>
                                                                        <ul className="navbar-nav ml-auto text-center">
                                                                            <li data-toggle="modal" data-target="#modal-xl1"  onClick={() => {handleEditar(item._id); setCpf('')}} className="nav-item dropdown">
                                                                                <a className="nav-link">
                                                                                    <i className="far fa-edit" />
                                                                                </a>
                                                                            </li>
                                                                        </ul>
                                                                    </td>  
                                                                    <td>
                                                                        <ul className="navbar-nav ml-auto text-center">
                                                                            <li onClick={() => {handleStatus(item._id, "Ativo")}} className="nav-item dropdown">
                                                                                <a className="nav-link">
                                                                                    <i className="fas fa-toggle-off" />
                                                                                </a>
                                                                            </li>
                                                                        </ul>
                                                                    </td>                                                             
                                                                </tr>                                                      
                                                        );
                                                    })}
                                                </tbody>                                            
                                                <tfoot>
                                                    <tr class="text-center">                                                        
                                                        <th>CNPJ</th>
                                                        <th>Raz??o Social</th>
                                                        <th>Telefone</th>
                                                        <th>Bairro</th>
                                                        <th>CEP</th>    
                                                        <th>Tipo</th>                                                                                                                                        
                                                        <th>Alterar</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </tfoot>                                                                                        
                                            </table>
                                            :
                                            <table style={{fontSize: 13}} className="table table-bordered table-hover">
                                                <thead>
                                                    <tr class="text-center">                                                    
                                                        <th>CNPJ</th>
                                                        <th>CPF</th>
                                                        <th>Raz??o Social</th>
                                                        <th>Telefone</th>
                                                        <th>Bairro</th>
                                                        <th>CEP</th>
                                                        <th>Tipo</th>                                                                                                                                            
                                                        <th>Alterar</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>                                                                                   
                                                <tbody>                                                    
                                                    <tr >                                                        
                                                        <td></td>    
                                                        <td></td>    
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>                                                        
                                                        <td></td>                                                    
                                                    </tr>                                                                                                          
                                                </tbody>                                            
                                                <tfoot>
                                                    <tr class="text-center">  
                                                        <th>CNPJ</th>                                                      
                                                        <th>CPF</th>
                                                        <th>Raz??o Social</th>
                                                        <th>Telefone</th>
                                                        <th>Bairro</th>
                                                        <th>CEP</th>    
                                                        <th>tipo</th>                                                                                                                                        
                                                        <th>Alterar</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </tfoot>                                                                                        
                                            </table>
                                        }                                            
                                          
                                </div>
                                {/* /.card-body */}
                            </div>
                            
                        </div>
                        {/* /.col */}
                        </div>
                        {/* /.row */}
                    </div>
                    {/* /.container-fluid */}
                        <div className="modal fade" id="modal-xl1">
                            <div className="modal-dialog modal-xl">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h4 className="modal-title">Alterar dados do Fornecedor</h4>
                                        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true" onClick={() => {setPessoaFisica(false); setPessoaJuridica(false); setTipo('')}} >??</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <div style={{padding: 30, marginLeft: 40, display:"flex", flexWrap:"wrap"}}>
                                            <div >
                                                {/* Nome do Produto */}
                                                <label>CNPJ:</label>
                                                <div style={{backgroundColor: "#FFF", width: 238}} className="form-group">
                                                    <div className="input-group-prepend">
                                                        <div className="input-group-text">
                                                            <span className="fas fa-building" />
                                                        </div>
                                                        <input type="text" className="form-control" value={cnpj} onChange={(e) => {setCnpj(e.target.value.replace(/\D/g, '')
                                                            .replace(/(\d{2})(\d)/, '$1.$2')
                                                            .replace(/(\d{3})(\d)/, '$1.$2')
                                                            .replace(/(\d{3})(\d)/, '$1/$2')
                                                            .replace(/(\d{4})(\d)/, '$1-$2')
                                                            .replace(/(-\d{2})\d+?$/, '$1')
                                                            )}} 
                                                        />
                                                    </div>
                                                </div>    
                                            </div>
                                            <div class="ml-5">
                                                {/* Nome do Produto */}
                                                <label>CPF:</label>
                                                <div style={{width: 238}} className="form-group">
                                                    <div className="input-group-prepend">
                                                        <div className="input-group-text">
                                                            <span className="far fa-address-card" />
                                                        </div>
                                                        <input type="text" className="form-control" value={cpf} onChange={(e) => {setCpf(e.target.value.replace(/\D/g, '')
                                                            .replace(/(\d{3})(\d)/, '$1.$2')
                                                            .replace(/(\d{3})(\d)/, '$1.$2')
                                                            .replace(/(\d{3})(\d)/, '$1-$2')					                    
                                                            .replace(/(-\d{2})\d+?$/, '$1')
                                                            )}} 
                                                        />
                                                    </div>
                                                </div>    
                                            </div>
                                            <div class="ml-5">
                                                {/* Nome do Produto */}
                                                <label>Raz??o Social:</label>
                                                <br />
                                                <div style={{width: 238}} className="form-group">
                                                    <div className="input-group-prepend">
                                                        <div className="input-group-text">
                                                            <span className="fas fa-building" />
                                                        </div>
                                                        <input type="text" className="form-control" value={nome} onChange={(e) => {setNome(e.target.value)}} />
                                                    </div>
                                                </div>    
                                            </div>
                                            <div class="mt-2">
                                                {/* Fornecedor */}
                                                <label>Telefone:</label>
                                                <div style={{width: 238}} className="form-group mb-1">
                                                    <div className="input-group-prepend">
                                                        <div className="input-group-text">
                                                            <span className="fas fa-phone-square" />
                                                        </div>
                                                        <input type="text" className="form-control" value={fone} onChange={(e) => {setFone(e.target.value.replace(/\D/g, '')
                                                            .replace(/(\d{2})(\d)/, '($1) $2')
                                                            .replace(/(\d{4})(\d)/, '$1-$2')
                                                            .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
                                                            .replace(/(-\d{4})\d+?$/, '$1'))}} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                    
                                            <div class="ml-5 mt-2">
                                                {/* Fabricante */}
                                                <label>Bairro:</label>
                                                <div style={{width: 238}} className="form-group">
                                                    <div className="input-group-prepend">
                                                        <div className="input-group-text">
                                                            <span className="fas fa-city" />
                                                        </div>
                                                        <input type="text" className="form-control" value={novoBairro} onChange={(e) => {setNovoBairro(e.target.value)}} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="ml-5 mt-2">
                                                {/*Pre??o do Produto*/}
                                                <label>CEP:</label>
                                                <div style={{width: 238}} className="form-group mb-1">
                                                    <div className="input-group-prepend">
                                                        <div className="input-group-text">
                                                            <span className="fas fa-envelope" />
                                                        </div>
                                                        <input type="text" className="form-control" value={cep} onChange={(e) => {setCep(e.target.value.replace(/\D/g, '')
                                                            .replace(/(\d{5})(\d)/, '$1-$2')
                                                            .replace(/(-\d{3})\d+?$/, '$1')
                                                        )}} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div style={{width: 286}} class="mt-4">
                                                <label style={{fontSize: 18}}>Pessoa F??sica:</label>
                                                <div>
                                                    <input type="checkbox" checked={pessoaFisica} onChange={() => {setPessoaFisica(!pessoaFisica); setPessoaJuridica(!pessoaJuridica)}} onClick={() => {setNovoTipo("pessoaJuridica")}} /> 
                                                </div>
                                            </div>
                        
                                            <div style={{width: 250}} class="mt-4">
                                                <label style={{fontSize: 18}}>Pessoa Jur??dica:</label>
                                                <div>
                                                    <input type="checkbox" checked={pessoaJuridica} onChange={() => {setPessoaJuridica(!pessoaJuridica); setPessoaFisica(!pessoaFisica)}} onClick={() => {setNovoTipo("pessoaFisica")}} /> 
                                                </div>
                                            </div>
                                            
                                            </div>
                                        </div>
                                            <div className="modal-footer justify-content-between">
                                                <button type="button" className="btn btn-default" data-dismiss="modal">Fechar</button>
                                                <button type="button" className="btn btn-primary" onClick={handleAlterar}>Salvar</button>
                                            </div>
                                </div>
                                {/* /.modal-content */}
                            </div>
                            {/* /.modal-dialog */}
                        </div>
                    </section>
                    {/* /.content */}
                </div>
            <Footer/>
        </BrowserRouter>
    )
}

export default Page;