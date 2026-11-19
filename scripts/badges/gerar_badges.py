"""Gera os badges de conquista da mentoria Zero to Hero no Blender.

Patentes (promoções conforme o aluno avança): Cadete, Primeiro Oficial,
Comandante e Master. Naves recebidas durante a jornada: Falcon 1, Falcon 9,
Falcon Heavy, Dragon, Crew Dragon e Starship.

O Blender só executa Python (bpy); rode em modo headless:

    /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
        -P scripts/badges/gerar_badges.py -- [--only cadete,nave-starship] \
        [--res 1024] [--samples 64] [--out public/zero-to-hero/badges]

Saída: PNG com fundo transparente, um por badge.
"""

import argparse
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, "..", ".."))
FONTE_TITULO = os.path.join(AQUI, "fontes", "space-grotesk-700.ttf")
FONTE_MONO = os.path.join(AQUI, "fontes", "space-mono-400.ttf")


# ---------------------------------------------------------------- utilidades
def hex_lin(h):
    """Converte #rrggbb (sRGB) para cor linear RGBA."""
    h = h.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def set_input(node, nome, valor):
    if nome in node.inputs:
        node.inputs[nome].default_value = valor


_MATS = {}


def mat(nome, cor, metal=0.0, rough=0.4, emissao=0.0, coat=0.0):
    chave = (nome, cor, metal, rough, emissao, coat)
    if chave in _MATS:
        return _MATS[chave]
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    rgba = hex_lin(cor)
    set_input(p, "Base Color", rgba)
    set_input(p, "Metallic", metal)
    set_input(p, "Roughness", rough)
    set_input(p, "Coat Weight", coat)
    set_input(p, "Coat Roughness", 0.08)
    if emissao:
        set_input(p, "Emission Color", rgba)
        set_input(p, "Emission Strength", emissao)
    _MATS[chave] = m
    return m


def colecao():
    c = bpy.data.collections.get("Badge")
    if not c:
        c = bpy.data.collections.new("Badge")
        bpy.context.scene.collection.children.link(c)
    return c


def obj_de_bmesh(nome, bm, material, angulo_vivo=32, chanfro=0.0):
    for f in bm.faces:
        f.smooth = True
    limite = math.radians(angulo_vivo)
    for e in bm.edges:
        if len(e.link_faces) == 2 and e.calc_face_angle(0) > limite:
            e.smooth = False
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nome, me)
    colecao().objects.link(ob)
    me.materials.append(material)
    if chanfro:
        mod = ob.modifiers.new("Chanfro", "BEVEL")
        mod.width = chanfro
        mod.segments = 3
        mod.limit_method = "ANGLE"
        mod.angle_limit = math.radians(30)
        mod.harden_normals = True
    return ob


def area2d(pts):
    return sum(pts[i - 1][0] * pts[i][1] - pts[i][0] * pts[i - 1][1] for i in range(len(pts))) / 2


