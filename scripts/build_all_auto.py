import os

def w(rel_path, content):
    abs_path = os.path.abspath(rel_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with open(abs_path, 'w', encoding='utf-8') as out:
        out.write(content.strip() + '\n')
    print('[OK]', rel_path)

print('build_all_auto.py initialized')
