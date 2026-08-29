import os

def w(p, c):
    abs = os.path.abspath(p)
    os.makedirs(os.path.dirname(abs), exist_ok=True)
    with open(abs, 'w', encoding='utf-8') as fd:
        fd.write(c.strip() + '\n')
    print('[OK]', p)

print('Builder Initialized')
