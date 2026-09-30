#!/usr/bin/env python3
"""Generates the mod's pixel-art textures, item models and recipes.

Run from the mod folder:  python3 tools/gen_assets.py
Only needs the Python standard library.
"""
import json
import os
import random
import struct
import zlib

ROOT = os.path.join(os.path.dirname(__file__), "..", "src", "main", "resources")
ASSETS = os.path.join(ROOT, "assets", "mkheroes")
DATA = os.path.join(ROOT, "data", "mkheroes")


# ---------------------------------------------------------------- PNG writer
def write_png(path, pixels):
    """pixels: list of rows, each a list of (r, g, b, a)."""
    h, w = len(pixels), len(pixels[0])
    raw = b"".join(b"\x00" + bytes(c for px in row for c in px) for row in pixels)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)))
        f.write(chunk(b"IDAT", zlib.compress(raw, 9)))
        f.write(chunk(b"IEND", b""))


def hexc(s):
    s = s.lstrip("#")
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), 255)


CLEAR = (0, 0, 0, 0)


def from_art(art, palette):
    return [[palette[ch] if ch != "." else CLEAR for ch in row] for row in art]


# ---------------------------------------------------------------- item icons (16x16)
# Letters are palette keys. "." is transparent.
FIST = [
    "................",
    "................",
    "....1111111.....",
    "...122222221....",
    "..12232323221...",
    "..12232323221...",
    "..12222222221...",
    "..12222222221...",
    "..11222222221...",
    "...1222222221...",
    "...1333333331...",
    "...1344444431...",
    "...1344444431...",
    "...1333333331...",
    "....11111111....",
    "................",
]

ITEMS = {
    # Scorpion: yellow glove, black wrap, kunai chain
    "scorpion_hands": (FIST, {"1": hexc("3a2600"), "2": hexc("f2c200"), "3": hexc("111111"), "4": hexc("c49000")},
                       [("k", [(12, 1), (13, 0), (13, 1), (12, 2), (11, 3), (10, 4)], hexc("b0b0b8"))]),
    # Sub-Zero: blue glove with ice spikes
    "subzero_hands": (FIST, {"1": hexc("0b2140"), "2": hexc("2f7fe0"), "3": hexc("c8e8ff"), "4": hexc("1d5bb0")},
                      [("i", [(13, 0), (13, 1), (12, 2), (14, 2), (13, 3), (1, 4), (1, 5), (0, 6)], hexc("e8f8ff"))]),
    # Iron Man: red & gold glove with glowing repulsor
    "iron_man_gauntlet": (FIST, {"1": hexc("3a0505"), "2": hexc("c01818"), "3": hexc("e8b92e"), "4": hexc("f0cc4a")},
                          [("r", [(6, 11), (7, 11), (8, 11), (9, 11), (7, 12), (8, 12)], hexc("7ff6ff"))]),
    # Thanos: gold gauntlet with the six stones
    "infinity_gauntlet": (FIST, {"1": hexc("5a3a00"), "2": hexc("e0a820"), "3": hexc("ffd84a"), "4": hexc("c08a10")},
                          [("s", [(4, 4)], hexc("2050ff")), ("s", [(6, 4)], hexc("ff2020")), ("s", [(8, 4)], hexc("ff8a00")),
                           ("s", [(10, 4)], hexc("ffe020")), ("s", [(6, 7)], hexc("9020e0")), ("s", [(7, 7)], hexc("9020e0")),
                           ("s", [(7, 12)], hexc("20e040")), ("s", [(8, 12)], hexc("20e040"))]),
}

WEB_SHOOTER = [
    "..............w.",
    "............w.w.",
    "...........w.w..",
    "..........www...",
    ".........w......",
    "................",
    "....11111111....",
    "...1bbbbbbbb1...",
    "...1rrrrrrrr1...",
    "...1rsrrsrrs1...",
    "...1rrrrrrrr1...",
    "...1bbbbbbbb1...",
    "....11111111....",
    "................",
    "................",
    "................",
]

HELMET = [
    "................",
    "................",
    "...1111111111...",
    "..122222222221..",
    "..122222222221..",
    "..123333333321..",
    "..134433334431..",
    "..133333333331..",
    "..12211111122 1.",
    "..121......121..",
    "..111......111..",
    "................",
    "................",
    "................",
    "................",
    "................",
]
CHEST = [
    "................",
    "..111......111..",
    ".12221111112221.",
    ".12222222222221.",
    ".12222244222221.",
    "..111224422111..",
    "....12222221....",
    "....12222221....",
    "....13333331....",
    "....12222221....",
    "....12222221....",
    "....11111111....",
    "................",
    "................",
    "................",
    "................",
]
LEGS = [
    "................",
    "...1111111111...",
    "...1333333331...",
    "...1222222221...",
    "...1222112221...",
    "...122211222 1..",
    "...12221.1221...",
    "...1222...221...",
    "...1222...221...",
    "...1222...221...",
    "...1222...221...",
    "...1111...111...",
    "................",
    "................",
    "................",
    "................",
]
BOOTS = [
    "................",
    "................",
    "................",
    "................",
    "................",
    "...1111..1111...",
    "...1221..1221...",
    "...1221..1221...",
    "...1221..1221...",
    "..12221..12221..",
    ".122331..133221.",
    ".111111..111111.",
    "................",
    "................",
    "................",
    "................",
]

