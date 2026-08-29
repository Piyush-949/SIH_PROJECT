import sys, os, base64

rel_path = sys.argv[1]
b64_content = sys.argv[2]
content = base64.b64decode(b64_content.encode('ascii')).decode('utf-8')

abs_path = os.path.abspath(rel_path)
os.makedirs(os.path.dirname(abs_path), exist_ok=True)
with open(abs_path, 'w', encoding='utf-8') as f:
    f.write(content.strip() + '\n')
print(f'[OK] {rel_path}')
