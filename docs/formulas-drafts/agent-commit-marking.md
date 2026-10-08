---
layout: default
title: "Draft: agent commit marking and signed ratification"
published: false
description: "Draft of a paste-in prompt that sets up the marking of agent-made commits and signed ratifications at one of three levels, proves each rule red then green, and fixes how the assistant itself behaves. Not tested in a registered run."
---

# Draft: mark agent commits and sign ratifications, level by level

**Status: design, tools tested, not yet in a registered run.** Kept out of the site (`published: false`). The practice is [Agent commit marking and signed ratification](/practice/agent-commit-marking/); the tools are `tools/gs-decide/` (`gs-decide.mjs`, `gs-decide-hook.mjs`, `gs-attribution-hook.mjs`, `gs-decide-ci.mjs`; 57 tests with real `ssh-keygen` keys). Install `gs-decide` first ([decide and snapshot](decide-and-snapshot.md)).

**What the prompt cannot do.** It cannot make the assistant honest: it tells it how to behave, and the hook refuses what it can see. An agent session that writes no marking under a person's identity is invisible. A signature proves custody of a key, not that a person decided. Both limits are in the practice page and the prompt makes the assistant report them.

## When to use

A project where an assistant commits, with `gs-decide` installed. Pick a level: **L0** trailers only (no tool), **L1** trailers plus the hook, **L2** signed ratifications plus a CI check. Open a fresh session in the project folder. You, not the assistant, create and hold the keys.

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Set up the marking of agent-made commits, and signed ratifications, at the level I choose, using the reference tools. Work on a branch named gs-marking-[YYYY-MM-DD]. Follow the steps in order.

Level: [L0 | L1 | L2]
Reference tools, files you copy and never edit: [path of tools/gs-decide/ : gs-decide.mjs, gs-decide-hook.mjs, gs-attribution-hook.mjs, gs-decide-ci.mjs]
Default branch of this repository: [main | master | other]
My name, e-mail and role for ratification: [from my git configuration; role]
The agent identity for your own commits (name and e-mail, not mine): [e.g. Claude Agent <claude-agent@example.com>]

How you behave in this session, always
- You never sign as a person. You never run `gs-decide add` with my key or any key that is not yours, never read, copy or use my private key, never edit docs/decisions.log.md, and never ask me for the passphrase.
- You never add `Signed-off-by` to a commit. A person certifies the origin of a commit; you do not.
- You mark every commit you make: `Assisted-by: [AGENT]:[MODEL]` (for example claude-code:claude-sonnet-5-5), or your tool's `Co-Authored-By: Name <email>`. Never hide that you are an agent: no `--agent` to look like a person, no `--no-verify`.
- At a protected path (see `node tools/gs-decide/gs-decide.mjs protected`) you stop. You print the exact `gs-decide add` command with a DRAFT reason, say "needs a person", and wait until I say it is recorded. You never record it yourself.
- Paste the real output and exit code of every command. Never describe an output you did not see. One change per commit, Conventional Commit subject.