def prisma(nome, pts, z0, z1, material, chanfro=0.006):
    """Extruda um polígono 2D (no plano XY) entre z0 e z1."""
    if area2d(pts) < 0:  # garante sentido anti-horário visto de +Z
        pts = list(reversed(pts))
    bm = bmesh.new()
    baixo = [bm.verts.new((x, y, z0)) for x, y in pts]
    cima = [bm.verts.new((x, y, z1)) for x, y in pts]
    bm.faces.new(cima)
    bm.faces.new(list(reversed(baixo)))
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((baixo[i], baixo[j], cima[j], cima[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj_de_bmesh(nome, bm, material, chanfro=chanfro)


def circulo(r, n=128, cx=0.0, cy=0.0):
    return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def disco(nome, r, z0, z1, material, chanfro=0.006, n=128):
    return prisma(nome, circulo(r, n), z0, z1, material, chanfro)


def anel(nome, r_ext, r_int, z0, z1, material, chanfro=0.005, n=128):
    bm = bmesh.new()

    def vs(r, z):
        return [bm.verts.new((r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), z))
                for i in range(n)]
    eb, et, ib, it = vs(r_ext, z0), vs(r_ext, z1), vs(r_int, z0), vs(r_int, z1)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((et[i], et[j], it[j], it[i]))
        bm.faces.new((eb[j], eb[i], ib[i], ib[j]))
        bm.faces.new((eb[i], eb[j], et[j], et[i]))
        bm.faces.new((ib[j], ib[i], it[i], it[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj_de_bmesh(nome, bm, material, chanfro=chanfro)


def torno(nome, perfil, material, seg=64, a0=0.0, a1=2 * math.pi, tampa=True, angulo_vivo=40):
    """Revolve um perfil [(raio, y), ...] em torno do eixo Y."""
    cheio = abs((a1 - a0) - 2 * math.pi) < 1e-6
    n = seg if cheio else seg + 1
    bm = bmesh.new()
    aneis = []
    for r, y in perfil:
        if r < 1e-6:
            aneis.append([bm.verts.new((0, y, 0))])
        else:
            aneis.append([bm.verts.new((r * math.cos(a0 + (a1 - a0) * i / seg), y,
                                        r * math.sin(a0 + (a1 - a0) * i / seg))) for i in range(n)])
    passo = range(n) if cheio else range(n - 1)
    for a, b in zip(aneis, aneis[1:]):
        if len(a) == 1 and len(b) == 1:
            continue
        for i in passo:
            j = (i + 1) % n
            if len(a) == 1:
                bm.faces.new((a[0], b[j], b[i]))
            elif len(b) == 1:
                bm.faces.new((a[i], a[j], b[0]))
            else:
                bm.faces.new((a[i], a[j], b[j], b[i]))
    if tampa and cheio:
        for ponta in (aneis[0], aneis[-1]):
            if len(ponta) > 2:
                bm.faces.new(ponta)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj_de_bmesh(nome, bm, material, angulo_vivo=angulo_vivo)


def caixa(nome, tam, centro, material, chanfro=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=tam, verts=bm.verts)
    bmesh.ops.translate(bm, vec=centro, verts=bm.verts)
    return obj_de_bmesh(nome, bm, material, chanfro=chanfro)


def esfera(nome, r, centro, material, escala=(1, 1, 1), rot=None):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=r)
    bmesh.ops.scale(bm, vec=escala, verts=bm.verts)
    if rot:
        bmesh.ops.rotate(bm, matrix=rot, verts=bm.verts)
    bmesh.ops.translate(bm, vec=centro, verts=bm.verts)
    return obj_de_bmesh(nome, bm, material, angulo_vivo=180)


_FONTES = {}


def fonte(caminho):
    if caminho not in _FONTES:
        _FONTES[caminho] = bpy.data.fonts.load(caminho)
    return _FONTES[caminho]


def texto(nome, corpo, tam, pos, material, caminho=FONTE_TITULO, extrude=0.008, rot_z=0.0, espaco=1.0):
    cu = bpy.data.curves.new(nome, "FONT")
    cu.body = corpo
    cu.font = fonte(caminho)
    cu.size = tam
    cu.extrude = extrude
    cu.bevel_depth = min(0.002, extrude * 0.3)
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.space_character = espaco
    ob = bpy.data.objects.new(nome, cu)
    ob.data.materials.append(material)
    ob.location = (pos[0], pos[1], pos[2] + extrude)
    ob.rotation_euler = (0, 0, rot_z)
    colecao().objects.link(ob)
    return ob


def texto_em_arco(nome, corpo, raio, z, tam, material, embaixo=False, avanco=0.64):
    """Distribui caracteres (fonte mono) ao longo de um arco centrado no topo ou na base."""
    passo = tam * avanco / raio
    total = passo * (len(corpo) - 1)
    for i, ch in enumerate(corpo):
        if ch == " ":
            continue
        if embaixo:
            ang = math.radians(270) - total / 2 + i * passo
            rot = ang + math.pi / 2
        else:
            ang = math.radians(90) + total / 2 - i * passo
            rot = ang - math.pi / 2
        texto(f"{nome}_{i}", ch, tam, (raio * math.cos(ang), raio * math.sin(ang), z),
              material, FONTE_MONO, extrude=0.006, rot_z=rot)


def estrela(r_ext, r_int, pontas=5, cx=0.0, cy=0.0, giro=90):
    pts = []
    for i in range(pontas * 2):
        r = r_ext if i % 2 == 0 else r_int
        a = math.radians(giro) + math.pi * i / pontas
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def lente(cx, cy, rp, rd, n=360):
    """Polígono da interseção do círculo (cx, cy, rp) com o disco de raio rd na origem."""
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        x, y = cx + rp * math.cos(a), cy + rp * math.sin(a)
        if x * x + y * y <= rd * rd:
            pts.append((x, y))
        x2, y2 = rd * math.cos(a), rd * math.sin(a)
        if (x2 - cx) ** 2 + (y2 - cy) ** 2 <= rp * rp:
            pts.append((x2, y2))
    mx = sum(p[0] for p in pts) / len(pts)
    my = sum(p[1] for p in pts) / len(pts)
    return sorted(pts, key=lambda p: math.atan2(p[1] - my, p[0] - mx))


# ---------------------------------------------------------------- cena
def preparar_cena(res, amostras):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    cena = bpy.context.scene
    for motor in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            cena.render.engine = motor
            break
        except TypeError:
            continue
    ee = cena.eevee
    for attr, val in (("taa_render_samples", amostras), ("use_raytracing", True),
                      ("use_shadows", True), ("use_gtao", True)):
        if hasattr(ee, attr):
            setattr(ee, attr, val)
    cena.render.resolution_x = cena.render.resolution_y = res
    cena.render.film_transparent = True
    cena.render.image_settings.file_format = "PNG"
    cena.render.image_settings.color_mode = "RGBA"
    cena.render.image_settings.color_depth = "8"
    try:
        cena.view_settings.view_transform = "Standard"
        cena.view_settings.look = "None"
    except TypeError:
        pass

    # Mundo: estúdio em gradiente (claro em cima, quente de um lado) para os reflexos do metal.
    mundo = bpy.data.worlds.new("Estudio")
    cena.world = mundo
    mundo.use_nodes = True
    nt = mundo.node_tree
    nt.nodes.clear()
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    rampa_z = nt.nodes.new("ShaderNodeValToRGB")
    rampa_x = nt.nodes.new("ShaderNodeValToRGB")
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "ADD"
    fundo = nt.nodes.new("ShaderNodeBackground")
    saida = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(coord.outputs["Generated"], sep.inputs[0])
    for rampa, eixo in ((rampa_z, "Z"), (rampa_x, "X")):
        nt.links.new(sep.outputs[eixo], rampa.inputs[0])
    ez = rampa_z.color_ramp.elements
    ez[0].position, ez[0].color = 0.0, (0.01, 0.01, 0.012, 1)
    ez[1].position, ez[1].color = 1.0, (0.32, 0.32, 0.34, 1)
    ez.new(0.55).color = (0.03, 0.03, 0.035, 1)
    ez.new(0.8).color = (0.12, 0.12, 0.13, 1)
    ex = rampa_x.color_ramp.elements
    ex[0].position, ex[0].color = 0.55, (0, 0, 0, 1)
    ex[1].position, ex[1].color = 1.0, (0.55, 0.22, 0.06, 1)
    nt.links.new(rampa_z.outputs[0], mix.inputs[6])
    nt.links.new(rampa_x.outputs[0], mix.inputs[7])
    mix.inputs[0].default_value = 1.0
    nt.links.new(mix.outputs[2], fundo.inputs[0])
    fundo.inputs[1].default_value = 1.0
    nt.links.new(fundo.outputs[0], saida.inputs[0])

    # Câmera ortográfica olhando para baixo (-Z): o badge fica no plano XY.
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.type = "ORTHO"
    cam = bpy.data.objects.new("Camera", cam_data)
    cam.location = (0, 0, 10)
    cena.collection.objects.link(cam)
    cena.camera = cam

    def luz(nome, pos, potencia, tam, cor=(1, 1, 1)):
        ld = bpy.data.lights.new(nome, "AREA")
        ld.energy = potencia
        ld.size = tam
        ld.color = cor
        lo = bpy.data.objects.new(nome, ld)
        lo.location = pos
        direcao = Vector((0, 0, 0)) - Vector(pos)
        lo.rotation_euler = direcao.to_track_quat("-Z", "Y").to_euler()
        cena.collection.objects.link(lo)

    luz("Chave", (-4.5, 4.0, 6.0), 700, 3, (1.0, 0.95, 0.88))
    luz("Preenchimento", (5.0, -3.5, 5.0), 200, 4, (0.8, 0.88, 1.0))
    luz("Recorte", (3.5, 5.0, 2.5), 450, 1.5, (1.0, 0.6, 0.3))
    luz("Topo", (-1.2, 1.2, 14), 120, 2.5)
    return cena


def limpar_badge():
    c = colecao()
    for ob in list(c.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for bloco in (bpy.data.meshes, bpy.data.curves):
        for d in list(bloco):
            if d.users == 0:
                bloco.remove(d)


# ---------------------------------------------------------------- paleta
TINTA = "#0b0c0d"
LARANJA = "#ff792c"
METAIS = {
    "bronze": ("#c27a45", 0.32),
    "prata": ("#d9dce2", 0.22),
    "ouro": ("#ffc35a", 0.2),
}


def m_metal(tipo):
    cor, rough = METAIS[tipo]
    return mat(f"metal_{tipo}", cor, metal=1.0, rough=rough)


# ---------------------------------------------------------------- patentes
def divisa(cy, w=0.38, s=0.22, t=0.085):
    a = cy + (s + t) / 2
    return [(-w, a - s), (0, a), (w, a - s), (w, a - s - t), (0, a - t), (-w, a - s - t)]


def faixa(cy, meia, alt=0.3, entalhe=0.13):
    return [(-meia - entalhe, cy + alt / 2), (meia + entalhe, cy + alt / 2), (meia + entalhe * 0.45, cy),
            (meia + entalhe, cy - alt / 2), (-meia - entalhe, cy - alt / 2), (-meia - entalhe * 0.45, cy)]


def asa(lado):
    """Leque de penas atrás do medalhão (lado = 1 direita, -1 esquerda)."""
    penas = []
    for i in range(7):
        ang = math.radians(42 - i * 12)
        comp = 0.95 - i * 0.07
        larg = 0.07
        base = Vector((0.72, 0.3 - i * 0.075))
        d = Vector((math.cos(ang), math.sin(ang)))
        n = Vector((-d.y, d.x))
        ponta = base + d * comp
        pts = [base - n * larg, base + d * (comp * 0.82) - n * larg, ponta,
               base + d * (comp * 0.82) + n * larg, base + n * larg]
        penas.append([(lado * p.x, p.y) for p in pts])
    return penas


PATENTES = [
    {"slug": "cadete", "nome": "CADETE", "metal": "bronze", "divisas": 1, "estrelas": 0},
    {"slug": "primeiro-oficial", "nome": "PRIMEIRO OFICIAL", "metal": "prata", "divisas": 2, "estrelas": 1},
    {"slug": "comandante", "nome": "COMANDANTE", "metal": "ouro", "divisas": 3, "estrelas": 2, "resplendor": True},
    {"slug": "master", "nome": "MASTER", "metal": "ouro", "divisas": 3, "estrelas": 3, "resplendor": True,
     "asas": True, "brilho": True},
]


def montar_patente(p):
    metal = m_metal(p["metal"])
    esmalte = mat("esmalte", "#0d0f14", metal=0.0, rough=0.35, coat=0.25)
    tinta = mat("tinta", TINTA, rough=0.5)
    destaque = mat("laranja_brilho", LARANJA, rough=0.3, emissao=1.2) if p.get("brilho") else metal

    if p.get("resplendor"):
        prisma("resplendor", estrela(1.2, 1.02, pontas=24, giro=0), 0.0, 0.06, metal, chanfro=0.008)
    if p.get("asas"):
        for lado in (1, -1):
            for i, pena in enumerate(asa(lado)):
                prisma(f"pena_{lado}_{i}", pena, 0.0 + i * 0.004, 0.07 + i * 0.004, metal, chanfro=0.008)

    disco("base", 0.95, 0.06, 0.12, metal)
    disco("esmalte", 0.88, 0.12, 0.15, esmalte, chanfro=0.0)
    anel("aro", 1.0, 0.86, 0.06, 0.22, metal, chanfro=0.012)
    anel("filete", 0.655, 0.625, 0.15, 0.18, destaque)
    texto_em_arco("arco_topo", "ZERO TO HERO", 0.745, 0.15, 0.1, metal)

    # Divisas empilhadas e estrelas acima.
    n = p["divisas"]
    passo = 0.165
    topo = 0.18 if p["estrelas"] else 0.1
    for i in range(n):
        cy = topo - i * passo
        prisma(f"divisa_{i}", divisa(cy), 0.15, 0.23, destaque if (p.get("brilho") and i == 0) else metal,
               chanfro=0.01)
    e = p["estrelas"]
    for i in range(e):
        cx = (i - (e - 1) / 2) * 0.24
        cy = 0.42 if e < 3 or i == 1 else 0.38
        prisma(f"estrela_{i}", estrela(0.095, 0.04, cx=cx, cy=cy), 0.15, 0.22,
               destaque if p.get("brilho") and i == 1 else metal, chanfro=0.008)

    # Faixa com o nome da patente.
    meia = min(0.33 + 0.045 * len(p["nome"]), 0.74)
    prisma("faixa", faixa(-0.66, meia), 0.22, 0.27, metal, chanfro=0.01)
    texto("nome", p["nome"], 0.135 if len(p["nome"]) < 12 else 0.1, (0, -0.665, 0.27), tinta,
          extrude=0.01, espaco=1.08)
    return 3.6 if p.get("asas") else (2.75 if p.get("resplendor") else 2.5)


# ---------------------------------------------------------------- naves
def ogiva(r, y0, alt, n=12, expo=0.55):
    return [(r * (1 - (i / n) ** 2) ** expo, y0 + alt * i / n) for i in range(n + 1)]


def cilindro_perfil(r, y0, y1):
    return [(0, y0), (r, y0), (r, y1), (0, y1)]


def materiais_nave():
    return {
        "branco": mat("pintura_branca", "#e4e7ea", rough=0.4, coat=0.2),
        "preto": mat("pintura_preta", "#141518", rough=0.45),
        "aco": mat("aco_inox", "#cfd3d8", metal=1.0, rough=0.22),
        "motor": mat("motor", "#3a3c40", metal=1.0, rough=0.35),
        "aluminio": mat("aluminio", "#b9bec6", metal=1.0, rough=0.3),
        "solar": mat("painel_solar", "#1b2a55", metal=0.4, rough=0.2, coat=1.0),
        "vidro": mat("vidro", "#0b1220", metal=0.2, rough=0.05, coat=1.0),
        "chama": mat("chama", "#ff8a33", emissao=2.2),
        "chama_nucleo": mat("chama_nucleo", "#ffe2a8", emissao=3.0),
    }


def chama(pecas, M, y0, r, comp, x=0.0, nome="chama"):
    ext = torno(nome, [(0, y0), (r, y0), (r * 1.45, y0 - comp * 0.3), (r * 0.9, y0 - comp * 0.75), (0, y0 - comp)],
                M["chama"], seg=32)
    nuc = torno(nome + "_n", [(0, y0), (r * 0.6, y0), (r * 0.7, y0 - comp * 0.3), (0, y0 - comp * 0.55)],
                M["chama_nucleo"], seg=32)
    for o in (ext, nuc):
        o.location.x = x
        o.location.z = 0.02
    pecas += [ext, nuc]


def nucleo_falcon(pecas, M, x=0.0, r=0.055, comp=0.80, nariz=False):
    def p(o):
        o.location.x += x
        pecas.append(o)
    p(torno("sino", [(0.0, 0.0), (r * 0.85, 0.0), (r * 0.95, -0.06), (0.0, -0.06)], M["motor"]))
    p(torno("estagio1", cilindro_perfil(r, 0.0, comp), M["branco"]))
    p(torno("faixa_base", cilindro_perfil(r * 1.025, 0.0, 0.06), M["preto"]))
    for lado in (1, -1):
        p(caixa("perna", (0.012, 0.22, 0.028), (lado * (r + 0.004), 0.13, 0.0), M["preto"]))
        p(caixa("perna_z", (0.028, 0.22, 0.012), (0.0, 0.13, lado * (r + 0.004)), M["preto"]))
    if nariz:
        p(torno("nariz", [(0, comp)] + ogiva(r, comp, 0.14), M["branco"]))
        return
    p(torno("interestagio", cilindro_perfil(r * 1.025, comp, comp + 0.08), M["preto"]))
    for lado in (1, -1):
        p(caixa("aleta_grade", (0.05, 0.012, 0.045), (lado * (r + 0.03), comp + 0.06, 0.0), M["motor"]))
    p(torno("estagio2", cilindro_perfil(r, comp + 0.08, comp + 0.22), M["branco"]))
    rf = r * 1.18
    base = comp + 0.22
    perfil = [(0, base), (r, base), (rf, base + 0.03), (rf, base + 0.16)] + ogiva(rf, base + 0.16, 0.16)[1:]
    p(torno("coifa", perfil, M["branco"]))


def nave_falcon9(M):
    pecas = []
    nucleo_falcon(pecas, M)
    chama(pecas, M, -0.06, 0.05, 0.36)
    return pecas, 0.82, math.radians(-32)


def nave_falcon_heavy(M):
    pecas = []
    nucleo_falcon(pecas, M)
    for lado in (1, -1):
        nucleo_falcon(pecas, M, x=lado * 0.114, nariz=True)
        chama(pecas, M, -0.06, 0.05, 0.32, x=lado * 0.114, nome=f"chama_{lado}")
        pecas.append(caixa("suporte", (0.06, 0.015, 0.012), (lado * 0.057, 0.7, 0.0), M["preto"]))
    chama(pecas, M, -0.06, 0.05, 0.38)
    return pecas, 0.8, math.radians(-32)


def nave_falcon1(M):
    pecas = []
    r = 0.045
    pecas.append(torno("sino", [(0.0, 0.0), (r * 0.8, 0.0), (r * 0.95, -0.06), (0.0, -0.06)], M["motor"]))
    pecas.append(torno("estagio1", cilindro_perfil(r, 0.0, 0.55), M["aluminio"]))
    pecas.append(torno("faixa", cilindro_perfil(r * 1.03, 0.0, 0.05), M["preto"]))
    pecas.append(torno("faixa_meio", cilindro_perfil(r * 1.03, 0.3, 0.33), M["preto"]))
    pecas.append(torno("interestagio", cilindro_perfil(r * 1.03, 0.55, 0.6), M["preto"]))
    pecas.append(torno("estagio2", cilindro_perfil(r, 0.6, 0.66), M["branco"]))
    perfil = [(0, 0.66), (r * 1.08, 0.66), (r * 1.08, 0.76)] + ogiva(r * 1.08, 0.76, 0.12)[1:]
    pecas.append(torno("coifa", perfil, M["branco"]))
    chama(pecas, M, -0.06, 0.04, 0.3)
    return pecas, 1.05, math.radians(-32)


def capsula(pecas, M, base, r_base=0.19, r_topo=0.115, alt=0.26, janelas=True, faixa_preta=True):
    pecas.append(torno("escudo", cilindro_perfil(r_base * 1.03, base - 0.015, base + 0.005), M["preto"]))
    pecas.append(torno("capsula", [(0, base), (r_base, base), (r_base, base + 0.02),
                                   (r_topo, base + 0.02 + alt), (0, base + 0.02 + alt)], M["branco"]))

    def r_em(y):
        return r_base + (r_topo - r_base) * (y - base - 0.02) / alt
    if faixa_preta:
        y0, y1 = base + 0.06, base + 0.1
        pecas.append(torno("faixa_preta", [(r_em(y0) + 0.004, y0), (r_em(y1) + 0.004, y1)], M["preto"],
                           tampa=False))
    if janelas:
        incl = math.atan((r_base - r_topo) / alt)
        for lado in (1, -1):
            y = base + 0.15
            x = lado * 0.07
            z = math.sqrt(max(r_em(y) ** 2 - x * x, 0)) + 0.002
            pecas.append(esfera("janela", 0.015, (x, y, z), M["vidro"], escala=(1, 1, 0.35),
                                rot=Matrix.Rotation(-incl, 3, "X")))
    topo = base + 0.02 + alt
    pecas.append(torno("nariz", [(0, topo), (r_topo * 0.97, topo), (r_topo * 0.85, topo + 0.035),
                                 (r_topo * 0.5, topo + 0.06), (0, topo + 0.066)], M["branco"]))
    pecas.append(torno("junta_nariz", [(r_topo * 0.985, topo - 0.004), (r_topo * 0.985, topo + 0.006)],
                       M["preto"], tampa=False))


def nave_crew_dragon(M):
    pecas = []
    pecas.append(torno("tronco", cilindro_perfil(0.185, 0.0, 0.2), M["branco"]))
    pecas.append(torno("celulas", [(0.188, 0.02), (0.188, 0.18)], M["solar"], a0=math.radians(35),
                       a1=math.radians(145), tampa=False))
    for lado in (1, -1):
        aleta = [(lado * 0.185, 0.0), (lado * 0.27, 0.0), (lado * 0.27, 0.035), (lado * 0.185, 0.13)]
        pecas.append(prisma("aleta", aleta, -0.008, 0.008, M["branco"], chanfro=0.002))
    capsula(pecas, M, 0.2)
    return pecas, 1.3, 0.0


def nave_dragon(M):
    pecas = []
    pecas.append(torno("tronco", cilindro_perfil(0.18, 0.0, 0.2), M["branco"]))
    pecas.append(torno("faixa_tronco", cilindro_perfil(0.183, 0.0, 0.025), M["preto"]))
    capsula(pecas, M, 0.2, janelas=False, faixa_preta=False)
    for lado in (1, -1):
        pecas.append(caixa("braco", (0.08, 0.025, 0.02), (lado * 0.22, 0.1, 0.0), M["aluminio"]))
        for i in range(3):
            cx = lado * (0.27 + 0.085 + i * 0.172)
            pecas.append(caixa("moldura", (0.168, 0.15, 0.01), (cx, 0.1, 0.0), M["aluminio"]))
            pecas.append(caixa("painel", (0.156, 0.138, 0.014), (cx, 0.1, 0.0), M["solar"]))
            for k in (-1, 1):
                pecas.append(caixa("linha", (0.156, 0.004, 0.016), (cx, 0.1 + k * 0.023, 0.0), M["aluminio"]))
    return pecas, 0.98, 0.0


def nave_starship(M):
    pecas = []
    R = 0.13
    corpo = 1.0
    pecas.append(torno("corpo", [(0, 0), (R, 0), (R, corpo)] + ogiva(R, corpo, 0.32, n=16, expo=0.62)[1:],
                       M["aco"]))
    nariz = ogiva(R + 0.003, corpo, 0.32, n=16, expo=0.62)[:-3]
    pecas.append(torno("telhas", [(R + 0.003, 0.0)] + nariz, M["preto"], a0=math.radians(115),
                       a1=math.radians(245), tampa=False))

    def r_em(y):
        if y <= corpo:
            return R
        t = (y - corpo) / 0.32
        return R * (1 - t * t) ** 0.62
    for lado in (1, -1):
        traseira = [(lado * R, 0.03), (lado * (R + 0.13), 0.04), (lado * (R + 0.13), 0.2), (lado * R, 0.34)]
        pecas.append(prisma("flap_traseiro", traseira, -0.012, 0.012, M["preto"], chanfro=0.003))
        y0, y1 = 1.06, 1.2
        dianteira = [(lado * r_em(y0), y0), (lado * (r_em(y0) + 0.075), y0 + 0.01),
                     (lado * (r_em(y1) + 0.06), y1 - 0.02), (lado * r_em(y1), y1)]
        pecas.append(prisma("flap_dianteiro", dianteira, -0.01, 0.01, M["preto"], chanfro=0.003))
    for i in range(3):
        a = math.radians(90 + i * 120)
        sino = torno("raptor", [(0.0, 0.0), (0.03, 0.0), (0.042, -0.05), (0.0, -0.05)], M["motor"])
        sino.location = (0.06 * math.cos(a), 0, 0.06 * math.sin(a))
        pecas.append(sino)
        chama(pecas, M, -0.05, 0.036, 0.34, x=0.06 * math.cos(a), nome=f"chama_{i}")
    return pecas, 0.78, math.radians(-30)


NAVES = [
    {"slug": "nave-falcon-1", "nome": "FALCON 1", "fn": nave_falcon1, "planeta": "terra"},
    {"slug": "nave-falcon-9", "nome": "FALCON 9", "fn": nave_falcon9, "planeta": "terra"},
    {"slug": "nave-falcon-heavy", "nome": "FALCON HEAVY", "fn": nave_falcon_heavy, "planeta": "terra"},
    {"slug": "nave-dragon", "nome": "DRAGON", "fn": nave_dragon, "planeta": "terra"},
    {"slug": "nave-crew-dragon", "nome": "CREW DRAGON", "fn": nave_crew_dragon, "planeta": "terra"},
    {"slug": "nave-starship", "nome": "STARSHIP", "fn": nave_starship, "planeta": "marte"},
]


def montar_nave(n):
    aco = mat("aco_aro", "#c9ccd2", metal=1.0, rough=0.25)
    grafite = mat("grafite", "#2a2c30", metal=1.0, rough=0.4)
    laranja = mat("esmalte_laranja", LARANJA, rough=0.32, coat=0.2)
    espaco = mat("espaco", "#060a16", rough=0.45, coat=0.15)
    tinta = mat("tinta", TINTA, rough=0.5)
    estrela_m = mat("estrela", "#ffffff", emissao=1.5)

    disco("base", 1.0, 0.0, 0.1, grafite)
    anel("esmalte_aro", 0.96, 0.8, 0.1, 0.14, laranja, chanfro=0.0)
    anel("aro_ext", 1.0, 0.955, 0.1, 0.165, aco, chanfro=0.008)
    anel("aro_int", 0.815, 0.785, 0.1, 0.165, aco, chanfro=0.006)
    disco("espaco", 0.79, 0.1, 0.12, espaco, chanfro=0.0)

    rnd = random.Random(n["slug"])
    for i in range(70):
        r = 0.76 * math.sqrt(rnd.random())
        a = rnd.random() * 2 * math.pi
        tam = rnd.choice((0.004, 0.005, 0.006, 0.009, 0.013))
        prisma(f"estrela_{i}", circulo(tam, 10, r * math.cos(a), r * math.sin(a)), 0.12, 0.121, estrela_m,
               chanfro=0.0)

    if n["planeta"] == "marte":
        cor, borda = "#c4512a", "#ff9a6a"
    else:
        cor, borda = "#1f5fbf", "#8fd3ff"
    atm = mat(f"atmosfera_{n['planeta']}", borda, emissao=1.3)
    solo = mat(f"planeta_{n['planeta']}", cor, rough=0.55, coat=0.3)
    prisma("atmosfera", lente(0.0, -1.62, 1.08, 0.79), 0.12, 0.124, atm, chanfro=0.0)
    prisma("planeta", lente(0.0, -1.64, 1.06, 0.79), 0.12, 0.13, solo, chanfro=0.004)

    texto_em_arco("arco_topo", "ZERO TO HERO", 0.875, 0.14, 0.085, tinta)
    texto_em_arco("arco_nome", n["nome"], 0.885, 0.14, 0.095, tinta, embaixo=True)
    for lado in (1, -1):
        prisma(f"marcador_{lado}", estrela(0.035, 0.015, cx=lado * 0.88, cy=0.0), 0.14, 0.155, tinta, chanfro=0.0)

    M = materiais_nave()
    pecas, escala, giro = n["fn"](M)
    pivo = bpy.data.objects.new("nave", None)
    colecao().objects.link(pivo)
    for o in pecas:
        o.parent = pivo
    bpy.context.view_layer.update()
    ys = [(o.matrix_world @ Vector(c)).y for o in pecas for c in o.bound_box]
    zs = [(o.matrix_world @ Vector(c)).z for o in pecas for c in o.bound_box]
    meio = (min(ys) + max(ys)) / 2
    pivo.scale = (escala,) * 3
    pivo.rotation_euler = (0, 0, giro)
    deslocamento = Matrix.Rotation(giro, 3, "Z") @ Vector((0, -meio * escala, 0))
    pivo.location = (deslocamento.x, deslocamento.y + 0.04, 0.13 - min(zs) * escala + 0.01)
    return 2.35


# ---------------------------------------------------------------- execução
def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--res", type=int, default=1024)
    ap.add_argument("--samples", type=int, default=64)
    ap.add_argument("--out", default=os.path.join(RAIZ, "public", "zero-to-hero", "badges"))
    args = ap.parse_args(argv)

    filtro = {s.strip() for s in args.only.split(",") if s.strip()}
    os.makedirs(args.out, exist_ok=True)
    cena = preparar_cena(args.res, args.samples)

    trabalhos = [(p["slug"], montar_patente, p) for p in PATENTES] + [(n["slug"], montar_nave, n) for n in NAVES]
    for slug, montar, dados in trabalhos:
        if filtro and slug not in filtro:
            continue
        limpar_badge()
        cena.camera.data.ortho_scale = montar(dados)
        cena.render.filepath = os.path.join(args.out, f"{slug}.png")
        bpy.ops.render.render(write_still=True)
        print(f"[badges] {slug} -> {cena.render.filepath}")


if __name__ == "__main__":
    main()
