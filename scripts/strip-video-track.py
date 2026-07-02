"""Strip the video trak from an MP4, keeping the audio stream bit-identical.

Usage: python3 scripts/strip-video-track.py <src.mp4> <dst.mp4>

Layout of output: [ftyp][moov(minus video trak, stco patched)][mdat(audio chunks only)]
Verifies: every audio sample byte-range in the output equals the input's;
aborts (assert) on any mismatch. Zero dependencies (Python 3 stdlib).
"""
import struct
import sys
import hashlib
from array import array


def read_u32s(buf, pos, cnt):
    if cnt > 50_000_000:
        raise ValueError(f'implausible count {cnt} at {pos}')
    a = array('I')
    a.frombytes(bytes(buf[pos:pos + 4 * cnt]))
    if sys.byteorder == 'little':
        a.byteswap()
    return a.tolist()

SRC = sys.argv[1]
DST = sys.argv[2]


def parse_boxes(buf, start, end):
    """Yield (pos, size, type, header_size) for boxes in buf[start:end]."""
    pos = start
    while pos + 8 <= end:
        size, typ = struct.unpack_from('>I4s', buf, pos)
        typ = typ.decode('latin1')
        hsz = 8
        if size == 1:
            size = struct.unpack_from('>Q', buf, pos + 8)[0]
            hsz = 16
        elif size == 0:
            size = end - pos
        if size < hsz or pos + size > end:
            raise ValueError(f'corrupt box {typ} at {pos}: size {size}')
        yield pos, size, typ, hsz
        pos += size


def find_box(buf, start, end, path):
    """Return (pos, size, hsz) of the box at path (list of types), or None."""
    typ, rest = path[0], path[1:]
    for pos, size, t, hsz in parse_boxes(buf, start, end):
        if t == typ:
            if not rest:
                return pos, size, hsz
            return find_box(buf, pos + hsz, pos + size, rest)
    return None


def trak_kind(buf, tpos, tsize, thsz):
    r = find_box(buf, tpos + thsz, tpos + tsize, ['mdia', 'hdlr'])
    if r is None:
        return '?'
    p, s, h = r
    return buf[p + h + 8: p + h + 12].decode('latin1')


def audio_tables(buf, tpos, tsize, thsz):
    """Return dict with stsz sizes list, stco offsets list, stsc entries, and stco slot file-position."""
    stbl = find_box(buf, tpos + thsz, tpos + tsize, ['mdia', 'minf', 'stbl'])
    assert stbl, 'no stbl in audio trak'
    sp, ss, sh = stbl
    out = {}
    for p, s, t, h in parse_boxes(buf, sp + sh, sp + ss):
        body = p + h
        if t == 'stsz':
            fixed, cnt = struct.unpack_from('>II', buf, body + 4)
            if fixed:
                out['sizes'] = [fixed] * cnt
            else:
                out['sizes'] = read_u32s(buf, body + 12, cnt)
        elif t == 'stco':
            cnt = struct.unpack_from('>I', buf, body + 4)[0]
            out['offsets'] = read_u32s(buf, body + 8, cnt)
            out['stco_slots'] = body + 8  # file pos of first offset slot
        elif t == 'co64':
            raise ValueError('co64 not handled (file < 4GB should use stco)')
        elif t == 'stsc':
            cnt = struct.unpack_from('>I', buf, body + 4)[0]
            ents = []
            for i in range(cnt):
                fc, spc, sdi = struct.unpack_from('>III', buf, body + 8 + 12 * i)
                ents.append((fc, spc, sdi))
            out['stsc'] = ents
    assert 'sizes' in out and 'offsets' in out and 'stsc' in out, f'missing tables: {sorted(out)}'
    return out


def chunk_sizes(tables):
    """Byte size of each chunk, via stsc walk over stsz."""
    n_chunks = len(tables['offsets'])
    stsc = tables['stsc']
    sizes = tables['sizes']
    per_chunk = []
    si = 0
    for ci in range(1, n_chunks + 1):
        spc = None
        for j, (fc, s, _) in enumerate(stsc):
            nxt = stsc[j + 1][0] if j + 1 < len(stsc) else n_chunks + 1
            if fc <= ci < nxt:
                spc = s
                break
        assert spc is not None, f'no stsc entry for chunk {ci}'
        per_chunk.append(sum(sizes[si:si + spc]))
        si += spc
    assert si == len(sizes), f'consumed {si} samples of {len(sizes)}'
    return per_chunk