Steps (do the ones up to my level)
L0
1. Write the agreement into the sentinel as two lines: agent commits carry `Assisted-by: AGENT:MODEL` or `Co-Authored-By`; an agent never adds `Signed-off-by`. Commit it (this is a protected path: stop for my entry first).
L1 (adds)
2. Copy the four tool files to tools/gs-decide/ unchanged. Add to `.gs.json`: {"attribution": {"enabled": true}}. Wire commit-msg: `node tools/gs-decide/gs-decide-hook.mjs --msg-file "$1" && node tools/gs-decide/gs-attribution-hook.mjs --msg-file "$1"` and pre-push: `node tools/gs-decide/gs-attribution-hook.mjs --pre-push`; activate them with the project's existing setup step only after I have recorded the baseline entry.
3. Prove RED, one case at a time on a throwaway branch, pasting each refusal and exit code and never bypassing it: (a) a commit under your agent identity with no marking (A3); (b) a message with `Signed-off-by: [your agent identity]` (A1); (c) `Assisted-by: claude` (A2); (d) a marked commit that changes a protected file with no ratification entry (A5).
4. Prove GREEN: the same commits with a correct marking and no sign-off are accepted; for (d) stop, print the command for me, and after I record the entry commit again and paste the acceptance. Show that a person's commit with no marking is accepted, and say plainly that an agent session with no marking and a person's identity would be accepted too.
L2 (adds)
5. I create my key myself (`ssh-keygen -t ed25519`, ideally with a passphrase or a security key) and give you only the PUBLIC key line. You may generate a separate key for yourself with no passphrase in a temporary folder, give me its public line, and add it to docs/decision-roles.json only as an identity with role `agent` (the file is protected: print the change and stop for my entry). Roles: my identity holds my role; yours holds `agent`; "keys" lists the public lines.
6. Add to `.gs.json`: {"decide": {"requireSigned": true}} (and "requireSignedCommits": true if I say so). I record the baseline entry with `--key` pointing to my key. Run `node tools/gs-decide/gs-decide.mjs verify --require-signed --require-ratified` and paste it: it must exit 0.
7. Prove RED: (a) change a protected file and commit with only an UNSIGNED entry (`--no-sign`, which you may run only for the proof, and you say so): refused; (b) an entry signed with YOUR agent key (you may run that one for the proof): `verify` shows AGENT-KEY and the hook still refuses the protected change; (c) edit one word of a signed entry: `verify` says CHAIN-BROKEN, and BAD-SIGNATURE if the entry is rehashed. Restore with `git checkout`.
8. Prove GREEN: stop; I add the entry signed with my key; you commit and paste the acceptance.
9. CI: add a job that checks out the full history and runs `node tools/gs-decide/gs-decide-ci.mjs --base origin/[default branch] --require-signed`. Tell me to make it a required status check, and to turn on the branch protection setting "Require signed commits" if I want GitHub to refuse unverified commits. You cannot do these settings; list them as "needs a person".
10. Report: the steps done with their pasted output, and a section "Not proven by this" with these lines, each marked "not checked": that a human, not an agent, used my key (an agent with my unlocked key can sign as me; a key that needs a physical touch raises the bar, to be verified in practice); that the markings are true (an unmarked agent session is invisible); that `git commit --no-verify` is blocked (only the CI check and branch protection do that); that the CI job is required; that the person read the diff.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Configura el marcado de los commits hechos por un agente, y las ratificaciones firmadas, en el nivel que yo elija, con las herramientas de referencia. Trabaja en una rama llamada gs-marking-[AAAA-MM-DD]. Sigue los pasos en orden.

Nivel: [L0 | L1 | L2]
Herramientas de referencia, archivos que copias y nunca editas: [ruta de tools/gs-decide/ : gs-decide.mjs, gs-decide-hook.mjs, gs-attribution-hook.mjs, gs-decide-ci.mjs]
Rama por defecto de este repositorio: [main | master | otra]
Mi nombre, correo y rol para ratificar: [de mi configuración de git; rol]
La identidad de agente para tus propios commits (nombre y correo, no los míos): [p. ej. Claude Agent <claude-agent@example.com>]

Cómo te comportas en esta sesión, siempre
- Nunca firmas como una persona. Nunca corres `gs-decide add` con mi clave ni con una clave que no sea tuya, nunca lees, copias ni usas mi clave privada, nunca editas docs/decisions.log.md y nunca me pides la contraseña de la clave.
- Nunca agregas `Signed-off-by` a un commit. Una persona certifica el origen de un commit; tú no.
- Marcas cada commit que haces: `Assisted-by: [AGENTE]:[MODELO]` (por ejemplo claude-code:claude-sonnet-5-5), o el `Co-Authored-By: Nombre <correo>` de tu herramienta. Nunca ocultas que eres un agente: nada de `--agent` para parecer una persona, nada de `--no-verify`.
- Ante una ruta protegida (mira `node tools/gs-decide/gs-decide.mjs protected`) te detienes. Imprimes el comando exacto de `gs-decide add` con una razón como BORRADOR, dices "requiere una persona" y esperas a que yo diga que quedó registrado. Nunca lo registras tú.
- Pega la salida real y el código de salida de cada comando. Nunca describas una salida que no viste. Un cambio por commit, asunto en Conventional Commits.