# 1 outline, 2 main, 3 accent, 4 detail (eyes / emblem)
SUITS = {
    "scorpion": {"1": hexc("3a2600"), "2": hexc("f2c200"), "3": hexc("1a1a1a"), "4": hexc("ffffff")},
    "subzero": {"1": hexc("0b2140"), "2": hexc("2f7fe0"), "3": hexc("9aa6b8"), "4": hexc("ffffff")},
    "spiderman": {"1": hexc("3a0000"), "2": hexc("d01515"), "3": hexc("1a3fb0"), "4": hexc("ffffff")},
    "ironman": {"1": hexc("3a0505"), "2": hexc("c01818"), "3": hexc("e8b92e"), "4": hexc("7ff6ff")},
    "thanos": {"1": hexc("3a2a00"), "2": hexc("e0a820"), "3": hexc("2a3f9a"), "4": hexc("8a4fc0")},
}


def item_icons():
    tex = os.path.join(ASSETS, "textures", "item")
    for name, (art, pal, extras) in ITEMS.items():
        px = from_art(art, pal)
        for _, pts, color in extras:
            for x, y in pts:
                px[y][x] = color
        write_png(os.path.join(tex, name + ".png"), px)

    pal = {"1": hexc("222222"), "b": hexc("1a3fb0"), "r": hexc("d01515"), "s": hexc("c0c0c0"), "w": hexc("f4f4f4")}
    write_png(os.path.join(tex, "web_shooter.png"), from_art(WEB_SHOOTER, pal))

    for suit, pal in SUITS.items():
        pal = dict(pal)
        pal[" "] = CLEAR
        for piece, art in (("helmet", HELMET), ("chestplate", CHEST), ("leggings", LEGS), ("boots", BOOTS)):
            write_png(os.path.join(tex, f"{suit}_{piece}.png"), from_art(art, pal))


# ---------------------------------------------------------------- armor layers (64x32)
def shade(c, amount):
    return tuple(max(0, min(255, v + amount)) for v in c[:3]) + (255,)


