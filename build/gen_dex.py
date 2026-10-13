#!/usr/bin/env python3
import struct, hashlib, zlib, sys

PKG = sys.argv[2] if len(sys.argv) > 2 else 'com/xadohot/xadocalc'
CLS = f'L{PKG}/MainActivity;'
ACT = 'Landroid/app/Activity;'
WV = 'Landroid/webkit/WebView;'
WS = 'Landroid/webkit/WebSettings;'
RES = 'Landroid/content/res/Resources;'
CFG = 'Landroid/content/res/Configuration;'
URL_D = 'file:///android_asset/index.html#dark'
URL_L = 'file:///android_asset/index.html#light'


def P(ret, *params):
    return (''.join('L' if t[0] in 'L[' else t for t in (ret,) + params), ret, tuple(params))


M = {
    'act_init': (ACT, '<init>', P('V')),
    'act_onCreate': (ACT, 'onCreate', P('V', 'Landroid/os/Bundle;')),
    'act_setContentView': (ACT, 'setContentView', P('V', 'Landroid/view/View;')),
    'act_onBack': (ACT, 'onBackPressed', P('V')),
    'act_getRes': (ACT, 'getResources', P(RES)),
    'res_getCfg': (RES, 'getConfiguration', P(CFG)),
    'wv_init': (WV, '<init>', P('V', 'Landroid/content/Context;')),
    'wv_getSettings': (WV, 'getSettings', P(WS)),
    'wv_loadUrl': (WV, 'loadUrl', P('V', 'Ljava/lang/String;')),
    'wv_setBg': (WV, 'setBackgroundColor', P('V', 'I')),
    'wv_canGoBack': (WV, 'canGoBack', P('Z')),
    'wv_goBack': (WV, 'goBack', P('V')),
    'ws_js': (WS, 'setJavaScriptEnabled', P('V', 'Z')),
    'ws_dom': (WS, 'setDomStorageEnabled', P('V', 'Z')),
    'ws_zoom': (WS, 'setTextZoom', P('V', 'I')),
    'my_init': (CLS, '<init>', P('V')),
    'my_onCreate': (CLS, 'onCreate', P('V', 'Landroid/os/Bundle;')),
    'my_onBack': (CLS, 'onBackPressed', P('V')),
}
FLD = {'wv': (CLS, WV, 'wv'), 'uiMode': (CFG, 'I', 'uiMode')}

types = {CLS, ACT, WV}
strs = {URL_D, URL_L}
protos = set()
for c, n, pr in M.values():
    types.add(c); strs.add(n); protos.add(pr); strs.add(pr[0]); types.add(pr[1]); types.update(pr[2])
for c, t, n in FLD.values():
    types.update((c, t)); strs.add(n)
strs.update(types)
str_list = sorted(strs, key=lambda s: s.encode('utf-16-be'))
SI = {s: i for i, s in enumerate(str_list)}
type_list = sorted(types, key=lambda t: SI[t])
TI = {t: i for i, t in enumerate(type_list)}
proto_list = sorted(protos, key=lambda p: (TI[p[1]], [TI[x] for x in p[2]]))
PI = {p: i for i, p in enumerate(proto_list)}
meth_list = sorted(M.values(), key=lambda m: (TI[m[0]], SI[m[1]], PI[m[2]]))
mi = {k: meth_list.index(v) for k, v in M.items()}
fld_list = sorted(FLD.values(), key=lambda f: (TI[f[0]], SI[f[2]], TI[f[1]]))
fi = {k: fld_list.index(v) for k, v in FLD.items()}


def uleb(v):
    out = bytearray()
    while True:
        b = v & 0x7f; v >>= 7
        if v: out.append(b | 0x80)
        else: out.append(b); return bytes(out)


def inv(op, regs, idx):
    r = list(regs) + [0] * (5 - len(regs))
    C, D, E, F, G = r
    return bytes([op, (len(regs) << 4) | G]) + struct.pack('<H', idx) + bytes([(D << 4) | C, (F << 4) | E])


def asm(items):
    pos, labels, sized = 0, {}, []
    for it in items:
        if isinstance(it, tuple) and it[0] == 'label':
            labels[it[1]] = pos; continue
        n = len(it) // 2 if isinstance(it, bytes) else (2 if it[0] == 'if' else 1)
        sized.append((pos, it)); pos += n
    out = b''
    for p, it in sized:
        if isinstance(it, bytes): out += it
        elif it[0] == 'if': out += bytes([it[1], it[2]]) + struct.pack('<h', labels[it[3]] - p)
        else: out += bytes([0x28, (labels[it[1]] - p) & 0xff])
    return out


