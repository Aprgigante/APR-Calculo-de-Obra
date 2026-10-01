/* =========================================================
   SUPABASE / AUTENTICAÇÃO
   ========================================================= */

const SUPABASE_URL = "https://ipkjtdinkqzuagzlvftp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_T2cOb45OwFgwyEAhmnV8Cw_MoS4atx5";

let supabaseClient = null;

function obterSupabase() {
    if (!supabaseClient) {
        if (!window.supabase || typeof window.supabase.createClient !== "function") {
            throw new Error("A biblioteca do Supabase não foi carregada.");
        }
        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );
    }
    return supabaseClient;
}

function mostrarMensagemAuth(mensagem, erro = false) {
    const el = document.getElementById("authMensagem");
    if (!el) return;
    el.textContent = mensagem || "";
    el.classList.toggle("erro", erro);
}

function mostrarLogin() {
    document.getElementById("authLoginForm").style.display = "block";
    document.getElementById("authCadastroForm").style.display = "none";
    mostrarMensagemAuth("");
}

function mostrarCadastro() {
    document.getElementById("authLoginForm").style.display = "none";
    document.getElementById("authCadastroForm").style.display = "block";
    mostrarMensagemAuth("");
}

function mostrarAplicativo(usuario) {
    const auth = document.getElementById("authTela");
    const app = document.getElementById("appShell");
    const conta = document.getElementById("aprUsuarioLogado");

    if (auth) auth.style.display = "none";
    if (app) app.style.display = "block";

    if (conta && usuario) {
        const nome = usuario.user_metadata?.nome || usuario.user_metadata?.full_name;
        conta.textContent = nome
            ? `${nome} • ${usuario.email || ""}`
            : (usuario.email || "Usuário conectado");
    }
}

function mostrarTelaLogin() {
    const auth = document.getElementById("authTela");
    const app = document.getElementById("appShell");
    if (auth) auth.style.display = "flex";
    if (app) app.style.display = "none";
    mostrarLogin();
}

async function entrarNoSistema() {
    const email = document.getElementById("authLoginEmail")?.value.trim();
    const senha = document.getElementById("authLoginSenha")?.value;

    if (!email || !senha) {
        mostrarMensagemAuth("Informe o e-mail e a senha.", true);
        return;
    }

    try {
        mostrarMensagemAuth("Entrando...");
        const { error } = await obterSupabase().auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        mostrarMensagemAuth("");
    } catch (erro) {
        mostrarMensagemAuth(erro?.message || "Não foi possível entrar.", true);
    }
}

async function criarConta() {
    const nome = document.getElementById("authCadastroNome")?.value.trim();
    const telefone = document.getElementById("authCadastroTelefone")?.value.trim();
    const email = document.getElementById("authCadastroEmail")?.value.trim();
    const senha = document.getElementById("authCadastroSenha")?.value;

    if (!nome || !email || !senha) {
        mostrarMensagemAuth("Informe nome, e-mail e senha.", true);
        return;
    }

    if (senha.length < 6) {
        mostrarMensagemAuth("A senha deve ter pelo menos 6 caracteres.", true);
        return;
    }

    try {
        mostrarMensagemAuth("Criando sua conta...");
        const { data, error } = await obterSupabase().auth.signUp({
            email,
            password: senha,
            options: {
                data: {
                    nome,
                    telefone
                }
            }
        });

        if (error) throw error;

        if (data.session) {
            mostrarMensagemAuth("Conta criada com sucesso.");
        } else {
            mostrarMensagemAuth("Conta criada. Verifique seu e-mail para confirmar o cadastro.");
            document.getElementById("authCadastroSenha").value = "";
        }
    } catch (erro) {
        mostrarMensagemAuth(erro?.message || "Não foi possível criar a conta.", true);
    }
}

async function recuperarSenha() {
    const email = document.getElementById("authLoginEmail")?.value.trim();

    if (!email) {
        mostrarMensagemAuth("Informe seu e-mail primeiro para receber o link de recuperação.", true);
        return;
    }

    try {
        const redirectTo = window.location.origin + window.location.pathname;
        const { error } = await obterSupabase().auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        mostrarMensagemAuth("Se o e-mail estiver cadastrado, enviaremos o link de recuperação.");
    } catch (erro) {
        mostrarMensagemAuth(erro?.message || "Não foi possível solicitar a recuperação.", true);
    }
}

async function sairDoSistema() {
    try {
        const { error } = await obterSupabase().auth.signOut();
        if (error) throw error;
    } catch (erro) {
        alert(erro?.message || "Não foi possível sair.");
    }
}

async function iniciarAutenticacao() {
    try {
        const client = obterSupabase();

        const { data: { session } } = await client.auth.getSession();

        if (session?.user) {
            mostrarAplicativo(session.user);
        } else {
            mostrarTelaLogin();
        }

        client.auth.onAuthStateChange((_event, novaSessao) => {
            if (novaSessao?.user) {
                mostrarAplicativo(novaSessao.user);
            } else {
                mostrarTelaLogin();
            }
        });
    } catch (erro) {
        console.error(erro);
        mostrarTelaLogin();
        mostrarMensagemAuth("Não foi possível conectar ao sistema de acesso.", true);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    iniciarAutenticacao();
});

/* =========================================================
   CLIENTES
   ========================================================= */

let clienteEditandoId = null;

function obterUsuarioAutenticado() {
    return obterSupabase().auth.getSession().then(function (resultado) {
        const sessao = resultado?.data?.session;
        if (!sessao?.user) {
            throw new Error("Sua sessão expirou. Entre novamente para continuar.");
        }
        return sessao.user;
    });
}

function mostrarMensagemCliente(mensagem, erro = false) {
    const el = document.getElementById("clienteMensagem");
    if (!el) return;
    el.textContent = mensagem || "";
    el.classList.toggle("erro", erro);
}

function limparFormularioCliente() {
    const form = document.getElementById("formCliente");
    if (form) form.reset();
    clienteEditandoId = null;
    const titulo = document.getElementById("clienteFormTitulo");
    if (titulo) titulo.textContent = "Novo cliente";
    mostrarMensagemCliente("");
}

