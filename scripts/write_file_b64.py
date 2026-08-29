import sys, os, base64

rel_path = sys.argv[1]
b64_content = sys.argv[2].strip()
b64_content += '=' * (-len(b64_content) % 4)
content = base64.b64decode(b64_content).decode('utf-8')

abs_path = os.path.abspath(rel_path)
os.makedirs(os.path.dirname(abs_path), exist_ok=True)
with open(abs_path, 'w', encoding='utf-8') as f:
    f.write(content.strip() + chr(10))
print(f'[OK] {rel_path}')