code_init = inv(0x70, [0], mi['act_init']) + bytes([0x0e, 0x00])
code_on = asm([
    inv(0x6f, [4, 5], mi['act_onCreate']),
    bytes([0x22, 0x00]) + struct.pack('<H', TI[WV]),
    inv(0x70, [0, 4], mi['wv_init']),
    bytes([0x5b, 0x40]) + struct.pack('<H', fi['wv']),
    bytes([0x12, 0x02]),
    inv(0x6e, [0, 2], mi['wv_setBg']),
    inv(0x6e, [0], mi['wv_getSettings']), bytes([0x0c, 0x01]),
    bytes([0x12, 0x12]),
    inv(0x6e, [1, 2], mi['ws_js']),
    inv(0x6e, [1, 2], mi['ws_dom']),
    bytes([0x13, 0x02]) + struct.pack('<h', 100),
    inv(0x6e, [1, 2], mi['ws_zoom']),
    inv(0x6e, [4], mi['act_getRes']), bytes([0x0c, 0x01]),
    inv(0x6e, [1], mi['res_getCfg']), bytes([0x0c, 0x01]),
    bytes([0x52, 0x11]) + struct.pack('<H', fi['uiMode']),
    bytes([0xdd, 0x01, 0x01, 0x30]),
    bytes([0x13, 0x02]) + struct.pack('<h', 0x20),
    ('if', 0x33, 0x21, 'light'),
    bytes([0x1a, 0x03]) + struct.pack('<H', SI[URL_D]),
    ('goto', 'load'),
    ('label', 'light'),
    bytes([0x1a, 0x03]) + struct.pack('<H', SI[URL_L]),
    ('label', 'load'),
    inv(0x6e, [0, 3], mi['wv_loadUrl']),
    inv(0x6e, [4, 0], mi['act_setContentView']),
    bytes([0x0e, 0x00]),
])
code_back = asm([
    bytes([0x54, 0x20]) + struct.pack('<H', fi['wv']),
    ('if', 0x38, 0x00, 'sup'),
    inv(0x6e, [0], mi['wv_canGoBack']), bytes([0x0a, 0x01]),
    ('if', 0x38, 0x01, 'sup'),
    inv(0x6e, [0], mi['wv_goBack']),
    bytes([0x0e, 0x00]),
    ('label', 'sup'),
    inv(0x6f, [2], mi['act_onBack']),
    bytes([0x0e, 0x00]),
])


def code_item(regs, ins, outs, insns):
    return struct.pack('<HHHHII', regs, ins, outs, 0, 0, len(insns) // 2) + insns


codes = [code_item(1, 1, 1, code_init), code_item(6, 2, 2, code_on), code_item(3, 1, 1, code_back)]

HDR = 0x70
off_str = HDR
off_type = off_str + 4 * len(str_list)
off_proto = off_type + 4 * len(type_list)
off_fld = off_proto + 12 * len(proto_list)
off_meth = off_fld + 8 * len(fld_list)
off_cls = off_meth + 8 * len(meth_list)
data_off = off_cls + 32
align = lambda x, a=4: (x + a - 1) & ~(a - 1)
data = bytearray(); pos = data_off


def put(b, a=1):
    global pos
    pad = align(pos, a) - pos
    data.extend(b'\0' * pad); pos += pad
    o = pos; data.extend(b); pos += len(b); return o


code_offs = [put(c, 4) for c in codes]
tl_offs = {}
tlists = sorted({p[2] for p in proto_list if p[2]}, key=lambda t: [TI[x] for x in t])
for t in tlists:
    tl_offs[t] = put(struct.pack('<I', len(t)) + b''.join(struct.pack('<H', TI[x]) for x in t), 4)
sd_offs = [put(uleb(len(s)) + s.encode('utf-8') + b'\0') for s in str_list]
init_i, on_i, back_i = mi['my_init'], mi['my_onCreate'], mi['my_onBack']
assert back_i < on_i
cd = uleb(0) + uleb(1) + uleb(1) + uleb(2)
cd += uleb(fi['wv']) + uleb(0x2)
cd += uleb(init_i) + uleb(0x10001) + uleb(code_offs[0])
cd += uleb(back_i) + uleb(0x1) + uleb(code_offs[2])
cd += uleb(on_i - back_i) + uleb(0x4) + uleb(code_offs[1])
off_cd = put(cd)
items = [(0x0000, 1, 0), (0x0001, len(str_list), off_str), (0x0002, len(type_list), off_type),
         (0x0003, len(proto_list), off_proto), (0x0004, len(fld_list), off_fld), (0x0005, len(meth_list), off_meth),
         (0x0006, 1, off_cls), (0x2001, len(codes), code_offs[0]), (0x1001, len(tlists), tl_offs[tlists[0]]),
         (0x2002, len(str_list), sd_offs[0]), (0x2000, 1, off_cd)]
map_off = align(pos, 4)
items.append((0x1000, 1, map_off))
put(struct.pack('<I', len(items)) + b''.join(struct.pack('<HHII', t, 0, n, o) for t, n, o in items), 4)
put(b'\0' * (align(pos, 4) - pos))
file_size = pos

body = bytearray()
body += b''.join(struct.pack('<I', o) for o in sd_offs)
body += b''.join(struct.pack('<I', SI[t]) for t in type_list)
for sh, ret, params in proto_list:
    body += struct.pack('<III', SI[sh], TI[ret], tl_offs[params] if params else 0)
for c, t, n in fld_list:
    body += struct.pack('<HHI', TI[c], TI[t], SI[n])
for c, n, pr in meth_list:
    body += struct.pack('<HHI', TI[c], PI[pr], SI[n])
body += struct.pack('<IIIIIIII', TI[CLS], 0x0001, TI[ACT], 0, 0xFFFFFFFF, 0, off_cd, 0)
assert HDR + len(body) == data_off

header = bytearray(b'dex\n035\0') + b'\0' * 24
header += struct.pack('<IIIIII', file_size, HDR, 0x12345678, 0, 0, map_off)
for n, o in ((len(str_list), off_str), (len(type_list), off_type), (len(proto_list), off_proto),
             (len(fld_list), off_fld), (len(meth_list), off_meth), (1, off_cls), (file_size - data_off, data_off)):
    header += struct.pack('<II', n, o)
assert len(header) == HDR
dex = bytearray(header + body + data)
assert len(dex) == file_size
dex[12:32] = hashlib.sha1(dex[32:]).digest()
dex[8:12] = struct.pack('<I', zlib.adler32(bytes(dex[12:])) & 0xffffffff)
open(sys.argv[1], 'wb').write(dex)
print('dex ok', file_size, 'bytes, onCreate', len(code_on) // 2, 'units, onBack', len(code_back) // 2, 'units')
