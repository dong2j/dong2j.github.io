#!/usr/bin/env python3
"""
Usage: python bib2jemdoc.py references.bib
Output: references.txt  (written next to the .bib file)
"""

import re, sys, os

def parse_bib(text):
    entries = []
    for block in re.findall(r'@\w+\{[^@]+', text):
        fields = {}
        for k, v in re.findall(r'(\w+)\s*=\s*\{(.*?)\}(?=\s*[,\}])', block, re.DOTALL):
            fields[k.lower()] = re.sub(r'\s+', ' ', v.strip().strip('{}'))
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
    title   = e.get('title', '').replace('{', '').replace('}', '')
    journal = e.get('journal', e.get('booktitle', ''))
    volume  = e.get('volume', '')
    pages   = e.get('pages', '')
    doi     = e.get('doi', '')
    url     = e.get('url', '')
    details = ", ".join(x for x in [volume, pages] if x)
    ref = f"{authors} ({year}). {title}."
    if details:
        ref += f" /{journal}/, {details}."
    else:
        ref += f" /{journal}/"
    if doi:    ref += f" \[[https://doi.org/{doi} DOI]\]"
    elif url:  ref += f" \[[{url} Link]\]"
    return ref

bib_path = sys.argv[1]
out_path = os.path.splitext(bib_path)[0] + '.txt'

with open(bib_path) as f:
    text = f.read()

entries = sorted(parse_bib(text), key=lambda e: e.get('year', '0'), reverse=True)

with open(out_path, 'w') as f:
    for e in entries:
        f.write(f'. {format_entry(e)}\n')

print(f"Wrote {len(entries)} entries → {out_path}")

