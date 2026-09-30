#!/usr/bin/env python3
"""
Usage: python bib2jemdoc.py references.bib
Output: references.txt  (written next to the .bib file)
"""

import re, sys, os


def read_value(s, i):
    """Read one field value starting at s[i]. Handles {braced}, "quoted" and bare values,
    including nested braces. Returns (value, index just past the value)."""
    n = len(s)
    if i < n and s[i] == '{':
        depth, j = 0, i
        while j < n:
            if s[j] == '\\':          # skip escaped chars like \{ or \&
                j += 2
                continue
            if s[j] == '{':
                depth += 1
            elif s[j] == '}':
                depth -= 1
                if depth == 0:
                    return s[i + 1:j], j + 1
            j += 1
        return s[i + 1:], n
    if i < n and s[i] == '"':
        depth, j = 0, i + 1
        while j < n:
            if s[j] == '\\':
                j += 2
                continue
            if s[j] == '{':
                depth += 1
            elif s[j] == '}':
                depth -= 1
            elif s[j] == '"' and depth == 0:
                return s[i + 1:j], j + 1
            j += 1
        return s[i + 1:], n
    # bare value, e.g. year = 2015
    m = re.match(r'[^,}\s]*', s[i:])
    return m.group(0), i + m.end()


GREEK = {name: f'&{name};' for name in (
    'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi '
    'pi rho sigma tau upsilon phi chi psi omega Gamma Delta Theta Lambda Xi Pi '
    'Sigma Upsilon Phi Psi Omega').split()}
SYMBOLS = {'pm': '&plusmn;', 'times': '&times;', 'cdot': '&middot;', 'circ': '&deg;',
           'infty': '&infin;', 'leq': '&le;', 'geq': '&ge;', 'le': '&le;', 'ge': '&ge;',
           'approx': '&asymp;', 'sim': '~', 'rightarrow': '&rarr;', 'to': '&rarr;',
           'prime': '&prime;', 'varepsilon': '&epsilon;', 'varphi': '&phi;'}
SYMBOLS.update(GREEK)


def convert_markup(v, raw):
    """Turn LaTeX super/subscripts, Greek letters and simple math into jemdoc raw HTML.
    Each HTML snippet is stored in `raw` and replaced by a placeholder, so the later
    brace-stripping step can't damage it."""
    def stash(html):
        raw.append(html)
        return f'\x00{len(raw) - 1}\x00'

    def group(s, i):
        """Read a {group} or a single char/command at s[i]; return (text, next index)."""
        if i < len(s) and s[i] == '{':
            return read_value(s, i)
        m = re.match(r'\\[A-Za-z]+|.', s[i:])
        return (m.group(0), i + m.end()) if m else ('', i)

    def math(s):
        out, i = [], 0
        while i < len(s):
            c = s[i]
            if c in '^_':
                inner, i = group(s, i + 1)
                tag = 'sup' if c == '^' else 'sub'
                out.append(stash(f'<{tag}>') + math(inner) + stash(f'</{tag}>'))
            elif c == '\\':
                m = re.match(r'\\([A-Za-z]+)', s[i:])
                if not m:                      # \, \; etc. (spacing) or escaped char
                    out.append(' ' if i + 1 < len(s) and s[i + 1] in ',;: ' else s[i + 1:i + 2])
                    i += 2
                    continue
                name, i = m.group(1), i + m.end()
                if name in SYMBOLS:
                    out.append(stash(SYMBOLS[name]))
                elif name in ('mathrm', 'text', 'mathbf', 'mathit', 'textrm', 'rm', 'mathsf'):
                    inner, i = group(s, i) if i < len(s) and s[i] == '{' else ('', i)
                    out.append(math(inner))
                # unknown commands are dropped
            elif c in '{}':
                i += 1
            else:
                out.append(c)
                i += 1
        return ''.join(out)

    # \textsuperscript{..} / \textsubscript{..} outside math
    def text_cmds(s):
        out, i = [], 0
        for m in re.finditer(r'\\text(super|sub)script\s*(?=\{)', s):
            if m.start() < i:
                continue
            inner, end = read_value(s, m.end())
            tag = 'sup' if m.group(1) == 'super' else 'sub'
            out.append(s[i:m.start()] + stash(f'<{tag}>') + text_cmds(inner) + stash(f'</{tag}>'))
            i = end
        return ''.join(out) + s[i:]

    v = text_cmds(v)
    # $...$ math segments (an escaped \$ is a literal dollar sign)
    parts = re.split(r'(?<!\\)\$', v)
    v = ''.join(math(p) if k % 2 else p for k, p in enumerate(parts))
    # a literal \$ is left as-is: jemdoc also uses \$ for a plain dollar sign
    # bare Greek/symbol commands used outside math, e.g. {\textmu}
    v = re.sub(r'\\(?:text)?([A-Za-z]+)',
               lambda m: stash(SYMBOLS[m.group(1)]) if m.group(1) in SYMBOLS else m.group(0), v)
    return v


