import json, os, sys

def deploy(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for rel_path, text in data.items():
        abs_path = os.path.abspath(rel_path)
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, 'w', encoding='utf-8') as out:
            out.write(text.strip() + '\n')
        print('[OK]', rel_path)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        deploy(sys.argv[1])
