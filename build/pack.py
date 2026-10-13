import zipfile, struct, sys
src, dex, dst = sys.argv[1:4]
zin = zipfile.ZipFile(src)
entries = [(i, zin.read(i.filename)) for i in zin.infolist()]
entries.append((None, open(dex, 'rb').read()))
with open(dst, 'wb') as fp:
    zout = zipfile.ZipFile(fp, 'w')
    for info, data in entries:
        if info is None:
            zi = zipfile.ZipInfo('classes.dex', (2026, 10, 13, 12, 0, 0)); zi.compress_type = zipfile.ZIP_DEFLATED
        else:
            zi = zipfile.ZipInfo(info.filename, info.date_time); zi.compress_type = info.compress_type
            if info.filename == 'resources.arsc': zi.compress_type = zipfile.ZIP_STORED
        zi.external_attr = 0o644 << 16; zi.create_system = 0
        if zi.compress_type == zipfile.ZIP_STORED:
            base = fp.tell() + 30 + len(zi.filename.encode())
            n = 6
            while (base + n) % 4: n += 1
            zi.extra = struct.pack('<HHH', 0xD935, n - 4, 4) + b'\0' * (n - 6)
        zout.writestr(zi, data)
    zout.close()
print('packed', dst)