def clean(v):
    raw = []
    v = convert_markup(v, raw)
    v = v.replace('{', '').replace('}', '')
    v = re.sub(r'\s+', ' ', v).strip()
    # restore HTML snippets, wrapped in jemdoc's {{ }} raw-HTML markers
    v = re.sub(r'\x00(\d+)\x00', lambda m: raw[int(m.group(1))], v)
    return wrap_raw(v)


def wrap_raw(v):
    """Wrap each run of HTML (tags, entities, and the text between an open/close tag pair)
    in {{ }} so jemdoc passes it through untouched."""
    out, i = [], 0
    pat = re.compile(r'(?:&\w+;|<(sup|sub)>.*?</\1>)+')
    for m in pat.finditer(v):
        out.append(v[i:m.start()] + '{{' + m.group(0) + '}}')
        i = m.end()
    return ''.join(out) + v[i:]


def parse_bib(text):
    entries = []
    for m in re.finditer(r'@(\w+)\s*\{', text):
        if m.group(1).lower() in ('comment', 'preamble', 'string'):
            continue
        # find the end of this entry by matching braces
        body, _ = read_value(text, m.end() - 1)
        # skip the citation key
        comma = body.find(',')
        if comma == -1:
            continue
        i, fields = comma + 1, {}
        field_re = re.compile(r'\s*(\w[\w-]*)\s*=\s*')
        while i < len(body):
            fm = field_re.match(body, i)
            if not fm:
                i += 1
                continue
            value, i = read_value(body, fm.end())
            fields[fm.group(1).lower()] = clean(value)
        if fields:
            entries.append(fields)
    return entries


def format_authors(raw):
    authors = [a.strip() for a in raw.replace('\n', ' ').split(' and ')]
    out = []
    for a in authors:
        if ',' in a:
            last, first = a.split(',', 1)
            initials = ''.join(p[0] + '.' for p in first.split() if p)
            out.append(f"{last.strip()}, {initials}")
        else:
            out.append(a)
    return ', '.join(out)


def format_entry(e):
    authors = format_authors(e.get('author', 'Unknown'))
    year    = e.get('year', 'n.d.')
    title   = e.get('title', '')
    journal = e.get('journal', e.get('booktitle', e.get('publisher', '')))
    volume  = e.get('volume', '')
    pages   = e.get('pages', '')
    doi     = e.get('doi', '')
    url     = e.get('url', '')
    details = ", ".join(x for x in [volume, pages] if x)
    ref = f"{authors} ({year}). {title}."
    if journal and details:
        ref += f" /{journal}/, {details}."
    elif journal:
        ref += f" /{journal}/."
    if doi:    ref += f" \\[[https://doi.org/{doi} DOI]\\]"
    elif url:  ref += f" \\[[{url} Link]\\]"
    return ref


if __name__ == '__main__':
    bib_path = sys.argv[1]
    out_path = os.path.splitext(bib_path)[0] + '.txt'

    with open(bib_path, encoding='utf-8') as f:
        text = f.read()

    entries = sorted(parse_bib(text), key=lambda e: e.get('year', '0'), reverse=True)

    with open(out_path, 'w', encoding='utf-8') as f:
        for e in entries:
            f.write(f'. {format_entry(e)}\n')

    print(f"Wrote {len(entries)} entries → {out_path}")