with open(SRC, 'rb') as f:
    data = f.read()

top = list(parse_boxes(data, 0, len(data)))
ftyp = next((p, s) for p, s, t, h in top if t == 'ftyp')
moov = next((p, s, h) for p, s, t, h in top if t == 'moov')

mpos, msize, mhsz = moov
traks = []
for p, s, t, h in parse_boxes(data, mpos + mhsz, mpos + msize):
    if t == 'trak':
        traks.append((p, s, h, trak_kind(data, p, s, h)))
kinds = [k for *_, k in traks]
print(f'traks: {kinds}', flush=True)
assert sorted(kinds) == ['soun', 'vide'], f'expected one vide + one soun, got {kinds}'

vtrak = next(t for t in traks if t[3] == 'vide')
atrak = next(t for t in traks if t[3] == 'soun')
tables = audio_tables(data, atrak[0], atrak[1], atrak[2])
print('tables parsed', flush=True)
csizes = chunk_sizes(tables)
print('chunk sizes done', flush=True)
audio_bytes = sum(csizes)
print(f'audio: {len(tables["offsets"])} chunks, {len(tables["sizes"])} samples, {audio_bytes/1e6:.2f} MB')

# Build new moov: original moov bytes minus the video trak span, size patched.
vs, vsz = vtrak[0], vtrak[1]
new_moov = bytearray(data[mpos:vs] + data[vs + vsz:mpos + msize])
struct.pack_into('>I', new_moov, 0, len(new_moov))

# New layout offsets.
ftyp_bytes = data[ftyp[0]:ftyp[0] + ftyp[1]]
mdat_start = len(ftyp_bytes) + len(new_moov)
mdat_size = 8 + audio_bytes

# Patch stco: slots' position inside new_moov = old file pos - mpos, minus vsz if after the removed trak.
slot = tables['stco_slots'] - mpos
if tables['stco_slots'] > vs:
    slot -= vsz
running = mdat_start + 8
for i, _ in enumerate(tables['offsets']):
    struct.pack_into('>I', new_moov, slot + 4 * i, running)
    running += csizes[i]

with open(DST, 'wb') as out:
    out.write(ftyp_bytes)
    out.write(new_moov)
    out.write(struct.pack('>I4s', mdat_size, b'mdat'))
    for off, sz in zip(tables['offsets'], csizes):
        out.write(data[off:off + sz])

# ---- verification ----
with open(DST, 'rb') as f:
    new = f.read()
ntop = list(parse_boxes(new, 0, len(new)))
nmoov = next((p, s, h) for p, s, t, h in ntop if t == 'moov')
ntraks = [(p, s, h, trak_kind(new, p, s, h)) for p, s, t, h in parse_boxes(new, nmoov[0] + nmoov[2], nmoov[0] + nmoov[1]) if t == 'trak']
assert [k for *_, k in ntraks] == ['soun'], f'output traks: {[k for *_, k in ntraks]}'
ntables = audio_tables(new, ntraks[0][0], ntraks[0][1], ntraks[0][2])
assert ntables['sizes'] == tables['sizes'], 'stsz mismatch'
assert ntables['stsc'] == tables['stsc'], 'stsc mismatch'
ncsizes = chunk_sizes(ntables)

h_old, h_new = hashlib.sha256(), hashlib.sha256()
for off, sz in zip(tables['offsets'], csizes):
    h_old.update(data[off:off + sz])
for off, sz in zip(ntables['offsets'], ncsizes):
    h_new.update(new[off:off + sz])
assert h_old.hexdigest() == h_new.hexdigest(), 'AUDIO BYTES DIFFER'
print(f'audio sample bytes identical: sha256 {h_old.hexdigest()[:16]}...')
print(f'output: {len(new)/1e6:.2f} MB ({len(new)} bytes)')
