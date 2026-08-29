import os
import sys

def write_file(rel_path, content):
    abs_path = os.path.abspath(rel_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with open(abs_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'[OK] {rel_path}')

print('Writing backend API files...')