function novoCliente() {
    limparFormularioCliente();
    const campo = document.getElementById("clienteNome");
    if (campo) {
        setTimeout(function () {
            campo.focus();
            campo.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    }
}

function cancelarEdicaoCliente() {
    limparFormularioCliente();
}

function escaparHtmlCliente(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatarInfoCliente(rotulo, valor) {
    if (!valor) return "";
    return `<div><strong>${rotulo}:</strong> ${escaparHtmlCliente(valor)}</div>`;
}

async function carregarClientes() {
    const lista = document.getElementById("listaClientes");
    if (!lista) return;

    lista.innerHTML = '<div class="apr-clientes-vazio">Carregando clientes...</div>';

    try {
        const usuario = await obterUsuarioAutenticado();
        const { data, error } = await obterSupabase()
            .from("clientes")
            .select("id, nome, telefone, email, cpf_cnpj, endereco, observacoes, created_at, updated_at")
            .eq("user_id", usuario.id)
            .order("nome", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            lista.innerHTML = '<div class="apr-clientes-vazio">Nenhum cliente cadastrado ainda.<br>Clique em <strong>＋ Novo cliente</strong> para começar.</div>';
            return;
        }

        lista.innerHTML = data.map(function (cliente) {
            const contato = [
                formatarInfoCliente("Telefone", cliente.telefone),
                formatarInfoCliente("E-mail", cliente.email),
                formatarInfoCliente("CPF/CNPJ", cliente.cpf_cnpj),
                formatarInfoCliente("Endereço", cliente.endereco)
            ].filter(Boolean).join("");

            const observacoes = cliente.observacoes
                ? `<div class="apr-cliente-observacoes"><strong>Observações:</strong><br>${escaparHtmlCliente(cliente.observacoes)}</div>`
                : "";

            return `
                <article class="apr-cliente-card">
                    <div class="apr-cliente-topo">
                        <div><h3>${escaparHtmlCliente(cliente.nome)}</h3></div>
                        <div class="apr-cliente-acoes">
                            <button type="button" onclick="editarCliente('${cliente.id}')">Editar</button>
                            <button type="button" onclick="excluirCliente('${cliente.id}')">Excluir</button>
                        </div>
                    </div>
                    ${contato ? `<div class="apr-cliente-info">${contato}</div>` : ""}
                    ${observacoes}
                </article>
            `;
        }).join("");
    } catch (erro) {
        console.error("Erro ao carregar clientes:", erro);
        lista.innerHTML = `<div class="apr-clientes-vazio" style="color:#b42318;">Não foi possível carregar os clientes.<br>${escaparHtmlCliente(erro?.message || "Erro desconhecido")}</div>`;
    }
}

async function editarCliente(id) {
    try {
        const usuario = await obterUsuarioAutenticado();
        const { data, error } = await obterSupabase()
            .from("clientes")
            .select("id, nome, telefone, email, cpf_cnpj, endereco, observacoes")
            .eq("id", id)
            .eq("user_id", usuario.id)
            .single();

        if (error) throw error;
        if (!data) throw new Error("Cliente não encontrado.");

        clienteEditandoId = data.id;
        document.getElementById("clienteNome").value = data.nome || "";
        document.getElementById("clienteTelefone").value = data.telefone || "";
        document.getElementById("clienteEmail").value = data.email || "";
        document.getElementById("clienteCpfCnpj").value = data.cpf_cnpj || "";
        document.getElementById("clienteEndereco").value = data.endereco || "";
        document.getElementById("clienteObservacoes").value = data.observacoes || "";
        document.getElementById("clienteFormTitulo").textContent = "Editar cliente";
        mostrarMensagemCliente("");

        document.getElementById("formCliente").scrollIntoView({ behavior: "smooth", block: "start" });
        document.getElementById("clienteNome").focus();
    } catch (erro) {
        console.error("Erro ao editar cliente:", erro);
        mostrarMensagemCliente(erro?.message || "Não foi possível carregar o cliente.", true);
    }
}

async function excluirCliente(id) {
    const confirmar = window.confirm("Deseja realmente excluir este cliente?");
    if (!confirmar) return;

    try {
        const usuario = await obterUsuarioAutenticado();

        const { count, error: erroObras } = await obterSupabase()
            .from("obras")
            .select("id", { count: "exact", head: true })
            .eq("cliente_id", id)
            .eq("user_id", usuario.id);

        if (erroObras) throw erroObras;

        if (Number(count || 0) > 0) {
            alert("Este cliente já possui obra(s) cadastrada(s).\n\nPor segurança, o cliente não será excluído para não apagar os dados relacionados.");
            return;
        }

        const { error } = await obterSupabase()
            .from("clientes")
            .delete()
            .eq("id", id)
            .eq("user_id", usuario.id);

        if (error) throw error;

        if (clienteEditandoId === id) limparFormularioCliente();
        await carregarClientes();
    } catch (erro) {
        console.error("Erro ao excluir cliente:", erro);
        alert(erro?.message || "Não foi possível excluir o cliente.");
    }
}

async function salvarCliente(evento) {
    evento.preventDefault();

    const nome = document.getElementById("clienteNome")?.value.trim();
    const telefone = document.getElementById("clienteTelefone")?.value.trim();
    const email = document.getElementById("clienteEmail")?.value.trim();
    const cpfCnpj = document.getElementById("clienteCpfCnpj")?.value.trim();
    const endereco = document.getElementById("clienteEndereco")?.value.trim();
    const observacoes = document.getElementById("clienteObservacoes")?.value.trim();

    if (!nome) {
        mostrarMensagemCliente("Informe o nome do cliente.", true);
        document.getElementById("clienteNome")?.focus();
        return;
    }

    try {
        mostrarMensagemCliente(clienteEditandoId ? "Atualizando cliente..." : "Salvando cliente...");
        const usuario = await obterUsuarioAutenticado();
        const dados = {
            nome,
            telefone: telefone || null,
            email: email || null,
            cpf_cnpj: cpfCnpj || null,
            endereco: endereco || null,
            observacoes: observacoes || null
        };

        let resultado;

        if (clienteEditandoId) {
            resultado = await obterSupabase()
                .from("clientes")
                .update(dados)
                .eq("id", clienteEditandoId)
                .eq("user_id", usuario.id);
        } else {
            resultado = await obterSupabase()
                .from("clientes")
                .insert({ ...dados, user_id: usuario.id });
        }

        if (resultado.error) throw resultado.error;

        const mensagemSucesso = clienteEditandoId
            ? "Cliente atualizado com sucesso."
            : "Cliente salvo com sucesso.";

        limparFormularioCliente();
        mostrarMensagemCliente(mensagemSucesso);
        await carregarClientes();
    } catch (erro) {
        console.error("Erro ao salvar cliente:", erro);
        mostrarMensagemCliente(erro?.message || "Não foi possível salvar o cliente.", true);
    }
}

/* =========================================================
   OBRAS
   ========================================================= */

let obraEditandoId = null;

function mostrarMensagemObra(mensagem, erro = false) {
    const el = document.getElementById("obraMensagem");
    if (!el) return;
    el.textContent = mensagem || "";
    el.classList.toggle("erro", erro);
}

function limparFormularioObra() {
    const form = document.getElementById("formObra");
    if (form) form.reset();
    obraEditandoId = null;
    const titulo = document.getElementById("obraFormTitulo");
    if (titulo) titulo.textContent = "Nova obra";
    mostrarMensagemObra("");
}

function novaObra() {
    limparFormularioObra();
    carregarClientesParaObra().then(function () {
        const campo = document.getElementById("obraCliente");
        if (campo) {
            setTimeout(function () {
                campo.focus();
                campo.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
        }
    });
}

function cancelarEdicaoObra() {
    limparFormularioObra();
}

async function carregarClientesParaObra() {
    const select = document.getElementById("obraCliente");
    if (!select) return;

    select.innerHTML = '<option value="">Carregando clientes...</option>';

    try {
        const usuario = await obterUsuarioAutenticado();
        const { data, error } = await obterSupabase()
            .from("clientes")
            .select("id, nome")
            .eq("user_id", usuario.id)
            .order("nome", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            select.innerHTML = '<option value="">Cadastre um cliente primeiro</option>';
            return;
        }

        select.innerHTML = '<option value="">Selecione o cliente</option>' +
            data.map(function (cliente) {
                return `<option value="${cliente.id}">${escaparHtmlCliente(cliente.nome)}</option>`;
            }).join("");
    } catch (erro) {
        console.error("Erro ao carregar clientes para obra:", erro);
        select.innerHTML = '<option value="">Não foi possível carregar os clientes</option>';
        mostrarMensagemObra(erro?.message || "Não foi possível carregar os clientes.", true);
    }
}

async function carregarObras() {
    const lista = document.getElementById("listaObras");
    if (!lista) return;

    lista.innerHTML = '<div class="apr-clientes-vazio">Carregando obras...</div>';

    try {
        const usuario = await obterUsuarioAutenticado();
        const { data: obras, error: erroObras } = await obterSupabase()
            .from("obras")
            .select("id, cliente_id, nome, endereco, observacoes, created_at, updated_at")
            .eq("user_id", usuario.id)
            .order("nome", { ascending: true });

        if (erroObras) throw erroObras;

        if (!obras || obras.length === 0) {
            lista.innerHTML = '<div class="apr-clientes-vazio">Nenhuma obra cadastrada ainda.<br>Clique em <strong>＋ Nova obra</strong> para começar.</div>';
            return;
        }

        const idsClientes = [...new Set(obras.map(o => o.cliente_id).filter(Boolean))];
        let mapaClientes = {};

        if (idsClientes.length) {
            const { data: clientes, error: erroClientes } = await obterSupabase()
                .from("clientes")
                .select("id, nome")
                .eq("user_id", usuario.id)
                .in("id", idsClientes);

            if (erroClientes) throw erroClientes;
            (clientes || []).forEach(function (cliente) {
                mapaClientes[cliente.id] = cliente.nome;
            });
        }

        lista.innerHTML = obras.map(function (obra) {
            const clienteNome = mapaClientes[obra.cliente_id] || "Cliente não encontrado";
            const detalhes = [
                `<div><strong>Cliente:</strong> ${escaparHtmlCliente(clienteNome)}</div>`,
                obra.endereco ? `<div><strong>Endereço:</strong> ${escaparHtmlCliente(obra.endereco)}</div>` : ""
            ].filter(Boolean).join("");

            const observacoes = obra.observacoes
                ? `<div class="apr-cliente-observacoes"><strong>Observações:</strong><br>${escaparHtmlCliente(obra.observacoes)}</div>`
                : "";

            return `
                <article class="apr-cliente-card">
                    <div class="apr-cliente-topo">
                        <div><h3>${escaparHtmlCliente(obra.nome)}</h3></div>
                        <div class="apr-cliente-acoes">
                            <button type="button" onclick="editarObra('${obra.id}')">Editar</button>
                            <button type="button" onclick="excluirObra('${obra.id}')">Excluir</button>
                        </div>
                    </div>
                    <div class="apr-cliente-info">${detalhes}</div>
                    ${observacoes}
                </article>
            `;
        }).join("");
    } catch (erro) {
        console.error("Erro ao carregar obras:", erro);
        lista.innerHTML = `<div class="apr-clientes-vazio" style="color:#b42318;">Não foi possível carregar as obras.<br>${escaparHtmlCliente(erro?.message || "Erro desconhecido")}</div>`;
    }
}

async function editarObra(id) {
    try {
        const usuario = await obterUsuarioAutenticado();
        const { data, error } = await obterSupabase()
            .from("obras")
            .select("id, cliente_id, nome, endereco, observacoes")
            .eq("id", id)
            .eq("user_id", usuario.id)
            .single();

        if (error) throw error;
        if (!data) throw new Error("Obra não encontrada.");

        obraEditandoId = data.id;
        await carregarClientesParaObra();
        document.getElementById("obraCliente").value = data.cliente_id || "";
        document.getElementById("obraNome").value = data.nome || "";
        document.getElementById("obraEndereco").value = data.endereco || "";
        document.getElementById("obraObservacoes").value = data.observacoes || "";
        document.getElementById("obraFormTitulo").textContent = "Editar obra";
        mostrarMensagemObra("");

        document.getElementById("formObra").scrollIntoView({ behavior: "smooth", block: "start" });
        document.getElementById("obraNome").focus();
    } catch (erro) {
        console.error("Erro ao editar obra:", erro);
        mostrarMensagemObra(erro?.message || "Não foi possível carregar a obra.", true);
    }
}

async function excluirObra(id) {
    const confirmar = window.confirm("Deseja realmente excluir esta obra?");
    if (!confirmar) return;

    try {
        const usuario = await obterUsuarioAutenticado();
        const { error } = await obterSupabase()
            .from("obras")
            .delete()
            .eq("id", id)
            .eq("user_id", usuario.id);

        if (error) throw error;

        if (obraEditandoId === id) limparFormularioObra();
        await carregarObras();
    } catch (erro) {
        console.error("Erro ao excluir obra:", erro);
        alert(erro?.message || "Não foi possível excluir a obra.");
    }
}

async function salvarObra(evento) {
    evento.preventDefault();

    const clienteId = document.getElementById("obraCliente")?.value;
    const nome = document.getElementById("obraNome")?.value.trim();
    const endereco = document.getElementById("obraEndereco")?.value.trim();
    const observacoes = document.getElementById("obraObservacoes")?.value.trim();

    if (!clienteId) {
        mostrarMensagemObra("Selecione o cliente da obra.", true);
        document.getElementById("obraCliente")?.focus();
        return;
    }

    if (!nome) {
        mostrarMensagemObra("Informe o nome da obra.", true);
        document.getElementById("obraNome")?.focus();
        return;
    }

    try {
        mostrarMensagemObra(obraEditandoId ? "Atualizando obra..." : "Salvando obra...");
        const usuario = await obterUsuarioAutenticado();
        const dados = {
            cliente_id: clienteId,
            nome,
            endereco: endereco || null,
            observacoes: observacoes || null
        };

        let resultado;

        if (obraEditandoId) {
            resultado = await obterSupabase()
                .from("obras")
                .update(dados)
                .eq("id", obraEditandoId)
                .eq("user_id", usuario.id);
        } else {
            resultado = await obterSupabase()
                .from("obras")
                .insert({ ...dados, user_id: usuario.id });
        }

        if (resultado.error) throw resultado.error;

        const mensagemSucesso = obraEditandoId
            ? "Obra atualizada com sucesso."
            : "Obra salva com sucesso.";

        limparFormularioObra();
        await carregarClientesParaObra();
        mostrarMensagemObra(mensagemSucesso);
        await carregarObras();
    } catch (erro) {
        console.error("Erro ao salvar obra:", erro);
        mostrarMensagemObra(erro?.message || "Não foi possível salvar a obra.", true);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formCliente");
    if (form) form.addEventListener("submit", salvarCliente);

    const formObra = document.getElementById("formObra");
    if (formObra) formObra.addEventListener("submit", salvarObra);

    const formOrcamento = document.getElementById("formOrcamento");
    if (formOrcamento) formOrcamento.addEventListener("submit", salvarOrcamento);

    const selectClienteOrcamento = document.getElementById("orcamentoCliente");
    if (selectClienteOrcamento) {
        selectClienteOrcamento.addEventListener("change", function () {
            carregarObrasParaOrcamento(this.value);
        });
    }
});

/* =========================================================
   ORÇAMENTOS - ETAPA 1
   ========================================================= */

let orcamentoEditandoId = null;

function mostrarMensagemOrcamento(mensagem, erro = false) {
    const el = document.getElementById("orcamentoMensagem");
    if (!el) return;
    el.textContent = mensagem || "";
    el.classList.toggle("erro", erro);
}

function limparFormularioOrcamento() {
    const form = document.getElementById("formOrcamento");
    if (form) form.reset();
    orcamentoEditandoId = null;

    const titulo = document.getElementById("orcamentoFormTitulo");
    if (titulo) titulo.textContent = "Novo orçamento";

    const obra = document.getElementById("orcamentoObra");
    if (obra) {
        obra.innerHTML = '<option value="">Selecione primeiro o cliente</option>';
        obra.disabled = true;
    }

    mostrarMensagemOrcamento("");
}

function novoOrcamento() {
    limparFormularioOrcamento();
    carregarClientesParaOrcamento().then(function () {
        const campo = document.getElementById("orcamentoCliente");
        if (campo) {
            setTimeout(function () {
                campo.focus();
                campo.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
        }
    });
}

function cancelarEdicaoOrcamento() {
    limparFormularioOrcamento();
}

async function carregarClientesParaOrcamento() {
    const select = document.getElementById("orcamentoCliente");
    if (!select) return;

    select.innerHTML = '<option value="">Carregando clientes...</option>';

    try {
        const usuario = await obterUsuarioAutenticado();
        const { data, error } = await obterSupabase()
            .from("clientes")
            .select("id, nome")
            .eq("user_id", usuario.id)
            .order("nome", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            select.innerHTML = '<option value="">Cadastre um cliente primeiro</option>';
            const obra = document.getElementById("orcamentoObra");
            if (obra) {
                obra.innerHTML = '<option value="">Cadastre um cliente primeiro</option>';
                obra.disabled = true;
            }
            return;
        }

        select.innerHTML = '<option value="">Selecione o cliente</option>' +
            data.map(function (cliente) {
                return `<option value="${cliente.id}">${escaparHtmlCliente(cliente.nome)}</option>`;
            }).join("");
    } catch (erro) {
        console.error("Erro ao carregar clientes para orçamento:", erro);
        select.innerHTML = '<option value="">Não foi possível carregar os clientes</option>';
        mostrarMensagemOrcamento(erro?.message || "Não foi possível carregar os clientes.", true);
    }
}

async function carregarObrasParaOrcamento(clienteId, obraSelecionadaId = "") {
    const select = document.getElementById("orcamentoObra");
    if (!select) return;

    if (!clienteId) {
        select.innerHTML = '<option value="">Selecione primeiro o cliente</option>';
        select.disabled = true;
        return;
    }

    select.innerHTML = '<option value="">Carregando obras...</option>';
    select.disabled = true;

    try {
        const usuario = await obterUsuarioAutenticado();
        const { data, error } = await obterSupabase()
            .from("obras")
            .select("id, nome")
            .eq("user_id", usuario.id)
            .eq("cliente_id", clienteId)
            .order("nome", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            select.innerHTML = '<option value="">Este cliente ainda não possui obra</option>';
            select.disabled = true;
            return;
        }

        select.innerHTML = '<option value="">Selecione a obra</option>' +
            data.map(function (obra) {
                return `<option value="${obra.id}">${escaparHtmlCliente(obra.nome)}</option>`;
            }).join("");
        select.disabled = false;

        if (obraSelecionadaId) {
            select.value = obraSelecionadaId;
        }
    } catch (erro) {
        console.error("Erro ao carregar obras para orçamento:", erro);
        select.innerHTML = '<option value="">Não foi possível carregar as obras</option>';
        select.disabled = true;
        mostrarMensagemOrcamento(erro?.message || "Não foi possível carregar as obras.", true);
    }
}

async function proximoNumeroOrcamento(usuarioId) {
    const { data, error } = await obterSupabase()
        .from("orcamentos")
        .select("numero")
        .eq("user_id", usuarioId)
        .not("numero", "is", null)
        .order("numero", { ascending: false })
        .limit(1);

    if (error) throw error;

    const ultimo = data && data.length ? Number(data[0].numero) : 0;
    return Number.isFinite(ultimo) ? ultimo + 1 : 1;
}

async function carregarOrcamentos() {
    const lista = document.getElementById("listaOrcamentos");
    if (!lista) return;

    lista.innerHTML = '<div class="apr-orcamento-vazio">Carregando orçamentos...</div>';

    try {
        const usuario = await obterUsuarioAutenticado();
        const { data: orcamentos, error: erroOrcamentos } = await obterSupabase()
            .from("orcamentos")
            .select("id, cliente_id, obra_id, numero, descricao, status, total_materiais, total_mao_obra, total_geral, created_at, updated_at")
            .eq("user_id", usuario.id)
            .order("created_at", { ascending: false });

        if (erroOrcamentos) throw erroOrcamentos;

        if (!orcamentos || orcamentos.length === 0) {
            lista.innerHTML = '<div class="apr-orcamento-vazio">Nenhum orçamento cadastrado ainda.<br>Clique em <strong>＋ Novo orçamento</strong> para começar.</div>';
            return;
        }

        const idsClientes = [...new Set(orcamentos.map(o => o.cliente_id).filter(Boolean))];
        const idsObras = [...new Set(orcamentos.map(o => o.obra_id).filter(Boolean))];
        const mapaClientes = {};
        const mapaObras = {};

        if (idsClientes.length) {
            const { data: clientes, error } = await obterSupabase()
                .from("clientes")
                .select("id, nome")
                .eq("user_id", usuario.id)
                .in("id", idsClientes);
            if (error) throw error;
            (clientes || []).forEach(function (cliente) {
                mapaClientes[cliente.id] = cliente.nome;
            });
        }

        if (idsObras.length) {
            const { data: obras, error } = await obterSupabase()
                .from("obras")
                .select("id, nome")
                .eq("user_id", usuario.id)
                .in("id", idsObras);
            if (error) throw error;
            (obras || []).forEach(function (obra) {
                mapaObras[obra.id] = obra.nome;
            });
        }

        lista.innerHTML = orcamentos.map(function (orcamento) {
            const clienteNome = mapaClientes[orcamento.cliente_id] || "Cliente não encontrado";
            const obraNome = mapaObras[orcamento.obra_id] || "Obra não encontrada";
            const numero = orcamento.numero ? `Orçamento nº ${escaparHtmlCliente(orcamento.numero)}` : "Orçamento sem número";
            const status = escaparHtmlCliente(orcamento.status || "rascunho");
            const descricao = orcamento.descricao
                ? `<div class="apr-cliente-observacoes"><strong>Descrição:</strong><br>${escaparHtmlCliente(orcamento.descricao)}</div>`
                : "";

            return `
                <article class="apr-orcamento-card">
                    <div class="apr-cliente-topo">
                        <div>
                            <h3>${numero}</h3>
                            <div style="margin-top:6px;"><span class="apr-orcamento-status">${status}</span></div>
                        </div>
                        <div class="apr-cliente-acoes">
                            <button type="button" onclick="editarOrcamento('${orcamento.id}')">Editar</button>
                            <button type="button" onclick="excluirOrcamento('${orcamento.id}')">Excluir</button>
                        </div>
                    </div>
                    <div class="apr-cliente-info">
                        <div><strong>Cliente:</strong> ${escaparHtmlCliente(clienteNome)}</div>
                        <div><strong>Obra:</strong> ${escaparHtmlCliente(obraNome)}</div>
                        <div><strong>Materiais:</strong> ${dinheiro(Number(orcamento.total_materiais || 0))}</div>
                        <div><strong>Mão de obra:</strong> ${dinheiro(Number(orcamento.total_mao_obra || 0))}</div>
                    </div>
                    <div class="apr-orcamento-total" style="margin-top:12px;">Total: ${dinheiro(Number(orcamento.total_geral || 0))}</div>
                    ${descricao}
                </article>
            `;
        }).join("");
    } catch (erro) {
        console.error("Erro ao carregar orçamentos:", erro);
        lista.innerHTML = `<div class="apr-orcamento-vazio" style="color:#b42318;">Não foi possível carregar os orçamentos.<br>${escaparHtmlCliente(erro?.message || "Erro desconhecido")}</div>`;
    }
}

async function editarOrcamento(id) {
    try {
        const usuario = await obterUsuarioAutenticado();
        const { data, error } = await obterSupabase()
            .from("orcamentos")
            .select("id, cliente_id, obra_id, numero, descricao, status")
            .eq("id", id)
            .eq("user_id", usuario.id)
            .single();

        if (error) throw error;
        if (!data) throw new Error("Orçamento não encontrado.");

        orcamentoEditandoId = data.id;
        await carregarClientesParaOrcamento();
        document.getElementById("orcamentoCliente").value = data.cliente_id || "";
        await carregarObrasParaOrcamento(data.cliente_id, data.obra_id);
        document.getElementById("orcamentoNumero").value = data.numero || "";
        document.getElementById("orcamentoStatus").value = data.status || "rascunho";
        document.getElementById("orcamentoDescricao").value = data.descricao || "";
        document.getElementById("orcamentoFormTitulo").textContent = "Editar orçamento";
        mostrarMensagemOrcamento("");

        document.getElementById("formOrcamento").scrollIntoView({ behavior: "smooth", block: "start" });
        document.getElementById("orcamentoCliente").focus();
    } catch (erro) {
        console.error("Erro ao editar orçamento:", erro);
        mostrarMensagemOrcamento(erro?.message || "Não foi possível carregar o orçamento.", true);
    }
}

async function excluirOrcamento(id) {
    const confirmar = window.confirm("Deseja realmente excluir este orçamento? Os itens vinculados a ele também serão excluídos.");
    if (!confirmar) return;

    try {
        const usuario = await obterUsuarioAutenticado();
        const { error } = await obterSupabase()
            .from("orcamentos")
            .delete()
            .eq("id", id)
            .eq("user_id", usuario.id);

        if (error) throw error;

        if (orcamentoEditandoId === id) limparFormularioOrcamento();
        await carregarOrcamentos();
    } catch (erro) {
        console.error("Erro ao excluir orçamento:", erro);
        alert(erro?.message || "Não foi possível excluir o orçamento.");
    }
}

async function salvarOrcamento(evento) {
    evento.preventDefault();

    const clienteId = document.getElementById("orcamentoCliente")?.value;
    const obraId = document.getElementById("orcamentoObra")?.value;
    const numeroCampo = document.getElementById("orcamentoNumero")?.value.trim();
    const descricao = document.getElementById("orcamentoDescricao")?.value.trim();
    const status = document.getElementById("orcamentoStatus")?.value || "rascunho";

    if (!clienteId) {
        mostrarMensagemOrcamento("Selecione o cliente do orçamento.", true);
        document.getElementById("orcamentoCliente")?.focus();
        return;
    }

    if (!obraId) {
        mostrarMensagemOrcamento("Selecione a obra do orçamento.", true);
        document.getElementById("orcamentoObra")?.focus();
        return;
    }

    let numero = numeroCampo ? Number(numeroCampo) : null;
    if (numeroCampo && (!Number.isInteger(numero) || numero < 1)) {
        mostrarMensagemOrcamento("O número do orçamento deve ser um número inteiro maior que zero.", true);
        document.getElementById("orcamentoNumero")?.focus();
        return;
    }

    try {
        mostrarMensagemOrcamento(orcamentoEditandoId ? "Atualizando orçamento..." : "Salvando orçamento...");
        const usuario = await obterUsuarioAutenticado();

        if (!orcamentoEditandoId && numero === null) {
            numero = await proximoNumeroOrcamento(usuario.id);
        }

        const dados = {
            cliente_id: clienteId,
            obra_id: obraId,
            numero,
            descricao: descricao || null,
            status,
            total_materiais: 0,
            total_mao_obra: 0,
            total_geral: 0
        };

        let resultado;

        if (orcamentoEditandoId) {
            const dadosEdicao = {
                cliente_id: clienteId,
                obra_id: obraId,
                numero,
                descricao: descricao || null,
                status
            };
            resultado = await obterSupabase()
                .from("orcamentos")
                .update(dadosEdicao)
                .eq("id", orcamentoEditandoId)
                .eq("user_id", usuario.id);
        } else {
            resultado = await obterSupabase()
                .from("orcamentos")
                .insert({ ...dados, user_id: usuario.id });
        }

        if (resultado.error) throw resultado.error;

        const mensagemSucesso = orcamentoEditandoId
            ? "Orçamento atualizado com sucesso."
            : `Orçamento nº ${numero} salvo com sucesso.`;

        limparFormularioOrcamento();
        await carregarClientesParaOrcamento();
        mostrarMensagemOrcamento(mensagemSucesso);
        await carregarOrcamentos();
    } catch (erro) {
        console.error("Erro ao salvar orçamento:", erro);
        mostrarMensagemOrcamento(erro?.message || "Não foi possível salvar o orçamento.", true);
    }
}

/* =========================================================
   APR GIGANTE - CÁLCULO DE OBRA
   ========================================================= */


/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function esconderTodasAsTelas() {

    document.getElementById("inicio").style.display = "none";
    document.getElementById("clientes").style.display = "none";
    document.getElementById("obras").style.display = "none";
    document.getElementById("orcamentos").style.display = "none";
    document.getElementById("impermeabilizacao").style.display = "none";
    document.getElementById("alvenaria").style.display = "none";
    document.getElementById("chapisco").style.display = "none";
    document.getElementById("emboco").style.display = "none";
    document.getElementById("contrapiso").style.display = "none";
    document.getElementById("piso").style.display = "none";
    document.getElementById("concreto").style.display = "none";
    document.getElementById("fundacao").style.display = "none";
    document.getElementById("vigaBaldrame").style.display = "none";
    document.getElementById("blocoFundacao").style.display = "none";
    document.getElementById("pintura").style.display = "none";
    document.getElementById("hidraulica").style.display = "none";
    document.getElementById("esgoto").style.display = "none";
    document.getElementById("ralosCaixas").style.display = "none";
    document.getElementById("caixaAgua").style.display = "none";
    document.getElementById("telhado").style.display = "none";
    document.getElementById("calhasRufos").style.display = "none";
    document.getElementById("forro").style.display = "none";
    document.getElementById("aparelhosHidraulicos").style.display = "none";
    document.getElementById("eletricaPontos").style.display = "none";
    document.getElementById("eletricaCabos").style.display = "none";
    document.getElementById("eletricaQuadro").style.display = "none";
    document.getElementById("eletricaProtecoes").style.display = "none";
    document.getElementById("eletricaAterramento").style.display = "none";
    document.getElementById("eletricaEntradaEnergia").style.display = "none";
}


function abrirObras() {

    esconderTodasAsTelas();

    document.getElementById("obras").style.display = "block";

    limparFormularioObra();
    carregarClientesParaObra();
    carregarObras();
    rolarParaTopo();
}

function abrirOrcamentos() {

    esconderTodasAsTelas();

    document.getElementById("orcamentos").style.display = "block";

    limparFormularioOrcamento();
    carregarClientesParaOrcamento();
    carregarOrcamentos();
    rolarParaTopo();
}


function abrirClientes() {

    esconderTodasAsTelas();

    document.getElementById("clientes").style.display = "block";

    limparFormularioCliente();
    carregarClientes();
    rolarParaTopo();
}


function abrirAlvenaria() {

    esconderTodasAsTelas();

    document.getElementById("alvenaria").style.display = "block";

    rolarParaTopo();
}


function abrirChapisco() {

    esconderTodasAsTelas();

    document.getElementById("chapisco").style.display = "block";

    rolarParaTopo();
}


function abrirEmboco() {

    esconderTodasAsTelas();

    document.getElementById("emboco").style.display = "block";

    rolarParaTopo();
}


function abrirContrapiso() {

    esconderTodasAsTelas();

    document.getElementById("contrapiso").style.display = "block";

    rolarParaTopo();
}


function abrirPiso() {

    esconderTodasAsTelas();

    document.getElementById("piso").style.display = "block";

    rolarParaTopo();
}


function abrirConcreto() {

    esconderTodasAsTelas();

    document.getElementById("concreto").style.display = "block";

    rolarParaTopo();
}

function abrirFundacao() {

    esconderTodasAsTelas();

    document.getElementById("fundacao").style.display = "block";

    rolarParaTopo();
}


function abrirVigaBaldrame() {

    esconderTodasAsTelas();

    document.getElementById("vigaBaldrame").style.display = "block";

    rolarParaTopo();
}


function abrirBlocoFundacao() {

    esconderTodasAsTelas();

    document.getElementById("blocoFundacao").style.display = "block";

    rolarParaTopo();
}


function abrirPintura() {

    esconderTodasAsTelas();

    document.getElementById("pintura").style.display = "block";

    rolarParaTopo();
}


function abrirHidraulica() {

    esconderTodasAsTelas();

    document.getElementById("hidraulica").style.display = "block";

    rolarParaTopo();
}


function abrirEsgoto() {

    esconderTodasAsTelas();

    document.getElementById("esgoto").style.display = "block";

    rolarParaTopo();
}


function abrirRalosCaixas() {

    esconderTodasAsTelas();

    document.getElementById("ralosCaixas").style.display = "block";

    rolarParaTopo();
}


function abrirCaixaAgua() {

    esconderTodasAsTelas();

    document.getElementById("caixaAgua").style.display = "block";

    rolarParaTopo();
}


function abrirTelhado() {

    esconderTodasAsTelas();

    document.getElementById("telhado").style.display = "block";

    rolarParaTopo();
}


function abrirCalhasRufos() {

    esconderTodasAsTelas();

    document.getElementById("calhasRufos").style.display = "block";

    rolarParaTopo();
}


function abrirAparelhosHidraulicos() {

    esconderTodasAsTelas();

    document.getElementById("aparelhosHidraulicos").style.display = "block";

    rolarParaTopo();
}


function abrirForro() {

    esconderTodasAsTelas();

    document.getElementById("forro").style.display = "block";

    rolarParaTopo();
}


function abrirEletricaPontos() {

    esconderTodasAsTelas();

    document.getElementById("eletricaPontos").style.display = "block";

    rolarParaTopo();
}


function abrirEletricaCabos() {

    esconderTodasAsTelas();

    document.getElementById("eletricaCabos").style.display = "block";

    rolarParaTopo();
}

function abrirEletricaQuadro() {

    esconderTodasAsTelas();

    document.getElementById("eletricaQuadro").style.display = "block";

    rolarParaTopo();
}


function abrirEletricaProtecoes() {

    esconderTodasAsTelas();

    document.getElementById("eletricaProtecoes").style.display = "block";

    rolarParaTopo();
}


function abrirEletricaAterramento() {

    esconderTodasAsTelas();

    document.getElementById("eletricaAterramento").style.display = "block";

    rolarParaTopo();
}


function abrirEletricaEntradaEnergia() {

    esconderTodasAsTelas();

    document.getElementById("eletricaEntradaEnergia").style.display = "block";

    rolarParaTopo();
}


function espelharQuantidadesEletrica() {

    const mapa = {
        eletricaIluminacao: [
            "eletricaQtdMaoIluminacao",
            "eletricaQtdMaterialIluminacao"
        ],
        eletricaTomadaSimples: [
            "eletricaQtdMaoTomadaSimples",
            "eletricaQtdMaterialTomadaSimples"
        ],
        eletricaTomadaDupla: [
            "eletricaQtdMaoTomadaDupla",
            "eletricaQtdMaterialTomadaDupla"
        ],
        eletricaTomadaPotencia: [
            "eletricaQtdMaoTomadaPotencia",
            "eletricaQtdMaterialTomadaPotencia"
        ],
        eletricaInterruptorSimples: [
            "eletricaQtdMaoInterruptorSimples",
            "eletricaQtdMaterialInterruptorSimples"
        ],
        eletricaInterruptorParalelo: [
            "eletricaQtdMaoInterruptorParalelo",
            "eletricaQtdMaterialInterruptorParalelo"
        ]
    };

    Object.keys(mapa).forEach(function (origem) {

        const quantidade = Math.max(0, Math.floor(numero(origem)));

        mapa[origem].forEach(function (idDestino) {
            const campoDestino = document.getElementById(idDestino);

            if (campoDestino) {
                campoDestino.value = quantidade;
            }
        });
    });
}


document.addEventListener("input", function (evento) {

    const idsEletrica = [
        "eletricaIluminacao",
        "eletricaTomadaSimples",
        "eletricaTomadaDupla",
        "eletricaTomadaPotencia",
        "eletricaInterruptorSimples",
        "eletricaInterruptorParalelo"
    ];

    if (idsEletrica.includes(evento.target.id)) {
        espelharQuantidadesEletrica();
    }
});


document.addEventListener("DOMContentLoaded", function () {
    espelharQuantidadesEletrica();
});

function alternarMateriaisEletrica() {

    const checkbox = document.getElementById("eletricaCalcularMateriais");
    const campos = document.getElementById("eletricaMateriaisCampos");

    if (!checkbox || !campos) {
        return;
    }

    campos.style.display = checkbox.checked ? "block" : "none";

    const resultado = document.getElementById("resultadoEletricaPontos");

    if (resultado && resultado.style.display !== "none") {
        calcularEletricaPontos(false);
    }
}


function calcularEletricaPontos(rolarResultado = true) {

    const iluminacao = Math.max(0, Math.floor(numero("eletricaIluminacao")));
    const tomadaSimples = Math.max(0, Math.floor(numero("eletricaTomadaSimples")));
    const tomadaDupla = Math.max(0, Math.floor(numero("eletricaTomadaDupla")));
    const tomadaPotencia = Math.max(0, Math.floor(numero("eletricaTomadaPotencia")));
    const interruptorSimples = Math.max(0, Math.floor(numero("eletricaInterruptorSimples")));
    const interruptorParalelo = Math.max(0, Math.floor(numero("eletricaInterruptorParalelo")));

    const totalPontos =
        iluminacao +
        tomadaSimples +
        tomadaDupla +
        tomadaPotencia +
        interruptorSimples +
        interruptorParalelo;

    if (totalPontos <= 0) {
        alert("Informe pelo menos um ponto elétrico.");
        return;
    }

    const calcularMateriais =
        document.getElementById("eletricaCalcularMateriais")?.checked === true;

    let custoMateriais = 0;

    if (calcularMateriais) {

        const precoIluminacao = numero("eletricaPrecoIluminacao");
        const precoTomadaSimples = numero("eletricaPrecoTomadaSimples");
        const precoTomadaDupla = numero("eletricaPrecoTomadaDupla");
        const precoTomadaPotencia = numero("eletricaPrecoTomadaPotencia");
        const precoInterruptorSimples = numero("eletricaPrecoInterruptorSimples");
        const precoInterruptorParalelo = numero("eletricaPrecoInterruptorParalelo");
        const materiaisGerais = numero("eletricaMateriaisGerais");

        custoMateriais =
            (iluminacao * precoIluminacao) +
            (tomadaSimples * precoTomadaSimples) +
            (tomadaDupla * precoTomadaDupla) +
            (tomadaPotencia * precoTomadaPotencia) +
            (interruptorSimples * precoInterruptorSimples) +
            (interruptorParalelo * precoInterruptorParalelo) +
            materiaisGerais;
    }

    const maoIluminacao = numero("eletricaMaoIluminacao");
    const maoTomadaSimples = numero("eletricaMaoTomadaSimples");
    const maoTomadaDupla = numero("eletricaMaoTomadaDupla");
    const maoTomadaPotencia = numero("eletricaMaoTomadaPotencia");
    const maoInterruptorSimples = numero("eletricaMaoInterruptorSimples");
    const maoInterruptorParalelo = numero("eletricaMaoInterruptorParalelo");

    /* Espelhamento automático das quantidades */
    espelharQuantidadesEletrica();

    const custoMaoObra =
        (iluminacao * maoIluminacao) +
        (tomadaSimples * maoTomadaSimples) +
        (tomadaDupla * maoTomadaDupla) +
        (tomadaPotencia * maoTomadaPotencia) +
        (interruptorSimples * maoInterruptorSimples) +
        (interruptorParalelo * maoInterruptorParalelo);

    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("eletricaCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("eletricaCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("eletricaCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("eletricaResultadoIluminacao").textContent = iluminacao + " un.";
    document.getElementById("eletricaResultadoTomadaSimples").textContent = tomadaSimples + " un.";
    document.getElementById("eletricaResultadoTomadaDupla").textContent = tomadaDupla + " un.";
    document.getElementById("eletricaResultadoTomadaPotencia").textContent = tomadaPotencia + " un.";
    document.getElementById("eletricaResultadoInterruptorSimples").textContent = interruptorSimples + " un.";
    document.getElementById("eletricaResultadoInterruptorParalelo").textContent = interruptorParalelo + " un.";
    document.getElementById("eletricaResultadoTotalPontos").textContent = totalPontos + " un.";

    document.getElementById("eletricaCompraIluminacao").textContent =
        "💡 Iluminação: " + iluminacao + " ponto(s)";
    document.getElementById("eletricaCompraTomadaSimples").textContent =
        "🔌 Tomadas simples: " + tomadaSimples + " un.";
    document.getElementById("eletricaCompraTomadaDupla").textContent =
        "🔌 Tomadas duplas: " + tomadaDupla + " un.";
    document.getElementById("eletricaCompraTomadaPotencia").textContent =
        "⚡ Tomadas de uso específico: " + tomadaPotencia + " un.";
    document.getElementById("eletricaCompraInterruptorSimples").textContent =
        "🔘 Interruptores simples: " + interruptorSimples + " un.";
    document.getElementById("eletricaCompraInterruptorParalelo").textContent =
        "🔘 Interruptores paralelos: " + interruptorParalelo + " un.";

    if (rolarResultado) {
        mostrarResultadoEIrPara("resultadoEletricaPontos");
    } else {
        document.getElementById("resultadoEletricaPontos").style.display = "block";
    }
}


/* =========================================================
   ELÉTRICA — ELETRODUTOS E CABOS
   Quantificação conforme metragens informadas pelo usuário.
   ========================================================= */

function espelharQuantidadesEletricaCabos() {

    const mapa = {
        eletricaCabosCorrugado: [
            "eletricaCabosQtdMaoCorrugado",
            "eletricaCabosQtdMaterialCorrugado"
        ],
        eletricaCabosRigido: [
            "eletricaCabosQtdMaoRigido",
            "eletricaCabosQtdMaterialRigido"
        ],
        eletricaCabos15: [
            "eletricaCabosQtdMao15",
            "eletricaCabosQtdMaterial15"
        ],
        eletricaCabos25: [
            "eletricaCabosQtdMao25",
            "eletricaCabosQtdMaterial25"
        ],
        eletricaCabos4: [
            "eletricaCabosQtdMao4",
            "eletricaCabosQtdMaterial4"
        ],
        eletricaCabos6: [
            "eletricaCabosQtdMao6",
            "eletricaCabosQtdMaterial6"
        ],
        eletricaCabos10: [
            "eletricaCabosQtdMao10",
            "eletricaCabosQtdMaterial10"
        ],
        eletricaCabosCaixas: [
            "eletricaCabosQtdMaoCaixas",
            "eletricaCabosQtdMaterialCaixas"
        ]
    };

    Object.keys(mapa).forEach(function (origem) {

        const quantidade = numero(origem);

        mapa[origem].forEach(function (idDestino) {

            const destino = document.getElementById(idDestino);

            if (destino) {
                destino.value = quantidade;
            }
        });
    });
}


document.addEventListener("input", function (evento) {

    const ids = [
        "eletricaCabosCorrugado",
        "eletricaCabosRigido",
        "eletricaCabos15",
        "eletricaCabos25",
        "eletricaCabos4",
        "eletricaCabos6",
        "eletricaCabos10",
        "eletricaCabosCaixas"
    ];

    if (ids.includes(evento.target.id)) {
        espelharQuantidadesEletricaCabos();
    }
});


document.addEventListener("DOMContentLoaded", function () {
    espelharQuantidadesEletricaCabos();
});


function alternarMateriaisEletricaCabos() {

    const checkbox = document.getElementById("eletricaCabosCalcularMateriais");
    const campos = document.getElementById("eletricaCabosMateriaisCampos");

    if (!checkbox || !campos) {
        return;
    }

    campos.style.display = checkbox.checked ? "block" : "none";

    const resultado = document.getElementById("resultadoEletricaCabos");

    if (resultado && resultado.style.display !== "none") {
        calcularEletricaCabos(false);
    }
}


function calcularEletricaCabos(rolarResultado = true) {

    const corrugado = numero("eletricaCabosCorrugado");
    const rigido = numero("eletricaCabosRigido");
    const cabo15 = numero("eletricaCabos15");
    const cabo25 = numero("eletricaCabos25");
    const cabo4 = numero("eletricaCabos4");
    const cabo6 = numero("eletricaCabos6");
    const cabo10 = numero("eletricaCabos10");
    const caixas = Math.max(0, Math.floor(numero("eletricaCabosCaixas")));
    const perda = Math.max(0, numero("eletricaCabosPerda"));

    const totalMetros =
        corrugado + rigido + cabo15 + cabo25 + cabo4 + cabo6 + cabo10;

    if (totalMetros <= 0 && caixas <= 0) {
        alert("Informe pelo menos uma metragem de eletroduto/cabo ou uma quantidade de caixas.");
        return;
    }

    espelharQuantidadesEletricaCabos();

    const calcularMateriais =
        document.getElementById("eletricaCabosCalcularMateriais")?.checked === true;

    let custoMateriais = 0;

    if (calcularMateriais) {

        custoMateriais =
            (corrugado * numero("eletricaCabosPrecoCorrugado")) +
            (rigido * numero("eletricaCabosPrecoRigido")) +
            (cabo15 * numero("eletricaCabosPreco15")) +
            (cabo25 * numero("eletricaCabosPreco25")) +
            (cabo4 * numero("eletricaCabosPreco4")) +
            (cabo6 * numero("eletricaCabosPreco6")) +
            (cabo10 * numero("eletricaCabosPreco10")) +
            (caixas * numero("eletricaCabosPrecoCaixas"));
    }

    const custoMaoObra =
        (corrugado * numero("eletricaCabosMaoCorrugado")) +
        (rigido * numero("eletricaCabosMaoRigido")) +
        (cabo15 * numero("eletricaCabosMao15")) +
        (cabo25 * numero("eletricaCabosMao25")) +
        (cabo4 * numero("eletricaCabosMao4")) +
        (cabo6 * numero("eletricaCabosMao6")) +
        (cabo10 * numero("eletricaCabosMao10")) +
        (caixas * numero("eletricaCabosMaoCaixas"));

    const custoTotal = custoMateriais + custoMaoObra;
    const fatorPerda = 1 + (perda / 100);

    document.getElementById("eletricaCabosCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("eletricaCabosCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("eletricaCabosCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("eletricaCabosResultadoCorrugado").textContent = formatarNumero(corrugado, 2) + " m";
    document.getElementById("eletricaCabosResultadoRigido").textContent = formatarNumero(rigido, 2) + " m";
    document.getElementById("eletricaCabosResultado15").textContent = formatarNumero(cabo15, 2) + " m";
    document.getElementById("eletricaCabosResultado25").textContent = formatarNumero(cabo25, 2) + " m";
    document.getElementById("eletricaCabosResultado4").textContent = formatarNumero(cabo4, 2) + " m";
    document.getElementById("eletricaCabosResultado6").textContent = formatarNumero(cabo6, 2) + " m";
    document.getElementById("eletricaCabosResultado10").textContent = formatarNumero(cabo10, 2) + " m";
    document.getElementById("eletricaCabosResultadoCaixas").textContent = caixas + " un.";

    document.getElementById("eletricaCabosCompraCorrugado").textContent =
        "🔌 Eletroduto corrugado: " + formatarNumero(Math.ceil(corrugado * fatorPerda * 100) / 100, 2) + " m";
    document.getElementById("eletricaCabosCompraRigido").textContent =
        "🔌 Eletroduto rígido: " + formatarNumero(Math.ceil(rigido * fatorPerda * 100) / 100, 2) + " m";
    document.getElementById("eletricaCabosCompra15").textContent =
        "⚡ Cabo 1,5 mm²: " + formatarNumero(Math.ceil(cabo15 * fatorPerda * 100) / 100, 2) + " m";
    document.getElementById("eletricaCabosCompra25").textContent =
        "⚡ Cabo 2,5 mm²: " + formatarNumero(Math.ceil(cabo25 * fatorPerda * 100) / 100, 2) + " m";
    document.getElementById("eletricaCabosCompra4").textContent =
        "⚡ Cabo 4 mm²: " + formatarNumero(Math.ceil(cabo4 * fatorPerda * 100) / 100, 2) + " m";
    document.getElementById("eletricaCabosCompra6").textContent =
        "⚡ Cabo 6 mm²: " + formatarNumero(Math.ceil(cabo6 * fatorPerda * 100) / 100, 2) + " m";
    document.getElementById("eletricaCabosCompra10").textContent =
        "⚡ Cabo 10 mm²: " + formatarNumero(Math.ceil(cabo10 * fatorPerda * 100) / 100, 2) + " m";
    document.getElementById("eletricaCabosCompraCaixas").textContent =
        "📦 Caixas elétricas: " + caixas + " un.";

    if (rolarResultado) {
        mostrarResultadoEIrPara("resultadoEletricaCabos");
    } else {
        document.getElementById("resultadoEletricaCabos").style.display = "block";
    }
}


/* =========================================================
   ELÉTRICA — DISJUNTORES E PROTEÇÕES
   Quantidades informadas pelo usuário; materiais opcionais.
   ========================================================= */

function espelharQuantidadesEletricaProtecoes() {

    const mapa = {
        eletricaProtQtdMono: ["eletricaProtQtdMatMono", "eletricaProtQtdMaoMono"],
        eletricaProtQtdBi: ["eletricaProtQtdMatBi", "eletricaProtQtdMaoBi"],
        eletricaProtQtdTri: ["eletricaProtQtdMatTri", "eletricaProtQtdMaoTri"],
        eletricaProtQtdDR: ["eletricaProtQtdMatDR", "eletricaProtQtdMaoDR"],
        eletricaProtQtdDPS: ["eletricaProtQtdMatDPS", "eletricaProtQtdMaoDPS"],
        eletricaProtQtdFusivel: ["eletricaProtQtdMatFusivel", "eletricaProtQtdMaoFusivel"],
        eletricaProtQtdOutros: ["eletricaProtQtdMatOutros", "eletricaProtQtdMaoOutros"]
    };

    Object.keys(mapa).forEach(function (origem) {
        const quantidade = Math.max(0, Math.floor(numero(origem)));
        mapa[origem].forEach(function (idDestino) {
            const destino = document.getElementById(idDestino);
            if (destino) destino.value = quantidade;
        });
    });
}


document.addEventListener("input", function (evento) {
    const ids = [
        "eletricaProtQtdMono", "eletricaProtQtdBi", "eletricaProtQtdTri",
        "eletricaProtQtdDR", "eletricaProtQtdDPS", "eletricaProtQtdFusivel",
        "eletricaProtQtdOutros"
    ];
    if (ids.includes(evento.target.id)) espelharQuantidadesEletricaProtecoes();
});


document.addEventListener("DOMContentLoaded", function () {
    espelharQuantidadesEletricaProtecoes();
});


function alternarMateriaisEletricaProtecoes() {
    const checkbox = document.getElementById("eletricaProtCalcularMateriais");
    const campos = document.getElementById("eletricaProtMateriaisCampos");
    if (!checkbox || !campos) return;

    campos.style.display = checkbox.checked ? "block" : "none";

    const resultado = document.getElementById("resultadoEletricaProtecoes");
    if (resultado && resultado.style.display !== "none") {
        calcularEletricaProtecoes(false);
    }
}


function calcularEletricaProtecoes(rolarResultado = true) {

    espelharQuantidadesEletricaProtecoes();

    const mono = Math.max(0, Math.floor(numero("eletricaProtQtdMono")));
    const bi = Math.max(0, Math.floor(numero("eletricaProtQtdBi")));
    const tri = Math.max(0, Math.floor(numero("eletricaProtQtdTri")));
    const dr = Math.max(0, Math.floor(numero("eletricaProtQtdDR")));
    const dps = Math.max(0, Math.floor(numero("eletricaProtQtdDPS")));
    const fusivel = Math.max(0, Math.floor(numero("eletricaProtQtdFusivel")));
    const outros = Math.max(0, Math.floor(numero("eletricaProtQtdOutros")));

    const totalPecas = mono + bi + tri + dr + dps + fusivel + outros;

    if (totalPecas <= 0) {
        alert("Informe pelo menos uma quantidade de disjuntor ou proteção.");
        return;
    }

    const calcularMateriais = document.getElementById("eletricaProtCalcularMateriais")?.checked === true;

    let custoMateriais = 0;

    if (calcularMateriais) {
        custoMateriais =
            mono * numero("eletricaProtPrecoMono") +
            bi * numero("eletricaProtPrecoBi") +
            tri * numero("eletricaProtPrecoTri") +
            dr * numero("eletricaProtPrecoDR") +
            dps * numero("eletricaProtPrecoDPS") +
            fusivel * numero("eletricaProtPrecoFusivel") +
            outros * numero("eletricaProtPrecoOutros");
    }

    const custoMaoObra =
        mono * numero("eletricaProtMaoMono") +
        bi * numero("eletricaProtMaoBi") +
        tri * numero("eletricaProtMaoTri") +
        dr * numero("eletricaProtMaoDR") +
        dps * numero("eletricaProtMaoDPS") +
        fusivel * numero("eletricaProtMaoFusivel") +
        outros * numero("eletricaProtMaoOutros");

    const valores = {
        Mono: mono,
        Bi: bi,
        Tri: tri,
        DR: dr,
        DPS: dps,
        Fusivel: fusivel,
        Outros: outros
    };

    const nomes = {
        Mono: "🔧 Disjuntores monopolares",
        Bi: "🔧 Disjuntores bipolares",
        Tri: "🔧 Disjuntores tripolares",
        DR: "🛡️ DR",
        DPS: "🛡️ DPS",
        Fusivel: "🧰 Fusíveis / porta-fusíveis",
        Outros: "🛡️ Outras proteções"
    };

    Object.keys(valores).forEach(function (chave) {
        const resultado = document.getElementById("eletricaProtResultado" + chave);
        const compra = document.getElementById("eletricaProtCompra" + chave);
        if (resultado) resultado.textContent = valores[chave] + " un.";
        if (compra) compra.textContent = nomes[chave] + ": " + valores[chave] + " un.";
    });

    document.getElementById("eletricaProtCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("eletricaProtCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("eletricaProtCustoTotal").textContent = dinheiro(custoMateriais + custoMaoObra);

    if (rolarResultado) {
        mostrarResultadoEIrPara("resultadoEletricaProtecoes");
    } else {
        document.getElementById("resultadoEletricaProtecoes").style.display = "block";
    }
}


/* =========================================================
   ELÉTRICA — QUADRO DE DISTRIBUIÇÃO
   Quantidades informadas pelo usuário; materiais opcionais.
   ========================================================= */

function espelharQuantidadesEletricaQuadro() {

    const mapa = {
        eletricaQuadroQtdQuadro: ["eletricaQuadroQtdMaterialQuadro", "eletricaQuadroQtdMaoQuadro"],
        eletricaQuadroQtdMono: ["eletricaQuadroQtdMaterialMono", "eletricaQuadroQtdMaoMono"],
        eletricaQuadroQtdBi: ["eletricaQuadroQtdMaterialBi", "eletricaQuadroQtdMaoBi"],
        eletricaQuadroQtdTri: ["eletricaQuadroQtdMaterialTri", "eletricaQuadroQtdMaoTri"],
        eletricaQuadroQtdDR: ["eletricaQuadroQtdMaterialDR", "eletricaQuadroQtdMaoDR"],
        eletricaQuadroQtdDPS: ["eletricaQuadroQtdMaterialDPS", "eletricaQuadroQtdMaoDPS"],
        eletricaQuadroQtdBarramento: ["eletricaQuadroQtdMaterialBarramento", "eletricaQuadroQtdMaoBarramento"],
        eletricaQuadroQtdAcessorios: ["eletricaQuadroQtdMaterialAcessorios", "eletricaQuadroQtdMaoAcessorios"]
    };

    Object.keys(mapa).forEach(function (origem) {
        const quantidade = Math.max(0, Math.floor(numero(origem)));
        mapa[origem].forEach(function (idDestino) {
            const destino = document.getElementById(idDestino);
            if (destino) destino.value = quantidade;
        });
    });
}

document.addEventListener("input", function (evento) {
    const ids = [
        "eletricaQuadroQtdQuadro", "eletricaQuadroQtdMono", "eletricaQuadroQtdBi",
        "eletricaQuadroQtdTri", "eletricaQuadroQtdDR", "eletricaQuadroQtdDPS",
        "eletricaQuadroQtdBarramento", "eletricaQuadroQtdAcessorios"
    ];
    if (ids.includes(evento.target.id)) espelharQuantidadesEletricaQuadro();
});

document.addEventListener("DOMContentLoaded", function () {
    espelharQuantidadesEletricaQuadro();
});

function alternarMateriaisEletricaQuadro() {
    const checkbox = document.getElementById("eletricaQuadroCalcularMateriais");
    const campos = document.getElementById("eletricaQuadroMateriaisCampos");
    if (!checkbox || !campos) return;
    campos.style.display = checkbox.checked ? "block" : "none";
    const resultado = document.getElementById("resultadoEletricaQuadro");
    if (resultado && resultado.style.display !== "none") calcularEletricaQuadro(false);
}

function calcularEletricaQuadro(rolarResultado = true) {

    espelharQuantidadesEletricaQuadro();

    const quadro = Math.max(0, Math.floor(numero("eletricaQuadroQtdQuadro")));
    const mono = Math.max(0, Math.floor(numero("eletricaQuadroQtdMono")));
    const bi = Math.max(0, Math.floor(numero("eletricaQuadroQtdBi")));
    const tri = Math.max(0, Math.floor(numero("eletricaQuadroQtdTri")));
    const dr = Math.max(0, Math.floor(numero("eletricaQuadroQtdDR")));
    const dps = Math.max(0, Math.floor(numero("eletricaQuadroQtdDPS")));
    const barramento = Math.max(0, Math.floor(numero("eletricaQuadroQtdBarramento")));
    const acessorios = Math.max(0, Math.floor(numero("eletricaQuadroQtdAcessorios")));

    const totalPecas = quadro + mono + bi + tri + dr + dps + barramento + acessorios;
    if (totalPecas <= 0) {
        alert("Informe pelo menos uma quantidade do quadro de distribuição.");
        return;
    }

    const calcularMateriais = document.getElementById("eletricaQuadroCalcularMateriais")?.checked === true;
    let custoMateriais = 0;
    if (calcularMateriais) {
        custoMateriais =
            quadro * numero("eletricaQuadroPrecoQuadro") +
            mono * numero("eletricaQuadroPrecoMono") +
            bi * numero("eletricaQuadroPrecoBi") +
            tri * numero("eletricaQuadroPrecoTri") +
            dr * numero("eletricaQuadroPrecoDR") +
            dps * numero("eletricaQuadroPrecoDPS") +
            barramento * numero("eletricaQuadroPrecoBarramento") +
            acessorios * numero("eletricaQuadroPrecoAcessorios");
    }

    const custoMaoObra =
        quadro * numero("eletricaQuadroMaoQuadro") +
        mono * numero("eletricaQuadroMaoMono") +
        bi * numero("eletricaQuadroMaoBi") +
        tri * numero("eletricaQuadroMaoTri") +
        dr * numero("eletricaQuadroMaoDR") +
        dps * numero("eletricaQuadroMaoDPS") +
        barramento * numero("eletricaQuadroMaoBarramento") +
        acessorios * numero("eletricaQuadroMaoAcessorios");

    document.getElementById("eletricaQuadroCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("eletricaQuadroCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("eletricaQuadroCustoTotal").textContent = dinheiro(custoMateriais + custoMaoObra);

    const valores = {Quadro:quadro, Mono:mono, Bi:bi, Tri:tri, DR:dr, DPS:dps, Barramento:barramento, Acessorios:acessorios};
    Object.keys(valores).forEach(function (chave) {
        document.getElementById("eletricaQuadroResultado" + chave).textContent = valores[chave] + " un.";
        document.getElementById("eletricaQuadroCompra" + chave).textContent =
            ({Quadro:"⚡ Quadro", Mono:"🔧 Disjuntores monopolares", Bi:"🔧 Disjuntores bipolares", Tri:"🔧 Disjuntores tripolares", DR:"🛡️ DR", DPS:"🛡️ DPS", Barramento:"🔩 Barramentos", Acessorios:"🔧 Acessórios / outros"}[chave]) + ": " + valores[chave] + " un.";
    });

    if (rolarResultado) mostrarResultadoEIrPara("resultadoEletricaQuadro");
    else document.getElementById("resultadoEletricaQuadro").style.display = "block";
}


function voltarInicio() {

    esconderTodasAsTelas();

    document.getElementById("inicio").style.display = "block";

    rolarParaTopo();
}


function rolarParaTopo() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function mostrarResultadoEIrPara(idResultado) {

    const resultado = document.getElementById(idResultado);

    if (!resultado) {
        return;
    }

    resultado.style.display = "block";

    setTimeout(function () {
        resultado.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 100);
}


/* =========================================================
   AVANÇO AUTOMÁTICO DOS CAMPOS
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const campos =
        document.querySelectorAll(
            'input:not([type="hidden"]), select'
        );


    campos.forEach(function (campo, indice) {

        campo.addEventListener("keydown", function (evento) {

            if (evento.key !== "Enter") {
                return;
            }

            evento.preventDefault();

            let proximo = null;

            for (
                let i = indice + 1;
                i < campos.length;
                i++
            ) {

                const candidato = campos[i];

                if (
                    candidato.offsetParent !== null &&
                    !candidato.disabled
                ) {

                    proximo = candidato;

                    break;
                }
            }


            if (proximo) {

                proximo.focus();

                setTimeout(function () {

                    proximo.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }, 100);

            }

        });


        campo.addEventListener("focus", function () {

            setTimeout(function () {

                campo.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }, 150);

        });

    });

});


/* =========================================================
   FUNÇÕES AUXILIARES
   ========================================================= */

function numero(id) {

    const elemento =
        document.getElementById(id);

    if (!elemento) {
        return 0;
    }

    let valor = elemento.value;

    if (typeof valor !== "string") {

        return parseFloat(valor) || 0;
    }

    valor =
        valor.replace(",", ".");

    return parseFloat(valor) || 0;
}


function dinheiro(valor) {

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


function arredondar(
    valor,
    casas = 3
) {

    return Number(
        valor.toFixed(casas)
    );
}


function formatarNumero(
    valor,
    casas
) {

    return valor.toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits: casas,
            maximumFractionDigits: casas
        }
    );
}


/* =========================================================
   ALVENARIA
   ========================================================= */

function calcularAlvenaria() {

    const comprimento =
        numero("comprimento");

    const altura =
        numero("altura");

    const precoBloco =
        numero("precoBloco");

    const precoCimento =
        numero("precoCimento");

    const precoCal =
        numero("precoCal");

    const precoAreia =
        numero("precoAreia");

    const maoObra =
        numero("maoObra");

    const litrosCarrinho =
        numero("litrosCarrinhoAlvenaria");


    if (
        comprimento <= 0 ||
        altura <= 0
    ) {

        alert(
            "Informe o comprimento e a altura da parede."
        );

        return;
    }


    const area =
        comprimento * altura;


    /*
       Bloco cerâmico 9 x 19 x 29 cm
       18,87 blocos/m²
    */

    const blocos =
        area * 18.87;


    /*
       Consumo de argamassa
    */

    const argamassa =
        area * 0.0077;


    /*
       Coeficientes da argamassa
    */

    const cimentoKg =
        argamassa * 196.6318514;


    const calKg =
        argamassa * 174.7838679;


    const areiaM3 =
        argamassa * 1.1652258;


    /* Compra */

    const blocosCompra =
        Math.ceil(blocos);


    const sacosCimento =
        Math.ceil(
            cimentoKg / 50
        );


    const sacosCal =
        Math.ceil(
            calKg / 20
        );


    const carrinhosAreia =
        Math.ceil(
            (areiaM3 * 1000) /
            litrosCarrinho
        );


    /* Custos */

    const custoBlocos =
        blocos * precoBloco;


    const custoCimento =
        (cimentoKg / 50) *
        precoCimento;


    const custoCal =
        (calKg / 20) *
        precoCal;


    const custoAreia =
        areiaM3 *
        precoAreia;


    const custoMateriais =
        custoBlocos +
        custoCimento +
        custoCal +
        custoAreia;


    const custoMaoObra =
        area *
        maoObra;


    const custoTotal =
        custoMateriais +
        custoMaoObra;


    /* Orçamento */

    document.getElementById(
        "resultadoArea"
    ).textContent =
        `${formatarNumero(area, 2)} m²`;


    document.getElementById(
        "custoMateriais"
    ).textContent =
        dinheiro(custoMateriais);


    document.getElementById(
        "custoMaoObra"
    ).textContent =
        dinheiro(custoMaoObra);


    document.getElementById(
        "custoTotal"
    ).textContent =
        dinheiro(custoTotal);


    /* Ficha técnica */

    document.getElementById(
        "resultadoBlocos"
    ).textContent =
        `${formatarNumero(blocos, 2)} unidades`;


    document.getElementById(
        "resultadoArgamassa"
    ).textContent =
        `${formatarNumero(argamassa, 4)} m³`;


    document.getElementById(
        "resultadoCimento"
    ).textContent =
        `${formatarNumero(cimentoKg, 2)} kg`;


    document.getElementById(
        "resultadoCal"
    ).textContent =
        `${formatarNumero(calKg, 2)} kg`;


    document.getElementById(
        "resultadoAreia"
    ).textContent =
        `${formatarNumero(areiaM3, 3)} m³`;


    /* Compra */

    document.getElementById(
        "compraBlocos"
    ).textContent =
        `🧱 Blocos: ${blocosCompra} unidades`;


    document.getElementById(
        "compraCimento"
    ).textContent =
        `🧱 Cimento: ${sacosCimento} saco(s) de 50 kg`;


    document.getElementById(
        "compraCal"
    ).textContent =
        `🪣 Cal: ${sacosCal} saco(s) de 20 kg`;


    document.getElementById(
        "compraAreia"
    ).textContent =
        `🪣 Areia: aproximadamente ${carrinhosAreia} carrinho(s) de ${litrosCarrinho} litros (${formatarNumero(areiaM3, 3)} m³)`;


    mostrarResultadoEIrPara("resultadoAlvenaria");
}


/* =========================================================
   CHAPISCO
   ========================================================= */

function calcularChapisco() {

    const comprimento =
        numero("chapiscoComprimento");

    const altura =
        numero("chapiscoAltura");

    const precoCimento =
        numero("chapiscoCimento");

    const precoAreia =
        numero("chapiscoAreia");

    const maoObra =
        numero("chapiscoMaoObra");

    const litrosCarrinho =
        numero("litrosCarrinhoChapisco");


    if (
        comprimento <= 0 ||
        altura <= 0
    ) {

        alert(
            "Informe o comprimento e a altura da parede."
        );

        return;
    }


    const area =
        comprimento * altura;


    /*
       Chapisco convencional

       Consumo:
       0,00420 m³/m²
    */

    const argamassa =
        area * 0.00420;


    /*
       Coeficientes utilizados
    */

    const cimentoKg =
        argamassa * 400;


    const areiaM3 =
        argamassa * 1.20;


    const sacosCimento =
        Math.ceil(
            cimentoKg / 50
        );


    const carrinhosAreia =
        Math.ceil(
            (areiaM3 * 1000) /
            litrosCarrinho
        );


    /* Custos */

    const custoCimento =
        (cimentoKg / 50) *
        precoCimento;


    const custoAreia =
        areiaM3 *
        precoAreia;


    const custoMateriais =
        custoCimento +
        custoAreia;


    const custoMaoObra =
        area *
        maoObra;


    const custoTotal =
        custoMateriais +
        custoMaoObra;


    /* Orçamento */

    document.getElementById(
        "chapiscoResultadoArea"
    ).textContent =
        `${formatarNumero(area, 2)} m²`;


    document.getElementById(
        "chapiscoCustoMateriais"
    ).textContent =
        dinheiro(custoMateriais);


    document.getElementById(
        "chapiscoCustoMaoObra"
    ).textContent =
        dinheiro(custoMaoObra);


    document.getElementById(
        "chapiscoCustoTotal"
    ).textContent =
        dinheiro(custoTotal);


    /* Ficha técnica */

    document.getElementById(
        "chapiscoResultadoArgamassa"
    ).textContent =
        `${formatarNumero(argamassa, 4)} m³`;


    document.getElementById(
        "chapiscoResultadoCimento"
    ).textContent =
        `${formatarNumero(cimentoKg, 2)} kg`;


    document.getElementById(
        "chapiscoResultadoAreia"
    ).textContent =
        `${formatarNumero(areiaM3, 3)} m³`;


    /* Compra */

    document.getElementById(
        "chapiscoCompraCimento"
    ).textContent =
        `🧱 Cimento: ${sacosCimento} saco(s) de 50 kg`;


    document.getElementById(
        "chapiscoCompraAreia"
    ).textContent =
        `🪣 Areia grossa: aproximadamente ${carrinhosAreia} carrinho(s) de ${litrosCarrinho} litros (${formatarNumero(areiaM3, 3)} m³)`;


    mostrarResultadoEIrPara("resultadoChapisco");
}


/* =========================================================
   EMBOÇO
   ========================================================= */

function calcularEmboco() {

    const comprimento =
        numero("embocoComprimento");

    const altura =
        numero("embocoAltura");

    let espessura =
        numero("embocoEspessura");

    const precoCimento =
        numero("embocoCimento");

    const precoCal =
        numero("embocoCal");

    const precoAreia =
        numero("embocoAreia");

    const maoObra =
        numero("embocoMaoObra");

    const litrosCarrinho =
        numero("litrosCarrinhoEmboco");


    if (
        comprimento <= 0 ||
        altura <= 0
    ) {

        alert(
            "Informe o comprimento e a altura da parede."
        );

        return;
    }


    /*
       O mínimo permitido é 2 cm.
    */

    if (espessura < 2) {

        espessura = 2;

        document.getElementById(
            "embocoEspessura"
        ).value = 2;
    }


    const area =
        comprimento * altura;


    /*
       Referência base:

       0,0304 m³/m² para 17,5 mm.

       Como nesta aplicação o mínimo é 20 mm,
       o consumo é proporcional à espessura.

       20 mm = 0,034742857 m³/m²
    */

    const consumoArgamassaPorM2 =
        0.0304 *
        (espessura / 1.75);


    const argamassa =
        area *
        consumoArgamassaPorM2;


    /*
       Argamassa 1:2:8
    */

    const cimentoKg =
        argamassa *
        192.51714;


    const calKg =
        argamassa *
        171.126347;


    const areiaM3 =
        argamassa *
        1.140842;


    /* Compra */

    const sacosCimento =
        Math.ceil(
            cimentoKg / 50
        );


    const sacosCal =
        Math.ceil(
            calKg / 20
        );


    const carrinhosAreia =
        Math.ceil(
            (areiaM3 * 1000) /
            litrosCarrinho
        );


    /* Custos */

    const custoCimento =
        (cimentoKg / 50) *
        precoCimento;


    const custoCal =
        (calKg / 20) *
        precoCal;


    const custoAreia =
        areiaM3 *
        precoAreia;


    const custoMateriais =
        custoCimento +
        custoCal +
        custoAreia;


    const custoMaoObra =
        area *
        maoObra;


    const custoTotal =
        custoMateriais +
        custoMaoObra;


    /* Orçamento */

    document.getElementById(
        "embocoResultadoArea"
    ).textContent =
        `${formatarNumero(area, 2)} m²`;


    document.getElementById(
        "embocoCustoMateriais"
    ).textContent =
        dinheiro(custoMateriais);


    document.getElementById(
        "embocoCustoMaoObra"
    ).textContent =
        dinheiro(custoMaoObra);


    document.getElementById(
        "embocoCustoTotal"
    ).textContent =
        dinheiro(custoTotal);


    /* Ficha técnica */

    document.getElementById(
        "embocoResultadoEspessura"
    ).textContent =
        `${formatarNumero(espessura, 2)} cm`;


    document.getElementById(
        "embocoResultadoArgamassa"
    ).textContent =
        `${formatarNumero(argamassa, 4)} m³`;


    document.getElementById(
        "embocoResultadoCimento"
    ).textContent =
        `${formatarNumero(cimentoKg, 2)} kg`;


    document.getElementById(
        "embocoResultadoCal"
    ).textContent =
        `${formatarNumero(calKg, 2)} kg`;


    document.getElementById(
        "embocoResultadoAreia"
    ).textContent =
        `${formatarNumero(areiaM3, 3)} m³`;


    /* Compra */

    document.getElementById(
        "embocoCompraCimento"
    ).textContent =
        `🧱 Cimento: ${sacosCimento} saco(s) de 50 kg`;


    document.getElementById(
        "embocoCompraCal"
    ).textContent =
        `🪣 Cal: ${sacosCal} saco(s) de 20 kg`;


    document.getElementById(
        "embocoCompraAreia"
    ).textContent =
        `🪣 Areia média: aproximadamente ${carrinhosAreia} carrinho(s) de ${litrosCarrinho} litros (${formatarNumero(areiaM3, 3)} m³)`;


    mostrarResultadoEIrPara("resultadoEmboco");
}


/* =========================================================
   CONTRAPISO
   ========================================================= */

function calcularContrapiso() {

    const comprimento =
        numero("contrapisoComprimento");

    const largura =
        numero("contrapisoLargura");

    let espessura =
        numero("contrapisoEspessura");

    const precoCimento =
        numero("contrapisoCimento");

    const precoAreia =
        numero("contrapisoAreia");

    const maoObra =
        numero("contrapisoMaoObra");

    const litrosCarrinho =
        numero("litrosCarrinhoContrapiso");


    if (
        comprimento <= 0 ||
        largura <= 0
    ) {

        alert(
            "Informe o comprimento e a largura do contrapiso."
        );

        return;
    }


    /*
       Espessura mínima de segurança
       configurada nesta calculadora.
    */

    if (espessura < 2) {

        espessura = 2;

        document.getElementById(
            "contrapisoEspessura"
        ).value = 2;
    }


    const area =
        comprimento * largura;


    /*
       Referência SINAPI:

       Contrapiso de 5 cm:
       aproximadamente 0,0661 m³ de argamassa/m².

       O consumo é proporcional à espessura.
    */

    const consumoArgamassaPorM2 =
        0.0661 *
        (espessura / 5);


    const argamassa =
        area *
        consumoArgamassaPorM2;


    /*
       Argamassa traço 1:4

       Referência atual da composição 87301:
       aproximadamente 459,85 kg de cimento
       e 1,36 m³ de areia por m³ de argamassa.
    */

    const cimentoKg =
        argamassa *
        459.85;


    const areiaM3 =
        argamassa *
        1.36;


    /* Compra */

    const sacosCimento =
        Math.ceil(
            cimentoKg / 50
        );


    const carrinhosAreia =
        Math.ceil(
            (areiaM3 * 1000) /
            litrosCarrinho
        );


    /* Custos */

    const custoCimento =
        (cimentoKg / 50) *
        precoCimento;


    const custoAreia =
        areiaM3 *
        precoAreia;


    const custoMateriais =
        custoCimento +
        custoAreia;


    const custoMaoObra =
        area *
        maoObra;


    const custoTotal =
        custoMateriais +
        custoMaoObra;


    /* Orçamento */

    document.getElementById(
        "contrapisoResultadoArea"
    ).textContent =
        `${formatarNumero(area, 2)} m²`;


    document.getElementById(
        "contrapisoCustoMateriais"
    ).textContent =
        dinheiro(custoMateriais);


    document.getElementById(
        "contrapisoCustoMaoObra"
    ).textContent =
        dinheiro(custoMaoObra);


    document.getElementById(
        "contrapisoCustoTotal"
    ).textContent =
        dinheiro(custoTotal);


    /* Ficha técnica */

    document.getElementById(
        "contrapisoResultadoEspessura"
    ).textContent =
        `${formatarNumero(espessura, 2)} cm`;


    document.getElementById(
        "contrapisoResultadoArgamassa"
    ).textContent =
        `${formatarNumero(argamassa, 4)} m³`;


    document.getElementById(
        "contrapisoResultadoCimento"
    ).textContent =
        `${formatarNumero(cimentoKg, 2)} kg`;


    document.getElementById(
        "contrapisoResultadoAreia"
    ).textContent =
        `${formatarNumero(areiaM3, 3)} m³`;


    /* Compra */

    document.getElementById(
        "contrapisoCompraCimento"
    ).textContent =
        `🧱 Cimento: ${sacosCimento} saco(s) de 50 kg`;


    document.getElementById(
        "contrapisoCompraAreia"
    ).textContent =
        `🪣 Areia média: aproximadamente ${carrinhosAreia} carrinho(s) de ${litrosCarrinho} litros (${formatarNumero(areiaM3, 3)} m³)`;


    mostrarResultadoEIrPara("resultadoContrapiso");
}


/* =========================================================
   PISO / CERÂMICA
   ========================================================= */

function calcularPiso() {

    const comprimento = numero("pisoComprimento");
    const largura = numero("pisoLargura");
    const pecaLargura = numero("pisoPecaLargura");
    const pecaComprimento = numero("pisoPecaComprimento");
    const perda = numero("pisoPerda");
    const rendimentoCaixa = numero("pisoRendimentoCaixa");
    const precoCaixa = numero("pisoPrecoCaixa");
    const consumoArgamassa = numero("pisoConsumoArgamassa");
    const precoArgamassa = numero("pisoPrecoArgamassa");
    const consumoRejunte = numero("pisoConsumoRejunte");
    const precoRejunte = numero("pisoPrecoRejunte");
    const maoObra = numero("pisoMaoObra");

    if (comprimento <= 0 || largura <= 0) {
        alert("Informe o comprimento e a largura do ambiente.");
        return;
    }

    if (pecaLargura <= 0 || pecaComprimento <= 0) {
        alert("Informe o tamanho da peça de cerâmica.");
        return;
    }

    if (rendimentoCaixa <= 0) {
        alert("Informe o rendimento da caixa em m².");
        return;
    }

    const area = comprimento * largura;
    const areaComPerda = area * (1 + perda / 100);
    const areaPeca = (pecaLargura / 100) * (pecaComprimento / 100);
    const pecasExatas = area / areaPeca;
    const pecasCompra = Math.ceil(areaComPerda / areaPeca);
    const areaPecasCompra = pecasCompra * areaPeca;
    const caixas = Math.ceil(areaComPerda / rendimentoCaixa);
    const areaComprada = caixas * rendimentoCaixa;

    const argamassaKg = area * consumoArgamassa;
    const sacosArgamassa = Math.ceil(argamassaKg / 20);
    const rejunteKg = area * consumoRejunte;
    const custoCeramica = caixas * precoCaixa;
    const custoArgamassa = (argamassaKg / 20) * precoArgamassa;
    const custoRejunte = rejunteKg * precoRejunte;
    const custoMateriais = custoCeramica + custoArgamassa + custoRejunte;
    const custoMaoObra = area * maoObra;
    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("pisoResultadoArea").textContent = `${formatarNumero(area, 2)} m²`;
    document.getElementById("pisoCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("pisoCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("pisoCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("pisoResultadoAreaPerda").textContent = `${formatarNumero(areaComPerda, 2)} m²`;
    document.getElementById("pisoResultadoPecas").textContent = `${formatarNumero(pecasExatas, 2)} unidades`;
    document.getElementById("pisoResultadoArgamassa").textContent = `${formatarNumero(argamassaKg, 2)} kg`;
    document.getElementById("pisoResultadoRejunte").textContent = `${formatarNumero(rejunteKg, 2)} kg`;

    document.getElementById("pisoCompraCaixas").textContent = `📦 Cerâmica: ${caixas} caixa(s) — ${formatarNumero(areaComprada, 2)} m²`;
    document.getElementById("pisoCompraArgamassa").textContent = `🪣 Argamassa: ${sacosArgamassa} saco(s) de 20 kg`;
    document.getElementById("pisoCompraRejunte").textContent = `🧱 Rejunte: aproximadamente ${formatarNumero(rejunteKg, 2)} kg`;
    document.getElementById("pisoCompraArea").textContent = `📐 Peças calculadas para compra: ${pecasCompra} unidades (${formatarNumero(areaPecasCompra, 2)} m²)`;

    mostrarResultadoEIrPara("resultadoPiso");
}


/* =========================================================
   CONCRETO
   ========================================================= */

function calcularConcreto() {

    const comprimento = numero("concretoComprimento");
    const largura = numero("concretoLargura");
    const alturaCm = numero("concretoAltura");

    const precoCimento = numero("concretoCimento");
    const precoAreia = numero("concretoAreia");
    const precoBrita = numero("concretoBrita");
    const maoObra = numero("concretoMaoObra");
    const litrosCarrinho = numero("litrosCarrinhoConcreto");
    const litrosCarrinhoBrita = numero("litrosCarrinhoBritaConcreto");

    if (
        comprimento <= 0 ||
        largura <= 0 ||
        alturaCm <= 0
    ) {

        alert("Informe o comprimento, a largura e a espessura do concreto.");
        return;
    }

    /*
       SINAPI 94964 - Concreto FCK 20 MPa

       Coeficientes por m³ de concreto:
       Cimento: 322,978 kg
       Areia média: 0,7558 m³
       Brita 1: 0,5872 m³
    */

    const volume =
        comprimento *
        largura *
        (alturaCm / 100);

    const cimentoKg =
        volume *
        322.978;

    const areiaM3 =
        volume *
        0.7558;

    const britaM3 =
        volume *
        0.5872;

    const carrinhosAreia =
        Math.ceil(
            (areiaM3 * 1000) /
            litrosCarrinho
        );

    const carrinhosBrita =
        Math.ceil(
            (britaM3 * 1000) /
            litrosCarrinhoBrita
        );

    const sacosCimento =
        Math.ceil(cimentoKg / 50);

    const custoCimento =
        (cimentoKg / 50) *
        precoCimento;

    const custoAreia =
        areiaM3 *
        precoAreia;

    const custoBrita =
        britaM3 *
        precoBrita;

    const custoMateriais =
        custoCimento +
        custoAreia +
        custoBrita;

    const custoMaoObra =
        volume *
        maoObra;

    const custoTotal =
        custoMateriais +
        custoMaoObra;

    /* Orçamento */

    document.getElementById(
        "concretoResultadoVolume"
    ).textContent =
        `${formatarNumero(volume, 3)} m³`;

    document.getElementById(
        "concretoCustoMateriais"
    ).textContent =
        dinheiro(custoMateriais);

    document.getElementById(
        "concretoCustoMaoObra"
    ).textContent =
        dinheiro(custoMaoObra);

    document.getElementById(
        "concretoCustoTotal"
    ).textContent =
        dinheiro(custoTotal);

    /* Ficha técnica */

    document.getElementById(
        "concretoResultadoCimento"
    ).textContent =
        `${formatarNumero(cimentoKg, 2)} kg`;

    document.getElementById(
        "concretoResultadoAreia"
    ).textContent =
        `${formatarNumero(areiaM3, 3)} m³`;

    document.getElementById(
        "concretoResultadoBrita"
    ).textContent =
        `${formatarNumero(britaM3, 3)} m³`;

    /* Compra */

    document.getElementById(
        "concretoCompraCimento"
    ).textContent =
        `🧱 Cimento: ${sacosCimento} saco(s) de 50 kg`;

    document.getElementById(
        "concretoCompraAreia"
    ).textContent =
        `🪣 Areia média: aproximadamente ${carrinhosAreia} carrinho(s) de ${litrosCarrinho} litros (${formatarNumero(areiaM3, 3)} m³)`;

    document.getElementById(
        "concretoCompraBrita"
    ).textContent =
        `🪨 Brita 1: aproximadamente ${carrinhosBrita} carrinho(s) de ${litrosCarrinhoBrita} litros (${formatarNumero(britaM3, 3)} m³)`;

    mostrarResultadoEIrPara("resultadoConcreto");
}


/* =========================================================
   FUNDAÇÃO - SAPATA
   ========================================================= */

function calcularSapata() {

    const comprimento = numero("sapataComprimento");
    const largura = numero("sapataLargura");
    const alturaCm = numero("sapataAltura");
    const quantidade = numero("sapataQuantidade");

    const precoCimento = numero("sapataCimento");
    const precoAreia = numero("sapataAreia");
    const precoBrita = numero("sapataBrita");
    const maoObra = numero("sapataMaoObra");
    const litrosAreia = numero("litrosCarrinhoSapataAreia");
    const litrosBrita = numero("litrosCarrinhoSapataBrita");

    if (comprimento <= 0 || largura <= 0 || alturaCm <= 0 || quantidade <= 0) {
        alert("Informe as dimensões e a quantidade de sapatas.");
        return;
    }

    const volumeUnitario = comprimento * largura * (alturaCm / 100);
    const volume = volumeUnitario * quantidade;

    const cimentoKg = volume * 322.978;
    const areiaM3 = volume * 0.7558;
    const britaM3 = volume * 0.5872;

    const sacosCimento = Math.ceil(cimentoKg / 50);
    const carrinhosAreia = Math.ceil((areiaM3 * 1000) / litrosAreia);
    const carrinhosBrita = Math.ceil((britaM3 * 1000) / litrosBrita);

    const custoCimento = (cimentoKg / 50) * precoCimento;
    const custoAreia = areiaM3 * precoAreia;
    const custoBrita = britaM3 * precoBrita;
    const custoMateriais = custoCimento + custoAreia + custoBrita;
    const custoMaoObra = volume * maoObra;
    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("sapataResultadoQuantidade").textContent = formatarNumero(quantidade, 0);
    document.getElementById("sapataResultadoVolumeUnitario").textContent = `${formatarNumero(volumeUnitario, 3)} m³`;
    document.getElementById("sapataResultadoVolume").textContent = `${formatarNumero(volume, 3)} m³`;
    document.getElementById("sapataCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("sapataCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("sapataCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("sapataResultadoCimento").textContent = `${formatarNumero(cimentoKg, 2)} kg`;
    document.getElementById("sapataResultadoAreia").textContent = `${formatarNumero(areiaM3, 3)} m³`;
    document.getElementById("sapataResultadoBrita").textContent = `${formatarNumero(britaM3, 3)} m³`;

    document.getElementById("sapataCompraCimento").textContent = `🧱 Cimento: ${sacosCimento} saco(s) de 50 kg`;
    document.getElementById("sapataCompraAreia").textContent = `🪣 Areia média: aproximadamente ${carrinhosAreia} carrinho(s) de ${litrosAreia} litros (${formatarNumero(areiaM3, 3)} m³)`;
    document.getElementById("sapataCompraBrita").textContent = `🪨 Brita 1: aproximadamente ${carrinhosBrita} carrinho(s) de ${litrosBrita} litros (${formatarNumero(britaM3, 3)} m³)`;

    mostrarResultadoEIrPara("resultadoSapata");
}


/* =========================================================
   FUNDAÇÃO - VIGA BALDRAME
   ========================================================= */

function calcularVigaBaldrame() {

    const comprimento = numero("vigaComprimento");
    const largura = numero("vigaLargura");
    const alturaCm = numero("vigaAltura");

    const precoCimento = numero("vigaCimento");
    const precoAreia = numero("vigaAreia");
    const precoBrita = numero("vigaBrita");
    const maoObra = numero("vigaMaoObra");
    const litrosAreia = numero("litrosCarrinhoVigaAreia");
    const litrosBrita = numero("litrosCarrinhoVigaBrita");

    if (comprimento <= 0 || largura <= 0 || alturaCm <= 0) {
        alert("Informe o comprimento, a largura e a altura da viga.");
        return;
    }

    const altura = alturaCm / 100;
    const volumeGeometrico = comprimento * largura * altura;

    // SINAPI 96555: concretagem de viga baldrame/bloco de coroamento,
    // com consumo de 1,16 m³ de concreto por m³ de geometria.
    const volumeConcreto = volumeGeometrico * 1.16;

    // SINAPI 94972 - concreto FCK 30 MPa, referência atual consultada.
    const cimentoKg = volumeConcreto * 391.1663;
    const areiaM3 = volumeConcreto * 0.7119;
    const britaM3 = volumeConcreto * 0.5927;

    const sacosCimento = Math.ceil(cimentoKg / 50);
    const carrinhosAreia = Math.ceil((areiaM3 * 1000) / litrosAreia);
    const carrinhosBrita = Math.ceil((britaM3 * 1000) / litrosBrita);

    const custoCimento = (cimentoKg / 50) * precoCimento;
    const custoAreia = areiaM3 * precoAreia;
    const custoBrita = britaM3 * precoBrita;
    const custoMateriais = custoCimento + custoAreia + custoBrita;
    const custoMaoObra = comprimento * maoObra;
    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("vigaResultadoComprimento").textContent = `${formatarNumero(comprimento, 2)} m`;
    document.getElementById("vigaResultadoVolumeGeometrico").textContent = `${formatarNumero(volumeGeometrico, 3)} m³`;
    document.getElementById("vigaResultadoVolumeConcreto").textContent = `${formatarNumero(volumeConcreto, 3)} m³`;
    document.getElementById("vigaCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("vigaCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("vigaCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("vigaResultadoCimento").textContent = `${formatarNumero(cimentoKg, 2)} kg`;
    document.getElementById("vigaResultadoAreia").textContent = `${formatarNumero(areiaM3, 3)} m³`;
    document.getElementById("vigaResultadoBrita").textContent = `${formatarNumero(britaM3, 3)} m³`;

    document.getElementById("vigaCompraCimento").textContent = `🧱 Cimento: ${sacosCimento} saco(s) de 50 kg`;
    document.getElementById("vigaCompraAreia").textContent = `🪣 Areia média: aproximadamente ${carrinhosAreia} carrinho(s) de ${litrosAreia} litros (${formatarNumero(areiaM3, 3)} m³)`;
    document.getElementById("vigaCompraBrita").textContent = `🪨 Brita 1: aproximadamente ${carrinhosBrita} carrinho(s) de ${litrosBrita} litros (${formatarNumero(britaM3, 3)} m³)`;

    mostrarResultadoEIrPara("resultadoVigaBaldrame");
}


/* =========================================================
   FUNDAÇÃO - BLOCO DE FUNDAÇÃO
   ========================================================= */

function calcularBlocoFundacao() {

    const comprimento = numero("blocoComprimento");
    const largura = numero("blocoLargura");
    const alturaCm = numero("blocoAltura");
    const quantidade = numero("blocoQuantidade");

    const precoCimento = numero("blocoCimento");
    const precoAreia = numero("blocoAreia");
    const precoBrita = numero("blocoBrita");
    const maoObra = numero("blocoMaoObra");
    const litrosAreia = numero("litrosCarrinhoBlocoAreia");
    const litrosBrita = numero("litrosCarrinhoBlocoBrita");

    if (comprimento <= 0 || largura <= 0 || alturaCm <= 0 || quantidade <= 0) {
        alert("Informe as dimensões e a quantidade de blocos.");
        return;
    }

    const volumeUnitario = comprimento * largura * (alturaCm / 100);
    const volume = volumeUnitario * quantidade;

    // Referência de concreto igual à utilizada no módulo Sapata.
    // O aplicativo quantifica o bloco informado; não dimensiona a fundação.
    const cimentoKg = volume * 322.978;
    const areiaM3 = volume * 0.7558;
    const britaM3 = volume * 0.5872;

    const sacosCimento = Math.ceil(cimentoKg / 50);
    const carrinhosAreia = Math.ceil((areiaM3 * 1000) / litrosAreia);
    const carrinhosBrita = Math.ceil((britaM3 * 1000) / litrosBrita);

    const custoCimento = (cimentoKg / 50) * precoCimento;
    const custoAreia = areiaM3 * precoAreia;
    const custoBrita = britaM3 * precoBrita;
    const custoMateriais = custoCimento + custoAreia + custoBrita;
    const custoMaoObra = volume * maoObra;
    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("blocoResultadoQuantidade").textContent = formatarNumero(quantidade, 0);
    document.getElementById("blocoResultadoVolumeUnitario").textContent = `${formatarNumero(volumeUnitario, 3)} m³`;
    document.getElementById("blocoResultadoVolume").textContent = `${formatarNumero(volume, 3)} m³`;
    document.getElementById("blocoCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("blocoCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("blocoCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("blocoResultadoCimento").textContent = `${formatarNumero(cimentoKg, 2)} kg`;
    document.getElementById("blocoResultadoAreia").textContent = `${formatarNumero(areiaM3, 3)} m³`;
    document.getElementById("blocoResultadoBrita").textContent = `${formatarNumero(britaM3, 3)} m³`;

    document.getElementById("blocoCompraCimento").textContent = `🧱 Cimento: ${sacosCimento} saco(s) de 50 kg`;
    document.getElementById("blocoCompraAreia").textContent = `🪣 Areia média: aproximadamente ${carrinhosAreia} carrinho(s) de ${litrosAreia} litros (${formatarNumero(areiaM3, 3)} m³)`;
    document.getElementById("blocoCompraBrita").textContent = `🪨 Brita 1: aproximadamente ${carrinhosBrita} carrinho(s) de ${litrosBrita} litros (${formatarNumero(britaM3, 3)} m³)`;

    mostrarResultadoEIrPara("resultadoBlocoFundacao");
}




/* =========================================================
   PINTURA
   ========================================================= */

function calcularPintura() {

    const area = numero("pinturaArea");
    const superficie = document.getElementById("pinturaSuperficie").value;
    const tipo = document.getElementById("pinturaTipo").value;
    const precoTinta = numero("pinturaPrecoTinta");
    const volumeLata = numero("pinturaVolumeLata");
    const maoObraM2 = numero("pinturaMaoObra");

    if (area <= 0) {
        alert("Informe a área a pintar.");
        return;
    }

    if (volumeLata <= 0) {
        alert("Informe o volume da lata de tinta.");
        return;
    }

    const coeficientes = {
        economica: 0.2678,
        standard: 0.2367,
        premium: 0.2285
    };

    const nomes = {
        economica: "Acrílica econômica",
        standard: "Acrílica standard",
        premium: "Acrílica premium"
    };

    const litrosPorM2 = coeficientes[tipo];
    const litros = area * litrosPorM2;
    const latas = Math.ceil(litros / volumeLata);

    const custoTinta = litros * precoTinta;
    const custoMaoObra = area * maoObraM2;
    const custoMateriais = custoTinta;
    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("pinturaResultadoArea").textContent = `${formatarNumero(area, 2)} m²`;
    document.getElementById("pinturaResultadoTipo").textContent = `${nomes[tipo]} — ${superficie === "parede" ? "parede" : "teto"}`;
    document.getElementById("pinturaResultadoLitros").textContent = `${formatarNumero(litros, 2)} L`;
    document.getElementById("pinturaCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("pinturaCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("pinturaCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("pinturaCompraTinta").textContent = `🎨 Tinta: ${latas} lata(s) de ${formatarNumero(volumeLata, 1)} L — consumo técnico ${formatarNumero(litros, 2)} L`;
    document.getElementById("pinturaCompraArea").textContent = `📐 Área pintada: ${formatarNumero(area, 2)} m²`;

    mostrarResultadoEIrPara("resultadoPintura");
}


/* =========================================================
   HIDRÁULICA - RALOS E CAIXAS SIFONADAS
   Quantificação e orçamento conforme quantidades informadas.
   ========================================================= */

function calcularRalosCaixas() {

    const ralos = numero("ralosQuantidade");
    const caixas = numero("caixasSifonadasQuantidade");
    const grelhas = numero("ralosGrelhasQuantidade");
    const prolongadores = numero("ralosProlongadoresQuantidade");

    const precoRalo = numero("ralosPrecoRalo");
    const precoCaixa = numero("ralosPrecoCaixa");
    const precoGrelha = numero("ralosPrecoGrelha");
    const precoProlongador = numero("ralosPrecoProlongador");
    const maoObra = numero("ralosMaoObra");

    const totalPecas =
        Math.ceil(ralos) +
        Math.ceil(caixas) +
        Math.ceil(grelhas) +
        Math.ceil(prolongadores);

    if (totalPecas <= 0) {
        alert("Informe pelo menos uma peça para calcular ralos e caixas.");
        return;
    }

    const custoRalos = ralos * precoRalo;
    const custoCaixas = caixas * precoCaixa;
    const custoGrelhas = grelhas * precoGrelha;
    const custoProlongadores = prolongadores * precoProlongador;

    const custoMateriais =
        custoRalos +
        custoCaixas +
        custoGrelhas +
        custoProlongadores;

    const custoMaoObra = totalPecas * maoObra;
    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("ralosCustoMateriais").textContent =
        dinheiro(custoMateriais);

    document.getElementById("ralosCustoMaoObra").textContent =
        dinheiro(custoMaoObra);

    document.getElementById("ralosCustoTotal").textContent =
        dinheiro(custoTotal);

    document.getElementById("ralosResultadoRalos").textContent =
        Math.ceil(ralos) + " un.";

    document.getElementById("ralosResultadoCaixas").textContent =
        Math.ceil(caixas) + " un.";

    document.getElementById("ralosResultadoGrelhas").textContent =
        Math.ceil(grelhas) + " un.";

    document.getElementById("ralosResultadoProlongadores").textContent =
        Math.ceil(prolongadores) + " un.";

    document.getElementById("ralosCompraRalos").textContent =
        "🚿 Ralos: " + Math.ceil(ralos) + " un.";

    document.getElementById("ralosCompraCaixas").textContent =
        "📦 Caixas sifonadas: " + Math.ceil(caixas) + " un.";

    document.getElementById("ralosCompraGrelhas").textContent =
        "🔲 Grelhas / tampas: " + Math.ceil(grelhas) + " un.";

    document.getElementById("ralosCompraProlongadores").textContent =
        "🔧 Prolongadores: " + Math.ceil(prolongadores) + " un.";

    mostrarResultadoEIrPara("resultadoRalosCaixas");
}


/* =========================================================
   HIDRÁULICA - CAIXA D'ÁGUA / RESERVATÓRIO
   Quantificação e orçamento conforme dados informados.
   ========================================================= */

function calcularCaixaAgua() {

    const capacidade = numero("caixaAguaCapacidade");
    const quantidade = numero("caixaAguaQuantidade");

    const entrada = numero("caixaAguaEntrada");
    const saida = numero("caixaAguaSaida");
    const extravasor = numero("caixaAguaExtravasor");
    const perda = numero("caixaAguaPerda");

    const joelhos = numero("caixaAguaJoelhos");
    const tes = numero("caixaAguaTes");
    const adaptadores = numero("caixaAguaAdaptadores");
    const registros = numero("caixaAguaRegistros");
    const boias = numero("caixaAguaBoias");
    const valvulas = numero("caixaAguaValvulas");

    const precoReservatorio = numero("caixaAguaPrecoReservatorio");
    const precoTubo = numero("caixaAguaPrecoTubo");
    const precoJoelho = numero("caixaAguaPrecoJoelho");
    const precoTe = numero("caixaAguaPrecoTe");
    const precoAdaptador = numero("caixaAguaPrecoAdaptador");
    const precoRegistro = numero("caixaAguaPrecoRegistro");
    const precoBoia = numero("caixaAguaPrecoBoia");
    const precoValvula = numero("caixaAguaPrecoValvula");
    const maoObra = numero("caixaAguaMaoObra");

    if (capacidade <= 0 || quantidade <= 0) {
        alert("Informe a capacidade e a quantidade do reservatório.");
        return;
    }

    const tuboTecnico = entrada + saida + extravasor;
    const tuboCompra = tuboTecnico * (1 + perda / 100);
    const barras = Math.ceil(tuboCompra / 6);
    const metrosComprados = barras * 6;

    const qtdReservatorios = Math.ceil(quantidade);
    const qtdJoelhos = Math.ceil(joelhos);
    const qtdTes = Math.ceil(tes);
    const qtdAdaptadores = Math.ceil(adaptadores);
    const qtdRegistros = Math.ceil(registros);
    const qtdBoias = Math.ceil(boias);
    const qtdValvulas = Math.ceil(valvulas);

    const custoReservatorio = qtdReservatorios * precoReservatorio;
    const custoTubo = barras * precoTubo;
    const custoJoelhos = qtdJoelhos * precoJoelho;
    const custoTes = qtdTes * precoTe;
    const custoAdaptadores = qtdAdaptadores * precoAdaptador;
    const custoRegistros = qtdRegistros * precoRegistro;
    const custoBoias = qtdBoias * precoBoia;
    const custoValvulas = qtdValvulas * precoValvula;

    const custoMateriais =
        custoReservatorio +
        custoTubo +
        custoJoelhos +
        custoTes +
        custoAdaptadores +
        custoRegistros +
        custoBoias +
        custoValvulas;

    const custoMaoObra = qtdReservatorios * maoObra;
    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("caixaAguaCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("caixaAguaCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("caixaAguaCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("caixaAguaResultadoCapacidade").textContent =
        formatarNumero(capacidade, 0) + " L";
    document.getElementById("caixaAguaResultadoQuantidade").textContent =
        qtdReservatorios + " un.";
    document.getElementById("caixaAguaResultadoEntrada").textContent =
        formatarNumero(entrada, 2) + " m";
    document.getElementById("caixaAguaResultadoSaida").textContent =
        formatarNumero(saida, 2) + " m";
    document.getElementById("caixaAguaResultadoExtravasor").textContent =
        formatarNumero(extravasor, 2) + " m";
    document.getElementById("caixaAguaResultadoJoelhos").textContent =
        qtdJoelhos + " un.";
    document.getElementById("caixaAguaResultadoTes").textContent =
        qtdTes + " un.";
    document.getElementById("caixaAguaResultadoAdaptadores").textContent =
        qtdAdaptadores + " un.";
    document.getElementById("caixaAguaResultadoRegistros").textContent =
        qtdRegistros + " un.";
    document.getElementById("caixaAguaResultadoBoias").textContent =
        qtdBoias + " un.";
    document.getElementById("caixaAguaResultadoValvulas").textContent =
        qtdValvulas + " un.";

    document.getElementById("caixaAguaCompraReservatorio").textContent =
        "🚰 Reservatório: " + qtdReservatorios + " un. de " + formatarNumero(capacidade, 0) + " L";
    document.getElementById("caixaAguaCompraTubo").textContent =
        "🪠 Tubos: " + barras + " barra(s) de 6 m (" +
        formatarNumero(metrosComprados, 2) + " m comprados)";
    document.getElementById("caixaAguaCompraJoelhos").textContent =
        "🔩 Joelhos 90°: " + qtdJoelhos + " un.";
    document.getElementById("caixaAguaCompraTes").textContent =
        "🔩 Tês / derivações: " + qtdTes + " un.";
    document.getElementById("caixaAguaCompraAdaptadores").textContent =
        "🔩 Adaptadores: " + qtdAdaptadores + " un.";
    document.getElementById("caixaAguaCompraRegistros").textContent =
        "🚰 Registros: " + qtdRegistros + " un.";
    document.getElementById("caixaAguaCompraBoias").textContent =
        "🛠️ Torneiras de boia: " + qtdBoias + " un.";
    document.getElementById("caixaAguaCompraValvulas").textContent =
        "🔧 Válvulas / acessórios: " + qtdValvulas + " un.";

    mostrarResultadoEIrPara("resultadoCaixaAgua");
}


/* =========================================================
   ELÉTRICA — ATERRAMENTO
   Quantidades informadas pelo usuário; materiais opcionais.
   ========================================================= */

function espelharQuantidadesEletricaAterramento() {
    const mapa = {
        eletricaAterramentoQtdHastes: ["eletricaAterramentoQtdMatHastes", "eletricaAterramentoQtdMaoHastes"],
        eletricaAterramentoComprimentoCondutor: ["eletricaAterramentoQtdMatCondutor", "eletricaAterramentoQtdMaoCondutor"],
        eletricaAterramentoQtdConectores: ["eletricaAterramentoQtdMatConectores", "eletricaAterramentoQtdMaoConectores"],
        eletricaAterramentoQtdCaixas: ["eletricaAterramentoQtdMatCaixas", "eletricaAterramentoQtdMaoCaixas"],
        eletricaAterramentoQtdAcessorios: ["eletricaAterramentoQtdMatAcessorios", "eletricaAterramentoQtdMaoAcessorios"]
    };

    Object.keys(mapa).forEach(function (origem) {
        const valor = numero(origem);
        mapa[origem].forEach(function (idDestino) {
            const destino = document.getElementById(idDestino);
            if (destino) destino.value = valor;
        });
    });
}

document.addEventListener("input", function (evento) {
    const ids = [
        "eletricaAterramentoQtdHastes",
        "eletricaAterramentoComprimentoCondutor",
        "eletricaAterramentoQtdConectores",
        "eletricaAterramentoQtdCaixas",
        "eletricaAterramentoQtdAcessorios"
    ];
    if (ids.includes(evento.target.id)) espelharQuantidadesEletricaAterramento();
});

document.addEventListener("DOMContentLoaded", function () {
    espelharQuantidadesEletricaAterramento();
});

function alternarMateriaisEletricaAterramento() {
    const checkbox = document.getElementById("eletricaAterramentoCalcularMateriais");
    const campos = document.getElementById("eletricaAterramentoMateriaisCampos");
    if (!checkbox || !campos) return;

    campos.style.display = checkbox.checked ? "block" : "none";

    const resultado = document.getElementById("resultadoEletricaAterramento");
    if (resultado && resultado.style.display !== "none") {
        calcularEletricaAterramento(false);
    }
}

function calcularEletricaAterramento(rolarResultado = true) {
    espelharQuantidadesEletricaAterramento();

    const hastes = Math.max(0, Math.floor(numero("eletricaAterramentoQtdHastes")));
    const condutor = Math.max(0, numero("eletricaAterramentoComprimentoCondutor"));
    const perda = Math.max(0, numero("eletricaAterramentoPerda"));
    const conectores = Math.max(0, Math.floor(numero("eletricaAterramentoQtdConectores")));
    const caixas = Math.max(0, Math.floor(numero("eletricaAterramentoQtdCaixas")));
    const acessorios = Math.max(0, Math.floor(numero("eletricaAterramentoQtdAcessorios")));

    if (hastes <= 0 && condutor <= 0 && conectores <= 0 && caixas <= 0 && acessorios <= 0) {
        alert("Informe pelo menos uma quantidade ou comprimento do aterramento.");
        return;
    }

    const calcularMateriais = document.getElementById("eletricaAterramentoCalcularMateriais")?.checked === true;
    const condutorCompra = condutor * (1 + perda / 100);

    let custoMateriais = 0;
    if (calcularMateriais) {
        custoMateriais =
            hastes * numero("eletricaAterramentoPrecoHastes") +
            condutorCompra * numero("eletricaAterramentoPrecoCondutor") +
            conectores * numero("eletricaAterramentoPrecoConectores") +
            caixas * numero("eletricaAterramentoPrecoCaixas") +
            acessorios * numero("eletricaAterramentoPrecoAcessorios");
    }

    const custoMaoObra =
        hastes * numero("eletricaAterramentoMaoHastes") +
        condutor * numero("eletricaAterramentoMaoCondutor") +
        conectores * numero("eletricaAterramentoMaoConectores") +
        caixas * numero("eletricaAterramentoMaoCaixas") +
        acessorios * numero("eletricaAterramentoMaoAcessorios");

    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("eletricaAterramentoCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("eletricaAterramentoCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("eletricaAterramentoCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("eletricaAterramentoResultadoHastes").textContent = `${hastes} un.`;
    document.getElementById("eletricaAterramentoResultadoCondutor").textContent = `${formatarNumero(condutor, 2)} m`;
    document.getElementById("eletricaAterramentoResultadoConectores").textContent = `${conectores} un.`;
    document.getElementById("eletricaAterramentoResultadoCaixas").textContent = `${caixas} un.`;
    document.getElementById("eletricaAterramentoResultadoAcessorios").textContent = `${acessorios} un.`;

    document.getElementById("eletricaAterramentoCompraHastes").textContent = `🌎 Hastes: ${hastes} unidade(s)`;
    document.getElementById("eletricaAterramentoCompraCondutor").textContent = `🔌 Condutor: ${formatarNumero(condutorCompra, 2)} m (com ${formatarNumero(perda, 1)}% de perda)`;
    document.getElementById("eletricaAterramentoCompraConectores").textContent = `🔩 Conectores / grampos: ${conectores} unidade(s)`;
    document.getElementById("eletricaAterramentoCompraCaixas").textContent = `📦 Caixas de inspeção: ${caixas} unidade(s)`;
    document.getElementById("eletricaAterramentoCompraAcessorios").textContent = `🔧 Barramento / acessórios: ${acessorios} unidade(s)`;

    if (rolarResultado) mostrarResultadoEIrPara("resultadoEletricaAterramento");
    else document.getElementById("resultadoEletricaAterramento").style.display = "block";
}


/* =========================================================
   ELÉTRICA — ENTRADA DE ENERGIA
   Quantidades informadas pelo usuário; materiais opcionais.
   ========================================================= */

function espelharQuantidadesEletricaEntradaEnergia() {
    const comprimento = Math.max(0, numero("eletricaEntradaComprimentoCondutor"));
    const qtdCondutores = Math.max(0, Math.floor(numero("eletricaEntradaQtdCondutores")));
    const totalCondutores = comprimento * qtdCondutores;
    const mapa = {
        eletricaEntradaComprimentoEletroduto: ["eletricaEntradaQtdMatEletroduto", "eletricaEntradaQtdMaoEletroduto"],
        eletricaEntradaQtdCaixa: ["eletricaEntradaQtdMatCaixa", "eletricaEntradaQtdMaoCaixa"],
        eletricaEntradaQtdConectores: ["eletricaEntradaQtdMatConectores", "eletricaEntradaQtdMaoConectores"],
        eletricaEntradaQtdAcessorios: ["eletricaEntradaQtdMatAcessorios", "eletricaEntradaQtdMaoAcessorios"]
    };

    mapa.eletricaEntradaComprimentoEletroduto = mapa.eletricaEntradaComprimentoEletroduto || [];

    Object.keys(mapa).forEach(function (origem) {
        const valor = numero(origem);
        mapa[origem].forEach(function (idDestino) {
            const destino = document.getElementById(idDestino);
            if (destino) destino.value = valor;
        });
    });

    ["eletricaEntradaQtdMatCondutores", "eletricaEntradaQtdMaoCondutores"].forEach(function (id) {
        const destino = document.getElementById(id);
        if (destino) destino.value = totalCondutores;
    });
}

document.addEventListener("input", function (evento) {
    const ids = [
        "eletricaEntradaComprimentoCondutor",
        "eletricaEntradaQtdCondutores",
        "eletricaEntradaComprimentoEletroduto",
        "eletricaEntradaQtdCaixa",
        "eletricaEntradaQtdConectores",
        "eletricaEntradaQtdAcessorios"
    ];
    if (ids.includes(evento.target.id)) espelharQuantidadesEletricaEntradaEnergia();
});

document.addEventListener("DOMContentLoaded", function () {
    espelharQuantidadesEletricaEntradaEnergia();
});

function alternarMateriaisEletricaEntradaEnergia() {
    const checkbox = document.getElementById("eletricaEntradaCalcularMateriais");
    const campos = document.getElementById("eletricaEntradaMateriaisCampos");
    if (!checkbox || !campos) return;

    campos.style.display = checkbox.checked ? "block" : "none";

    const resultado = document.getElementById("resultadoEletricaEntradaEnergia");
    if (resultado && resultado.style.display !== "none") calcularEletricaEntradaEnergia(false);
}

function calcularEletricaEntradaEnergia(rolarResultado = true) {
    espelharQuantidadesEletricaEntradaEnergia();

    const comprimentoCondutor = Math.max(0, numero("eletricaEntradaComprimentoCondutor"));
    const qtdCondutores = Math.max(0, Math.floor(numero("eletricaEntradaQtdCondutores")));
    const perda = Math.max(0, numero("eletricaEntradaPerda"));
    const totalCondutores = comprimentoCondutor * qtdCondutores;
    const eletroduto = Math.max(0, numero("eletricaEntradaComprimentoEletroduto"));
    const caixa = Math.max(0, Math.floor(numero("eletricaEntradaQtdCaixa")));
    const conectores = Math.max(0, Math.floor(numero("eletricaEntradaQtdConectores")));
    const acessorios = Math.max(0, Math.floor(numero("eletricaEntradaQtdAcessorios")));

    if (totalCondutores <= 0 && eletroduto <= 0 && caixa <= 0 && conectores <= 0 && acessorios <= 0) {
        alert("Informe pelo menos uma medida ou quantidade da entrada de energia.");
        return;
    }

    const calcularMateriais = document.getElementById("eletricaEntradaCalcularMateriais")?.checked === true;
    const condutoresCompra = totalCondutores * (1 + perda / 100);
    const eletrodutoCompra = eletroduto * (1 + perda / 100);

    let custoMateriais = 0;
    if (calcularMateriais) {
        custoMateriais =
            condutoresCompra * numero("eletricaEntradaPrecoCondutor") +
            eletrodutoCompra * numero("eletricaEntradaPrecoEletroduto") +
            caixa * numero("eletricaEntradaPrecoCaixa") +
            conectores * numero("eletricaEntradaPrecoConectores") +
            acessorios * numero("eletricaEntradaPrecoAcessorios");
    }

    const custoMaoObra =
        totalCondutores * numero("eletricaEntradaMaoCondutor") +
        eletroduto * numero("eletricaEntradaMaoEletroduto") +
        caixa * numero("eletricaEntradaMaoCaixa") +
        conectores * numero("eletricaEntradaMaoConectores") +
        acessorios * numero("eletricaEntradaMaoAcessorios");

    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("eletricaEntradaCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("eletricaEntradaCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("eletricaEntradaCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("eletricaEntradaResultadoCondutores").textContent = `${formatarNumero(totalCondutores, 2)} m`;
    document.getElementById("eletricaEntradaResultadoEletroduto").textContent = `${formatarNumero(eletroduto, 2)} m`;
    document.getElementById("eletricaEntradaResultadoCaixa").textContent = `${caixa} un.`;
    document.getElementById("eletricaEntradaResultadoConectores").textContent = `${conectores} un.`;
    document.getElementById("eletricaEntradaResultadoAcessorios").textContent = `${acessorios} un.`;

    document.getElementById("eletricaEntradaCompraCondutores").textContent = `🔌 Condutores: ${formatarNumero(condutoresCompra, 2)} m (${qtdCondutores} condutor(es) × ${formatarNumero(comprimentoCondutor, 2)} m, com ${formatarNumero(perda, 1)}% de perda)`;
    document.getElementById("eletricaEntradaCompraEletroduto").textContent = `🪠 Eletroduto: ${formatarNumero(eletrodutoCompra, 2)} m (com ${formatarNumero(perda, 1)}% de perda)`;
    document.getElementById("eletricaEntradaCompraCaixa").textContent = `📦 Caixa / padrão: ${caixa} unidade(s)`;
    document.getElementById("eletricaEntradaCompraConectores").textContent = `🔩 Conectores / terminais: ${conectores} unidade(s)`;
    document.getElementById("eletricaEntradaCompraAcessorios").textContent = `🔧 Acessórios: ${acessorios} unidade(s)`;

    if (rolarResultado) mostrarResultadoEIrPara("resultadoEletricaEntradaEnergia");
    else document.getElementById("resultadoEletricaEntradaEnergia").style.display = "block";
}


/* =========================================================
   SERVICE WORKER
   ========================================================= */

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        function () {

            navigator.serviceWorker
                .register("./sw.js")

                .then(function () {

                    console.log(
                        "Service Worker registrado com sucesso."
                    );

                })

                .catch(function (erro) {

                    console.log(
                        "Erro ao registrar Service Worker:",
                        erro
                    );

                });

        }
    );

}

/* =========================================================
   HIDRÁULICA - ÁGUA FRIA
   Referência: SINAPI 91785 / 89356 - PVC soldável DN 25 mm
   ========================================================= */

function calcularHidraulica() {

    const comprimento = numero("hidraulicaComprimento");
    const perda = numero("hidraulicaPerda");
    const joelhos = numero("hidraulicaJoelhos");
    const tes = numero("hidraulicaTes");
    const adaptadores = numero("hidraulicaAdaptadores");
    const registros = numero("hidraulicaRegistros");

    const precoTubo = numero("hidraulicaPrecoTubo");
    const precoJoelho = numero("hidraulicaPrecoJoelho");
    const precoTe = numero("hidraulicaPrecoTe");
    const precoAdaptador = numero("hidraulicaPrecoAdaptador");
    const precoRegistro = numero("hidraulicaPrecoRegistro");
    const maoObra = numero("hidraulicaMaoObra");

    const tuboCompra = comprimento * (1 + perda / 100);
    const barras = Math.ceil(tuboCompra / 6);
    const areaTuboComprado = barras * 6;

    const custoTubo = barras * precoTubo;
    const custoJoelhos = joelhos * precoJoelho;
    const custoTes = tes * precoTe;
    const custoAdaptadores = adaptadores * precoAdaptador;
    const custoRegistros = registros * precoRegistro;

    const custoMateriais =
        custoTubo +
        custoJoelhos +
        custoTes +
        custoAdaptadores +
        custoRegistros;

    const custoMaoObra = comprimento * maoObra;
    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("hidraulicaCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("hidraulicaCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("hidraulicaCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("hidraulicaResultadoTubo").textContent = comprimento.toFixed(2).replace(".", ",") + " m";
    document.getElementById("hidraulicaResultadoJoelhos").textContent = joelhos.toFixed(0) + " un.";
    document.getElementById("hidraulicaResultadoTes").textContent = tes.toFixed(0) + " un.";
    document.getElementById("hidraulicaResultadoAdaptadores").textContent = adaptadores.toFixed(0) + " un.";
    document.getElementById("hidraulicaResultadoRegistros").textContent = registros.toFixed(0) + " un.";

    document.getElementById("hidraulicaCompraTubo").textContent =
        "🪠 Tubos PVC 25 mm: " + barras + " barras de 6 m (" +
        areaTuboComprado.toFixed(2).replace(".", ",") + " m comprados)";

    document.getElementById("hidraulicaCompraJoelhos").textContent =
        "🔩 Joelhos 90°: " + Math.ceil(joelhos) + " un.";

    document.getElementById("hidraulicaCompraTes").textContent =
        "🔩 Tês: " + Math.ceil(tes) + " un.";

    document.getElementById("hidraulicaCompraAdaptadores").textContent =
        "🔩 Adaptadores para registro: " + Math.ceil(adaptadores) + " un.";

    document.getElementById("hidraulicaCompraRegistros").textContent =
        "🚰 Registros: " + Math.ceil(registros) + " un.";

    mostrarResultadoEIrPara("resultadoHidraulica");
}


/* =========================================================
   HIDRÁULICA - ESGOTO SANITÁRIO
   Referência técnica: SINAPI 89714 para tubo PVC DN 100 mm.
   O cálculo usa os comprimentos e quantidades informados pelo usuário.
   ========================================================= */

function calcularEsgoto() {

    const diametro = numero("esgotoDiametro");
    const comprimento = numero("esgotoComprimento");
    const perda = numero("esgotoPerda");
    const joelhos90 = numero("esgotoJoelhos90");
    const joelhos45 = numero("esgotoJoelhos45");
    const juncoes = numero("esgotoJuncoes");
    const ralos = numero("esgotoRalos");
    const caixas = numero("esgotoCaixas");

    const precoTubo = numero("esgotoPrecoTubo");
    const precoJoelho90 = numero("esgotoPrecoJoelho90");
    const precoJoelho45 = numero("esgotoPrecoJoelho45");
    const precoJuncao = numero("esgotoPrecoJuncao");
    const precoRalo = numero("esgotoPrecoRalo");
    const precoCaixa = numero("esgotoPrecoCaixa");
    const maoObra = numero("esgotoMaoObra");

    if (comprimento <= 0) {
        alert("Informe o comprimento da tubulação de esgoto.");
        return;
    }

    const tuboCompra = comprimento * (1 + perda / 100);
    const barras = Math.ceil(tuboCompra / 6);
    const metrosComprados = barras * 6;

    const custoTubo = barras * precoTubo;
    const custoJoelhos90 = joelhos90 * precoJoelho90;
    const custoJoelhos45 = joelhos45 * precoJoelho45;
    const custoJuncoes = juncoes * precoJuncao;
    const custoRalos = ralos * precoRalo;
    const custoCaixas = caixas * precoCaixa;

    const custoMateriais =
        custoTubo +
        custoJoelhos90 +
        custoJoelhos45 +
        custoJuncoes +
        custoRalos +
        custoCaixas;

    const custoMaoObra = comprimento * maoObra;
    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("esgotoCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("esgotoCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("esgotoCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("esgotoResultadoDiametro").textContent = "DN " + diametro + " mm";
    document.getElementById("esgotoResultadoTubo").textContent = comprimento.toFixed(2).replace(".", ",") + " m";
    document.getElementById("esgotoResultadoJoelhos90").textContent = joelhos90.toFixed(0) + " un.";
    document.getElementById("esgotoResultadoJoelhos45").textContent = joelhos45.toFixed(0) + " un.";
    document.getElementById("esgotoResultadoJuncoes").textContent = juncoes.toFixed(0) + " un.";
    document.getElementById("esgotoResultadoRalos").textContent = ralos.toFixed(0) + " un.";
    document.getElementById("esgotoResultadoCaixas").textContent = caixas.toFixed(0) + " un.";

    document.getElementById("esgotoCompraTubo").textContent =
        "🪠 Tubos PVC DN " + diametro + " mm: " + barras + " barras de 6 m (" +
        metrosComprados.toFixed(2).replace(".", ",") + " m comprados)";

    document.getElementById("esgotoCompraJoelhos90").textContent =
        "🔩 Joelhos 90°: " + Math.ceil(joelhos90) + " un.";

    document.getElementById("esgotoCompraJoelhos45").textContent =
        "🔩 Joelhos 45°: " + Math.ceil(joelhos45) + " un.";

    document.getElementById("esgotoCompraJuncoes").textContent =
        "🔩 Junções / tês: " + Math.ceil(juncoes) + " un.";

    document.getElementById("esgotoCompraRalos").textContent =
        "🚿 Ralos: " + Math.ceil(ralos) + " un.";

    document.getElementById("esgotoCompraCaixas").textContent =
        "📦 Caixas sifonadas: " + Math.ceil(caixas) + " un.";

    mostrarResultadoEIrPara("resultadoEsgoto");
}


/* =========================================================
   TELHADO - MODELOS E CÁLCULO
   ========================================================= */

const modelosTelhado = {
    fibrocimento: [
        {
            id: "residencial110244",
            nome: "Fibrocimento Residencial 1,10 x 2,44 m (5 mm)",
            largura: 1.10, comprimento: 2.44, larguraUtil: 1.05,
            comprimentoUtilPorInclinacao: { ate9: 2.19, ate14: 2.24, acima15: 2.30 },
            modo: "area"
        },
        {
            id: "ondulada1102446",
            nome: "Fibrocimento Ondulada 1,10 x 2,44 m (6 mm)",
            largura: 1.10, comprimento: 2.44, larguraUtil: 1.05,
            comprimentoUtilPorInclinacao: { ate9: 2.19, ate14: 2.24, acima15: 2.30 },
            modo: "area"
        },
        {
            id: "ondulada092244",
            nome: "Fibrocimento Ondulada 0,92 x 2,44 m",
            largura: 0.92, comprimento: 2.44, larguraUtil: 0.87,
            comprimentoUtilPorInclinacao: { ate9: 2.19, ate14: 2.24, acima15: 2.30 },
            modo: "area"
        },
        {
            id: "residencial110305",
            nome: "Fibrocimento 1,10 x 3,05 m (5 mm)",
            largura: 1.10, comprimento: 3.05, larguraUtil: 1.05,
            comprimentoUtilPorInclinacao: { ate9: 2.80, ate14: 2.94, acima15: 2.94 },
            modo: "area"
        },
        {
            id: "residencial110366",
            nome: "Fibrocimento 1,10 x 3,66 m (6 mm)",
            largura: 1.10, comprimento: 3.66, larguraUtil: 1.05,
            comprimentoUtilPorInclinacao: { ate9: 3.41, ate14: 3.58, acima15: 3.58 },
            modo: "area"
        },
        {
            id: "fibrotex050122",
            nome: "Fibrotex 0,50 x 1,22 m (4 mm)",
            largura: 0.50, comprimento: 1.22, larguraUtil: 0.44,
            comprimentoUtil: 1.22, modo: "area"
        },
        { id: "personalizada", nome: "Outra medida / personalizada", modo: "personalizada" }
    ],
    ceramica: [
        { id: "colonial29", nome: "Colonial — rendimento aprox. 29 peças/m²", modo: "pecas", pecasM2: 29 },
        { id: "colonialc50", nome: "Colonial C-50 — rendimento aprox. 22 peças/m²", modo: "pecas", pecasM2: 22 },
        { id: "colonialc47", nome: "Colonial C-47 — rendimento aprox. 27,4 peças/m²", modo: "pecas", pecasM2: 27.4 },
        { id: "personalizada", nome: "Outra medida / rendimento do fabricante", modo: "personalizada" }
    ],
    galvanizada: [
        { id: "personalizada", nome: "Informe a medida da telha", modo: "personalizada" }
    ],
    galvalume: [
        { id: "personalizada", nome: "Informe a medida da telha", modo: "personalizada" }
    ],
    concreto: [
        { id: "personalizada", nome: "Modelo / rendimento do fabricante", modo: "personalizada" }
    ],
    outra: [
        { id: "personalizada", nome: "Informe as medidas da telha", modo: "personalizada" }
    ]
};

function alternarMateriaisTelhado() {
    const ativo = document.getElementById("telhadoCalcularMateriais").checked;
    document.getElementById("telhadoMateriaisCampos").style.display = ativo ? "block" : "none";

    if (ativo) {
        atualizarModelosTelhado();
        return;
    }

    // Ao desmarcar materiais, o valor dos materiais deve sair imediatamente
    // do orçamento e permanecer somente a mão de obra no total.
    document.getElementById("telhadoCustoMateriais").textContent = dinheiro(0);
    document.getElementById("telhadoResultadoModelo").textContent = "Materiais não calculados";
    document.getElementById("telhadoResultadoTelhas").textContent = "Não calculado";
    document.getElementById("telhadoCompraTelhas").textContent = "🏠 Telhas: não calculadas";

    const comprimento = numero("telhadoComprimento");
    const largura = numero("telhadoLargura");
    const inclinacao = numero("telhadoInclinacao");
    const maoObra = numero("telhadoMaoObra");

    if (comprimento > 0 && largura > 0) {
        const areaPlanta = comprimento * largura;
        const angulo = Math.atan(inclinacao / 100);
        const areaInclinada = areaPlanta / Math.cos(angulo);
        const custoMaoObra = areaInclinada * maoObra;
        document.getElementById("telhadoCustoMaoObra").textContent = dinheiro(custoMaoObra);
        document.getElementById("telhadoCustoTotal").textContent = dinheiro(custoMaoObra);
    } else {
        document.getElementById("telhadoCustoMaoObra").textContent = dinheiro(0);
        document.getElementById("telhadoCustoTotal").textContent = dinheiro(0);
    }
}

function atualizarModelosTelhado() {
    const tipo = document.getElementById("telhadoTipo").value;
    const select = document.getElementById("telhadoModelo");
    select.innerHTML = "";
    (modelosTelhado[tipo] || modelosTelhado.outra).forEach(modelo => {
        const option = document.createElement("option");
        option.value = modelo.id;
        option.textContent = modelo.nome;
        select.appendChild(option);
    });
    selecionarModeloTelhado();
}

function selecionarModeloTelhado() {
    const tipo = document.getElementById("telhadoTipo").value;
    const id = document.getElementById("telhadoModelo").value;
    const modelo = (modelosTelhado[tipo] || []).find(item => item.id === id) || { id: "personalizada", nome: "Personalizada", modo: "personalizada" };
    const personalizada = modelo.modo === "personalizada";
    document.getElementById("telhadoPersonalizado").style.display = personalizada ? "block" : "none";

    if (!personalizada) {
        if (modelo.largura) document.getElementById("telhadoLarguraTelha").value = modelo.largura;
        if (modelo.comprimento) document.getElementById("telhadoComprimentoTelha").value = modelo.comprimento;
        document.getElementById("telhadoPecasM2").value = modelo.pecasM2 || "";
    }

    atualizarResumoTecnicoTelhado(modelo);
}

function comprimentoUtilTelhado(modelo, inclinacao) {
    if (modelo.comprimentoUtil) return modelo.comprimentoUtil;
    if (!modelo.comprimentoUtilPorInclinacao) return 0;
    if (inclinacao <= 9) return modelo.comprimentoUtilPorInclinacao.ate9;
    if (inclinacao < 15) return modelo.comprimentoUtilPorInclinacao.ate14;
    return modelo.comprimentoUtilPorInclinacao.acima15;
}

function atualizarResumoTecnicoTelhado(modelo) {
    const inclinacao = numero("telhadoInclinacao");
    const resumo = document.getElementById("telhadoResumoModelo");
    if (!resumo) return;
    if (modelo.modo === "pecas") {
        resumo.innerHTML = `Rendimento automático: <strong>${formatarNumero(modelo.pecasM2, 1)} peças/m²</strong>. O cálculo considera capa + canal quando aplicável.`;
        return;
    }
    if (modelo.modo === "personalizada") {
        resumo.textContent = "Informe as medidas da telha e o rendimento/área útil conforme a ficha técnica do fabricante.";
        return;
    }
    const compUtil = comprimentoUtilTelhado(modelo, inclinacao);
    const areaUtil = modelo.larguraUtil * compUtil;
    const recobrimentoLateral = Math.max(0, modelo.largura - modelo.larguraUtil);
    const recobrimentoLongitudinal = Math.max(0, modelo.comprimento - compUtil);
    resumo.innerHTML = `Medida: <strong>${formatarNumero(modelo.largura, 2)} × ${formatarNumero(modelo.comprimento, 2)} m</strong> · Largura útil: <strong>${formatarNumero(modelo.larguraUtil, 2)} m</strong> · Comprimento útil: <strong>${formatarNumero(compUtil, 2)} m</strong> · Recobrimento lateral: <strong>${formatarNumero(recobrimentoLateral * 100, 0)} cm</strong> · Recobrimento longitudinal: <strong>${formatarNumero(recobrimentoLongitudinal * 100, 0)} cm</strong> · Área útil aproximada: <strong>${formatarNumero(areaUtil, 2)} m²/peça</strong>.`;
}

function calcularTelhado() {
    const comprimento = numero("telhadoComprimento");
    const largura = numero("telhadoLargura");
    const inclinacao = numero("telhadoInclinacao");
    const perda = numero("telhadoPerda");
    const maoObra = numero("telhadoMaoObra");
    const calcularMateriais = document.getElementById("telhadoCalcularMateriais").checked;

    if (comprimento <= 0 || largura <= 0) {
        alert("Informe o comprimento e a largura da cobertura.");
        return;
    }

    const areaPlanta = comprimento * largura;
    const angulo = Math.atan(inclinacao / 100);
    const areaInclinada = areaPlanta / Math.cos(angulo);
    const custoMaoObra = areaInclinada * maoObra;

    let quantidadeTecnica = 0;
    let quantidadeCompra = 0;
    let custoMateriais = 0;
    let modeloNome = "Materiais não calculados";

    if (calcularMateriais) {
        const tipo = document.getElementById("telhadoTipo").value;
        const id = document.getElementById("telhadoModelo").value;
        const modelo = (modelosTelhado[tipo] || []).find(item => item.id === id) || { id: "personalizada", nome: "Personalizada", modo: "personalizada" };
        modeloNome = modelo.nome;

        if (modelo.modo === "pecas") {
            const pecasM2 = modelo.pecasM2;
            if (!(pecasM2 > 0)) {
                alert("Informe o rendimento em peças por m² do fabricante.");
                return;
            }
            quantidadeTecnica = areaInclinada * pecasM2;
        } else {
            let larguraUtil = modelo.larguraUtil;
            let comprimentoUtil = comprimentoUtilTelhado(modelo, inclinacao);
            let pecasM2 = numero("telhadoPecasM2");

            if (modelo.modo === "personalizada") {
                larguraUtil = numero("telhadoLarguraUtil");
                comprimentoUtil = numero("telhadoComprimentoUtil");
            }

            if (pecasM2 > 0) {
                quantidadeTecnica = areaInclinada * pecasM2;
            } else if (larguraUtil > 0 && comprimentoUtil > 0) {
                quantidadeTecnica = areaInclinada / (larguraUtil * comprimentoUtil);
            } else {
                alert("Informe o rendimento ou as medidas úteis da telha.");
                return;
            }
        }

        quantidadeCompra = Math.ceil(quantidadeTecnica * (1 + perda / 100));
        const precoTelha = numero("telhadoPrecoTelha");
        const precoEstrutura = numero("telhadoPrecoEstrutura");
        custoMateriais = quantidadeCompra * precoTelha + precoEstrutura;
    }

    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("telhadoResultadoPlanta").textContent = formatarNumero(areaPlanta, 2) + " m²";
    document.getElementById("telhadoResultadoInclinacao").textContent = formatarNumero(inclinacao, 1) + "%";
    document.getElementById("telhadoResultadoArea").textContent = formatarNumero(areaInclinada, 2) + " m²";
    document.getElementById("telhadoResultadoAreaTecnica").textContent = formatarNumero(areaInclinada, 2) + " m²";
    document.getElementById("telhadoResultadoModelo").textContent = modeloNome;
    document.getElementById("telhadoResultadoTelhas").textContent = calcularMateriais ? formatarNumero(quantidadeTecnica, 2) + " un." : "Não calculado";
    document.getElementById("telhadoCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("telhadoCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("telhadoCustoTotal").textContent = dinheiro(custoTotal);
    document.getElementById("telhadoCompraTelhas").textContent = calcularMateriais ? "🏠 Telhas: " + quantidadeCompra + " unidades" : "🏠 Telhas: não calculadas";
    document.getElementById("telhadoCompraArea").textContent = "📐 Área inclinada considerada: " + formatarNumero(areaInclinada, 2) + " m²";

    mostrarResultadoEIrPara("resultadoTelhado");
}


/* =========================================================
   CALHAS E RUFOS
   ========================================================= */

function calcularCalhasRufos() {

    const numero = function (id) {
        return Number(document.getElementById(id).value) || 0;
    };

    const dinheiro = function (valor) {
        return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    };

    const arredondar = function (valor) {
        return Math.ceil(valor);
    };

    const comprimentoCalha = numero("calhasComprimento");
    const comprimentoRufo = numero("calhasComprimentoRufo");
    const comprimentoCondutor = numero("calhasComprimentoCondutor");
    const descidas = numero("calhasDescidas");
    const emendas = numero("calhasEmendas");
    const cantos = numero("calhasCantos");
    const bocais = numero("calhasBocais");
    const emendasRufo = numero("calhasEmendasRufo");
    const suportes = numero("calhasSuportes");
    const perda = numero("calhasPerda");

    const precoCalha = numero("calhasPrecoCalha");
    const precoRufo = numero("calhasPrecoRufo");
    const precoCondutor = numero("calhasPrecoCondutor");
    const precoEmenda = numero("calhasPrecoEmenda");
    const precoCanto = numero("calhasPrecoCanto");
    const precoBocal = numero("calhasPrecoBocal");
    const precoEmendaRufo = numero("calhasPrecoEmendaRufo");
    const precoSuporte = numero("calhasPrecoSuporte");

    const maoObraCalha = numero("calhasMaoObraCalha");
    const maoObraRufo = numero("calhasMaoObraRufo");
    const maoObraCondutor = numero("calhasMaoObraCondutor");
    const maoObraPeca = numero("calhasMaoObraPeca");

    const fatorPerda = 1 + perda / 100;
    const compraCalha = comprimentoCalha * fatorPerda;
    const compraRufo = comprimentoRufo * fatorPerda;
    const compraCondutor = comprimentoCondutor * fatorPerda;

    const totalPecas = emendas + cantos + bocais + emendasRufo + suportes;

    const custoMateriais =
        compraCalha * precoCalha +
        compraRufo * precoRufo +
        compraCondutor * precoCondutor +
        emendas * precoEmenda +
        cantos * precoCanto +
        bocais * precoBocal +
        emendasRufo * precoEmendaRufo +
        suportes * precoSuporte;

    const custoMaoObra =
        comprimentoCalha * maoObraCalha +
        comprimentoRufo * maoObraRufo +
        comprimentoCondutor * maoObraCondutor +
        totalPecas * maoObraPeca;

    const custoTotal = custoMateriais + custoMaoObra;

    document.getElementById("calhasCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("calhasCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("calhasCustoTotal").textContent = dinheiro(custoTotal);

    document.getElementById("calhasResultadoCalha").textContent = comprimentoCalha.toFixed(2).replace(".", ",") + " m";
    document.getElementById("calhasResultadoRufo").textContent = comprimentoRufo.toFixed(2).replace(".", ",") + " m";
    document.getElementById("calhasResultadoCondutor").textContent = comprimentoCondutor.toFixed(2).replace(".", ",") + " m";
    document.getElementById("calhasResultadoDescidas").textContent = descidas + " un.";
    document.getElementById("calhasResultadoSuportes").textContent = suportes + " un.";

    document.getElementById("calhasCompraCalha").textContent = "🏠 Calhas: " + compraCalha.toFixed(2).replace(".", ",") + " m";
    document.getElementById("calhasCompraRufo").textContent = "🔧 Rufos: " + compraRufo.toFixed(2).replace(".", ",") + " m";
    document.getElementById("calhasCompraCondutor").textContent = "🚰 Condutores: " + compraCondutor.toFixed(2).replace(".", ",") + " m";
    document.getElementById("calhasCompraPecas").textContent =
        "🔩 Acessórios: " +
        arredondar(totalPecas) + " un. (emendas, cantos, bocais, emendas de rufo e suportes)";

    mostrarResultadoEIrPara("resultadoCalhasRufos");
}


/* =========================================================
   APARELHOS HIDRÁULICOS
   ========================================================= */

let aparelhosHidraulicos = [];

function atualizarListaAparelhosHidraulicos() {
    const lista = document.getElementById("listaAparelhosHidraulicos");
    if (!lista) return;

    if (aparelhosHidraulicos.length === 0) {
        lista.innerHTML = '<div class="item-compra">Nenhum aparelho adicionado.</div>';
        const resultado = document.getElementById("resultadoAparelhosHidraulicos");
        if (resultado) resultado.style.display = "none";
        return;
    }

    lista.innerHTML = aparelhosHidraulicos.map(function(item, index) {
        return '<div class="item-compra" style="display:flex;justify-content:space-between;gap:10px;align-items:center;">' +
            '<span>' + item.nome + ' — ' + item.quantidade + ' un. — Material: ' + dinheiro(item.precoMaterial) + '/un. — M.O.: ' + dinheiro(item.maoObra) + '/un.</span>' +
            '<button type="button" onclick="removerAparelhoHidraulico(' + index + ')" style="border:0;background:none;cursor:pointer;font-size:18px;">🗑️</button>' +
            '</div>';
    }).join('');
}

function configurarAparelhoOutro() {
    const tipo = document.getElementById("aparelhoTipo");
    const campo = document.getElementById("aparelhoOutroCampo");
    if (tipo && campo) campo.style.display = tipo.value === "Outro" ? "block" : "none";
}

function adicionarAparelhoHidraulico() {
    const tipo = document.getElementById("aparelhoTipo").value;
    const outro = (document.getElementById("aparelhoOutro").value || "").trim();
    const nome = tipo === "Outro" ? outro : tipo;
    const quantidade = numero("aparelhoQuantidade");
    const precoMaterial = numero("aparelhoPrecoMaterial");
    const maoObra = numero("aparelhoMaoObra");

    if (!nome) { alert("Informe o nome do aparelho."); return; }
    if (quantidade <= 0) { alert("Informe uma quantidade válida."); return; }

    aparelhosHidraulicos.push({ nome, quantidade, precoMaterial, maoObra });
    atualizarListaAparelhosHidraulicos();

    document.getElementById("aparelhoQuantidade").value = 1;
    document.getElementById("aparelhoPrecoMaterial").value = "";
    document.getElementById("aparelhoMaoObra").value = "";
    if (tipo === "Outro") document.getElementById("aparelhoOutro").value = "";
}

function removerAparelhoHidraulico(index) {
    aparelhosHidraulicos.splice(index, 1);
    atualizarListaAparelhosHidraulicos();
    if (aparelhosHidraulicos.length > 0) calcularAparelhosHidraulicos();
}

function calcularAparelhosHidraulicos() {
    if (aparelhosHidraulicos.length === 0) {
        alert("Adicione pelo menos um aparelho.");
        return;
    }

    let materiais = 0;
    let maoObra = 0;
    let tecnico = [];
    let compra = [];

    aparelhosHidraulicos.forEach(function(item) {
        materiais += item.quantidade * item.precoMaterial;
        maoObra += item.quantidade * item.maoObra;
        tecnico.push('<div class="linha-resultado"><span>' + item.nome + '</span><strong>' + item.quantidade + ' un.</strong></div>');
        compra.push('<div class="item-compra">🔧 ' + item.nome + ': ' + Math.ceil(item.quantidade) + ' un.</div>');
    });

    document.getElementById("aparelhosCustoMateriais").textContent = dinheiro(materiais);
    document.getElementById("aparelhosCustoMaoObra").textContent = dinheiro(maoObra);
    document.getElementById("aparelhosCustoTotal").textContent = dinheiro(materiais + maoObra);
    document.getElementById("aparelhosResultadoItens").innerHTML = tecnico.join('');
    document.getElementById("aparelhosCompraItens").innerHTML = compra.join('');
    mostrarResultadoEIrPara("resultadoAparelhosHidraulicos");
}



/* =========================================================
   COBERTURA - FORRO
   ========================================================= */

function alternarMateriaisForro() {
    const ativo = document.getElementById("forroCalcularMateriais").checked;
    document.getElementById("forroMateriaisCampos").style.display = ativo ? "block" : "none";

    if (!ativo) {
        document.getElementById("forroCustoMateriais").textContent = dinheiro(0);
        document.getElementById("forroCompraMaterial").textContent = "🏠 Material: não calculado";
        const area = numero("forroComprimento") * numero("forroLargura");
        document.getElementById("forroResultadoAreaCompra").textContent = formatarNumero(area) + " m²";
        document.getElementById("forroCustoTotal").textContent = document.getElementById("forroCustoMaoObra").textContent;
    }
}

function calcularForro() {
    const comprimento = numero("forroComprimento");
    const largura = numero("forroLargura");
    const perda = numero("forroPerda");
    const maoObra = numero("forroMaoObra");
    const tipo = document.getElementById("forroTipo").value;

    if (comprimento <= 0 || largura <= 0) {
        alert("Informe o comprimento e a largura do ambiente.");
        return;
    }

    const area = comprimento * largura;
    const areaCompra = area * (1 + perda / 100);
    const custoMaoObra = area * maoObra;
    let custoMateriais = 0;

    if (document.getElementById("forroCalcularMateriais").checked) {
        const precoMaterial = numero("forroPrecoMaterial");
        const estrutura = numero("forroPrecoEstrutura");
        custoMateriais = areaCompra * precoMaterial + estrutura;
    }

    document.getElementById("forroResultadoArea").textContent = formatarNumero(area) + " m²";
    document.getElementById("forroResultadoTipo").textContent = tipo;
    document.getElementById("forroResultadoAreaUtil").textContent = formatarNumero(area) + " m²";
    document.getElementById("forroResultadoAreaCompra").textContent = formatarNumero(areaCompra) + " m²";
    document.getElementById("forroCustoMateriais").textContent = dinheiro(custoMateriais);
    document.getElementById("forroCustoMaoObra").textContent = dinheiro(custoMaoObra);
    document.getElementById("forroCustoTotal").textContent = dinheiro(custoMateriais + custoMaoObra);

    if (document.getElementById("forroCalcularMateriais").checked) {
        document.getElementById("forroCompraMaterial").textContent = "🏠 " + tipo + ": " + formatarNumero(areaCompra) + " m² para compra";
    } else {
        document.getElementById("forroCompraMaterial").textContent = "🏠 Material: não calculado";
    }

    mostrarResultadoEIrPara("resultadoForro");
}

function formatarNumero(valor) {
    return Number(valor).toFixed(2).replace(".", ",");
}



/* Recuperado do módulo Impermeabilização */
function abrirImpermeabilizacao() {

    esconderTodasAsTelas();

    document.getElementById("impermeabilizacao").style.display = "block";

    rolarParaTopo();
}

/* Recuperado do módulo Impermeabilização */
function alternarMateriaisImpermeabilizacao() {

    const checkbox = document.getElementById("impermeabilizacaoCalcularMateriais");
    const campos = document.getElementById("impermeabilizacaoMateriaisCampos");

    if (!checkbox || !campos) {
        return;
    }

    campos.style.display = checkbox.checked ? "block" : "none";

    const resultado = document.getElementById("resultadoImpermeabilizacao");

    if (resultado && resultado.style.display !== "none") {
        calcularImpermeabilizacao();
    }
}

/* Recuperado do módulo Impermeabilização */
function calcularImpermeabilizacao() {

    const comprimento = numero("impermeabilizacaoComprimento");
    const largura = numero("impermeabilizacaoLargura");
    const perda = numero("impermeabilizacaoPerda");
    const maoObra = numero("impermeabilizacaoMaoObra");
    const tipo = document.getElementById("impermeabilizacaoTipo").value;
    const calcularMateriais = document.getElementById("impermeabilizacaoCalcularMateriais").checked;

    if (comprimento <= 0 || largura <= 0) {
        alert("Informe o comprimento e a largura da área a impermeabilizar.");
        return;
    }

    const area = comprimento * largura;
    const areaComPerda = area * (1 + perda / 100);
    const custoMaoObra = area * maoObra;

    let custoMateriais = 0;
    let consumoTecnico = "-";
    let unidadesCompra = 0;

    if (calcularMateriais) {

        const rendimento = numero("impermeabilizacaoRendimento");
        let demaos = numero("impermeabilizacaoDemaos");
        const precoUnidade = numero("impermeabilizacaoPrecoUnidade");
        const acessorios = numero("impermeabilizacaoAcessorios");

        if (rendimento <= 0) {
            alert("Informe o rendimento do produto em m² por unidade/demão.");
            return;
        }

        if (demaos < 1) {
            demaos = 1;
            document.getElementById("impermeabilizacaoDemaos").value = 1;
        }

        /*
           Consumo técnico:
           área real × número de demãos ÷ rendimento da unidade.
           A perda é aplicada somente na compra sugerida.
        */
        const unidadesTecnicas = (area * demaos) / rendimento;
        unidadesCompra = Math.ceil((areaComPerda * demaos) / rendimento);

        custoMateriais =
            (unidadesCompra * precoUnidade) +
            acessorios;

        consumoTecnico =
            formatarNumero(unidadesTecnicas) + " unidade(s)";

        document.getElementById("impermeabilizacaoResultadoDemaos").textContent =
            demaos + " demão(s)";

        document.getElementById("impermeabilizacaoCompraProduto").textContent =
            "💧 " + tipo + ": " + unidadesCompra + " unidade(s)";

        document.getElementById("impermeabilizacaoCompraArea").textContent =
            "📐 Área para compra: " + formatarNumero(areaComPerda) + " m²";

    } else {

        document.getElementById("impermeabilizacaoResultadoDemaos").textContent =
            "Não calculado";

        document.getElementById("impermeabilizacaoCompraProduto").textContent =
            "💧 Produto: não calculado";

        document.getElementById("impermeabilizacaoCompraArea").textContent =
            "📐 Área para compra: não calculada";
    }

    document.getElementById("impermeabilizacaoResultadoArea").textContent =
        formatarNumero(area) + " m²";

    document.getElementById("impermeabilizacaoResultadoTipo").textContent =
        tipo;

    document.getElementById("impermeabilizacaoResultadoAreaUtil").textContent =
        formatarNumero(area) + " m²";

    document.getElementById("impermeabilizacaoResultadoConsumo").textContent =
        consumoTecnico;

    document.getElementById("impermeabilizacaoCustoMateriais").textContent =
        dinheiro(custoMateriais);

    document.getElementById("impermeabilizacaoCustoMaoObra").textContent =
        dinheiro(custoMaoObra);

    document.getElementById("impermeabilizacaoCustoTotal").textContent =
        dinheiro(custoMateriais + custoMaoObra);

    mostrarResultadoEIrPara("resultadoImpermeabilizacao");
}