Pasos (haz los que correspondan a mi nivel)
L0
1. Escribe el acuerdo en el centinela en dos líneas: los commits de agente llevan `Assisted-by: AGENTE:MODELO` o `Co-Authored-By`; un agente nunca agrega `Signed-off-by`. Haz commit (es una ruta protegida: detente para mi entrada primero).
L1 (suma)
2. Copia los cuatro archivos de la herramienta a tools/gs-decide/ sin cambios. Agrega a `.gs.json`: {"attribution": {"enabled": true}}. Conecta commit-msg: `node tools/gs-decide/gs-decide-hook.mjs --msg-file "$1" && node tools/gs-decide/gs-attribution-hook.mjs --msg-file "$1"` y pre-push: `node tools/gs-decide/gs-attribution-hook.mjs --pre-push`; actívalos con el paso de preparación que el proyecto ya tiene solo después de que yo registre la entrada de línea base.
3. Prueba en ROJO, un caso a la vez en una rama descartable, pegando cada rechazo y su código de salida y sin saltarlo: (a) un commit con tu identidad de agente sin marcado (A3); (b) un mensaje con `Signed-off-by: [tu identidad de agente]` (A1); (c) `Assisted-by: claude` (A2); (d) un commit marcado que cambia un archivo protegido sin entrada de ratificación (A5).
4. Prueba en VERDE: los mismos commits con el marcado correcto y sin sign-off se aceptan; para (d) detente, imprime el comando para mí y, cuando yo registre la entrada, haz commit otra vez y pega la aceptación. Muestra que un commit de una persona sin marcado se acepta, y di con claridad que una sesión de agente sin marcado y con la identidad de una persona también se aceptaría.
L2 (suma)
5. Yo creo mi clave (`ssh-keygen -t ed25519`, de preferencia con contraseña o con una llave de seguridad) y te doy solo la línea de la clave PÚBLICA. Tú puedes generar una clave aparte para ti, sin contraseña, en una carpeta temporal, darme su línea pública y agregarla a docs/decision-roles.json solo como una identidad con el rol `agent` (el archivo es protegido: imprime el cambio y detente para mi entrada). Roles: mi identidad tiene mi rol; la tuya tiene `agent`; "keys" lista las líneas públicas.
6. Agrega a `.gs.json`: {"decide": {"requireSigned": true}} (y "requireSignedCommits": true si yo lo digo). Yo registro la entrada de línea base con `--key` apuntando a mi clave. Corre `node tools/gs-decide/gs-decide.mjs verify --require-signed --require-ratified` y pégalo: debe salir con 0.
7. Prueba en ROJO: (a) cambia un archivo protegido y haz commit con una entrada SIN firma (`--no-sign`, que puedes correr solo para la prueba, y lo dices): se rechaza; (b) una entrada firmada con TU clave de agente (puedes correr esa para la prueba): `verify` muestra AGENT-KEY y el hook igual rechaza el cambio protegido; (c) edita una palabra de una entrada firmada: `verify` dice CHAIN-BROKEN, y BAD-SIGNATURE si la entrada se vuelve a calcular. Restaura con `git checkout`.
8. Prueba en VERDE: detente; yo agrego la entrada firmada con mi clave; tú haces commit y pegas la aceptación.
9. CI: agrega un trabajo que descargue el historial completo y corra `node tools/gs-decide/gs-decide-ci.mjs --base origin/[rama por defecto] --require-signed`. Dime que lo haga una verificación de estado requerida y que active la regla de protección de rama "Require signed commits" si quiero que GitHub rechace los commits no verificados. Tú no puedes tocar esos ajustes; ponlos como "requiere una persona".
10. Informe: los pasos hechos con su salida pegada, y una sección "No probado por esto" con estas líneas, cada una marcada "no verificado": que una persona, y no un agente, usó mi clave (un agente con mi clave desbloqueada puede firmar como yo; una clave que exige un toque físico sube la barrera, por verificar en la práctica); que los marcados son verdaderos (una sesión de agente sin marcado es invisible); que `git commit --no-verify` está bloqueado (solo lo hacen la verificación de CI y la protección de rama); que el trabajo de CI es requerido; que la persona leyó el diff.
```

</div>
</div>
