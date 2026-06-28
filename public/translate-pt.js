// Rhythmic Geometry — Portuguese (pt-BR) translation overlay
// Injected before the original bundle. Uses MutationObserver to translate
// text nodes as React renders them. Safe: only touches text content, never
// attributes or React state.

(function () {
  "use strict";

  // Translation dictionary: English (exact match) → Portuguese
  // Keys are matched against the trimmed text content of text nodes.
  // We do NOT translate:
  //   - Mode names (Orbit/Study/Riff) — keep as brand
  //   - Atmosphere names (Classic/Void/Deep Space/etc) — keep as brand
  //   - Tone preset names (Glass/Deep/Rain/Dream/Warm) — keep as brand
  //   - Scale names (Aeolian/Bembe/Bossa/etc) — music terms stay
  //   - Scene names (Prime Ritual/Rose Engine/etc) — keep as brand
  const DICT = {
    // ─── Landing / nav ─────────────────────────────────────────────────
    "Launch App": "Abrir App",
    "See Modes": "Ver Modos",
    "Modes": "Modos",
    "Showcase": "Galeria",
    "What Is It?": "O Que É?",
    "Tools": "Ferramentas",
    "Pro": "Pro",
    "Sign In": "Entrar",
    "Sign Out": "Sair",
    "Account": "Conta",
    "Close account panel": "Fechar painel da conta",
    "Already have an account? Sign in": "Já tem conta? Entre",
    "Need an account? Create one": "Precisa de conta? Crie uma",
    "Create Account": "Criar Conta",
    "Forgot password?": "Esqueceu a senha?",
    "Password": "Senha",
    "Restoring session…": "Restaurando sessão…",
    "Working…": "Processando…",
    "Signed in": "Conectado",
    "Signed in.": "Conectado.",
    "Enter an email address first.": "Digite um email primeiro.",
    "Enter your password first.": "Digite sua senha primeiro.",
    "Use at least 8 characters for your password.": "Use ao menos 8 caracteres na senha.",
    "Account created. Sign in to continue.": "Conta criada. Entre para continuar.",
    "Account created. You can sign in now.": "Conta criada. Você já pode entrar.",
    "Password reset email sent.": "Email de redefinição de senha enviado.",
    "That email already has an account. Sign in or reset your password.":
      "Esse email já tem conta. Entre ou redefina a senha.",
    "Accounts are not available yet.": "Contas ainda não estão disponíveis.",
    "Accounts are offline until Supabase is configured.":
      "Contas estão offline até o Supabase ser configurado.",
    "Website sign-in is unavailable until the auth environment is connected.":
      "Login indisponível até o ambiente de auth ser conectado.",
    "Create an account to keep your work in sync.":
      "Crie uma conta pra manter seu trabalho sincronizado.",
    "Sign in to return to your saved work and Pro access.":
      "Entre pra voltar ao seu trabalho salvo e acesso Pro.",
    "Use one account across the site and the instrument.":
      "Use uma conta no site e no instrumento.",

    // ─── Hero ───────────────────────────────────────────────────────────
    "Rhythm": "Ritmo",
    "Visualized": "Visualizado",
    "Through": "Através de",
    "Geometry": "Geometria",
    "See The Structure Inside Rhythm": "Veja a Estrutura Dentro do Ritmo",
    "A moving visual instrument for exploring rhythm as structure.":
      "Um instrumento visual em movimento pra explorar ritmo como estrutura.",
    "Set simple ratios. Watch them unfold into motion, pattern, and form.":
      "Defina razões simples. Veja elas se desdobrarem em movimento, padrão e forma.",
    "What you hear as rhythm... reveals itself as geometry over time.":
      "O que você ouve como ritmo... se revela como geometria ao longo do tempo.",

    // ─── Modes section ──────────────────────────────────────────────────
    "Three Clear Entries": "Três Entradas Claras",
    "The Instrument": "O Instrumento",
    "Not a visualization. A system.": "Não é visualização. É um sistema.",
    "Rhythmic Geometry™ is a space for discovery. Simple inputs create complex results - patterns that emerge, repeat, and transform over time.":
      "Rhythmic Geometry™ é um espaço pra descoberta. Entradas simples criam resultados complexos — padrões que surgem, repetem e transformam ao longo do tempo.",
    "Set constraints. Watch structure appear.": "Defina restrições. Veja a estrutura aparecer.",
    "Form": "Forma",
    "Best for": "Melhor pra",
    "First move": "Primeiro passo",

    // ─── Mode descriptions (eyebrows/summaries/details) ─────────────────
    "See rhythm as motion.": "Veja o ritmo como movimento.",
    "Seeing rhythm as motion.": "Vendo o ritmo como movimento.",
    "Every ratio becomes a path. Every cycle leaves a shape.":
      "Cada razão vira um caminho. Cada ciclo deixa uma forma.",
    "Two cycles rotating in time. As they repeat, their relationship traces a pattern - a geometric memory of the rhythm itself.":
      "Dois ciclos girando no tempo. Conforme se repetem, a relação entre eles traça um padrão — uma memória geométrica do próprio ritmo.",
    "Layer simple pulse counts into moving orbits.":
      "Sobreponha contagens simples de pulsos em órbitas em movimento.",
    "Watch the drawing reveal how the cycles relate.":
      "Veja o desenho revelar como os ciclos se relacionam.",
    "Enter Orbit": "Entrar em Órbita",

    "See how rhythms align.": "Veja como os ritmos se alinham.",
    "Seeing how rhythms align.": "Vendo como os ritmos se alinham.",
    "Where do the pulses agree? Where do they drift apart?":
      "Onde os pulsos concordam? Onde se separam?",
    "Break rhythm into shared structure. Visualize how cycles meet, divide, and resolve - revealing the hidden framework behind polyrhythm.":
      "Decomponha o ritmo em estrutura compartilhada. Visualize como os ciclos se encontram, dividem e resolvem — revelando a estrutura oculta por trás da polirritmia.",
    "Compare rhythm layers on one shared grid.":
      "Compare camadas de ritmo em uma grade compartilhada.",
    "See exactly where the pulses line up.":
      "Veja exatamente onde os pulsos se alinham.",
    "Open Study": "Abrir Estudo",

    "Build rhythm as structure.": "Construa ritmo como estrutura.",
    "Building rhythm as structure.": "Construindo ritmo como estrutura.",
    "Not just what you play - but how it cycles.":
      "Não só o que você toca — mas como isso cicla.",
    "Write and explore patterns through time. Shape grooves, displace accents, and feel how structure evolves when rhythm becomes a system instead of a loop.":
      "Escreva e explore padrões ao longo do tempo. Molde grooves, desloque acentos e sinta como a estrutura evolui quando o ritmo vira um sistema em vez de um loop.",
    "Build hits, rests, and accents into a riff.":
      "Construa hits, pausas e acentos em um riff.",
    "See where the phrase returns, shifts, or lands.":
      "Veja onde a frase retorna, muda ou pousa.",
    "Start Riff": "Iniciar Riff",
    "Set a simple ratio and press Play.": "Defina uma razão simples e toque Play.",
    "Start with two layers and watch where they meet.":
      "Comece com duas camadas e veja onde elas se encontram.",
    "Write a pattern, then let it cycle through time.":
      "Escreva um padrão e deixe ele ciclar no tempo.",

    // ─── Showcase ────────────────────────────────────────────────────────
    "Orbits Showcase": "Galeria de Órbitas",
    "Orbits scenes where moving ratios leave visible form behind.":
      "Cenas de Órbitas onde razões em movimento deixam forma visível pra trás.",
    "Featured Orbits Scene": "Cena de Órbitas em Destaque",
    "Orbits Scene": "Cena de Órbitas",
    "Rotating cycles forming evolving geometric patterns from rhythmic ratios":
      "Ciclos girando formam padrões geométricos que evoluem a partir de razões rítmicas",

    // ─── Philosophy ──────────────────────────────────────────────────────
    "Why it works": "Por que funciona",
    "Rhythm is ratio. Ratio creates motion. Motion forms geometry.":
      "Ritmo é razão. Razão cria movimento. Movimento forma geometria.",
    "What you hear... is structure unfolding in time.":
      "O que você ouve... é estrutura se desdobrando no tempo.",
    "Music, math, motion, and form - different expressions of the same relationship.":
      "Música, matemática, movimento e forma — diferentes expressões da mesma relação.",
    "Read More": "Ler Mais",

    // ─── Tools ───────────────────────────────────────────────────────────
    "Workflow Tools": "Ferramentas de Fluxo",
    "Scene Library": "Biblioteca de Cenas",
    "Built-in scenes give Orbits, Polyrhythm Study, and Riff Cycle a strong starting point instead of a blank canvas.":
      "Cenas embutidas dão a Órbitas, Estudo Polirrítmico e Ciclo de Riff um ponto de partida forte em vez de uma tela vazia.",
    "Edit": "Editar",
    "Focused Editors": "Editores Focados",
    "Open a close writing view when you want to shape one ring or one groove directly.":
      "Abra uma vista de escrita próxima quando quiser moldar um anel ou um groove diretamente.",
    "Capture": "Capturar",
    "Loop Capture": "Captura de Loop",
    "Record short moving studies directly from the live canvas.":
      "Grave estudos curtos em movimento direto do canvas ao vivo.",
    "Fullscreen": "Tela Cheia",
    "Fullscreen View": "Vista em Tela Cheia",
    "Hide extra controls so the pattern is easier to watch or record.":
      "Esconde controles extras pra facilitar assistir ou gravar o padrão.",
    "Layouts": "Layouts",
    "Desktop + Mobile": "Desktop + Mobile",
    "A wide desktop instrument or a tighter mobile flow, without changing the core ideas.":
      "Um instrumento desktop largo ou um fluxo mobile mais justo, sem mudar as ideias centrais.",
    "Entry": "Entrada",
    "Three Clear Entries": "Três Entradas Claras",
    "Orbits is for discovery, Polyrhythm Study is for clarity, and Riff Cycle is for writing.":
      "Órbitas é pra descoberta, Estudo Polirrítmico é pra clareza, e Ciclo de Riff é pra escrita.",
    "Save, edit, capture, and watch fullscreen.":
      "Salve, edite, capture e assista em tela cheia.",

    // ─── Pro section ─────────────────────────────────────────────────────
    "Extended Access": "Acesso Estendido",
    "Keep the scenes that matter and go further with them.":
      "Mantenha as cenas que importam e vá além com elas.",
    "Pro unlocks scene saving, premium studies, broader randomization, export tools, and the wider control set across Orbits, Polyrhythm Study, and Riff Cycle.":
      "Pro desbloqueia salvar cenas, estudos premium, randomização mais ampla, ferramentas de exportação e o conjunto de controles mais amplo em Órbitas, Estudo Polirrítmico e Ciclo de Riff.",
    "It is for the version of the app you come back to: the one where strong ideas stay organized, get refined, and keep turning into finished work.":
      "É pra versão do app que você volta: aquela onde ideias fortes ficam organizadas, são refinadas e viram trabalho finalizado.",
    "Unlock Pro In App": "Desbloquear Pro no App",
    "Choose Pro Mode": "Escolher Modo Pro",
    "Pro Included": "Pro Incluso",
    "Pro already active on this account": "Pro já ativo nesta conta",
    "One-time unlock inside the app": "Desbloqueio único dentro do app",
    "Personal Scene Library": "Biblioteca Pessoal de Cenas",
    "Keep the scenes worth revisiting and return to them as the work grows.":
      "Mantenha as cenas que valem revisitar e volte a elas conforme o trabalho cresce.",
    "Export": "Exportar",
    "Still + Motion": "Estático + Movimento",
    "Take scenes out as clean images and short captured loops.":
      "Tire cenas como imagens limpas e loops curtos capturados.",
    "Expand": "Expandir",
    "Deeper Control": "Controle Profundo",
    "Open the wider control ranges and broader randomization across all three modes.":
      "Abra ranges de controle mais amplos e randomização mais ampla em todos os três modos.",
    "Access": "Acesso",
    "Premium Studies": "Estudos Premium",
    "Step into the richer built-in scenes and more advanced starting points.":
      "Entre nas cenas embutidas mais ricas e pontos de partida mais avançados.",

    // ─── CTA ─────────────────────────────────────────────────────────────
    "Open The Instrument": "Abrir o Instrumento",
    "Start exploring.": "Comece a explorar.",
    "Choose A Mode": "Escolher um Modo",
    "Choose Mode": "Escolher Modo",
    "Explore The Modes": "Explorar os Modos",

    // ─── Launch page ─────────────────────────────────────────────────────
    "Geometry Modes": "Modos de Geometria",
    "Back To Site": "Voltar pro Site",
    "Last Used Mode": "Último Modo Usado",
    "How to choose": "Como escolher",
    "After launch": "Depois de abrir",
    "Start with Orbits if you want the strongest first impression.":
      "Comece com Órbitas se quiser a primeira impressão mais forte.",
    "Start with Polyrhythm Study if you want to hear how layered rhythms meet.":
      "Comece com Estudo Polirrítmico se quiser ouvir como ritmos sobrepostos se encontram.",
    "Start with Riff Cycle if you already want to write phrases against a bar frame.":
      "Comece com Ciclo de Riff se já quiser escrever frases contra um compasso.",
    "The choice is not permanent. The app opens on one surface first, but the system stays connected once you are inside.":
      "A escolha não é permanente. O app abre numa superfície primeiro, mas o sistema fica conectado quando você está dentro.",
    "Polyrhythm Study": "Estudo Polirrítmico",
    "Riff Cycle": "Ciclo de Riff",

    // ─── How it works ────────────────────────────────────────────────────
    "How It Works": "Como Funciona",
    "What is Rhythmic Geometry?": "O que é Rhythmic Geometry?",
    "What Rhythmic Geometry Is": "O que é Rhythmic Geometry",
    "Rhythm As Structure": "Ritmo Como Estrutura",
    "Core idea": "Ideia central",
    "Ratio": "Razão",
    "The numerical relationship between cycles.":
      "A relação numérica entre os ciclos.",
    "Phase": "Fase",
    "The changing position of one rhythm against another.":
      "A posição mudando de um ritmo contra outro.",
    "Ratios become paths when cycles move around a shared center.":
      "Razões viram caminhos quando ciclos giram em torno de um centro compartilhado.",
    "Cycles repeat, ratios set the relationship, and phase reveals the motion.":
      "Ciclos se repetem, razões definem a relação, e a fase revela o movimento.",
    "Shared cycles make alignment, subdivision, and nested rhythm visible.":
      "Ciclos compartilhados tornam alinhamento, subdivisão e ritmo aninhado visíveis.",
    "Patterns move against a bar frame until phrase, accent, and return become clear.":
      "Padrões se movem contra um compasso até frase, acento e retorno ficarem claros.",
    "The visible memory left behind as rhythm repeats.":
      "A memória visível deixada pra trás conforme o ritmo se repete.",
    "How I Found It": "Como Eu Encontrei",
    "The project grew from polyrhythm videos, groove writing, and wanting to see what rhythm was doing.":
      "O projeto cresceu de vídeos de polirritmia, escrita de grooves e vontade de ver o que o ritmo estava fazendo.",
    "Where This Connects": "Onde Isso Conecta",
    "The same relationships appear in music theory, math, physics, art, and perception.":
      "As mesmas relações aparecem em teoria musical, matemática, física, arte e percepção.",

    // ─── App: tutorial / common ──────────────────────────────────────────
    "Action complete.": "Ação concluída.",
    "Advanced": "Avançado",
    "Advanced Pattern Tools Need Pro": "Ferramentas Avançadas de Padrão Precisam de Pro",
    "Advanced Riff Timing Needs Pro": "Timing Avançado de Riff Precisa de Pro",
    "Canvas Styling Needs Pro": "Estilização de Canvas Precisa de Pro",
    "Add Orbit": "Adicionar Órbita",
    "Add Cycle": "Adicionar Ciclo",
    "Add Layer": "Adicionar Camada",
    "Add To Sequence": "Adicionar à Sequência",
    "Add layer": "Adicionar camada",
    "Add orbit": "Adicionar órbita",
    "Add riff cell": "Adicionar célula de riff",
    "Add study layer": "Adicionar camada de estudo",
    "Add another orbit": "Adicionar outra órbita",
    "Add a third orbit": "Adicionar uma terceira órbita",
    "Add a fourth orbit": "Adicionar uma quarta órbita",
    "Add a third sweep orbit": "Adicionar uma terceira órbita de varredura",
    "Add a fourth sweep orbit": "Adicionar uma quarta órbita de varredura",
    "Add one more orbit to unlock the next orbit mode.":
      "Adicione mais uma órbita pra desbloquear o próximo modo de órbita.",
    "Add or remove one step and watch the layer update.":
      "Adicione ou remova um passo e veja a camada atualizar.",
    "Add or select a layer to edit.":
      "Adicione ou selecione uma camada pra editar.",
    "Active Layer": "Camada Ativa",
    "Active Layers": "Camadas Ativas",
    "Appearance": "Aparência",
    "Atmosphere": "Atmosfera",
    "Audio": "Áudio",
    "Audio Mix": "Mix de Áudio",
    "Background": "Fundo",
    "Ambient Motion": "Movimento Ambiente",
    "Anchor Loop": "Loop Âncora",
    "Accent": "Acento",
    "Accent Node": "Nó de Acento",
    "Accent Push": "Empurrão de Acento",
    "Accent changes emphasis, not placement.":
      "Acento muda ênfase, não posicionamento.",
    "Accent changes emphasis, not timing.":
      "Acento muda ênfase, não timing.",
    "Axes Off": "Eixos Off",
    "Axes On": "Eixos On",
    "Back 1": "Voltar 1",
    "Backbeat": "Backbeat",
    "Backbeat Off": "Backbeat Off",
    "Backbeat On": "Backbeat On",
    "Balanced": "Equilibrado",
    "Bar Cues": "Cues de Compasso",
    "Bar Frame": "Compasso",
    "Bar Grid": "Grade de Compasso",
    "Bar Marker": "Marcador de Compasso",
    "Bar Markers": "Marcadores de Compasso",
    "Bar selected.": "Compasso selecionado.",
    "Bar tab open.": "Aba de compasso aberta.",
    "Bar changes the count and grid, not the individual hits.":
      "Compasso muda a contagem e a grade, não os hits individuais.",
    "Bar changes the frame. It does not directly write the hits.":
      "Compasso muda o frame. Não escreve os hits diretamente.",
    "Bars Visible": "Compassos Visíveis",
    "Beats / Turn": "Beats / Volta",
    "Beats/Turn": "Beats/Volta",
    "Bright Marker": "Marcador Brilhante",
    "By Bars": "Por Compassos",
    "By Color": "Por Cor",
    "By Orbit Order": "Por Ordem de Órbita",
    "By Pulse Count": "Por Contagem de Pulsos",
    "By Radius": "Por Raio",
    "Canvas and export overlay": "Overlay de canvas e exportação",
    "Auto Mapping": "Mapeamento Automático",
    "Manual": "Manual",
    "All Notes": "Todas as Notas",

    // ─── Common actions ──────────────────────────────────────────────────
    "Save": "Salvar",
    "Export": "Exportar",
    "Reset": "Resetar",
    "Restart": "Reiniciar",
    "Play": "Tocar",
    "Pause": "Pausar",
    "Done": "Concluir",
    "Next": "Próximo",
    "Back": "Voltar",
    "Skip": "Pular",
    "Close": "Fechar",
    "Open": "Abrir",
    "Edit": "Editar",
    "Cancel": "Cancelar",
    "Confirm": "Confirmar",
    "Delete": "Excluir",
    "Remove": "Remover",
    "Random": "Aleatório",
    "Randomize": "Aleatorizar",
    "Clear": "Limpar",
    "Reset All": "Resetar Tudo",
    "Start Here": "Comece Aqui",
    "START HERE": "COMECE AQUI",
    "RESTART": "REINICIAR",
    "DONE": "CONCLUIR",
    "NEXT": "PRÓXIMO",

    // ─── Footer / trademark ──────────────────────────────────────────────
    "Rhythmic Geometry™ is a trademark of Marc DeBlasie. The original rhythm geometry app.":
      "Rhythmic Geometry™ é uma marca registrada de Marc DeBlasie. O app original de geometria de ritmo.",

    // ─── Tutorial ────────────────────────────────────────────────────────
    "Start Controls": "Iniciar Controles",
    "Start Here": "Comece Aqui",
    "This Screen": "Esta Tela",
    "Step Editor": "Editor de Passos",
    "Step Numbers": "Números dos Passos",
    "Step editor ready.": "Editor de passos pronto.",
    "This mode is for listening and watching. There is no wrong move.":
      "Este modo é pra ouvir e assistir. Não tem movimento errado.",
    "This changes energy, not the scene itself.":
      "Isso muda energia, não a cena em si.",
    "This changes the view, not the notes.":
      "Isso muda a vista, não as notas.",
    "This changes what you can see, not what plays.":
      "Isso muda o que você vê, não o que toca.",
    "This gives you a new example without needing to build one first.":
      "Isso te dá um novo exemplo sem precisar construir um antes.",
    "This is where you choose Bar, Riff, or Ending before editing.":
      "É aqui que você escolhe Compasso, Riff ou Final antes de editar.",
    "This is where you choose a layer and change its pattern.":
      "É aqui que você escolhe uma camada e muda seu padrão.",
    "This opens the precise writing surface for the riff.":
      "Isso abre a superfície de escrita precisa pro riff.",
    "This opens the precise writing view for one layer.":
      "Isso abre a vista de escrita precisa pra uma camada.",
    "This swaps filled and empty steps.":
      "Isso troca passos preenchidos e vazios.",
    "This Scene Is Included With Pro":
      "Esta Cena Está Inclusa Com Pro",
    "Move it 1 step and compare where the pattern starts.":
      "Mova 1 passo e compare onde o padrão começa.",
    "Move it 1 step left or right.":
      "Mova 1 passo pra esquerda ou direita.",
    "Move the pattern by 1 step.":
      "Mova o padrão em 1 passo.",
    "Move the pattern by one step.":
      "Mova o padrão em um passo.",
    "Move phrase back one step":
      "Mover frase um passo pra trás",
    "Move phrase forward one step":
      "Mover frase um passo pra frente",
    "Change one orbit number by one step, then watch how the shape changes.":
      "Mude um número de órbita em um passo, e veja como a forma muda.",
    "Change one layer’s step count and watch the canvas update.":
      "Mude a contagem de passos de uma camada e veja o canvas atualizar.",
    "Change Steps by one first, then watch the canvas update.":
      "Mude Passos em um primeiro, e veja o canvas atualizar.",
    "Changing Steps changes the grid for this layer.":
      "Mudar Passos muda a grade dessa camada.",
    "Each selected step can be silent, on, or accented.":
      "Cada passo selecionado pode ser silencioso, ligado ou acentuado.",
    "Open Edit, then change one layer count by one step.":
      "Abra Editar, e mude uma contagem de camada em um passo.",
    "Open Step Editor when you want the precise writing surface.":
      "Abra Editor de Passos quando quiser a superfície de escrita precisa.",
    "Move over a dot on a ring, then click one step you want to change.":
      "Passe sobre um ponto num anel, e clique num passo que quer mudar.",
    "Move over a dot on the circle, then click one step you want to change.":
      "Passe sobre um ponto no círculo, e clique num passo que quer mudar.",
    "Next move: change one step, then compare 1 Bar and Pattern view.":
      "Próximo movimento: mude um passo, e compare vista de 1 Compasso e Padrão.",
    "Next move: write one hit, then compare the layer against the full stack.":
      "Próximo movimento: escreva um hit, e compare a camada com a pilha completa.",
    "Next Motion": "Próximo Movimento",
    "Next Sound": "Próximo Som",
    "Clear stays free under the step editor.":
      "Limpar fica livre sob o editor de passos.",
    "An 11-step phrase that keeps turning across a two-bar return.":
      "Uma frase de 11 passos que continua girando através de um retorno de dois compassos.",
    "Blue cells are the editable ending slots":
      "Células azuis são os slots de final editáveis",
    "Step Editor edits one part up close. Bar changes the grid, Riff changes the repeating hits, and Ending changes the final landing area.":
      "Editor de Passos edita uma parte de perto. Compasso muda a grade, Riff muda os hits repetidos, e Final muda a área de pouso final.",
    "Step Editor edits one selected layer up close. The large view and the row of cells show the same layer.":
      "Editor de Passos edita uma camada selecionada de perto. A vista grande e a fileira de células mostram a mesma camada.",
    "Step Editor is the close-up writing view for the Riff pattern. The large shape and the roll below show the same hits.":
      "Editor de Passos é a vista de escrita próxima pro padrão de Riff. A forma grande e o roll abaixo mostram os mesmos hits.",
    "Advance the orbit motion by one small step while paused":
      "Avance o movimento da órbita em um pequeno passo enquanto pausado",

    // ─── Tutorial intros (bottom bar) ───────────────────────────────────
    "This bottom bar starts Orbit. Play controls motion, Restart returns to the beginning, and Random makes a new example.":
      "Esta barra inferior inicia Órbita. Play controla o movimento, Restart volta pro começo, e Random cria um novo exemplo.",
    "This bottom bar starts Riff. Play controls motion, Restart returns to beat 1, and Random makes a new example.":
      "Esta barra inferior inicia Riff. Play controla o movimento, Restart volta pro beat 1, e Random cria um novo exemplo.",
    "This bottom bar starts the study. Play controls motion, Restart returns to beat 1, and Random makes a new example.":
      "Esta barra inferior inicia o estudo. Play controla o movimento, Restart volta pro beat 1, e Random cria um novo exemplo.",

    // ─── Random / remix labels ──────────────────────────────────────────
    "Random is the fast beginner move. Remix and Random+ are Pro options for branching later.":
      "Random é o movimento rápido pra iniciante. Remix e Random+ são opções Pro pra ramificar depois.",
    "Random is the fastest beginner-safe way to explore.":
      "Random é a forma mais rápida e segura pra iniciantes explorarem.",

    // ─── Scene descriptions (top ones) ──────────────────────────────────
    "Glowing vertices trace a slow 3D triangle lattice.":
      "Vértices brilhantes traçam uma rede lenta de triângulos 3D.",
    "Slow swings, clear bell impacts, and one deep pulse.":
      "Oscilações lentas, impactos claros de sino, e um pulso profundo.",
    "Orbiting bodies with bass-centered pulse alignments.":
      "Corpos orbitando com alinhamentos de pulso centrados no grave.",
    "Droplets cross quiet bands and leave soft ripples.":
      "Gotas cruzam bandas silenciosas e deixam ondulações suaves.",
    "Bright orbit pulses bloom when their paths line up.":
      "Pulsos brilhantes de órbita florescem quando seus caminhos se alinham.",
    "Radial pulses draw a symmetrical bell pattern.":
      "Pulsos radiais desenham um padrão de sino simétrico.",
    "Soft hammers ride a slow wave and strike glowing bars.":
      "Martelos suaves cavalgam uma onda lenta e batem em barras brilhantes.",
    "A clear 7-step starter riff with a readable four-bar return.":
      "Um riff inicial claro de 7 passos com um retorno legível de quatro compassos.",
    "A 17-step pattern that returns every four bars.":
      "Um padrão de 17 passos que retorna a cada quatro compassos.",
    "A 25-step intro riff shape rotating across an eight-bar 4/4 frame.":
      "Uma forma de riff introdutório de 25 passos girando através de um compasso de oito barras em 4/4.",

    // ─── Common control labels ──────────────────────────────────────────
    "Standard": "Padrão",
    "Interference": "Interferência",
    "Sweep": "Varredura",
    "Quick Edit": "Edição Rápida",
    "Orbit Mode": "Modo Órbita",
    "Study Mode": "Modo Estudo",
    "Riff Mode": "Modo Riff",
    "Pattern": "Padrão",
    "Layers": "Camadas",
    "Layer": "Camada",
    "Orbits": "Órbitas",
    "Cycles": "Ciclos",
    "Cycle": "Ciclo",
    "Tempo": "Tempo",
    "Sound": "Som",
    "Speed": "Velocidade",
    "Volume": "Volume",
    "Tone": "Tom",
    "Filter": "Filtro",
    "Reverb": "Reverb",
    "Delay": "Delay",
    "Master": "Master",
    "Mix": "Mix",
    "Map": "Mapa",
    "Mapping": "Mapeamento",
    "Color": "Cor",
    "Colors": "Cores",
    "Radius": "Raio",
    "Pulses": "Pulsos",
    "Pulse": "Pulso",
    "Direction": "Direção",
    "Clockwise": "Horário",
    "Counter-clockwise": "Anti-horário",
    "Phase Offset": "Deslocamento de Fase",
    "Bar": "Compasso",
    "Bars": "Compasses",
    "Beat": "Beat",
    "Beats": "Beats",
    "Step": "Passo",
    "Steps": "Passos",
    "Hits": "Hits",
    "Hit": "Hit",
    "Rests": "Pausas",
    "Rest": "Pausa",
    "Ending": "Final",
    "Phrase": "Frase",
    "Phrases": "Frases",
    "Reference": "Referência",
    "Sync": "Sync",
    "On": "Ligado",
    "Off": "Desligado",
    "Invert": "Inverter",
    "Swap": "Trocar",
    "Duplicate": "Duplicar",
    "Copy": "Copiar",
    "Paste": "Colar",
    "Undo": "Desfazer",
    "Redo": "Refazer",
    "Snapshot": "Snapshot",
    "Capture": "Capturar",
    "Record": "Gravar",
    "Stop": "Parar",
    "Loop": "Loop",
    "Repeat": "Repetir",
    "Once": "Uma vez",
    "Continuous": "Contínuo",
    "Single": "Único",
    "Multiple": "Múltiplo",
    "Selected": "Selecionado",
    "Active": "Ativo",
    "Inactive": "Inativo",
    "Visible": "Visível",
    "Hidden": "Oculto",
    "Show": "Mostrar",
    "Hide": "Esconder",
    "Expand": "Expandir",
    "Collapse": "Recolher",
    "Open": "Abrir",
    "Close": "Fechar",
    "Minimize": "Minimizar",
    "Maximize": "Maximizar",
    "Settings": "Configurações",
    "Preferences": "Preferências",
    "Options": "Opções",
    "Help": "Ajuda",
    "About": "Sobre",
    "Info": "Info",
    "Tip": "Dica",
    "Hint": "Dica",
    "Note": "Nota",
    "Notes": "Notas",
    "Warning": "Aviso",
    "Error": "Erro",
    "Success": "Sucesso",
    "Loading…": "Carregando…",
    "Saving…": "Salvando…",
    "Saved": "Salvo",
    "Unsaved": "Não salvo",
    "New": "Novo",
    "Open…": "Abrir…",
    "Recent": "Recentes",
    "Favorites": "Favoritos",
    "Examples": "Exemplos",
    "Templates": "Templates",
    "Presets": "Presets",
    "Custom": "Personalizado",
    "Default": "Padrão",
    "Reset to Default": "Restaurar Padrão",
    "Apply": "Aplicar",
    "OK": "OK",
    "Yes": "Sim",
    "No": "Não",
    "Cancel": "Cancelar",
    "Confirm": "Confirmar",
    "Continue": "Continuar",
    "Finish": "Finalizar",
    "Submit": "Enviar",
    "Search": "Buscar",
    "Filter…": "Filtrar…",
  };

  // ─── Translation engine ───────────────────────────────────────────────
  // We walk text nodes. For each, we trim, lookup, and if found, replace
  // the text content (preserving surrounding whitespace).
  // Track already-translated nodes to avoid infinite loops with MutationObserver.

  const translated = new WeakSet();

  // Regex-based patterns for dynamic strings (e.g. "Step 3 of 9")
  const REGEX_PATTERNS = [
    { re: /^Step (\d+) of (\d+)$/, replace: (m) => `Passo ${m[1]} de ${m[2]}` },
    { re: /^(\d+) of (\d+)$/, replace: (m) => `${m[1]} de ${m[2]}` },
  ];

  function translateTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    if (translated.has(node)) return;
    const raw = node.nodeValue;
    if (!raw || raw.length < 2) return;
    const trimmed = raw.trim();
    if (trimmed.length < 2) return;
    let replacement = null;
    if (DICT[trimmed]) {
      replacement = DICT[trimmed];
    } else {
      for (const p of REGEX_PATTERNS) {
        const m = trimmed.match(p.re);
        if (m) {
          replacement = p.replace(m);
          break;
        }
      }
    }
    if (replacement) {
      const leading = raw.slice(0, raw.indexOf(trimmed[0]));
      const trailing = raw.slice(raw.lastIndexOf(trimmed[trimmed.length - 1]) + 1);
      node.nodeValue = leading + replacement + trailing;
      translated.add(node);
    }
  }

  function walkTree(root) {
    if (!root) return;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || node.nodeValue.trim().length < 2) {
            return NodeFilter.FILTER_REJECT;
          }
          // Skip script/style/textarea/code/input
          let parent = node.parentElement;
          while (parent) {
            const tag = parent.tagName;
            if (
              tag === "SCRIPT" ||
              tag === "STYLE" ||
              tag === "TEXTAREA" ||
              tag === "CODE" ||
              tag === "INPUT"
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            parent = parent.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );
    let n;
    while ((n = walker.nextNode())) {
      translateTextNode(n);
    }
  }

  // Run once on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => walkTree(document.body));
  } else {
    walkTree(document.body);
  }

  // Observe DOM mutations (React re-renders) — but only childList (new nodes),
  // NOT characterData (would cause infinite loop when we translate).
  const observer = new MutationObserver((mutations) => {
    for (const mut of mutations) {
      if (mut.type === "childList") {
        mut.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateTextNode(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            walkTree(node);
          }
        });
      }
    }
  });

  // Start observing once body exists
  function startObserver() {
    if (!document.body) {
      setTimeout(startObserver, 10);
      return;
    }
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    // Initial pass
    walkTree(document.body);
  }
  startObserver();

  // Re-run periodically for the first few seconds (catches lazy renders)
  let runs = 0;
  const interval = setInterval(() => {
    walkTree(document.body);
    runs++;
    if (runs > 6) clearInterval(interval);
  }, 800);
})();
