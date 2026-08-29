import os

def w(path, text):
    p = os.path.abspath(path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(text.strip() + '\n')
    print('[OK]', path)

# 1. Emitter
w
