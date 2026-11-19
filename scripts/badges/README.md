# Badges de conquista — Zero to Hero

Gerador em Python (`bpy`) que modela e renderiza no Blender os badges da mentoria.
O Blender só executa Python; não há etapa em JavaScript.

| Slug | Badge |
|------|-------|
| `cadete` | Patente 1 — bronze, 1 divisa |
| `primeiro-oficial` | Patente 2 — prata, 2 divisas, 1 estrela |
| `comandante` | Patente 3 — ouro, 3 divisas, 2 estrelas, resplendor |
| `master` | Patente 4 — ouro e laranja, 3 divisas, 3 estrelas, resplendor e asas |
| `nave-falcon-1`, `nave-falcon-9`, `nave-falcon-heavy`, `nave-dragon`, `nave-crew-dragon`, `nave-starship` | Naves recebidas na jornada |

## Como renderizar

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P scripts/badges/gerar_badges.py
```

Opções (depois de `--`): `--only cadete,nave-starship`, `--res 1024`, `--samples 64`, `--out <pasta>`.
Saída padrão: `public/zero-to-hero/badges/<slug>.png` (fundo transparente, 1024 px).

As fontes em `fontes/` são Space Grotesk e Space Mono (licença OFL), convertidas de woff2 para TTF
porque o Blender não lê woff2. As naves são modelos estilizados, sem logotipos da SpaceX.
