import os

def write_file(p, c):
    os.makedirs(os.path.dirname(os.path.abspath(p)), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(c.strip() + chr(10))
    print('[OK]', p)

print('Ready to build backend routes')
