import os, base64

def save(rel_path, b64_content):
    content = base64.b64decode(b64_content).decode('utf-8')
    abs_path = os.path.abspath(rel_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with open(abs_path, 'w', encoding='utf-8') as fd:
        fd.write(content.strip() + chr(10))
    print('[OK]', rel_path)
