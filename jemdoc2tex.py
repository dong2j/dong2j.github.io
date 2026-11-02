#!/usr/bin/env python3
"""Convert a jemdoc notes post into a standalone LaTeX file (for Overleaf).

Usage:  python jemdoc2tex.py notes_20261030.jemdoc [more.jemdoc ...]
Writes notes_20261030.tex next to the source. Upload the .tex together with
the figs/ files it uses to Overleaf, keeping the same folder paths.
"""
import pathlib, re, sys

PREAMBLE = r"""\documentclass[11pt]{article}
\usepackage[letterpaper,margin=1in]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{lmodern}
\usepackage{graphicx}
\usepackage{parskip}
\usepackage{xurl}
\usepackage[colorlinks=true,urlcolor=blue,linkcolor=blue]{hyperref}
\pagestyle{plain}
\begin{document}
"""

def esc(s):
    """Escape LaTeX special characters in plain text."""
    rep = {"\\": r"\textbackslash{}", "&": r"\&", "%": r"\%", "$": r"\$",
           "#": r"\#", "_": r"\_", "{": r"\{", "}": r"\}",
           "~": r"\textasciitilde{}", "^": r"\textasciicircum{}"}
    return "".join(rep.get(c, c) for c in s)

def inline(s):
    """Convert jemdoc inline markup to LaTeX."""
    keep = []
    def hold(tex):
        keep.append(tex)
        return "\x00%d\x00" % (len(keep) - 1)
    # jemdoc escapes
    s = s.replace("\\n", hold(r"\\")).replace("\\/", hold("/"))
    for c in "[]*|":
        s = s.replace("\\" + c, hold(c))
    # links: [url text]
    def link(m):
        url, text = m.group(1), m.group(2) or m.group(1)
        url = url.replace("%", r"\%").replace("#", r"\#")
        if not re.search(r"\s", text):   # doi:/URL-like text: let it line-break
            text = r"\nolinkurl{%s}" % text.replace("%", r"\%").replace("#", r"\#")
        else:
            text = inline(text)
        return hold(r"\href{%s}{%s}" % (url, text))
    s = re.sub(r"\[(\S+?)(?:\s+(.*?))?\]", link, s)
    s = esc(s)
    s = re.sub(r"/(\S(?:.*?\S)?)/", r"\\emph{\1}", s)      # /italic/
    s = re.sub(r"\*(\S(?:.*?\S)?)\*", r"\\textbf{\1}", s)  # *bold*
    s = re.sub(r'"(.*?)"', r"``\1''", s)                    # "quotes"
    s = s.replace("—", "---").replace("–", "--")
    return re.sub("\x00(\\d+)\x00", lambda m: keep[int(m.group(1))], s)

def figure(spec):
    """{}{img_left}{src}{alt}{width}... -> centered image."""
    parts = re.findall(r"\{(.*?)\}", spec)
    src = parts[2]
    width = re.sub(r"\D", "", parts[4]) if len(parts) > 4 else ""
    frac = min(1.0, int(width) / 600) if width else 1.0
    return ("\\begin{center}\n\\includegraphics[width=%.2f\\textwidth]{%s}\n"
            "\\end{center}\n" % (frac, src))

def convert(text):
    out, para, lst = [], [], None

    def flush():
        nonlocal para, lst
        if para:
            text = inline(" ".join(para)) + "\n"
            if out and out[-1].endswith("\\end{center}\n") and text.startswith("\\textbf{Figure"):
                out[-1] = ("\\noindent\\begin{minipage}{\\linewidth}\n" + out[-1]
                           + text + "\\end{minipage}\n")
            else:
                out.append(text)
            para = []
        if lst:
            env, items = lst
            out.append("\\begin{%s}\n" % env)
            out.extend("\\item %s\n" % inline(" ".join(i)) for i in items)
            out.append("\\end{%s}\n" % env)
            lst = None

    lines = iter(text.splitlines())
    for line in lines:
        if line.startswith("#"):                       # comment / header
            continue
        if line.strip() == "~~~":                      # image block
            flush()
            for inner in lines:
                if inner.strip() == "~~~":
                    break
                if "{img_left}" in inner:
                    out.append(figure(inner))
                elif inner.strip():
                    para.append(inner.strip())
            flush()
            continue
        if not line.strip():
            flush()
            continue
        m = re.match(r"(=+)\s*(.*)", line)
        if m:                                          # headings
            flush()
            level, title = len(m.group(1)), inline(m.group(2))
            if level == 1:
                out.append("{\\LARGE\\bfseries %s\\par}\n\\medskip\n" % title)
            else:
                out.append("\\%ssection*{%s}\n" % ("sub" * (level - 2), title))
            continue
        m = re.match(r"([-.])\s+(.*)", line)
        if m:                                          # list item
            if para:
                flush()
            env = "itemize" if m.group(1) == "-" else "enumerate"
            if not lst or lst[0] != env:
                flush()
                lst = (env, [])
            lst[1].append([m.group(2)])
            continue
        if lst:                                        # list continuation
            lst[1][-1].append(line.strip())
        else:
            para.append(line.strip())
    flush()
    return PREAMBLE + "\n".join(out) + "\n\\end{document}\n"

for src in map(pathlib.Path, sys.argv[1:]):
    if src.suffix != ".jemdoc":          # e.g. notes_* also matches .html/.tex
        print("skipped", src, "(not a .jemdoc file)")
        continue
    tex = src.with_suffix(".tex")
    tex.write_text(convert(src.read_text(encoding="utf-8")), encoding="utf-8")
    print("wrote", tex)