def armor_layers():
    rnd = random.Random(7)
    out = os.path.join(ASSETS, "textures", "models", "armor")

    def canvas(color):
        return [[shade(color, rnd.randint(-10, 10)) for _ in range(64)] for _ in range(32)]

    def rect(img, x0, y0, x1, y1, color, jitter=6):
        for y in range(y0, y1):
            for x in range(x0, x1):
                img[y][x] = shade(color, rnd.randint(-jitter, jitter))

    def px(img, x, y, color):
        img[y][x] = color

    # Regions of the vanilla 64x32 armor texture.
    HEAD_FRONT = (8, 8)          # 8x8
    BODY_FRONT = (20, 20)        # 8x12
    BODY_BACK = (32, 20)
    ARM_ALL = (40, 16, 56, 32)
    LEG_ALL = (0, 16, 16, 32)
    BODY_ALL = (16, 16, 40, 32)

    def face_mask(img, mask_color, eye_color, lower=True):
        fx, fy = HEAD_FRONT
        if lower:
            rect(img, fx, fy + 4, fx + 8, fy + 8, mask_color)
        for ex in (fx + 1, fx + 2, fx + 5, fx + 6):
            px(img, ex, fy + 3, eye_color)

    def belt(img, color):
        rect(img, 16, 28, 40, 30, color, 3)

    # ---- Scorpion: yellow ninja, black mask & belt, black shin wraps
    for layer in (1, 2):
        c = SUITS["scorpion"]
        img = canvas(c["2"])
        if layer == 1:
            face_mask(img, c["3"], c["4"])
            rect(img, 8, 8, 16, 10, c["2"])  # hood above the eyes
            rect(img, 24, 20, 25, 32, c["3"])  # chest strap
            rect(img, 23, 20, 25, 22, c["3"])
            rect(img, 40, 28, 56, 32, c["3"])  # wrist wraps
        else:
            belt(img, c["3"])
            rect(img, 0, 26, 16, 32, c["3"])  # shin wraps
        write_png(os.path.join(out, f"scorpion_layer_{layer}.png"), img)

    # ---- Sub-Zero: blue ninja, steel mask, silver trim
    for layer in (1, 2):
        c = SUITS["subzero"]
        img = canvas(c["2"])
        if layer == 1:
            face_mask(img, c["3"], hexc("dff6ff"))
            for x in range(8, 16, 2):
                px(img, x, 13, shade(c["3"], -40))
            rect(img, 20, 20, 28, 22, c["3"])
            rect(img, 23, 22, 25, 32, hexc("9ad4ff"))
            rect(img, 40, 28, 56, 32, c["3"])
        else:
            belt(img, c["3"])
            rect(img, 0, 28, 16, 32, hexc("1d5bb0"))
        write_png(os.path.join(out, f"subzero_layer_{layer}.png"), img)

    # ---- Spider-Man: red with blue sides, black web lines, big white eyes, spider emblem
    for layer in (1, 2):
        c = SUITS["spiderman"]
        img = canvas(c["2"])
        web = hexc("1a0000")
        if layer == 1:
            rect(img, *ARM_ALL, c["3"])
            rect(img, 44, 16, 48, 32, c["2"])  # red top of arms
            rect(img, 16, 20, 20, 32, c["3"])  # body sides
            rect(img, 28, 20, 32, 32, c["3"])
            fx, fy = HEAD_FRONT
            for (x, y) in ((1, 2), (2, 2), (1, 3), (2, 3), (2, 4), (5, 2), (6, 2), (5, 3), (6, 3), (5, 4)):
                px(img, fx + x, fy + y, c["4"])
            for (x, y) in ((0, 2), (3, 3), (3, 4), (7, 2), (4, 3), (4, 4)):
                px(img, fx + x, fy + y, web)
            # spider emblem
            bx, by = BODY_FRONT
            for (x, y) in ((3, 2), (4, 2), (3, 3), (4, 3), (3, 4), (4, 4), (2, 1), (5, 1), (2, 5), (5, 5), (1, 3), (6, 3)):
                px(img, bx + x, by + y, web)
        else:
            rect(img, 0, 20, 16, 32, c["3"])
            rect(img, 4, 20, 8, 32, c["2"])
            rect(img, 16, 16, 40, 32, c["2"])
        # web grid on red areas
        for y in range(32):
            for x in range(64):
                if img[y][x][:3] != CLEAR[:3] and abs(img[y][x][0] - c["2"][0]) < 20 and abs(img[y][x][2] - c["2"][2]) < 20:
                    if (x % 4 == 0 and y % 2 == 0) or (y % 4 == 0 and x % 2 == 0):
                        img[y][x] = shade(web, 20)
        write_png(os.path.join(out, f"spiderman_layer_{layer}.png"), img)

    # ---- Iron Man: red armor, gold faceplate / arms / thighs, arc reactor
    for layer in (1, 2):
        c = SUITS["ironman"]
        img = canvas(c["2"])
        if layer == 1:
            fx, fy = HEAD_FRONT
            rect(img, fx + 1, fy + 2, fx + 7, fy + 8, c["3"])
            for ex in (fx + 1, fx + 2, fx + 5, fx + 6):
                px(img, ex, fy + 3, c["4"])
            px(img, fx + 3, fy + 6, shade(c["3"], -60))
            px(img, fx + 4, fy + 6, shade(c["3"], -60))
            rect(img, 40, 20, 56, 26, c["3"])
            bx, by = BODY_FRONT
            rect(img, bx + 3, by + 2, bx + 5, by + 4, c["4"], 0)
            px(img, bx + 2, by + 3, shade(c["4"], -60))
            px(img, bx + 5, by + 2, shade(c["4"], -60))
            rect(img, bx, by + 7, bx + 8, by + 12, c["3"])
        else:
            rect(img, 0, 20, 16, 26, c["3"])
            belt(img, shade(c["3"], -40))
        write_png(os.path.join(out, f"ironman_layer_{layer}.png"), img)

    # ---- Thanos: gold helmet & shoulders, blue body, purple skin at the chin
    for layer in (1, 2):
        c = SUITS["thanos"]
        img = canvas(c["3"])
        if layer == 1:
            rect(img, 0, 0, 32, 16, c["2"])  # helmet
            fx, fy = HEAD_FRONT
            rect(img, fx + 1, fy + 3, fx + 7, fy + 8, c["4"])
            for ex in (fx + 2, fx + 5):
                px(img, ex, fy + 4, hexc("202020"))
            rect(img, fx + 2, fy + 6, fx + 6, fy + 7, shade(c["4"], -50))
            rect(img, 40, 16, 56, 22, c["2"])  # shoulder pads
            rect(img, 20, 20, 28, 24, c["2"])  # chest plate
            rect(img, 23, 24, 25, 32, c["2"])
        else:
            belt(img, c["2"])
            rect(img, 0, 28, 16, 32, c["2"])
        write_png(os.path.join(out, f"thanos_layer_{layer}.png"), img)


