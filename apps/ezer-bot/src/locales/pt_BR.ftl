# Welcome messages
welcome-message =
    🎵 *Bem-vindo ao Bot Ezer!* 🎵

    Olá { $first_name }! Sou seu companheiro musical para o ecossistema Kinnor.

    Posso ajudá-lo com:
    • Busca e descoberta de músicas
    • Identificação de áudio
    • Gerenciamento de playlists
    • E muito mais!

    Use /help para ver todos os comandos disponíveis.

# Inline keyboard buttons
search-button = 🎵 Buscar Músicas
playlists-button = 📋 Minhas Playlists
help-button = ❓ Ajuda

# Auth link messages
auth-link-success = ✅ Conta vinculada com sucesso! Seu Telegram agora está conectado.
auth-link-invalid = ❌ Link inválido. Gere um novo no seu perfil Shaliah.
auth-link-expired = ⏰ Link expirado. O link é válido por 15 minutos. Gere um novo.
auth-link-used = 🔒 Link já utilizado. Faça logout e gere um novo link.
auth-link-cancelled = ⚠️ Este link foi cancelado. Gere um novo no seu perfil.
auth-link-error = ❌ Erro ao processar sua solicitação. Tente novamente.
auth-link-already-linked = ✅ Sua conta já está vinculada! Você pode usar o Ezer bot normalmente.
auth-link-different-user = ⚠️ Esta conta do Telegram já está vinculada a outro usuário. Desvincule esta conta primeiro, e tente novamente.
auth-link-unlinked = ℹ️ Sua conta Shaliah não está vinculada. Abra seu perfil no Shaliah e gere um QR para conectar.

# Callback replies
search-reply = 🎵 *Busca de Músicas*

    Funcionalidade de busca em breve!
playlists-reply = 📋 *Minhas Playlists*

    Gerenciamento de playlists em breve!
help-reply = ❓ *Ajuda*

    Comandos disponíveis:
    /start - Mensagem de boas-vindas
    /help - Esta mensagem de ajuda

# Ezer authentication messages (from contracts/bot-start-command.md)
auth-link-success = ✅ Conta vinculada com sucesso!

    Seu Telegram agora está conectado à sua conta Shaliah. Você pode começar a usar o bot.

auth-link-error-invalid = ❌ Link inválido

    Este link de autenticação não é válido. Por favor, gere um novo link no seu perfil em Shaliah.

auth-link-error-expired = ⏰ Link expirado

    Este link expirou. Os links de autenticação são válidos por apenas 15 minutos.

    Por favor, gere um novo link no seu perfil em Shaliah.

auth-link-error-used = 🔒 Link já utilizado

    Este link já foi usado para vincular uma conta e não pode ser reutilizado.

    Se você precisa desvincular e vincular novamente, faça logout no Shaliah e gere um novo link.

auth-link-error-invalidated = ⚠️ Link cancelado

    Este link foi cancelado porque um novo link foi gerado.

    Use o link mais recente do seu perfil em Shaliah.

auth-link-error-collision = ⚠️ Esta conta Telegram já está vinculada

    Esta conta Telegram já está vinculada a outra conta Shaliah.

    Se você deseja trocar a vinculação, primeiro faça logout na outra conta.

auth-link-error-generic = ❌ Erro ao processar

    Ocorreu um erro ao vincular sua conta. Por favor, tente novamente em alguns instantes.

    Se o problema persistir, entre em contato com o suporte.

account-unlinked = 🟢 Sua conta Shaliah não está mais vinculada

    Por favor, visite seu perfil no Shaliah e gere um novo código QR para conectar.

# Dependency check messages (from 007-ezer-fix)
shaliah-offline-message = 
    🔧 *Shaliah está offline no momento*
    
    Preciso que o Shaliah esteja funcionando para te ajudar. Tente novamente mais tarde.

# Development mode logging messages
dev-mode-bypass-log = 🔧 Modo desenvolvimento: Ignorando verificação de dependência do Shaliah
dev-mode-config-log = 🔧 Modo desenvolvimento: NODE_ENV={ $node_env } detectado, verificações de dependência desabilitadas

# Health check logging messages
health-check-start-log = 🔍 Iniciando verificação de saúde do Shaliah em { $url }
health-check-success-log = ✅ Verificação de saúde do Shaliah bem-sucedida (tempo de resposta: { $response_time }ms)
health-check-failure-log = ❌ Verificação de saúde do Shaliah falhou: { $error }
health-check-timeout-log = ⏰ Verificação de saúde do Shaliah expirou após { $timeout }ms
health-check-config-error-log = ⚠️ Erro de configuração da verificação de saúde: { $error }

# Unlink account messages
unlink-success = ✅ Conta desvinculada com sucesso!

    Sua conta do Telegram foi desconectada da sua conta Shaliah.

    Para vincular novamente, visite seu perfil no Shaliah e gere um novo código QR.

unlink-error-not-linked = ⚠️ Conta não vinculada

    Sua conta do Telegram não está atualmente vinculada a nenhuma conta Shaliah.

unlink-error-no-user = ❌ Não foi possível identificar o usuário

    Houve um erro ao identificar sua conta do Telegram. Tente novamente.

unlink-error-generic = ❌ Falha ao desvincular

    Ocorreu um erro ao desvincular sua conta. Tente novamente mais tarde.

link-account-button = 🔗 Vincular Conta

# Unlink confirmation flow
unlink-button = 🔗 Desvincular Conta
unlink-confirmation = ⚠️ *Confirmar Desvinculação da Conta*

    Tem certeza de que deseja desvincular sua conta do Telegram da sua conta Shaliah?

    Isso desconectará suas contas e você precisará vinculá-las novamente para usar o bot.

confirm-unlink-button = ✅ Sim, Desvincular
cancel-button = ❌ Cancelar
unlink-cancelled = ✅ Desvinculação cancelada

    Sua conta permanece vinculada.