# ---------------------------------------------------------------- effect icons (18x18) + mod icon
def small_icons():
    rnd = random.Random(3)
    eff = os.path.join(ASSETS, "textures", "mob_effect")
    ice = [[CLEAR] * 18 for _ in range(18)]
    for y in range(18):
        for x in range(18):
            if abs(x - 8.5) + abs(y - 8.5) < 8:
                ice[y][x] = shade(hexc("8fd8ff"), rnd.randint(-30, 30))
            if x == 8 or y == 8 or x == y or x == 17 - y:
                if 1 < x < 16 and 1 < y < 16:
                    ice[y][x] = hexc("ffffff")
    write_png(os.path.join(eff, "frozen.png"), ice)

    web = [[CLEAR] * 18 for _ in range(18)]
    for y in range(18):
        for x in range(18):
            dx, dy = x - 8.5, y - 8.5
            r = (dx * dx + dy * dy) ** 0.5
            if r < 8.5 and (abs(dx) < 0.6 or abs(dy) < 0.6 or abs(abs(dx) - abs(dy)) < 0.7 or abs(r - 3) < 0.5 or abs(r - 6) < 0.5):
                web[y][x] = hexc("f0f0f0")
    write_png(os.path.join(eff, "webbed.png"), web)

    # 64x64 mod icon: the Infinity Gauntlet scaled up
    art, pal, extras = ITEMS["infinity_gauntlet"]
    small = from_art(art, pal)
    for _, pts, color in extras:
        for x, y in pts:
            small[y][x] = color
    big = [[small[y // 4][x // 4] for x in range(64)] for y in range(64)]
    write_png(os.path.join(ASSETS, "icon.png"), big)


# ---------------------------------------------------------------- models & recipes
WEAPONS = ["scorpion_hands", "subzero_hands", "web_shooter", "iron_man_gauntlet", "infinity_gauntlet"]
PIECES = ["helmet", "chestplate", "leggings", "boots"]
SUIT_MATERIAL = {
    "scorpion": "minecraft:blaze_rod",
    "subzero": "minecraft:blue_ice",
    "spiderman": "minecraft:cobweb",
    "ironman": "minecraft:iron_block",
    "thanos": "minecraft:gold_block",
}
PATTERNS = {
    "helmet": ["XXX", "X X"],
    "chestplate": ["X X", "XXX", "XXX"],
    "leggings": ["XXX", "X X", "X X"],
    "boots": ["X X", "X X"],
}
WEAPON_RECIPES = {
    "scorpion_hands": ["minecraft:blaze_rod", "minecraft:chain", "minecraft:gold_ingot", "minecraft:leather", "minecraft:iron_sword"],
    "subzero_hands": ["minecraft:blue_ice", "minecraft:packed_ice", "minecraft:diamond", "minecraft:leather", "minecraft:iron_sword"],
    "web_shooter": ["minecraft:cobweb", "minecraft:cobweb", "minecraft:string", "minecraft:iron_ingot", "minecraft:redstone"],
    "iron_man_gauntlet": ["minecraft:iron_block", "minecraft:gold_ingot", "minecraft:redstone_block", "minecraft:diamond"],
    "infinity_gauntlet": ["minecraft:gold_block", "minecraft:nether_star", "minecraft:diamond", "minecraft:emerald",
                          "minecraft:amethyst_shard", "minecraft:redstone", "minecraft:lapis_lazuli", "minecraft:blaze_powder"],
}


def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def models_and_recipes():
    models = os.path.join(ASSETS, "models", "item")
    for w in WEAPONS:
        dump(os.path.join(models, w + ".json"), {"parent": "minecraft:item/handheld", "textures": {"layer0": f"mkheroes:item/{w}"}})
        dump(os.path.join(DATA, "recipe", w + ".json"), {
            "type": "minecraft:crafting_shapeless",
            "category": "equipment",
            "ingredients": [{"item": i} for i in WEAPON_RECIPES[w]],
            "result": {"id": f"mkheroes:{w}", "count": 1},
        })
    for suit, material in SUIT_MATERIAL.items():
        for piece in PIECES:
            name = f"{suit}_{piece}"
            dump(os.path.join(models, name + ".json"), {"parent": "minecraft:item/generated", "textures": {"layer0": f"mkheroes:item/{name}"}})
            dump(os.path.join(DATA, "recipe", name + ".json"), {
                "type": "minecraft:crafting_shaped",
                "category": "equipment",
                "pattern": PATTERNS[piece],
                "key": {"X": {"item": material}},
                "result": {"id": f"mkheroes:{name}", "count": 1},
            })


if __name__ == "__main__":
    item_icons()
    armor_layers()
    small_icons()
    models_and_recipes()
    print("assets generated")
